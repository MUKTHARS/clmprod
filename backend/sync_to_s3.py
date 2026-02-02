#!/usr/bin/env python3
"""
Script to sync existing contracts from PostgreSQL to S3
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# First, setup the database
from app.database import setup_database, SessionLocal
from app.s3_service import s3_service
from datetime import datetime

def sync_existing_contracts():
    """Sync all existing contracts to S3 (extracted data only - no PDFs)"""
    print("Starting S3 sync for existing contracts...")
    
    # Initialize database
    setup_database()
    
    # Create session
    db = SessionLocal()
    
    try:
        # Import models AFTER database setup
        from app import models
        
        contracts = db.query(models.Contract).all()
        print(f"Found {len(contracts)} contracts in database")
        
        synced_count = 0
        failed_count = 0
        
        for contract in contracts:
            try:
                print(f"Syncing extracted data for contract {contract.id}: {contract.grant_name or contract.filename}")
                
                # Prepare comprehensive data
                comprehensive_data = contract.comprehensive_data or {}
                
                # Add basic data if not already present
                if "basic_data" not in comprehensive_data:
                    basic_data = {
                        "contract_id": contract.id,
                        "filename": contract.filename,
                        "contract_number": contract.contract_number,
                        "grant_name": contract.grant_name,
                        "grantor": contract.grantor,
                        "grantee": contract.grantee,
                        "total_amount": contract.total_amount,
                        "start_date": contract.start_date,
                        "end_date": contract.end_date,
                        "purpose": contract.purpose,
                        "status": contract.status
                    }
                    comprehensive_data["basic_data"] = basic_data
                
                # Store extracted data in S3
                data_key = s3_service.store_extracted_data(contract.id, comprehensive_data)
                
                # Store extracted text
                text_key = None
                if contract.full_text:
                    text_key = s3_service.store_extracted_text(contract.id, contract.full_text)
                
                # Update PostgreSQL with S3 reference
                if data_key:
                    if not contract.comprehensive_data:
                        contract.comprehensive_data = {}
                    
                    contract.comprehensive_data["s3_files"] = {
                        "extracted_data": data_key,
                        "extracted_text": text_key,
                        "synced_at": datetime.utcnow().isoformat(),
                        "sync_type": "batch_sync"
                    }
                    db.commit()
                
                synced_count += 1
                print(f"  ✅ Synced extracted data to S3")
                
            except Exception as e:
                failed_count += 1
                print(f"  ❌ Failed: {str(e)}")
                import traceback
                traceback.print_exc()
                db.rollback()  # Rollback on error for this contract
        
        print(f"\nSync completed!")
        print(f"Successfully synced extracted data: {synced_count}")
        print(f"Failed: {failed_count}")
        print("\nNote: Original PDFs are not synced in batch mode.")
        print("New uploads will automatically store PDFs in S3.")
        
    except Exception as e:
        print(f"❌ Major error during sync: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    sync_existing_contracts()

# #!/usr/bin/env python3
# """
# Script to sync existing contracts from PostgreSQL to S3
# """
# import sys
# import os
# from datetime import datetime

# # Add the project root to the path
# sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# # Set up database before importing models
# from app.database import setup_database, SessionLocal, Base, engine

# # IMPORTANT: Setup database first to resolve relationships
# setup_database()

# # Now import models AFTER setup_database is called
# from app import models
# from app.s3_service import s3_service
# from sqlalchemy.orm import Session
# import traceback

# def sync_existing_contracts(db: Session):
#     """Sync all existing contracts to S3"""
#     print("Starting S3 sync for existing contracts...")
    
#     try:
#         contracts = db.query(models.Contract).all()
#         print(f"Found {len(contracts)} contracts in database")
        
#         synced_count = 0
#         failed_count = 0
        
#         for contract in contracts:
#             try:
#                 print(f"Syncing contract {contract.id}: {contract.grant_name or contract.filename}")
                
#                 # Prepare comprehensive data
#                 comprehensive_data = contract.comprehensive_data or {}
                
#                 # Add basic data if not already present
#                 if "basic_data" not in comprehensive_data:
#                     basic_data = {
#                         "contract_id": contract.id,
#                         "filename": contract.filename,
#                         "contract_number": contract.contract_number,
#                         "grant_name": contract.grant_name,
#                         "grantor": contract.grantor,
#                         "grantee": contract.grantee,
#                         "total_amount": contract.total_amount,
#                         "start_date": contract.start_date,
#                         "end_date": contract.end_date,
#                         "purpose": contract.purpose,
#                         "status": contract.status
#                     }
#                     comprehensive_data["basic_data"] = basic_data
                
#                 # Store in S3
#                 s3_key = s3_service.store_contract_data(contract.id, comprehensive_data)
                
#                 # Store extracted text
#                 if contract.full_text:
#                     s3_service.store_extracted_text(contract.id, contract.full_text)
                
#                 # Update PostgreSQL with S3 reference
#                 if s3_key:
#                     if not contract.comprehensive_data:
#                         contract.comprehensive_data = {}
#                     contract.comprehensive_data["s3_references"] = {
#                         "data_key": s3_key,
#                         "synced_at": datetime.utcnow().isoformat(),
#                         "sync_type": "batch_sync"
#                     }
#                     db.commit()
                
#                 synced_count += 1
#                 print(f"  ✓ Synced to S3: {s3_key}")
                
#             except Exception as e:
#                 failed_count += 1
#                 print(f"  ✗ Failed to sync contract {contract.id}: {str(e)}")
#                 traceback.print_exc()
#                 db.rollback()  # Rollback in case of error
        
#         print(f"\nSync completed!")
#         print(f"Successfully synced: {synced_count}")
#         print(f"Failed: {failed_count}")
        
#     except Exception as e:
#         print(f"Error during sync: {str(e)}")
#         traceback.print_exc()

# if __name__ == "__main__":
#     db = SessionLocal()
#     try:
#         sync_existing_contracts(db)
#     finally:
#         db.close()