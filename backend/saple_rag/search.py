"""vectror search module."""

from langchain_milvus import Milvus
from typing import Dict

def search_vector_store(vector_store: Milvus, query: str, top_k: int = 1, index: Dict = None) -> list:
    """Search a Milvus vector store.
    Args:
    vector_store : Milvus : Milvus vector store.
    query : str : Query text.
    top_k : int : Number of results to return.
    Returns:
    list : List of search results.
    """
    return vector_store.similarity_search(query, top_k=top_k)