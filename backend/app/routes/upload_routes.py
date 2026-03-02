"""
Upload endpoints - contract upload and processing
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.auth_models import User, UserNotification
from app import models, schemas
from app.pdf_processor import PDFProcessor
from app.ai_extractor import AIExtractor
from app.vector_store import vector_store
from app.s3_service import s3_service
from app.dependencies import log_activity

router = APIRouter(prefix="/api", tags=["uploads"])
pdf_processor = PDFProcessor()
ai_extractor = AIExtractor()

@router.post("/upload/", response_model=schemas.ContractResponse)
async def upload_contract(
    file: UploadFile = File(...),
    current_user: User = Depends(lambda db: None),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Upload and process PDF contract"""
    if current_user.role not in ["project_manager", "program_manager", "director"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers, Program Managers and Directors can upload contracts"
        )
    
    try:
        contents = await file.read()
        
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        extraction_result = pdf_processor.extract_text(contents)
        cleaned_text = pdf_processor.clean_text(extraction_result["text"])
        comprehensive_data = ai_extractor.extract_contract_data(cleaned_text)
        reference_ids = comprehensive_data.get("reference_ids", {})
        embedding = ai_extractor.get_embedding(cleaned_text)
        
        contract_details = comprehensive_data.get("contract_details", {})
        parties = comprehensive_data.get("parties", {})
        financial_details = comprehensive_data.get("financial_details", {})
        terms_conditions_data = comprehensive_data.get("terms_conditions", {})
        
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
            terms_conditions=basic_data["terms_conditions"],
            created_by=current_user.id,
            status="draft",
            version=1
        )
        
        db.add(db_contract)
        db.commit()
        db.refresh(db_contract)

        try:
            upload_notif = UserNotification(
                user_id=current_user.id,
                notification_type="grant_uploaded",
                title="Grant Saved as Draft",
                message=f"'{db_contract.grant_name or db_contract.filename}' has been uploaded and saved as a draft",
                contract_id=db_contract.id,
                is_read=False,
                created_at=datetime.utcnow()
            )
            db.add(upload_notif)
            db.commit()
        except Exception as _notif_err:
            print(f"Warning: could not create upload notification: {_notif_err}")

        # Save reporting schedules and events
        try:
            deliverables_data = comprehensive_data.get("deliverables", {})
            reporting_data = deliverables_data.get("reporting_requirements", {})

            if reporting_data:
                reporting_entry = models.ReportingSchedule(
                    contract_id=db_contract.id,
                    frequency=reporting_data.get("frequency"),
                    report_types=reporting_data.get("report_types", []),
                    due_dates=reporting_data.get("due_dates", []),
                    format_requirements=reporting_data.get("format_requirements"),
                    submission_method=reporting_data.get("submission_method"),
                    recipients=reporting_data.get("recipients", [])
                )

                db.add(reporting_entry)
                db.commit()
                db.refresh(reporting_entry)
                print(f"✅ Reporting schedule saved for contract {db_contract.id}")

        except Exception as e:
            print(f"⚠️ Failed to save reporting schedule: {e}")

        try:
            report_types = reporting_data.get("report_types", [])
            due_dates = reporting_data.get("due_dates", [])

            for i, due_date_str in enumerate(due_dates):
                due_date_obj = datetime.strptime(due_date_str, "%Y-%m-%d").date()
                
                if "Final Report" in report_types and i == len(due_dates) - 1:
                    report_type = "Final Report"
                else:
                    report_type = "Progress Report"

                event = models.ReportingEvent(
                    contract_id=db_contract.id,
                    report_type=report_type,
                    due_date=due_date_obj,
                    status="pending"
                )
                db.add(event)

            db.commit()
            print(f"✅ Reporting events created for contract {db_contract.id}")

        except Exception as e:
            print(f"⚠️ Failed creating reporting events: {e}")

        try:
            pdf_key = s3_service.store_original_pdf(
                contract_id=db_contract.id,
                filename=file.filename,
                file_content=contents
            )
            
            if pdf_key:
                if not db_contract.comprehensive_data:
                    db_contract.comprehensive_data = {}
                
                db_contract.comprehensive_data["s3_pdf"] = {
                    "key": pdf_key,
                    "uploaded_at": datetime.utcnow().isoformat(),
                    "original_filename": file.filename
                }
                db.commit()
                print(f"✅ Contract {db_contract.id} PDF stored in S3: {pdf_key}")
            else:
                print(f"⚠️ Warning: Failed to store PDF in S3 for contract {db_contract.id}")
            
        except Exception as s3_error:
            print(f"⚠️ Warning: S3 storage failed: {s3_error}")
        
        if embedding and len(embedding) > 0:
            metadata = {
                "filename": file.filename,
                "contract_number": basic_data.get("contract_number") or "",
                "grant_name": basic_data.get("grant_name") or "",
                "total_amount": str(basic_data.get("total_amount")) if basic_data.get("total_amount") else "0",
                "contract_id": str(db_contract.id)
            }
            
            metadata = {k: v for k, v in metadata.items() if v is not None}
            
            chroma_id = vector_store.store_embedding(
                contract_id=db_contract.id,
                text=cleaned_text[:1000] if cleaned_text else "",
                embedding=embedding,
                metadata=metadata
            )
            
            db_contract.chroma_id = chroma_id
            db.commit()
            db.refresh(db_contract)
        
        log_activity(
            db, 
            current_user.id, 
            "upload", 
            contract_id=db_contract.id, 
            details={"filename": file.filename, "contract_id": db_contract.id}, 
            request=request
        )
        
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
