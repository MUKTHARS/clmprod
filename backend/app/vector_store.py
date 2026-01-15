import chromadb
from chromadb.config import Settings
from typing import List, Optional, Dict, Any
import uuid
import numpy as np
from app.config import settings

class ChromaVectorStore:
    def __init__(self):
        # Initialize Chroma client with persistence
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIRECTORY,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get or create collection
        try:
            self.collection = self.client.get_collection(settings.CHROMA_COLLECTION_NAME)
        except:
            self.collection = self.client.create_collection(
                name=settings.CHROMA_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
    
    def store_embedding(
        self, 
        contract_id: int,
        text: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """Store embedding in ChromaDB"""
        if metadata is None:
            metadata = {}
        
        # Add contract_id to metadata
        metadata["contract_id"] = str(contract_id)
        metadata["id"] = str(contract_id)
        
        # Generate unique ID
        doc_id = f"contract_{contract_id}"
        
        # Store in Chroma
        self.collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            metadatas=[metadata],
            documents=[text[:1000]]  # Store first 1000 chars as document
        )
        
        return doc_id
    
    def search_similar(
        self, 
        query_embedding: List[float], 
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for similar contracts"""
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=["metadatas", "distances", "documents"]
            )
            
            # Format results
            formatted_results = []
            if results['ids'][0]:  # Check if there are results
                for i, doc_id in enumerate(results['ids'][0]):
                    formatted_results.append({
                        "contract_id": int(results['metadatas'][0][i].get("contract_id", 0)),
                        "document": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i],
                        "distance": results['distances'][0][i],
                        "similarity_score": 1 - results['distances'][0][i]  # Convert distance to similarity
                    })
            
            return formatted_results
        except Exception as e:
            print(f"Search error: {e}")
            return []
    
    def get_by_contract_id(self, contract_id: int) -> Optional[Dict[str, Any]]:
        """Get embedding by contract ID"""
        try:
            results = self.collection.get(
                ids=[f"contract_{contract_id}"],
                include=["embeddings", "metadatas", "documents"]
            )
            
            if results['ids']:
                return {
                    "contract_id": contract_id,
                    "embedding": results['embeddings'][0] if results['embeddings'] else None,
                    "metadata": results['metadatas'][0] if results['metadatas'] else {},
                    "document": results['documents'][0] if results['documents'] else ""
                }
            return None
        except Exception as e:
            print(f"Get by contract_id error: {e}")
            return None
    
    def delete_by_contract_id(self, contract_id: int) -> bool:
        """Delete embedding by contract ID"""
        try:
            self.collection.delete(ids=[f"contract_{contract_id}"])
            return True
        except Exception as e:
            print(f"Delete error: {e}")
            return False
    
    def get_all_contracts(self) -> List[Dict[str, Any]]:
        """Get all stored contracts from Chroma"""
        try:
            results = self.collection.get(include=["embeddings", "metadatas", "documents"])
            contracts = []
            
            for i, doc_id in enumerate(results['ids']):
                contracts.append({
                    "contract_id": int(results['metadatas'][i].get("contract_id", 0)),
                    "embedding": results['embeddings'][i] if results['embeddings'] else None,
                    "metadata": results['metadatas'][i],
                    "document": results['documents'][i]
                })
            
            return contracts
        except Exception as e:
            print(f"Get all error: {e}")
            return []

# Global vector store instance
vector_store = ChromaVectorStore()