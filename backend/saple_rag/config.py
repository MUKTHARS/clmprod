# Milvus connection setup
import os
from langchain_milvus import Milvus
from langchain.embeddings.base import Embeddings 

def create_vector_store(embeddings : Embeddings, 
                        connection_args: str = None, 
                        collection_name: str = None, 
                        document_name: str = None,
                        drop_old : bool =False) -> Milvus:
    """Create a Milvus vector store.
    Args 
    embeddings : Embeddings : Embedding model to use.
    connection_args : str : Connection arguments for Milvus.
    collection_name : str : Name of the collection.
    drop_old : bool : Whether to drop the old collection if it exists.
    Returns
    Milvus : Milvus vector store.
    """
    if "MILVUS_URI" not in os.environ:
        os.environ["MILVUS_URI"] = connection_args

    vector_store = Milvus(
        embedding_function=embeddings,
        connection_args=connection_args,
        collection_name=collection_name,
        drop_old=drop_old,
    )
    return vector_store