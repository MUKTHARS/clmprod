# milvus_vector_store.py

from langchain.embeddings.base import Embeddings  # Or your embedding model import
from pymilvus import Milvus, CollectionSchema, FieldSchema, DataType
from langchain_milvus import Milvus
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
import asyncio


def create_user_store(embeddings: Embeddings, 
                        connection_args: dict, 
                        collection_name: str, 
                        document_name: str, 
                        drop_old: bool = False,
                        documents = None) -> Milvus:
    # Initialize the Milvus client
    """
    create a vector store
    Args:
        embeddings: Embeddings model
        connection_args: Connection arguments for Milvus
        collection_name: Name of the collection
        document_name: Name of the document
        drop_old: Whether to drop the old collection
    Returns:
        LangChainMilvus: The vector store
    """

    try:
        print("Creating vector store...")
        vector_store = Milvus(
            embedding_function=embeddings,
            connection_args=connection_args,
            collection_name=collection_name,
            drop_old=False,
        ).from_documents(
            documents=documents,
            embedding=embeddings,
            collection_name=collection_name,
            connection_args=connection_args,
        )
        print("Vector store created.")
        return vector_store
    except Exception as e:
        print(f"Error creating vector store: {e}")
        return None
