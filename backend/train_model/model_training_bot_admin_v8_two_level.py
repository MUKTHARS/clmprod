"""
Child Bot Training Pipeline Module.
Handles incoming training trigger requests to train individual bot under any Tenant based on documents uploaded.

This script implements 
training pipeline trigger for individual bot under any tenant and interacts with a PostgreSQL database 
to retrieve model types.

Author: [Saple.ai]
Date: [March 2023]
"""

# Import required libraries
import os
import time
import logging
import pandas as pd
import tempfile
import re
from dotenv import load_dotenv
load_dotenv()

import boto3
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document
from sayvai_rag.text_splitter import load_and_split_files
from sayvai_rag.milvus_vector_store import create_user_store
from pymilvus import connections, utility

os.environ["MILVUS_URI"] = "/app/db/sayvai.db"

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration for large file handling
MAX_ROWS_PER_CHUNK = 10000  # Process Excel/CSV files in chunks of this size
MAX_FILE_SIZE_FOR_MEMORY = 100 * 1024 * 1024  # 100MB - files larger than this will be processed in chunks

def create_valid_collection_name(tenant_id, bot_id):
    """Create a valid Milvus collection name from tenant_id and bot_id"""
    # Remove UUID hyphens and create a clean name
    clean_tenant_id = tenant_id.replace('-', '_')
    clean_bot_id = bot_id.replace('-', '_')
    
    collection_name = f"tenant_id_{clean_tenant_id}_bot_id_{clean_bot_id}"
    
    # Ensure it starts with a letter or underscore and contains only valid chars
    if not collection_name[0].isalpha() and collection_name[0] != '_':
        collection_name = 'col_' + collection_name
    
    return collection_name

def clear_existing_collection(collection_name):
    """Delete existing collection if it exists"""
    try:
        # Establish connection first
        connections.connect("default", uri=os.environ["MILVUS_URI"])
        
        if utility.has_collection(collection_name):
            utility.drop_collection(collection_name)
            logger.info(f"Cleared existing collection: {collection_name}")
        else:
            logger.info(f"Collection {collection_name} does not exist, creating new one")
            
    except Exception as e:
        logger.error(f"Error clearing collection: {e}")
        raise
    finally:
        # Always disconnect in finally block
        try:
            connections.disconnect("default")
        except:
            pass  # Ignore disconnect errors

def get_file_size(file_path):
    """Get file size in bytes"""
    return os.path.getsize(file_path)

def load_spreadsheet_file_chunked(file_path, chunk_size=MAX_ROWS_PER_CHUNK):
    """
    Load Excel or CSV file in chunks and convert to text documents
    
    Args:
        file_path (str): Path to the spreadsheet file
        chunk_size (int): Number of rows to process at once
        
    Returns:
        list: List of Document objects
    """
    try:
        file_size = get_file_size(file_path)
        logger.info(f"Processing spreadsheet file: {file_path}, Size: {file_size / 1024 / 1024:.2f} MB")
        
        documents = []
        total_rows_processed = 0
        
        # Determine if we need chunked processing
        use_chunked_processing = file_size > MAX_FILE_SIZE_FOR_MEMORY
        
        if file_path.endswith(('.xlsx', '.xls')):
            # Read Excel file with chunked processing for large files
            if use_chunked_processing:
                logger.info(f"Using chunked processing for large Excel file: {file_path}")
                
                # First, get total number of rows to estimate progress
                try:
                    total_rows = pd.read_excel(file_path, engine='openpyxl', nrows=0).shape[0]
                    logger.info(f"Total rows in Excel file: {total_rows}")
                except:
                    total_rows = 0
                
                # Process Excel file in chunks
                chunk_number = 0
                for chunk in pd.read_excel(file_path, engine='openpyxl', chunksize=chunk_size):
                    chunk_number += 1
                    chunk_docs = process_dataframe_chunk(chunk, file_path, chunk_number)
                    documents.extend(chunk_docs)
                    total_rows_processed += len(chunk)
                    
                    logger.info(f"Processed chunk {chunk_number}: {len(chunk)} rows, total: {total_rows_processed}")
                    
            else:
                # Process small Excel file in memory
                df = pd.read_excel(file_path, engine='openpyxl')
                documents = process_dataframe_chunk(df, file_path, 1)
                total_rows_processed = len(df)
                
        elif file_path.endswith('.csv'):
            # Read CSV file with chunked processing for large files
            if use_chunked_processing:
                logger.info(f"Using chunked processing for large CSV file: {file_path}")
                
                # First, get total number of rows to estimate progress
                try:
                    total_rows = sum(1 for _ in open(file_path, 'r', encoding='utf-8', errors='ignore')) - 1
                    logger.info(f"Total rows in CSV file: {total_rows}")
                except:
                    total_rows = 0
                
                # Process CSV file in chunks
                chunk_number = 0
                for chunk in pd.read_csv(file_path, chunksize=chunk_size, 
                                       encoding='utf-8', on_bad_lines='skip',
                                       low_memory=False):
                    chunk_number += 1
                    chunk_docs = process_dataframe_chunk(chunk, file_path, chunk_number)
                    documents.extend(chunk_docs)
                    total_rows_processed += len(chunk)
                    
                    logger.info(f"Processed chunk {chunk_number}: {len(chunk)} rows, total: {total_rows_processed}")
                    
                    # Clear memory periodically
                    if chunk_number % 10 == 0:
                        import gc
                        gc.collect()
                        
            else:
                # Process small CSV file in memory with error handling for encoding
                try:
                    df = pd.read_csv(file_path, encoding='utf-8', on_bad_lines='skip', low_memory=False)
                except UnicodeDecodeError:
                    try:
                        df = pd.read_csv(file_path, encoding='latin-1', on_bad_lines='skip', low_memory=False)
                    except Exception as e:
                        logger.error(f"Error reading CSV file {file_path}: {e}")
                        return None
                
                documents = process_dataframe_chunk(df, file_path, 1)
                total_rows_processed = len(df)
        else:
            return None
        
        logger.info(f"Loaded {len(documents)} documents from {total_rows_processed} rows in spreadsheet: {file_path}")
        return documents
    
    except Exception as e:
        logger.error(f"Error loading spreadsheet file {file_path}: {e}")
        return None

def process_dataframe_chunk(df_chunk, file_path, chunk_number):
    """
    Process a chunk of DataFrame and convert to Document objects
    
    Args:
        df_chunk (DataFrame): Chunk of data to process
        file_path (str): Original file path
        chunk_number (int): Chunk identifier
        
    Returns:
        list: List of Document objects
    """
    documents = []
    
    # Convert DataFrame chunk to text documents
    for index, row in df_chunk.iterrows():
        # Create a readable text representation of the row
        text_parts = []
        for col, value in row.items():
            if pd.notna(value):
                # Convert value to string and truncate very long values
                value_str = str(value)
                if len(value_str) > 1000:  # Limit very long text values
                    value_str = value_str[:1000] + "... [truncated]"
                text_parts.append(f"{col}: {value_str}")
        
        if text_parts:
            text_content = "\n".join(text_parts)
            documents.append(Document(
                page_content=text_content,
                metadata={
                    "source": os.path.basename(file_path),
                    "row_index": index,
                    "file_type": "spreadsheet",
                    "chunk_number": chunk_number,
                    "total_columns": len(df_chunk.columns)
                }
            ))
    
    return documents

def process_files_from_s3(account_name, account_key, container_name, tenant_id, blob_storage_id, bot_id):
    """
    Load and Process files from AWS S3.

    Connects to AWS S3 using the provided account information.
    Parses Word (.docx, .doc), PDF (.pdf), Excel (.xlsx, .xls) and CSV documents from the specified bucket.
    Divides the documents into chunks which are stored in the vector database.

    Args:
        account_name (str): The AWS access key ID.
        account_key (str): The AWS secret access key.
        container_name (str): The name of the S3 bucket.
        tenant_id (str): The ID of the tenant.
        blob_storage_id (str): The ID of the blob storage.
        bot_id (str): The ID of the bot.

    Returns:
        dict: A dictionary containing the status of the operation.
    """
    try:
        # Create valid collection name with hyphens converted to underscores
        collection_name = create_valid_collection_name(tenant_id, bot_id)
        
        logger.info(f"Training pipeline running for Bot with Bucket Name, tenant_id and blob_storage_id: {container_name}_{tenant_id}_{blob_storage_id}")
        logger.info(f"Using collection name: {collection_name}")
        
        # Clear existing collection before new training
        clear_existing_collection(collection_name)
        
        # Connect to AWS S3 (mask credentials in logs)
        masked_account_key = account_key[:4] + '***' + account_key[-4:] if account_key else '***'
        #logger.info(f"Connecting to S3 bucket: {container_name} with account: {account_name[:8]}***")
       
        if account_name:
           logger.info(
              f"Connecting to S3 bucket: {container_name} with account: {account_name[:8]}***"
           )
        else:
            logger.info(
               f"Connecting to S3 bucket: {container_name} using IAM role"
            )
 
        #s3_client = boto3.client('s3', 
        #                       aws_access_key_id=account_name, 
        #                       aws_secret_access_key=account_key)
        
        if account_name and account_key:
           s3_client = boto3.client("s3", aws_access_key_id=account_name, aws_secret_access_key=account_key,)
        else:
            # Use EC2 IAM role
            s3_client = boto3.client("s3")

        logger.info(f"Connected to S3 bucket: {container_name}")
        
        # List objects in the bucket with pagination for large buckets
        paginator = s3_client.get_paginator('list_objects_v2')
        processed_files = 0
        failed_files = 0
        successful_file_names = []
        failed_file_names = []
        
       # for page in paginator.paginate(Bucket=container_name):
       #     for obj in page.get('Contents', []):
       #         obj_key = obj['Key']
        for page in paginator.paginate(Bucket=container_name):

            contents = page.get("Contents")
            if not contents:
               logger.info("No objects found in this S3 page, skipping")
               continue

            for obj in contents:
                obj_key = obj["Key"]

                
                # Check if file is supported format
                supported_extensions = ['.pdf', '.docx', '.doc', '.txt', '.xlsx', '.xls', '.csv']
                file_extension = os.path.splitext(obj_key.lower())[1]
                
                if file_extension not in supported_extensions:
                    logger.info(f"Skipping unsupported file: {obj_key}")
                    continue
                
                # Check file size before downloading
                file_size = obj['Size']
                logger.info(f"Processing file: {obj_key}, Size: {file_size / 1024 / 1024:.2f} MB")
                
                # Create a temporary file with proper extension
                with tempfile.NamedTemporaryFile(suffix=file_extension, delete=False) as temp_file:
                    temp_file_path = temp_file.name
                
                try:
                    # Download file from S3 with progress for large files
                    logger.info(f"Downloading file: {obj_key}")
                    
                    # Use multipart download for very large files
                    if file_size > 50 * 1024 * 1024:  # 50MB
                        logger.info(f"Using multipart download for large file: {obj_key}")
                        with open(temp_file_path, 'wb') as f:
                            s3_client.download_fileobj(container_name, obj_key, f)
                    else:
                        s3_client.download_file(container_name, obj_key, temp_file_path)
                    
                    documents = []
                    
                    # Process based on file type
                    if file_extension in ['.xlsx', '.xls', '.csv']:
                        # Process spreadsheet files with chunked processing
                        logger.info(f"Processing spreadsheet: {obj_key}")
                        documents = load_spreadsheet_file_chunked(temp_file_path)
                    else:
                        # Process text-based files using existing function
                        logger.info(f"Processing document: {obj_key}")
                        documents = load_and_split_files(temp_file_path)
                    
                    if not documents:
                        logger.warning(f"No documents extracted from: {obj_key}")
                        failed_files += 1
                        continue
                    
                    logger.info(f"Extracted {len(documents)} chunks from {obj_key}")
                    
                    # Process documents in batches to avoid memory issues
                    batch_size = 1000
                    for i in range(0, len(documents), batch_size):
                        batch_docs = documents[i:i + batch_size]
                        
                        # Create embeddings and store in vector database
                        try:
                            embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
                            
                            create_user_store(
                                embeddings=embeddings,
                                connection_args={"uri": os.environ["MILVUS_URI"]},
                                collection_name=collection_name,
                                document_name=f"{obj_key}_batch_{i//batch_size + 1}",
                                documents=batch_docs
                            )
                            
                            logger.info(f"Successfully stored batch {i//batch_size + 1} of {obj_key}")
                            
                        except Exception as embedding_error:
                            logger.error(f"Error in embedding/storage for batch {i//batch_size + 1} of {obj_key}: {embedding_error}")
                            failed_files += 1
                            continue
                    
                    processed_files += 1
                    successful_file_names.append(obj_key)
                    logger.info(f"Successfully processed and stored: {obj_key}")
                    
                except Exception as file_error:
                    logger.error(f"Error processing file {obj_key}: {file_error}")
                    failed_files += 1
                    failed_file_names.append(obj_key)
                    continue
                finally:
                    # Clean up temporary file
                    if os.path.exists(temp_file_path):
                        os.remove(temp_file_path)
                    
                    # Clear memory after processing each file
                    import gc
                    gc.collect()
        
        logger.info(f"Training completed. Processed: {processed_files}, Failed: {failed_files}")
        return {
            "status": "success",
            "processed_files_count": processed_files,
            "failed_files_count": failed_files,
            "processed_files": successful_file_names,
            "failed_files": failed_file_names,
            "collection_name": collection_name
        }
         
    except Exception as e:
        logger.error(f"Error in process_files_from_s3: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

def model_training(account_name, account_key, container_name, tenant_id, blob_storage_id, bot_id):
    """
    Process files from AWS S3, generate trained vectors and store them in vector database.

    Fetches documents from AWS S3 and processes them to generate embedding vectors.
    Saves the processed data and embedding vectors to the vector database.
    Calculates and returns the time taken for processing.

    Args:
        account_name (str): The AWS access key ID.
        account_key (str): The AWS secret access key.
        container_name (str): The name of the S3 bucket.
        tenant_id (str): The ID of the tenant.
        blob_storage_id (str): The ID of the blob storage or bot.
        bot_id (str): The ID of the bot.

    Returns:
        tuple: A tuple containing the time taken for processing files, 
               generating embedding vectors and training status.
    """
    try:
        start_time = time.time()
        logger.info(f"Starting training for tenant: {tenant_id}, bot: {bot_id}")

        # Create valid collection name
        collection_name = create_valid_collection_name(tenant_id, bot_id)
        logger.info(f"Training with collection: {collection_name}")

        # Process files from S3
        start_fetch_time = time.time()
        result = process_files_from_s3(account_name, account_key, container_name, 
                                     tenant_id, blob_storage_id, bot_id)
        end_fetch_time = time.time()
        
        time_taken_to_process_files_from_s3 = end_fetch_time - start_fetch_time
        logger.info(f"Time taken by process_files_from_s3: {time_taken_to_process_files_from_s3:.2f} seconds")

        if result["status"] == "error":
            raise Exception(result["message"])

        # Generate embeddings and store in vector database
        start_embedding_time = time.time()
        # Embedding creation is handled within process_files_from_s3
        end_embedding_time = time.time()
        
        time_taken_to_generate_embedding_vectors = end_embedding_time - start_embedding_time
        logger.info(f"Time taken for embedding generation: {time_taken_to_generate_embedding_vectors:.2f} seconds")

        end_time = time.time()
        total_time = end_time - start_time
        logger.info(f"Total training time: {total_time:.2f} seconds")

        # Return the expected format - just the two time values
       # return time_taken_to_process_files_from_s3, time_taken_to_generate_embedding_vectors
        return {
            "status": "success",
            "collection_name": collection_name,
            "processing_time_seconds": time_taken_to_process_files_from_s3,
            "embedding_time_seconds": time_taken_to_generate_embedding_vectors,
            "processed_files": result["processed_files"],
            "failed_files": result["failed_files"],
            "processed_files_count": result["processed_files_count"],
            "failed_files_count": result["failed_files_count"]
        }
    except Exception as e:
        logger.error(f"Error in model_training: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

# Additional function to check and install required dependencies
def check_dependencies():
    """Check and install required dependencies"""
    try:
        import openpyxl
        logger.info("openpyxl is installed")
    except ImportError:
        logger.warning("openpyxl not found. Excel files will not be supported.")
        # You could add automatic installation here if needed:
        # import subprocess
        # subprocess.run(["pip", "install", "openpyxl"])

# Check dependencies on import
check_dependencies()
