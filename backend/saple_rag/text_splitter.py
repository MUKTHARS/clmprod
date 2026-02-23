from langchain_community.document_loaders import (
    CSVLoader, TextLoader, PyPDFLoader, JSONLoader,
    UnstructuredHTMLLoader, UnstructuredMarkdownLoader, Docx2txtLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os

def load_and_split_files(file_path, chunk_size=800, chunk_overlap=100):
    """
    Loads and splits a supported document into chunks.
    
    Supported file types: .txt, .pdf, .json, .docx, .html, .md

    Args:
        file_path (str): Path to the document.
        chunk_size (int): Max characters in a single chunk.
        chunk_overlap (int): Number of overlapping characters between chunks.

    Returns:
        List[Document]: A list of LangChain Document chunks.
    """
    print("Load split files Started")
    file_extension = os.path.splitext(file_path)[1].lower()
    print("File Extension", file_extension)

    try:
        if file_extension == ".txt":
            loader = TextLoader(file_path)
        elif file_extension == ".pdf":
            loader = PyPDFLoader(file_path)
        elif file_extension == ".json":
            loader = JSONLoader(file_path)
        elif file_extension == ".docx":
            loader = Docx2txtLoader(file_path)
        elif file_extension == ".html":
            loader = UnstructuredHTMLLoader(file_path)
        elif file_extension == ".md":
            loader = UnstructuredMarkdownLoader(file_path)
        else:
            raise ValueError(f"Unsupported file extension: {file_extension}")
        
        print(f"Using loader: {loader.__class__.__name__}")
        pages = loader.load()

        if not pages:
            print(f"No content found in {file_path}")
            return []

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        all_splits = text_splitter.split_documents(pages)

        print("All Splits", all_splits)
        return all_splits

    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
        return []
