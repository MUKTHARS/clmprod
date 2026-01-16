# PROXY FIX - Must be at the VERY TOP
import os
import sys

from app import models, schemas
from fastapi.middleware.cors import CORSMiddleware
# Remove all proxy environment variables
proxy_vars = [
    'HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy',
    'ALL_PROXY', 'all_proxy', 'NO_PROXY', 'no_proxy',
    'REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE'
]

for var in proxy_vars:
    os.environ.pop(var, None)

# Also patch OpenAI if needed
try:
    import openai._base_client
    
    # Patch SyncHttpxClientWrapper
    original_init = openai._base_client.SyncHttpxClientWrapper.__init__
    
    def patched_init(self, **kwargs):
        kwargs.pop('proxies', None)
        kwargs.pop('proxy', None)
        return original_init(self, **kwargs)
    
    openai._base_client.SyncHttpxClientWrapper.__init__ = patched_init
    
    # Patch AsyncHttpxClientWrapper  
    original_async_init = openai._base_client.AsyncHttpxClientWrapper.__init__
    
    def patched_async_init(self, **kwargs):
        kwargs.pop('proxies', None)
        kwargs.pop('proxy', None)
        return original_async_init(self, **kwargs)
    
    openai._base_client.AsyncHttpxClientWrapper.__init__ = patched_async_init
    
    print("✓ OpenAI proxy patches applied at startup")
except Exception as e:
    print(f"Note: Could not apply OpenAI patches: {e}")

# Now import everything else
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import json

from app import models, schemas
from app.database import get_db, engine, setup_database
from app.pdf_processor import PDFProcessor
from app.ai_extractor import AIExtractor
from app.vector_store import vector_store
from app.config import settings

# Create tables
models.Base.metadata.create_all(bind=engine)
setup_database()

app = FastAPI(title=settings.APP_NAME)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://44.219.56.85:4000", "http://44.219.56.85:5173","http://44.219.56.85:4001","http://localhost:4000", "http://localhost:4001","http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processors
pdf_processor = PDFProcessor()
ai_extractor = AIExtractor()

@app.get("/")
def read_root():
    return {"message": "Grant Contract Analyzer API"}

@app.post("/upload/", response_model=schemas.ContractResponse)
async def upload_contract(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process PDF contract"""
    try:
        # Read file
        contents = await file.read()
        
        # Check if PDF
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Extract text from PDF
        extraction_result = pdf_processor.extract_text(contents)
        cleaned_text = pdf_processor.clean_text(extraction_result["text"])
        
        # Extract comprehensive data using AI
        comprehensive_data = ai_extractor.extract_contract_data(cleaned_text)
        reference_ids = comprehensive_data.get("reference_ids", {})
        # Get embedding
        embedding = ai_extractor.get_embedding(cleaned_text)
        
        # Safely extract basic fields with None checks
        contract_details = comprehensive_data.get("contract_details", {})
        parties = comprehensive_data.get("parties", {})
        financial_details = comprehensive_data.get("financial_details", {})
        terms_conditions_data = comprehensive_data.get("terms_conditions", {})
        
        # Extract basic data with safe defaults
        basic_data = {
            "contract_number": contract_details.get("contract_number"),
            "grant_name": contract_details.get("grant_name"),
            "grantor": parties.get("grantor", {}).get("organization_name"),
            "grantee": parties.get("grantee", {}).get("organization_name"),
            "total_amount": financial_details.get("total_grant_amount"),
            "start_date": contract_details.get("start_date"),
            "end_date": contract_details.get("end_date"),
            "purpose": contract_details.get("purpose"),
            "payment_schedule": financial_details.get("payment_schedule", {}),
            "terms_conditions": terms_conditions_data
        }
        
        # Create contract record in PostgreSQL
        db_contract = models.Contract(
            filename=file.filename,
            full_text=cleaned_text[:5000] if cleaned_text else "",
            comprehensive_data=comprehensive_data,
            investment_id=reference_ids.get("investment_id"),
            project_id=reference_ids.get("project_id"),
            grant_id=reference_ids.get("grant_id"),
            extracted_reference_ids=reference_ids.get("extracted_reference_ids", []),
            contract_number=basic_data["contract_number"],
            grant_name=basic_data["grant_name"],
            grantor=basic_data["grantor"],
            grantee=basic_data["grantee"],
            total_amount=basic_data["total_amount"],
            start_date=basic_data["start_date"],
            end_date=basic_data["end_date"],
            purpose=basic_data["purpose"],
            payment_schedule=basic_data["payment_schedule"],
            terms_conditions=basic_data["terms_conditions"]
        )
        
        db.add(db_contract)
        db.commit()
        db.refresh(db_contract)
        
        # Store embedding in ChromaDB only if we have a valid embedding
        if embedding and len(embedding) > 0:
            metadata = {
                "filename": file.filename,
                "contract_number": basic_data.get("contract_number") or "",
                "grant_name": basic_data.get("grant_name") or "",
                "total_amount": str(basic_data.get("total_amount")) if basic_data.get("total_amount") else "0",
                "contract_id": str(db_contract.id)
            }
            
            # Clean metadata (remove None values)
            metadata = {k: v for k, v in metadata.items() if v is not None}
            
            chroma_id = vector_store.store_embedding(
                contract_id=db_contract.id,
                text=cleaned_text[:1000] if cleaned_text else "",
                embedding=embedding,
                metadata=metadata
            )
            
            # Update contract with chroma_id
            db_contract.chroma_id = chroma_id
            db.commit()
            db.refresh(db_contract)
        
        return db_contract
        
    except Exception as e:
        db.rollback()
        import traceback
        error_details = traceback.format_exc()
        print(f"Processing failed: {str(e)}")
        print(f"Error details: {error_details}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    finally:
        await file.close()

@app.get("/api/contracts/{contract_id}/comprehensive")
async def get_comprehensive_data(contract_id: int, db: Session = Depends(get_db)):
    """Get comprehensive data for a specific contract"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return {
        "contract_id": contract.id,
        "filename": contract.filename,
        "basic_data": {
            "contract_number": contract.contract_number,
            "grant_name": contract.grant_name,
            "grantor": contract.grantor,
            "grantee": contract.grantee,
            "total_amount": contract.total_amount,
            "start_date": contract.start_date,
            "end_date": contract.end_date,
            "purpose": contract.purpose
        },
        "comprehensive_data": contract.comprehensive_data
    }

@app.get("/api/contracts/{contract_id}/similar")
async def get_similar_contracts(
    contract_id: int, 
    n_results: int = 3,
    db: Session = Depends(get_db)
):
    """Find similar contracts"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Get embedding for this contract
    if contract.chroma_id:
        vector_data = vector_store.get_by_contract_id(contract.id)
        if vector_data and vector_data.get("embedding"):
            similar = vector_store.search_similar(vector_data["embedding"], n_results + 1)
            # Filter out the current contract
            similar = [s for s in similar if s["contract_id"] != contract.id]
            
            # Get full contract details for similar contracts
            similar_contracts = []
            for item in similar[:n_results]:
                similar_contract = db.query(models.Contract).filter(
                    models.Contract.id == item["contract_id"]
                ).first()
                if similar_contract:
                    similar_contracts.append({
                        "contract": similar_contract,
                        "similarity_score": item["similarity_score"]
                    })
            
            return {"similar_contracts": similar_contracts}
    
    return {"similar_contracts": []}

@app.get("/api/contracts/")
async def get_all_contracts(db: Session = Depends(get_db)):
    """Get all contracts with pagination"""
    contracts = db.query(models.Contract).order_by(models.Contract.uploaded_at.desc()).all()
    return contracts

@app.get("/api/contracts/{contract_id}")
async def get_contract(contract_id: int, db: Session = Depends(get_db)):
    """Get a single contract by ID"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

@app.delete("/api/contracts/{contract_id}")
async def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    """Delete a contract"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Delete from ChromaDB
    if contract.chroma_id:
        vector_store.delete_by_contract_id(contract.id)
    
    # Delete from database
    db.delete(contract)
    db.commit()
    
    return {"message": "Contract deleted successfully"}


# @app.post("/upload/", response_model=schemas.ContractResponse)
# async def upload_contract(
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db)
# ):
#     """Upload and process PDF contract"""
#     try:
#         # Read file
#         contents = await file.read()
        
#         # Check if PDF
#         if not file.filename.lower().endswith('.pdf'):
#             raise HTTPException(status_code=400, detail="File must be a PDF")
        
#         # Extract text from PDF
#         extraction_result = pdf_processor.extract_text(contents)
#         cleaned_text = pdf_processor.clean_text(extraction_result["text"])
        
#         # Extract comprehensive data using AI
#         comprehensive_data = ai_extractor.extract_contract_data(cleaned_text)
        
#         # Get embedding
#         embedding = ai_extractor.get_embedding(cleaned_text)
        
#         # Extract basic fields for backward compatibility
#         basic_data = {
#             "contract_number": comprehensive_data.get("contract_details", {}).get("contract_number"),
#             "grant_name": comprehensive_data.get("contract_details", {}).get("grant_name"),
#             "grantor": comprehensive_data.get("parties", {}).get("grantor", {}).get("organization_name"),
#             "grantee": comprehensive_data.get("parties", {}).get("grantee", {}).get("organization_name"),
#             "total_amount": comprehensive_data.get("financial_details", {}).get("total_grant_amount"),
#             "start_date": comprehensive_data.get("contract_details", {}).get("start_date"),
#             "end_date": comprehensive_data.get("contract_details", {}).get("end_date"),
#             "purpose": comprehensive_data.get("contract_details", {}).get("purpose"),
#             "payment_schedule": comprehensive_data.get("financial_details", {}).get("payment_schedule"),
#             "terms_conditions": comprehensive_data.get("terms_conditions", {})
#         }
        
#         # Create contract record in PostgreSQL
#         db_contract = models.Contract(
#             filename=file.filename,
#             full_text=cleaned_text[:5000],
#             comprehensive_data=comprehensive_data,  # Store comprehensive data
#             **basic_data
#         )
        
#         db.add(db_contract)
#         db.commit()
#         db.refresh(db_contract)
        
#         # Store embedding in ChromaDB
#         if embedding and len(embedding) > 0:
#             metadata = {
#                 "filename": file.filename,
#                 "contract_number": basic_data.get("contract_number"),
#                 "grant_name": basic_data.get("grant_name"),
#                 "total_amount": str(basic_data.get("total_amount")),
#             }
            
#             chroma_id = vector_store.store_embedding(
#                 contract_id=db_contract.id,
#                 text=cleaned_text,
#                 embedding=embedding,
#                 metadata=metadata
#             )
            
#             # Update contract with chroma_id
#             db_contract.chroma_id = chroma_id
#             db.commit()
#             db.refresh(db_contract)
        
#         return db_contract
        
#     except Exception as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
#     finally:
#         await file.close()

@app.get("/contracts/", response_model=List[schemas.ContractResponse])
def get_contracts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all contracts"""
    contracts = db.query(models.Contract).offset(skip).limit(limit).all()
    return contracts

@app.get("/contracts/{contract_id}", response_model=schemas.ContractResponse)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    """Get specific contract"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract

# ADD THIS NEW ENDPOINT
@app.get("/contracts/{contract_id}/comprehensive")
def get_comprehensive_data(contract_id: int, db: Session = Depends(get_db)):
    """Get comprehensive data for a contract"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if not contract.comprehensive_data:
        raise HTTPException(status_code=404, detail="Comprehensive data not found")
    
    return {
        "contract_id": contract.id,
        "filename": contract.filename,
        "comprehensive_data": contract.comprehensive_data,
        "basic_data": {
            "contract_number": contract.contract_number,
            "grant_name": contract.grant_name,
            "grantor": contract.grantor,
            "grantee": contract.grantee,
            "total_amount": contract.total_amount,
            "start_date": contract.start_date,
            "end_date": contract.end_date,
            "purpose": contract.purpose
        }
    }

@app.get("/contracts/{contract_id}/similar")
def get_similar_contracts(contract_id: int, n_results: int = 5, db: Session = Depends(get_db)):
    """Find similar contracts"""
    # Get contract
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Get embedding from ChromaDB
    chroma_data = vector_store.get_by_contract_id(contract_id)
    if not chroma_data or not chroma_data.get("embedding"):
        raise HTTPException(status_code=404, detail="Contract embedding not found")
    
    # Search for similar contracts
    similar_results = vector_store.search_similar(
        query_embedding=chroma_data["embedding"],
        n_results=n_results
    )
    
    # Get full contract details for similar contracts
    similar_contracts = []
    for result in similar_results:
        if result["contract_id"] != contract_id:  # Exclude self
            similar_contract = db.query(models.Contract).filter(
                models.Contract.id == result["contract_id"]
            ).first()
            
            if similar_contract:
                similar_contracts.append({
                    "contract": schemas.ContractResponse.from_orm(similar_contract),
                    "similarity_score": result["similarity_score"],
                    "distance": result["distance"]
                })
    
    return {
        "query_contract": schemas.ContractResponse.from_orm(contract),
        "similar_contracts": similar_contracts
    }

@app.delete("/contracts/{contract_id}")
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    """Delete contract and its embedding"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Delete from ChromaDB
    vector_store.delete_by_contract_id(contract_id)
    
    # Delete from PostgreSQL
    db.delete(contract)
    db.commit()
    
    return {"message": "Contract deleted successfully"}

@app.post("/extract/")
async def extract_from_text(request: schemas.ExtractionRequest):
    """Extract data from raw text (for testing)"""
    extracted_data = ai_extractor.extract_contract_data(request.text)
    return {"extracted_data": extracted_data}

@app.get("/search/")
def semantic_search(query: str, n_results: int = 5):
    """Semantic search using ChromaDB"""
    # Get embedding for query
    query_embedding = ai_extractor.get_embedding(query)
    
    # Search in ChromaDB
    search_results = vector_store.search_similar(
        query_embedding=query_embedding,
        n_results=n_results
    )
    
    return {
        "query": query,
        "results": search_results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4001)