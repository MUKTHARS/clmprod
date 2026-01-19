# migrate_reference_ids.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.ai_extractor import AIExtractor

def update_existing_contracts():
    """Update existing contracts with reference IDs"""
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    ai_extractor = AIExtractor()
    
    try:
        from app.models import Contract
        contracts = db.query(Contract).filter(
            (Contract.investment_id.is_(None)) & 
            (Contract.project_id.is_(None)) & 
            (Contract.grant_id.is_(None))
        ).all()
        
        print(f"Found {len(contracts)} contracts to update")
        
        for contract in contracts:
            if contract.full_text:
                # Extract reference IDs
                reference_ids = ai_extractor.extract_reference_ids(
                    contract.full_text,
                    contract.comprehensive_data.get("contract_details", {}) if contract.comprehensive_data else {}
                )
                
                # Update contract
                contract.investment_id = reference_ids.get("investment_id")
                contract.project_id = reference_ids.get("project_id")
                contract.grant_id = reference_ids.get("grant_id")
                contract.extracted_reference_ids = reference_ids.get("extracted_reference_ids", [])
                
                print(f"Updated contract {contract.id}: {reference_ids}")
        
        db.commit()
        print("✓ All contracts updated successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_existing_contracts()