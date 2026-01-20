import os
import sys
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import Query, Response
from fastapi.responses import RedirectResponse, JSONResponse

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
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import json
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.database import get_db, engine, setup_database
from app.pdf_processor import PDFProcessor
from app.ai_extractor import AIExtractor
from app.vector_store import vector_store
from app.config import settings
from app import models, schemas
from app.auth_models import User, ActivityLog, ContractPermission
from app.auth_schemas import UserCreate, UserResponse, LoginRequest, Token, ChangePasswordRequest

# Create tables and setup relationships
setup_database()

app = FastAPI(title=settings.APP_NAME)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4000", "http://44.219.56.85:5173", "http://44.219.56.85:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processors
pdf_processor = PDFProcessor()
ai_extractor = AIExtractor()

# Authentication dependencies
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    return user

def check_permission(user: User, contract_id: int, required_permission: str, db: Session) -> bool:
    """Check if user has required permission for a contract"""
    # Get the contract first
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        return False
    
    # Admin/Director has all permissions for all contracts
    if user.role == "director":
        return True
    
    # Program Manager permissions
    if user.role == "program_manager":
        # Program Managers can:
        # 1. View contracts under review, reviewed, approved, or draft
        if required_permission == "view":
            return contract.status in ["under_review", "reviewed", "approved", "draft"]
        # 2. Review contracts that are under review
        elif required_permission == "review":
            return contract.status == "under_review"
        else:
            return False
    
    # Project Manager permissions
    if user.role == "project_manager":
        # Check if this user created the contract
        is_creator = contract.created_by == user.id
        
        if not is_creator:
            # Non-creator Project Managers can only view if explicitly granted
            if required_permission == "view":
                permission = db.query(ContractPermission).filter(
                    ContractPermission.contract_id == contract_id,
                    ContractPermission.user_id == user.id,
                    ContractPermission.permission_type == "view"
                ).first()
                return permission is not None
            return False
        
        # Project Manager (Creator/Owner/Admin) permissions based on status
        
        # 1. ALWAYS ALLOWED PERMISSIONS (regardless of status):
        # - View: Can always view their own contracts
        # - Upload: Can upload/initiate processing (this is handled at contract creation)
        if required_permission in ["view", "upload"]:
            return True
        
        # 2. DRAFT STATUS PERMISSIONS:
        # Contract is in draft or being created
        if contract.status == "draft":
            # Can edit, fix metadata, submit for review
            if required_permission in ["edit", "fix_metadata", "submit_review"]:
                return True
        
        # 3. REJECTED STATUS PERMISSIONS:
        # Contract was rejected by Program Manager
        elif contract.status == "rejected":
            # Can edit, fix metadata, respond to comments, resubmit for review
            if required_permission in ["edit", "fix_metadata", "respond_to_comments", "submit_review"]:
                return True
        
        # 4. UNDER_REVIEW STATUS PERMISSIONS:
        # Contract is being reviewed by Program Manager
        elif contract.status == "under_review":
            # Can only view and respond to comments (cannot edit while under review)
            if required_permission in ["respond_to_comments"]:
                return True
        
        # 5. REVIEWED STATUS PERMISSIONS:
        # Contract reviewed by Program Manager, waiting for Director approval
        elif contract.status == "reviewed":
            # Can only view (no changes allowed)
            if required_permission == "view":
                return True
        
        # 6. APPROVED STATUS PERMISSIONS:
        # Contract approved by Director
        elif contract.status == "approved":
            # Can only view (contract is finalized)
            if required_permission == "view":
                return True
        
        # Check explicit permissions for any other permissions
        permission = db.query(ContractPermission).filter(
            ContractPermission.contract_id == contract_id,
            ContractPermission.user_id == user.id,
            ContractPermission.permission_type == required_permission
        ).first()
        
        return permission is not None
    
    # Other users (if any) - check explicit permissions only
    permission = db.query(ContractPermission).filter(
        ContractPermission.contract_id == contract_id,
        ContractPermission.user_id == user.id,
        ContractPermission.permission_type == required_permission
    ).first()
    
    return permission is not None

def get_user_permissions_dict(user: User) -> Dict[str, bool]:
    """Get all permissions for a user based on their role"""
    if user.role == "director":
        return {
            "can_upload": True,
            "can_view_all": True,
            "can_edit_all": True,
            "can_delete_all": True,
            "can_review": True,
            "can_approve": True,
            "can_manage_users": True,
            "can_view_activity_logs": True,
            "can_export": True,
            "can_manage_settings": True,
            "can_view_dashboard": True,
            "can_view_contracts": True,
            "can_view_analytics": True,
            "can_view_reports": True,
            "can_view_risk": True,
            "can_view_organizations": True,
            "can_view_grants": True,
            "can_view_approvals": True,
            "can_view_knowledge": True,
            "can_view_help": True,
            "can_submit_for_review": True,
            "can_resubmit_after_changes": True,
            "can_fix_metadata": True,
            "can_respond_to_comments": True,
            "can_view_all_versions": True
        }
    elif user.role == "program_manager":
        return {
            "can_upload": False,
            "can_view_all": True,
            "can_edit_all": False,
            "can_delete_all": False,
            "can_review": True,
            "can_approve": False,
            "can_manage_users": False,
            "can_view_activity_logs": False,
            "can_export": True,
            "can_manage_settings": False,
            "can_view_dashboard": False,
            "can_view_contracts": True,
            "can_view_analytics": True,
            "can_view_reports": True,
            "can_view_risk": True,
            "can_view_organizations": False,
            "can_view_grants": True,
            "can_view_approvals": False,
            "can_view_knowledge": True,
            "can_view_help": True,
            "can_submit_for_review": False,
            "can_resubmit_after_changes": False,
            "can_fix_metadata": False,
            "can_respond_to_comments": False,
            "can_view_all_versions": False
        }
    else:  # project_manager
        return {
            "can_upload": True,
            "can_view_all": False,
            "can_edit_all": False,
            "can_delete_all": False,
            "can_review": False,
            "can_approve": False,
            "can_manage_users": False,
            "can_view_activity_logs": False,
            "can_export": True,
            "can_manage_settings": False,
            "can_view_dashboard": True,
            "can_view_contracts": True,
            "can_view_analytics": False,
            "can_view_reports": False,
            "can_view_risk": False,
            "can_view_organizations": False,
            "can_view_grants": False,
            "can_view_approvals": False,
            "can_view_knowledge": True,
            "can_view_help": True,
            "can_submit_for_review": True,
            "can_resubmit_after_changes": True,
            "can_fix_metadata": True,
            "can_respond_to_comments": True,
            "can_view_all_versions": True
        }

def log_activity(
    db: Session, 
    user_id: int, 
    activity_type: str, 
    contract_id: Optional[int] = None, 
    details: Optional[dict] = None,
    request: Optional[Request] = None
):
    """Log user activity"""
    activity = ActivityLog(
        user_id=user_id,
        activity_type=activity_type,
        contract_id=contract_id,
        details=details or {},
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    
    db.add(activity)
    db.commit()
    return activity

# Public health check endpoint (no auth required)
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Authentication endpoints
@app.post("/auth/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Register a new user (director only)"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only directors can register new users"
        )
    
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    # Create new user
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        department=user_data.department,
        phone=user_data.phone
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    log_activity(
        db, 
        current_user.id, 
        "register_user", 
        details={"new_user_id": db_user.id, "new_user_role": db_user.role}, 
        request=request
    )
    
    return db_user

@app.post("/auth/login", response_model=Token)
async def login(
    login_data: LoginRequest, 
    request: Request, 
    db: Session = Depends(get_db)
):
    """Login user and return JWT token"""
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is disabled")
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Log login activity
    log_activity(
        db, 
        user.id, 
        "login", 
        details={"method": "password"}, 
        request=request
    )
    
    # Create JWT token
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }

@app.post("/auth/logout")
async def logout(
    request: Request, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Logout user"""
    log_activity(
        db, 
        current_user.id, 
        "logout", 
        request=request
    )
    return {"message": "Logged out successfully"}

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@app.post("/auth/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

# Public root endpoint (no auth required)
@app.get("/")
def read_root():
    return {"message": "Grant Contract Analyzer API", "version": "1.0.0"}

# Protected endpoints with authentication
@app.post("/upload/", response_model=schemas.ContractResponse)
async def upload_contract(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Upload and process PDF contract - Only Project Managers and Directors can upload"""
    if current_user.role not in ["project_manager", "director"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers and Directors can upload contracts"
        )
    
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
            terms_conditions=basic_data["terms_conditions"],
            created_by=current_user.id,
            status="draft",
            version=1
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
        
        # Log activity
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

@app.get("/api/contracts/{contract_id}/comprehensive")
async def get_comprehensive_data(
    contract_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Get comprehensive data for a specific contract"""
    print(f"=== get_comprehensive_data called for ID: {contract_id} ===")
    
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        print(f"Contract {contract_id} not found")
        raise HTTPException(status_code=404, detail="Contract not found")
    
    print(f"Found contract: {contract.id}, created_by: {contract.created_by}, status: {contract.status}")
    print(f"Current user: {current_user.id}, role: {current_user.role}")
    
    # Check permission based on role
    if current_user.role == "project_manager":
        # Project managers can only see contracts they created
        if contract.created_by != current_user.id:
            print(f"Permission denied: Contract created by {contract.created_by}, user is {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this contract"
            )
    elif current_user.role == "program_manager":
        # Program managers can only see contracts in review/approved status
        if contract.status not in ["under_review", "reviewed", "approved", "draft"]:
            print(f"Permission denied: Contract status is {contract.status}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this contract"
            )
    # Directors can see all contracts
    
    # Helper function to safely format dates
    def format_date(date_value):
        if date_value and hasattr(date_value, 'isoformat'):
            return date_value.isoformat()
        return date_value
    
    # Get or create comprehensive_data
    comp_data = contract.comprehensive_data or {}
    
    # Log activity
    log_activity(
        db, 
        current_user.id, 
        "view_comprehensive", 
        contract_id=contract_id, 
        details={"contract_id": contract_id}, 
        request=request
    )
    
    return {
        "contract_id": contract.id,
        "filename": contract.filename or "Unknown",
        "basic_data": {
            "id": contract.id,
            "contract_number": contract.contract_number,
            "grant_name": contract.grant_name or "Unnamed Contract",
            "grantor": contract.grantor or "Unknown Grantor",
            "grantee": contract.grantee or "Unknown Grantee",
            "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
            "start_date": format_date(contract.start_date),
            "end_date": format_date(contract.end_date),
            "purpose": contract.purpose,
            "status": contract.status or "draft",
            "version": contract.version or 1,
            "created_by": contract.created_by
        },
        "comprehensive_data": comp_data
    }

# Project Manager specific endpoints - ADDED HERE
@app.post("/api/contracts/{contract_id}/project-manager/submit-review")
async def submit_contract_for_review(
    contract_id: int,
    submit_data: schemas.SubmitForReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Submit a contract for review - Project Manager only
    Can only submit contracts in 'draft' or 'rejected' status
    """
    # Check if user is project manager
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can submit contracts for review"
        )
    
    # Get the contract
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check if user is the creator
    if contract.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the contract creator can submit for review"
        )
    
    # Check if contract can be submitted for review
    if contract.status not in ["draft", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot submit contract in '{contract.status}' status"
        )
    
    try:
        # Create a version snapshot before submission
        version_data = {
            "contract_data": contract.comprehensive_data or {},
            "basic_data": {
                "grant_name": contract.grant_name,
                "contract_number": contract.contract_number,
                "grantor": contract.grantor,
                "grantee": contract.grantee,
                "total_amount": contract.total_amount,
                "start_date": contract.start_date,
                "end_date": contract.end_date,
                "purpose": contract.purpose,
                "status": contract.status
            },
            "submission_notes": submit_data.notes
        }
        
        # Get next version number
        last_version = db.query(models.ContractVersion).filter(
            models.ContractVersion.contract_id == contract_id
        ).order_by(models.ContractVersion.version_number.desc()).first()
        
        version_number = (last_version.version_number + 1) if last_version else 1
        
        # Create version record
        version = models.ContractVersion(
            contract_id=contract_id,
            version_number=version_number,
            created_by=current_user.id,
            contract_data=version_data,
            changes_description=f"Submitted for review: {submit_data.notes}" if submit_data.notes else "Submitted for review",
            version_type="review_submission"
        )
        
        db.add(version)
        
        # Update contract version and status
        old_status = contract.status
        contract.status = "under_review"
        contract.version = version_number
        
        # Add to comprehensive data history
        if not contract.comprehensive_data:
            contract.comprehensive_data = {}
        
        review_history = contract.comprehensive_data.get("review_history", [])
        review_history.append({
            "action": "submitted_for_review",
            "by_user_id": current_user.id,
            "by_user_name": current_user.full_name or current_user.username,
            "timestamp": datetime.utcnow().isoformat(),
            "notes": submit_data.notes,
            "old_status": old_status,
            "new_status": "under_review",
            "version_number": version_number
        })
        
        contract.comprehensive_data["review_history"] = review_history
        
        db.commit()
        
        # Log activity
        log_activity(
            db, 
            current_user.id, 
            "submit_review", 
            contract_id=contract_id, 
            details={
                "contract_id": contract_id,
                "old_status": old_status,
                "new_status": "under_review",
                "version_number": version_number,
                "notes": submit_data.notes
            }, 
            request=request
        )
        
        return {
            "message": "Contract submitted for review",
            "contract_id": contract_id,
            "version_number": version_number,
            "status": "under_review"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit for review: {str(e)}")

@app.post("/api/contracts/{contract_id}/project-manager/fix-metadata")
async def fix_contract_metadata(
    contract_id: int,
    metadata_update: schemas.MetadataUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Fix/update contract metadata - Project Manager only
    Can only update contracts in 'draft' or 'rejected' status
    """
    # Check if user is project manager
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can fix metadata"
        )
    
    # Get the contract
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check if user is the creator
    if contract.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the contract creator can fix metadata"
        )
    
    # Check if contract can be updated
    if contract.status not in ["draft", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update contract in '{contract.status}' status"
        )
    
    try:
        # Store old values for versioning
        old_values = {
            "grant_name": contract.grant_name,
            "contract_number": contract.contract_number,
            "grantor": contract.grantor,
            "grantee": contract.grantee,
            "total_amount": contract.total_amount,
            "start_date": contract.start_date,
            "end_date": contract.end_date,
            "purpose": contract.purpose
        }
        
        # Update fields that are provided
        update_fields = []
        if metadata_update.grant_name is not None:
            contract.grant_name = metadata_update.grant_name
            update_fields.append("grant_name")
        
        if metadata_update.contract_number is not None:
            contract.contract_number = metadata_update.contract_number
            update_fields.append("contract_number")
        
        if metadata_update.grantor is not None:
            contract.grantor = metadata_update.grantor
            update_fields.append("grantor")
        
        if metadata_update.grantee is not None:
            contract.grantee = metadata_update.grantee
            update_fields.append("grantee")
        
        if metadata_update.total_amount is not None:
            contract.total_amount = metadata_update.total_amount
            update_fields.append("total_amount")
        
        if metadata_update.start_date is not None:
            contract.start_date = metadata_update.start_date
            update_fields.append("start_date")
        
        if metadata_update.end_date is not None:
            contract.end_date = metadata_update.end_date
            update_fields.append("end_date")
        
        if metadata_update.purpose is not None:
            contract.purpose = metadata_update.purpose
            update_fields.append("purpose")
        
        # If no fields were updated
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Get next version number
        last_version = db.query(models.ContractVersion).filter(
            models.ContractVersion.contract_id == contract_id
        ).order_by(models.ContractVersion.version_number.desc()).first()
        
        version_number = (last_version.version_number + 1) if last_version else 1
        
        # Create version record
        version_data = {
            "old_values": old_values,
            "new_values": {
                "grant_name": contract.grant_name,
                "contract_number": contract.contract_number,
                "grantor": contract.grantor,
                "grantee": contract.grantee,
                "total_amount": contract.total_amount,
                "start_date": contract.start_date,
                "end_date": contract.end_date,
                "purpose": contract.purpose
            },
            "updated_fields": update_fields,
            "notes": metadata_update.notes
        }
        
        version = models.ContractVersion(
            contract_id=contract_id,
            version_number=version_number,
            created_by=current_user.id,
            contract_data=version_data,
            changes_description=f"Metadata updated: {metadata_update.notes}" if metadata_update.notes else f"Updated fields: {', '.join(update_fields)}",
            version_type="metadata_update"
        )
        
        db.add(version)
        
        # Update contract version
        contract.version = version_number
        
        # Add to comprehensive data history
        if not contract.comprehensive_data:
            contract.comprehensive_data = {}
        
        metadata_history = contract.comprehensive_data.get("metadata_history", [])
        metadata_history.append({
            "action": "metadata_updated",
            "by_user_id": current_user.id,
            "by_user_name": current_user.full_name or current_user.username,
            "timestamp": datetime.utcnow().isoformat(),
            "updated_fields": update_fields,
            "old_values": {k: v for k, v in old_values.items() if k in update_fields},
            "new_values": {k: getattr(contract, k) for k in update_fields},
            "version_number": version_number,
            "notes": metadata_update.notes
        })
        
        contract.comprehensive_data["metadata_history"] = metadata_history
        
        db.commit()
        
        # Log activity
        log_activity(
            db, 
            current_user.id, 
            "fix_metadata", 
            contract_id=contract_id, 
            details={
                "contract_id": contract_id,
                "updated_fields": update_fields,
                "version_number": version_number,
                "notes": metadata_update.notes
            }, 
            request=request
        )
        
        return {
            "message": "Metadata updated successfully",
            "contract_id": contract_id,
            "version_number": version_number,
            "updated_fields": update_fields
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update metadata: {str(e)}")

@app.post("/api/contracts/{contract_id}/project-manager/respond-to-comments")
async def respond_to_reviewer_comments(
    contract_id: int,
    response_data: schemas.RespondToCommentsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """
    Respond to reviewer comments - Project Manager only
    Can only respond when contract is in 'under_review' or 'rejected' status
    """
    # Check if user is project manager
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can respond to comments"
        )
    
    # Get the contract
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check if user is the creator
    if contract.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the contract creator can respond to comments"
        )
    
    # Check if contract allows responses
    if contract.status not in ["under_review", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot respond to comments in '{contract.status}' status"
        )
    
    try:
        # Create a version snapshot
        last_version = db.query(models.ContractVersion).filter(
            models.ContractVersion.contract_id == contract_id
        ).order_by(models.ContractVersion.version_number.desc()).first()
        
        version_number = (last_version.version_number + 1) if last_version else 1
        
        # Create version record
        version_data = {
            "response": response_data.response,
            "review_comment_id": response_data.review_comment_id,
            "contract_status": contract.status
        }
        
        version = models.ContractVersion(
            contract_id=contract_id,
            version_number=version_number,
            created_by=current_user.id,
            contract_data=version_data,
            changes_description="Responded to reviewer comments",
            version_type="response_to_comments"
        )
        
        db.add(version)
        
        # Update contract version
        contract.version = version_number
        
        # Add response to comprehensive data
        if not contract.comprehensive_data:
            contract.comprehensive_data = {}
        
        responses = contract.comprehensive_data.get("review_responses", [])
        responses.append({
            "response": response_data.response,
            "by_user_id": current_user.id,
            "by_user_name": current_user.full_name or current_user.username,
            "timestamp": datetime.utcnow().isoformat(),
            "review_comment_id": response_data.review_comment_id,
            "version_number": version_number
        })
        
        contract.comprehensive_data["review_responses"] = responses
        
        # If contract was rejected, change status back to draft for resubmission
        if contract.status == "rejected":
            old_status = contract.status
            contract.status = "draft"
            
            status_history = contract.comprehensive_data.get("status_history", [])
            status_history.append({
                "from_status": old_status,
                "to_status": "draft",
                "reason": "Responded to reviewer comments",
                "timestamp": datetime.utcnow().isoformat(),
                "by_user_id": current_user.id
            })
            contract.comprehensive_data["status_history"] = status_history
        
        db.commit()
        
        # Log activity
        log_activity(
            db, 
            current_user.id, 
            "respond_to_comments", 
            contract_id=contract_id, 
            details={
                "contract_id": contract_id,
                "response_length": len(response_data.response),
                "review_comment_id": response_data.review_comment_id,
                "version_number": version_number
            }, 
            request=request
        )
        
        return {
            "message": "Response submitted successfully",
            "contract_id": contract_id,
            "version_number": version_number,
            "new_status": contract.status
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit response: {str(e)}")

@app.get("/api/contracts/{contract_id}/project-manager/versions")
async def get_contract_versions(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all versions of a contract - Project Manager (creator) only
    """
    # Get the contract
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check permissions - only creator can view versions
    if contract.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the contract creator can view versions"
        )
    
    # Get all versions
    versions = db.query(models.ContractVersion).filter(
        models.ContractVersion.contract_id == contract_id
    ).order_by(models.ContractVersion.version_number.desc()).all()
    
    # Format response
    formatted_versions = []
    for version in versions:
        creator = db.query(User).filter(User.id == version.created_by).first()
        
        formatted_versions.append({
            "id": version.id,
            "contract_id": version.contract_id,
            "version_number": version.version_number,
            "created_at": version.created_at.isoformat(),
            "changes_description": version.changes_description,
            "version_type": version.version_type,
            "created_by": version.created_by,
            "creator_name": creator.full_name if creator else creator.username,
            "contract_data": version.contract_data
        })
    
    return {
        "contract_id": contract_id,
        "contract_name": contract.grant_name or contract.filename,
        "current_version": contract.version,
        "versions": formatted_versions
    }

@app.get("/api/contracts/{contract_id}/similar")
async def get_similar_contracts(
    contract_id: int, 
    n_results: int = 3,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Find similar contracts"""
    # Check permission for the main contract
    if not check_permission(current_user, contract_id, "view", db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this contract"
        )
    
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
            
            # Check permissions for similar contracts and get full details
            similar_contracts = []
            for item in similar[:n_results]:
                # Check if user has permission to view this similar contract
                if check_permission(current_user, item["contract_id"], "view", db):
                    similar_contract = db.query(models.Contract).filter(
                        models.Contract.id == item["contract_id"]
                    ).first()
                    if similar_contract:
                        similar_contracts.append({
                            "contract": similar_contract,
                            "similarity_score": item["similarity_score"]
                        })
            
            # Log activity
            log_activity(
                db, 
                current_user.id, 
                "find_similar", 
                contract_id=contract_id, 
                details={"contract_id": contract_id, "results_count": len(similar_contracts)}, 
                request=request
            )
            
            return {"similar_contracts": similar_contracts}
    
    return {"similar_contracts": []}

@app.get("/api/contracts/")
async def get_all_contracts(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Get all contracts with pagination (with strict role-based filtering)"""
    print(f"=== get_all_contracts called ===")
    print(f"Current user: {current_user.username}, Role: {current_user.role}, ID: {current_user.id}")
    
    try:
        # STRICT role-based filtering
        if current_user.role == "director":
            print("Director: Fetching all contracts")
            query = db.query(models.Contract)
        elif current_user.role == "program_manager":
            print("Program Manager: Fetching contracts under review")
            query = db.query(models.Contract).filter(
                (models.Contract.status == "under_review") | 
                (models.Contract.status == "reviewed") |
                (models.Contract.status == "approved") |
                (models.Contract.status == "draft")
            )
        else:  # project_manager
            print(f"Project Manager: Fetching ONLY contracts created by user ID {current_user.id}")
            query = db.query(models.Contract).filter(
                models.Contract.created_by == current_user.id
            )
        
        # Get contracts
        contracts = query.order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
        
        print(f"Found {len(contracts)} contracts for user {current_user.role}")
        
        # Convert SQLAlchemy models to dictionaries with all fields
        contracts_dict = []
        for contract in contracts:
            # Helper function to safely format dates
            def format_date(date_value):
                if date_value and hasattr(date_value, 'isoformat'):
                    return date_value.isoformat()
                return date_value
            
            # Build the contract dictionary with ALL fields
            contract_dict = {
                "id": contract.id,
                "filename": contract.filename or "Unknown",
                "uploaded_at": format_date(contract.uploaded_at),
                "status": contract.status or "draft",
                "investment_id": contract.investment_id,
                "project_id": contract.project_id,
                "grant_id": contract.grant_id,
                "extracted_reference_ids": contract.extracted_reference_ids or [],
                "comprehensive_data": contract.comprehensive_data or {},
                "contract_number": contract.contract_number,
                "grant_name": contract.grant_name or "Unnamed Contract",
                "grantor": contract.grantor or "Unknown Grantor",
                "grantee": contract.grantee or "Unknown Grantee",
                "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
                "start_date": format_date(contract.start_date),
                "end_date": format_date(contract.end_date),
                "purpose": contract.purpose,
                "payment_schedule": contract.payment_schedule,
                "terms_conditions": contract.terms_conditions,
                "chroma_id": contract.chroma_id,
                "created_by": contract.created_by,
                "version": contract.version or 1,
                # Include basic_data for compatibility
                "basic_data": {
                    "id": contract.id,
                    "contract_number": contract.contract_number,
                    "grant_name": contract.grant_name or "Unnamed Contract",
                    "grantor": contract.grantor or "Unknown Grantor",
                    "grantee": contract.grantee or "Unknown Grantee",
                    "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
                    "start_date": format_date(contract.start_date),
                    "end_date": format_date(contract.end_date),
                    "purpose": contract.purpose,
                    "status": contract.status or "draft",
                    "version": contract.version or 1,
                    "created_by": contract.created_by
                }
            }
            
            contracts_dict.append(contract_dict)
        
        # Log activity
        log_activity(
            db, 
            current_user.id, 
            "view_all_contracts", 
            details={"skip": skip, "limit": limit, "count": len(contracts_dict)}, 
            request=request
        )
        
        print(f"Returning {len(contracts_dict)} contracts")
        return contracts_dict
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_all_contracts: {str(e)}")
        print(f"Error details: {error_details}")
        # Return empty array instead of error for frontend compatibility
        return []

@app.get("/api/contracts/{contract_id}")
async def get_contract(
    contract_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Get a single contract by ID"""
    print(f"=== get_contract called for ID: {contract_id} ===")
    
    # First, check if contract exists
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        print(f"Contract {contract_id} not found")
        raise HTTPException(status_code=404, detail="Contract not found")
    
    print(f"Found contract: {contract.id}, created_by: {contract.created_by}, status: {contract.status}")
    print(f"Current user: {current_user.id}, role: {current_user.role}")
    
    # Check permission based on role
    if current_user.role == "project_manager":
        # Project managers can only see contracts they created
        if contract.created_by != current_user.id:
            print(f"Permission denied: Contract created by {contract.created_by}, user is {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this contract"
            )
    elif current_user.role == "program_manager":
        # Program managers can only see contracts in review/approved status
        if contract.status not in ["under_review", "reviewed", "approved", "draft"]:
            print(f"Permission denied: Contract status is {contract.status}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this contract"
            )
    # Directors can see all contracts
    
    # Helper function to safely format dates
    def format_date(date_value):
        if date_value and hasattr(date_value, 'isoformat'):
            return date_value.isoformat()
        return date_value
    
    # Build the contract dictionary with ALL fields
    contract_dict = {
        "id": contract.id,
        "filename": contract.filename or "Unknown",
        "uploaded_at": format_date(contract.uploaded_at),
        "status": contract.status or "draft",
        "investment_id": contract.investment_id,
        "project_id": contract.project_id,
        "grant_id": contract.grant_id,
        "extracted_reference_ids": contract.extracted_reference_ids or [],
        "comprehensive_data": contract.comprehensive_data or {},
        "contract_number": contract.contract_number,
        "grant_name": contract.grant_name or "Unnamed Contract",
        "grantor": contract.grantor or "Unknown Grantor",
        "grantee": contract.grantee or "Unknown Grantee",
        "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
        "start_date": format_date(contract.start_date),
        "end_date": format_date(contract.end_date),
        "purpose": contract.purpose,
        "payment_schedule": contract.payment_schedule,
        "terms_conditions": contract.terms_conditions,
        "chroma_id": contract.chroma_id,
        "created_by": contract.created_by,
        "version": contract.version or 1,
        "basic_data": {
            "id": contract.id,
            "contract_number": contract.contract_number,
            "grant_name": contract.grant_name or "Unnamed Contract",
            "grantor": contract.grantor or "Unknown Grantor",
            "grantee": contract.grantee or "Unknown Grantee",
            "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
            "start_date": format_date(contract.start_date),
            "end_date": format_date(contract.end_date),
            "purpose": contract.purpose,
            "status": contract.status or "draft",
            "version": contract.version or 1,
            "created_by": contract.created_by
        }
    }
    
    # Log activity
    log_activity(
        db, 
        current_user.id, 
        "view_contract", 
        contract_id=contract_id, 
        details={"contract_id": contract_id}, 
        request=request
    )
    
    print(f"Returning contract {contract_id}")
    return contract_dict

@app.delete("/api/contracts/{contract_id}")
async def delete_contract(
    contract_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Delete a contract"""
    # Check permission
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Only the creator or a director can delete
    if contract.created_by != current_user.id and current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this contract"
        )
    
    # Delete from ChromaDB
    if contract.chroma_id:
        vector_store.delete_by_contract_id(contract.id)
    
    # Delete from database
    db.delete(contract)
    db.commit()
    
    # Log activity
    log_activity(
        db, 
        current_user.id, 
        "delete_contract", 
        contract_id=contract_id, 
        details={"contract_id": contract_id}, 
        request=request
    )
    
    return {"message": "Contract deleted successfully"}

@app.post("/contracts/{contract_id}/submit-review")
async def submit_for_review(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Submit contract for review - Project Manager (creator) only"""
    # Check if user is project manager
    if current_user.role != "project_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Project Managers can submit contracts for review"
        )
    
    contract = db.query(models.Contract).filter(
        models.Contract.id == contract_id,
        models.Contract.created_by == current_user.id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found or not owned by you"
        )
    
    if contract.status not in ["draft", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Contract cannot be submitted for review in its current status: {contract.status}"
        )
    
    # Update status
    contract.status = "under_review"
    
    # Add submission comment
    if not contract.comprehensive_data:
        contract.comprehensive_data = {}
    
    if "comments" not in contract.comprehensive_data:
        contract.comprehensive_data["comments"] = []
    
    contract.comprehensive_data["comments"].append({
        "type": "submission",
        "comment": "Contract submitted for review",
        "created_by": current_user.id,
        "created_by_name": current_user.full_name or current_user.username,
        "created_at": datetime.utcnow().isoformat(),
        "role": current_user.role
    })
    
    db.commit()
    
    # Log activity
    log_activity(
        db, 
        current_user.id, 
        "submit_review", 
        contract_id=contract_id, 
        details={"contract_id": contract_id, "status": "under_review"}, 
        request=request
    )
    
    return {"message": "Contract submitted for review", "contract_id": contract_id}


@app.post("/contracts/{contract_id}/review")
async def review_contract(
    contract_id: int,
    comments: str,
    action: str,  # "approve" or "reject"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Review contract - Program Manager only"""
    if current_user.role != "program_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Program Managers can review contracts"
        )
    
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.status != "under_review":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract is not under review"
        )
    
    if action == "approve":
        contract.status = "reviewed"
    elif action == "reject":
        contract.status = "rejected"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action must be 'approve' or 'reject'"
        )
    
    # Store review comments
    review_data = contract.comprehensive_data or {}
    review_data["review_comments"] = comments
    review_data["reviewed_by"] = current_user.id
    review_data["reviewed_by_name"] = current_user.full_name or current_user.username
    review_data["reviewed_at"] = datetime.utcnow().isoformat()
    contract.comprehensive_data = review_data
    
    db.commit()
    
    # Log activity
    log_activity(
        db, 
        current_user.id, 
        "review", 
        contract_id=contract_id, 
        details={"contract_id": contract_id, "action": action, "comments": comments}, 
        request=request
    )
    
    return {"message": f"Contract {action}d", "contract_id": contract_id}

@app.post("/contracts/{contract_id}/final-approval")
async def final_approval(
    contract_id: int,
    decision: str,  # "approve" or "reject"
    comments: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Final approval - Director only"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Directors can give final approval"
        )
    
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract.status != "reviewed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contract must be reviewed first"
        )
    
    if decision == "approve":
        contract.status = "approved"
    elif decision == "reject":
        contract.status = "rejected"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be 'approve' or 'reject'"
        )
    
    # Store approval data
    approval_data = contract.comprehensive_data or {}
    approval_data["final_decision"] = decision
    approval_data["approval_comments"] = comments
    approval_data["approved_by"] = current_user.id
    approval_data["approved_by_name"] = current_user.full_name or current_user.username
    approval_data["approved_at"] = datetime.utcnow().isoformat()
    contract.comprehensive_data = approval_data
    
    db.commit()
    
    # Log activity
    log_activity(
        db, 
        current_user.id, 
        "final_approval", 
        contract_id=contract_id, 
        details={"contract_id": contract_id, "decision": decision, "comments": comments}, 
        request=request
    )
    
    return {"message": f"Contract {decision}d", "contract_id": contract_id}

@app.get("/api/activity-logs")
async def get_activity_logs(
    contract_id: Optional[int] = None,
    user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get activity logs - Director only"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Directors can view activity logs"
        )
    
    query = db.query(ActivityLog)
    
    if contract_id:
        query = query.filter(ActivityLog.contract_id == contract_id)
    
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    
    logs = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return logs

# Keep existing endpoints for backward compatibility (protected)
@app.post("/extract/")
async def extract_from_text(
    request_data: schemas.ExtractionRequest,
    current_user: User = Depends(get_current_user)
):
    """Extract data from raw text (for testing) - Requires authentication"""
    extracted_data = ai_extractor.extract_contract_data(request_data.text)
    return {"extracted_data": extracted_data}

@app.get("/search/")
async def semantic_search(
    query: str, 
    n_results: int = 5,
    current_user: User = Depends(get_current_user)
):
    """Semantic search using ChromaDB - Requires authentication"""
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

# User management endpoints (Director only)
@app.get("/api/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users - Director only"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Directors can view all users"
        )
    
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users

@app.put("/api/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Activate or deactivate a user - Director only"""
    if current_user.role != "director":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Directors can activate/deactivate users"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate yourself"
        )
    
    user.is_active = not user.is_active
    action = "activated" if user.is_active else "deactivated"
    db.commit()
    
    # Log activity
    log_activity(
        db, 
        current_user.id, 
        f"user_{action}", 
        details={"target_user_id": user_id, "action": action}, 
        request=request
    )
    
    return {"message": f"User {action}", "user_id": user_id, "is_active": user.is_active}

# New enhanced endpoints for workflow management
@app.get("/api/user/permissions")
async def get_user_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all permissions for current user"""
    permissions = get_user_permissions_dict(current_user)
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
            "full_name": current_user.full_name
        },
        "permissions": permissions
    }

@app.post("/api/contracts/{contract_id}/update-status")
async def update_contract_status_endpoint(
    contract_id: int,
    status: str = Query(..., regex="^(draft|under_review|reviewed|approved|rejected)$"),
    comments: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Update contract status with workflow validation"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check permissions based on status transition
    allowed_transitions = {
        "project_manager": {
            "draft": ["under_review"],
            "rejected": ["under_review"]
        },
        "program_manager": {
            "under_review": ["reviewed", "rejected"]
        },
        "director": {
            "reviewed": ["approved", "rejected"]
        }
    }
    
    user_role = current_user.role
    if user_role not in allowed_transitions:
        raise HTTPException(status_code=403, detail="No permission to update status")
    
    if status not in allowed_transitions[user_role].get(contract.status, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {contract.status} to {status}"
        )
    
    # Additional validation
    if user_role == "project_manager" and contract.created_by != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the contract creator can submit for review"
        )
    
    # Update status
    old_status = contract.status
    contract.status = status
    
    # Store comments and history
    if not contract.comprehensive_data:
        contract.comprehensive_data = {}
    
    status_history = contract.comprehensive_data.get("status_history", [])
    status_history.append({
        "status": status,
        "changed_by": current_user.id,
        "changed_by_name": current_user.full_name or current_user.username,
        "changed_at": datetime.utcnow().isoformat(),
        "comments": comments,
        "old_status": old_status
    })
    
    contract.comprehensive_data["status_history"] = status_history
    
    db.commit()
    
    # Log activity
    log_activity(
        db, 
        current_user.id, 
        "status_change", 
        contract_id=contract_id, 
        details={
            "old_status": old_status,
            "new_status": status,
            "comments": comments
        }, 
        request=request
    )
    
    return {
        "message": f"Contract status updated from {old_status} to {status}",
        "contract_id": contract_id,
        "status": status
    }

@app.get("/api/contracts/status/{status}")
async def get_contracts_by_status(
    status: str,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get contracts by status with role-based filtering"""
    query = db.query(models.Contract).filter(models.Contract.status == status)
    
    # Role-based filtering
    if current_user.role == "project_manager":
        query = query.filter(models.Contract.created_by == current_user.id)
    elif current_user.role == "program_manager":
        query = query.filter(
            (models.Contract.status == "under_review") | 
            (models.Contract.status == "reviewed")
        )
    # Director can see all
    
    contracts = query.order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
    
    return contracts

@app.post("/api/contracts/{contract_id}/add-comment")
async def add_contract_comment(
    contract_id: int,
    comment: str,
    comment_type: str = Query(..., regex="^(review|general|question|issue)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Add comment to contract"""
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check view permission
    if not check_permission(current_user, contract_id, "view", db):
        raise HTTPException(status_code=403, detail="No permission to add comments")
    
    # Add comment to comprehensive data
    if not contract.comprehensive_data:
        contract.comprehensive_data = {}
    
    comments_list = contract.comprehensive_data.get("comments", [])
    comments_list.append({
        "comment": comment,
        "type": comment_type,
        "created_by": current_user.id,
        "created_by_name": current_user.full_name or current_user.username,
        "created_at": datetime.utcnow().isoformat(),
        "role": current_user.role
    })
    
    contract.comprehensive_data["comments"] = comments_list
    db.commit()
    
    # Log activity
    log_activity(
        db, 
        current_user.id, 
        "add_comment", 
        contract_id=contract_id, 
        details={"comment_type": comment_type, "comment_length": len(comment)}, 
        request=request
    )
    
    return {"message": "Comment added successfully", "contract_id": contract_id}

@app.get("/api/contracts/{contract_id}/workflow-history")
async def get_workflow_history(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get workflow history for a contract"""
    if not check_permission(current_user, contract_id, "view", db):
        raise HTTPException(status_code=403, detail="No permission to view workflow history")
    
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    history = contract.comprehensive_data.get("status_history", []) if contract.comprehensive_data else []
    comments = contract.comprehensive_data.get("comments", []) if contract.comprehensive_data else []
    
    return {
        "contract_id": contract_id,
        "current_status": contract.status,
        "workflow_history": history,
        "comments": comments
    }

# Enhanced contract list with filters
@app.get("/api/contracts/filtered")
async def get_filtered_contracts(
    status: Optional[str] = None,
    grantor: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get filtered contracts with advanced search"""
    query = db.query(models.Contract)
    
    # Base role filtering
    if current_user.role == "project_manager":
        query = query.filter(models.Contract.created_by == current_user.id)
    elif current_user.role == "program_manager":
        query = query.filter(
            (models.Contract.status == "under_review") | 
            (models.Contract.status == "reviewed")
        )
    
    # Apply filters
    if status:
        query = query.filter(models.Contract.status == status)
    
    if grantor:
        query = query.filter(models.Contract.grantor.ilike(f"%{grantor}%"))
    
    if start_date:
        try:
            start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(models.Contract.uploaded_at >= start_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(models.Contract.uploaded_at <= end_date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
    if search:
        query = query.filter(
            (models.Contract.grant_name.ilike(f"%{search}%")) |
            (models.Contract.contract_number.ilike(f"%{search}%")) |
            (models.Contract.filename.ilike(f"%{search}%"))
        )
    
    total_count = query.count()
    contracts = query.order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "contracts": contracts
    }

# Handle OPTIONS method for CORS preflight
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request, rest_of_path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Authorization, Content-Type",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Add redirect for endpoints without trailing slash
@app.api_route("/api/contracts", methods=["GET", "POST", "DELETE", "PUT", "OPTIONS"])
async def redirect_contracts_without_slash(request: Request):
    """Redirect /api/contracts to /api/contracts/"""
    return RedirectResponse(url="/api/contracts/")

@app.api_route("/api/contracts/{contract_id}", methods=["GET", "DELETE", "PUT", "POST", "OPTIONS"])
async def redirect_contract_without_slash(contract_id: int):
    """Redirect /api/contracts/{id} to /api/contracts/{id}/ for consistency"""
    return RedirectResponse(url=f"/api/contracts/{contract_id}/")

@app.api_route("/auth/login", methods=["POST", "OPTIONS"])
async def redirect_login_without_slash():
    """Ensure /auth/login works"""
    pass  # Already handled by existing route


@app.post("/contracts/{contract_id}/fix-metadata")
async def fix_contract_metadata(
    contract_id: int,
    metadata_update: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Fix/update contract metadata - Only Project Manager (creator) can do this before approval"""
    # Get the contract
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check if user is the creator
    if contract.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the contract creator can fix metadata"
        )
    
    # Check if contract status allows metadata updates (only in draft or rejected)
    if contract.status not in ["draft", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update metadata in current status: {contract.status}"
        )
    
    # Update metadata fields
    update_fields = {
        "grant_name": metadata_update.get("grant_name"),
        "grantor": metadata_update.get("grantor"),
        "grantee": metadata_update.get("grantee"),
        "contract_number": metadata_update.get("contract_number"),
        "total_amount": metadata_update.get("total_amount"),
        "start_date": metadata_update.get("start_date"),
        "end_date": metadata_update.get("end_date"),
        "purpose": metadata_update.get("purpose")
    }
    
    # Update only non-None values
    for key, value in update_fields.items():
        if value is not None:
            setattr(contract, key, value)
    
    # Update comprehensive_data if provided
    if metadata_update.get("comprehensive_data"):
        contract.comprehensive_data = metadata_update.get("comprehensive_data")
    
    # Log the metadata fix
    log_activity(
        db,
        current_user.id,
        "fix_metadata",
        contract_id=contract_id,
        details={"updated_fields": list(update_fields.keys())},
        request=request
    )
    
    db.commit()
    
    return {"message": "Metadata updated successfully", "contract_id": contract_id}


@app.post("/contracts/{contract_id}/respond-to-comments")
async def respond_to_reviewer_comments(
    contract_id: int,
    response_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Respond to reviewer comments - Only Project Manager (creator) can do this"""
    # Get the contract
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check if user is the creator
    if contract.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the contract creator can respond to comments"
        )
    
    # Check if contract is in a state that allows response (under review or rejected)
    if contract.status not in ["under_review", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot respond to comments in current status: {contract.status}"
        )
    
    # Add response to comprehensive_data
    if not contract.comprehensive_data:
        contract.comprehensive_data = {}
    
    # Initialize comments section if not exists
    if "comments" not in contract.comprehensive_data:
        contract.comprehensive_data["comments"] = []
    
    # Add the response
    response = {
        "type": "creator_response",
        "response": response_data.get("response"),
        "created_by": current_user.id,
        "created_by_name": current_user.full_name or current_user.username,
        "created_at": datetime.utcnow().isoformat(),
        "role": current_user.role
    }
    
    contract.comprehensive_data["comments"].append(response)
    
    # If contract was rejected, update status back to draft for resubmission
    if contract.status == "rejected":
        contract.status = "draft"
    
    # Log the response
    log_activity(
        db,
        current_user.id,
        "respond_to_comments",
        contract_id=contract_id,
        details={"response_length": len(response_data.get("response", ""))},
        request=request
    )
    
    db.commit()
    
    return {"message": "Response submitted successfully", "contract_id": contract_id}


@app.get("/contracts/{contract_id}/versions")
async def get_contract_versions(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all versions of a contract - Only creator and director can view"""
    # Get the contract
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check permissions
    if current_user.role != "director" and contract.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view contract versions"
        )
    
    # In a real implementation, you would query a versions table
    # For now, return activity logs related to this contract
    from app.auth_models import ActivityLog
    
    activities = db.query(ActivityLog).filter(
        ActivityLog.contract_id == contract_id
    ).order_by(ActivityLog.created_at.desc()).all()
    
    # Filter activities that represent version changes
    version_activities = []
    for activity in activities:
        if activity.activity_type in ["upload", "status_change", "fix_metadata", "add_comment"]:
            version_activities.append({
                "version_id": activity.id,
                "activity_type": activity.activity_type,
                "timestamp": activity.created_at.isoformat(),
                "user": activity.user.full_name if activity.user else "System",
                "details": activity.details
            })
    
    return {
        "contract_id": contract_id,
        "current_version": {
            "id": contract.id,
            "status": contract.status,
            "last_updated": contract.uploaded_at.isoformat(),
            "created_by": contract.created_by
        },
        "versions": version_activities
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4001)


# import os
# import sys
# from datetime import datetime, timedelta
# from typing import Optional, List, Dict, Any
# from fastapi import Query, Response
# from fastapi.responses import RedirectResponse, JSONResponse

# # Remove all proxy environment variables
# proxy_vars = [
#     'HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy',
#     'ALL_PROXY', 'all_proxy', 'NO_PROXY', 'no_proxy',
#     'REQUESTS_CA_BUNDLE', 'CURL_CA_BUNDLE'
# ]

# for var in proxy_vars:
#     os.environ.pop(var, None)

# # Also patch OpenAI if needed
# try:
#     import openai._base_client
    
#     # Patch SyncHttpxClientWrapper
#     original_init = openai._base_client.SyncHttpxClientWrapper.__init__
    
#     def patched_init(self, **kwargs):
#         kwargs.pop('proxies', None)
#         kwargs.pop('proxy', None)
#         return original_init(self, **kwargs)
    
#     openai._base_client.SyncHttpxClientWrapper.__init__ = patched_init
    
#     # Patch AsyncHttpxClientWrapper  
#     original_async_init = openai._base_client.AsyncHttpxClientWrapper.__init__
    
#     def patched_async_init(self, **kwargs):
#         kwargs.pop('proxies', None)
#         kwargs.pop('proxy', None)
#         return original_async_init(self, **kwargs)
    
#     openai._base_client.AsyncHttpxClientWrapper.__init__ = patched_async_init
    
#     print("✓ OpenAI proxy patches applied at startup")
# except Exception as e:
#     print(f"Note: Could not apply OpenAI patches: {e}")

# # Now import everything else
# from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from sqlalchemy.orm import Session
# import json
# from jose import JWTError, jwt
# from passlib.context import CryptContext

# from app.database import get_db, engine, setup_database
# from app.pdf_processor import PDFProcessor
# from app.ai_extractor import AIExtractor
# from app.vector_store import vector_store
# from app.config import settings
# from app import models, schemas
# from app.auth_models import User, ActivityLog, ContractPermission
# from app.auth_schemas import UserCreate, UserResponse, LoginRequest, Token, ChangePasswordRequest

# # Create tables and setup relationships
# setup_database()

# app = FastAPI(title=settings.APP_NAME)

# # CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:5173", "http://localhost:4000", "http://44.219.56.85:5173", "http://44.219.56.85:4000"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Initialize processors
# pdf_processor = PDFProcessor()
# ai_extractor = AIExtractor()

# # Authentication dependencies
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# security = HTTPBearer()

# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password: str) -> str:
#     return pwd_context.hash(password)

# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
#     return encoded_jwt

# def authenticate_user(db: Session, username: str, password: str):
#     user = db.query(User).filter(User.username == username).first()
#     if not user:
#         return None
#     if not verify_password(password, user.password_hash):
#         return None
#     return user

# def get_current_user(
#     request: Request,
#     db: Session = Depends(get_db),
#     credentials: HTTPAuthorizationCredentials = Depends(security)
# ) -> User:
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="Could not validate credentials",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
    
#     try:
#         token = credentials.credentials
#         payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
#         username: str = payload.get("sub")
#         if username is None:
#             raise credentials_exception
#     except JWTError:
#         raise credentials_exception
    
#     user = db.query(User).filter(User.username == username).first()
#     if user is None:
#         raise credentials_exception
    
#     # Update last login
#     user.last_login = datetime.utcnow()
#     db.commit()
    
#     return user

# def check_permission(user: User, contract_id: int, required_permission: str, db: Session) -> bool:
#     """Check if user has required permission for a contract"""
#     # Get the contract first
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         return False
    
#     # Admin/Director has all permissions for all contracts
#     if user.role == "director":
#         return True
    
#     # Program Manager permissions
#     if user.role == "program_manager":
#         # Program Managers can:
#         # 1. View contracts under review, reviewed, approved, or draft
#         if required_permission == "view":
#             return contract.status in ["under_review", "reviewed", "approved", "draft"]
#         # 2. Review contracts that are under review
#         elif required_permission == "review":
#             return contract.status == "under_review"
#         else:
#             return False
    
#     # Project Manager permissions
#     if user.role == "project_manager":
#         # Check if this user created the contract
#         is_creator = contract.created_by == user.id
        
#         if not is_creator:
#             # Non-creator Project Managers can only view if explicitly granted
#             if required_permission == "view":
#                 permission = db.query(ContractPermission).filter(
#                     ContractPermission.contract_id == contract_id,
#                     ContractPermission.user_id == user.id,
#                     ContractPermission.permission_type == "view"
#                 ).first()
#                 return permission is not None
#             return False
        
#         # Project Manager (Creator/Owner/Admin) permissions based on status
        
#         # 1. ALWAYS ALLOWED PERMISSIONS (regardless of status):
#         # - View: Can always view their own contracts
#         # - Upload: Can upload/initiate processing (this is handled at contract creation)
#         if required_permission in ["view", "upload"]:
#             return True
        
#         # 2. DRAFT STATUS PERMISSIONS:
#         # Contract is in draft or being created
#         if contract.status == "draft":
#             # Can edit, fix metadata, submit for review
#             if required_permission in ["edit", "fix_metadata", "submit_review"]:
#                 return True
        
#         # 3. REJECTED STATUS PERMISSIONS:
#         # Contract was rejected by Program Manager
#         elif contract.status == "rejected":
#             # Can edit, fix metadata, respond to comments, resubmit for review
#             if required_permission in ["edit", "fix_metadata", "respond_to_comments", "submit_review"]:
#                 return True
        
#         # 4. UNDER_REVIEW STATUS PERMISSIONS:
#         # Contract is being reviewed by Program Manager
#         elif contract.status == "under_review":
#             # Can only view and respond to comments (cannot edit while under review)
#             if required_permission in ["respond_to_comments"]:
#                 return True
        
#         # 5. REVIEWED STATUS PERMISSIONS:
#         # Contract reviewed by Program Manager, waiting for Director approval
#         elif contract.status == "reviewed":
#             # Can only view (no changes allowed)
#             if required_permission == "view":
#                 return True
        
#         # 6. APPROVED STATUS PERMISSIONS:
#         # Contract approved by Director
#         elif contract.status == "approved":
#             # Can only view (contract is finalized)
#             if required_permission == "view":
#                 return True
        
#         # Check explicit permissions for any other permissions
#         permission = db.query(ContractPermission).filter(
#             ContractPermission.contract_id == contract_id,
#             ContractPermission.user_id == user.id,
#             ContractPermission.permission_type == required_permission
#         ).first()
        
#         return permission is not None
    
#     # Other users (if any) - check explicit permissions only
#     permission = db.query(ContractPermission).filter(
#         ContractPermission.contract_id == contract_id,
#         ContractPermission.user_id == user.id,
#         ContractPermission.permission_type == required_permission
#     ).first()
    
#     return permission is not None

# def get_user_permissions_dict(user: User) -> Dict[str, bool]:
#     """Get all permissions for a user based on their role"""
#     if user.role == "director":
#         return {
#             "can_upload": True,
#             "can_view_all": True,
#             "can_edit_all": True,
#             "can_delete_all": True,
#             "can_review": True,
#             "can_approve": True,
#             "can_manage_users": True,
#             "can_view_activity_logs": True,
#             "can_export": True,
#             "can_manage_settings": True,
#             "can_view_dashboard": True,
#             "can_view_contracts": True,
#             "can_view_analytics": True,
#             "can_view_reports": True,
#             "can_view_risk": True,
#             "can_view_organizations": True,
#             "can_view_grants": True,
#             "can_view_approvals": True,
#             "can_view_knowledge": True,
#             "can_view_help": True,
#             "can_submit_for_review": True,
#             "can_resubmit_after_changes": True,
#             "can_fix_metadata": True,
#             "can_respond_to_comments": True,
#             "can_view_all_versions": True
#         }
#     elif user.role == "program_manager":
#         return {
#             "can_upload": False,
#             "can_view_all": True,
#             "can_edit_all": False,
#             "can_delete_all": False,
#             "can_review": True,
#             "can_approve": False,
#             "can_manage_users": False,
#             "can_view_activity_logs": False,
#             "can_export": True,
#             "can_manage_settings": False,
#             "can_view_dashboard": False,
#             "can_view_contracts": True,
#             "can_view_analytics": True,
#             "can_view_reports": True,
#             "can_view_risk": True,
#             "can_view_organizations": False,
#             "can_view_grants": True,
#             "can_view_approvals": False,
#             "can_view_knowledge": True,
#             "can_view_help": True,
#             "can_submit_for_review": False,
#             "can_resubmit_after_changes": False,
#             "can_fix_metadata": False,
#             "can_respond_to_comments": False,
#             "can_view_all_versions": False
#         }
#     else:  # project_manager
#         return {
#             "can_upload": True,
#             "can_view_all": False,
#             "can_edit_all": False,
#             "can_delete_all": False,
#             "can_review": False,
#             "can_approve": False,
#             "can_manage_users": False,
#             "can_view_activity_logs": False,
#             "can_export": True,
#             "can_manage_settings": False,
#             "can_view_dashboard": True,
#             "can_view_contracts": True,
#             "can_view_analytics": False,
#             "can_view_reports": False,
#             "can_view_risk": False,
#             "can_view_organizations": False,
#             "can_view_grants": False,
#             "can_view_approvals": False,
#             "can_view_knowledge": True,
#             "can_view_help": True,
#             "can_submit_for_review": True,
#             "can_resubmit_after_changes": True,
#             "can_fix_metadata": True,
#             "can_respond_to_comments": True,
#             "can_view_all_versions": True
#         }

# def log_activity(
#     db: Session, 
#     user_id: int, 
#     activity_type: str, 
#     contract_id: Optional[int] = None, 
#     details: Optional[dict] = None,
#     request: Optional[Request] = None
# ):
#     """Log user activity"""
#     activity = ActivityLog(
#         user_id=user_id,
#         activity_type=activity_type,
#         contract_id=contract_id,
#         details=details or {},
#         ip_address=request.client.host if request and request.client else None,
#         user_agent=request.headers.get("user-agent") if request else None
#     )
    
#     db.add(activity)
#     db.commit()
#     return activity

# # Public health check endpoint (no auth required)
# @app.get("/health")
# async def health_check():
#     """Health check endpoint"""
#     return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# # Authentication endpoints
# @app.post("/auth/register", response_model=UserResponse)
# async def register_user(
#     user_data: UserCreate,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Register a new user (director only)"""
#     if current_user.role != "director":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only directors can register new users"
#         )
    
#     # Check if user exists
#     existing_user = db.query(User).filter(
#         (User.username == user_data.username) | (User.email == user_data.email)
#     ).first()
    
#     if existing_user:
#         raise HTTPException(status_code=400, detail="Username or email already exists")
    
#     # Create new user
#     db_user = User(
#         username=user_data.username,
#         email=user_data.email,
#         password_hash=get_password_hash(user_data.password),
#         full_name=user_data.full_name,
#         role=user_data.role,
#         department=user_data.department,
#         phone=user_data.phone
#     )
    
#     db.add(db_user)
#     db.commit()
#     db.refresh(db_user)
    
#     log_activity(
#         db, 
#         current_user.id, 
#         "register_user", 
#         details={"new_user_id": db_user.id, "new_user_role": db_user.role}, 
#         request=request
#     )
    
#     return db_user

# @app.post("/auth/login", response_model=Token)
# async def login(
#     login_data: LoginRequest, 
#     request: Request, 
#     db: Session = Depends(get_db)
# ):
#     """Login user and return JWT token"""
#     user = authenticate_user(db, login_data.username, login_data.password)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect username or password",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
    
#     if not user.is_active:
#         raise HTTPException(status_code=400, detail="User account is disabled")
    
#     # Update last login
#     user.last_login = datetime.utcnow()
#     db.commit()
    
#     # Log login activity
#     log_activity(
#         db, 
#         user.id, 
#         "login", 
#         details={"method": "password"}, 
#         request=request
#     )
    
#     # Create JWT token
#     access_token = create_access_token(data={"sub": user.username})
    
#     return {
#         "access_token": access_token,
#         "token_type": "bearer",
#         "user": UserResponse.from_orm(user)
#     }

# @app.post("/auth/logout")
# async def logout(
#     request: Request, 
#     current_user: User = Depends(get_current_user), 
#     db: Session = Depends(get_db)
# ):
#     """Logout user"""
#     log_activity(
#         db, 
#         current_user.id, 
#         "logout", 
#         request=request
#     )
#     return {"message": "Logged out successfully"}

# @app.get("/auth/me", response_model=UserResponse)
# async def get_current_user_info(current_user: User = Depends(get_current_user)):
#     """Get current user information"""
#     return current_user

# @app.post("/auth/change-password")
# async def change_password(
#     password_data: ChangePasswordRequest,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Change user password"""
#     if not verify_password(password_data.current_password, current_user.password_hash):
#         raise HTTPException(status_code=400, detail="Current password is incorrect")
    
#     current_user.password_hash = get_password_hash(password_data.new_password)
#     db.commit()
    
#     return {"message": "Password changed successfully"}

# # Public root endpoint (no auth required)
# @app.get("/")
# def read_root():
#     return {"message": "Grant Contract Analyzer API", "version": "1.0.0"}

# # Protected endpoints with authentication
# @app.post("/upload/", response_model=schemas.ContractResponse)
# async def upload_contract(
#     file: UploadFile = File(...),
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Upload and process PDF contract - Only Project Managers and Directors can upload"""
#     if current_user.role not in ["project_manager", "director"]:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only Project Managers and Directors can upload contracts"
#         )
    
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
#         reference_ids = comprehensive_data.get("reference_ids", {})
#         # Get embedding
#         embedding = ai_extractor.get_embedding(cleaned_text)
        
#         # Safely extract basic fields with None checks
#         contract_details = comprehensive_data.get("contract_details", {})
#         parties = comprehensive_data.get("parties", {})
#         financial_details = comprehensive_data.get("financial_details", {})
#         terms_conditions_data = comprehensive_data.get("terms_conditions", {})
        
#         # Extract basic data with safe defaults
#         basic_data = {
#             "contract_number": contract_details.get("contract_number"),
#             "grant_name": contract_details.get("grant_name"),
#             "grantor": parties.get("grantor", {}).get("organization_name"),
#             "grantee": parties.get("grantee", {}).get("organization_name"),
#             "total_amount": financial_details.get("total_grant_amount"),
#             "start_date": contract_details.get("start_date"),
#             "end_date": contract_details.get("end_date"),
#             "purpose": contract_details.get("purpose"),
#             "payment_schedule": financial_details.get("payment_schedule", {}),
#             "terms_conditions": terms_conditions_data
#         }
        
#         # Create contract record in PostgreSQL
#         db_contract = models.Contract(
#             filename=file.filename,
#             full_text=cleaned_text[:5000] if cleaned_text else "",
#             comprehensive_data=comprehensive_data,
#             investment_id=reference_ids.get("investment_id"),
#             project_id=reference_ids.get("project_id"),
#             grant_id=reference_ids.get("grant_id"),
#             extracted_reference_ids=reference_ids.get("extracted_reference_ids", []),
#             contract_number=basic_data["contract_number"],
#             grant_name=basic_data["grant_name"],
#             grantor=basic_data["grantor"],
#             grantee=basic_data["grantee"],
#             total_amount=basic_data["total_amount"],
#             start_date=basic_data["start_date"],
#             end_date=basic_data["end_date"],
#             purpose=basic_data["purpose"],
#             payment_schedule=basic_data["payment_schedule"],
#             terms_conditions=basic_data["terms_conditions"],
#             created_by=current_user.id,
#             status="draft"
#         )
        
#         db.add(db_contract)
#         db.commit()
#         db.refresh(db_contract)
        
#         # Store embedding in ChromaDB only if we have a valid embedding
#         if embedding and len(embedding) > 0:
#             metadata = {
#                 "filename": file.filename,
#                 "contract_number": basic_data.get("contract_number") or "",
#                 "grant_name": basic_data.get("grant_name") or "",
#                 "total_amount": str(basic_data.get("total_amount")) if basic_data.get("total_amount") else "0",
#                 "contract_id": str(db_contract.id)
#             }
            
#             # Clean metadata (remove None values)
#             metadata = {k: v for k, v in metadata.items() if v is not None}
            
#             chroma_id = vector_store.store_embedding(
#                 contract_id=db_contract.id,
#                 text=cleaned_text[:1000] if cleaned_text else "",
#                 embedding=embedding,
#                 metadata=metadata
#             )
            
#             # Update contract with chroma_id
#             db_contract.chroma_id = chroma_id
#             db.commit()
#             db.refresh(db_contract)
        
#         # Log activity
#         log_activity(
#             db, 
#             current_user.id, 
#             "upload", 
#             contract_id=db_contract.id, 
#             details={"filename": file.filename, "contract_id": db_contract.id}, 
#             request=request
#         )
        
#         return db_contract
        
#     except Exception as e:
#         db.rollback()
#         import traceback
#         error_details = traceback.format_exc()
#         print(f"Processing failed: {str(e)}")
#         print(f"Error details: {error_details}")
#         raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
#     finally:
#         await file.close()

# @app.get("/api/contracts/{contract_id}/comprehensive")
# async def get_comprehensive_data(
#     contract_id: int, 
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Get comprehensive data for a specific contract"""
#     print(f"=== get_comprehensive_data called for ID: {contract_id} ===")
    
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         print(f"Contract {contract_id} not found")
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     print(f"Found contract: {contract.id}, created_by: {contract.created_by}, status: {contract.status}")
#     print(f"Current user: {current_user.id}, role: {current_user.role}")
    
#     # Check permission based on role
#     if current_user.role == "project_manager":
#         # Project managers can only see contracts they created
#         if contract.created_by != current_user.id:
#             print(f"Permission denied: Contract created by {contract.created_by}, user is {current_user.id}")
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="You don't have permission to view this contract"
#             )
#     elif current_user.role == "program_manager":
#         # Program managers can only see contracts in review/approved status
#         if contract.status not in ["under_review", "reviewed", "approved", "draft"]:
#             print(f"Permission denied: Contract status is {contract.status}")
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="You don't have permission to view this contract"
#             )
#     # Directors can see all contracts
    
#     # Helper function to safely format dates
#     def format_date(date_value):
#         if date_value and hasattr(date_value, 'isoformat'):
#             return date_value.isoformat()
#         return date_value
    
#     # Get or create comprehensive_data
#     comp_data = contract.comprehensive_data or {}
    
#     # Log activity
#     log_activity(
#         db, 
#         current_user.id, 
#         "view_comprehensive", 
#         contract_id=contract_id, 
#         details={"contract_id": contract_id}, 
#         request=request
#     )
    
#     return {
#         "contract_id": contract.id,
#         "filename": contract.filename or "Unknown",
#         "basic_data": {
#             "id": contract.id,
#             "contract_number": contract.contract_number,
#             "grant_name": contract.grant_name or "Unnamed Contract",
#             "grantor": contract.grantor or "Unknown Grantor",
#             "grantee": contract.grantee or "Unknown Grantee",
#             "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
#             "start_date": format_date(contract.start_date),
#             "end_date": format_date(contract.end_date),
#             "purpose": contract.purpose,
#             "status": contract.status or "draft"
#         },
#         "comprehensive_data": comp_data
#     }

# @app.get("/api/contracts/{contract_id}/similar")
# async def get_similar_contracts(
#     contract_id: int, 
#     n_results: int = 3,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Find similar contracts"""
#     # Check permission for the main contract
#     if not check_permission(current_user, contract_id, "view", db):
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You don't have permission to view this contract"
#         )
    
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     # Get embedding for this contract
#     if contract.chroma_id:
#         vector_data = vector_store.get_by_contract_id(contract.id)
#         if vector_data and vector_data.get("embedding"):
#             similar = vector_store.search_similar(vector_data["embedding"], n_results + 1)
#             # Filter out the current contract
#             similar = [s for s in similar if s["contract_id"] != contract.id]
            
#             # Check permissions for similar contracts and get full details
#             similar_contracts = []
#             for item in similar[:n_results]:
#                 # Check if user has permission to view this similar contract
#                 if check_permission(current_user, item["contract_id"], "view", db):
#                     similar_contract = db.query(models.Contract).filter(
#                         models.Contract.id == item["contract_id"]
#                     ).first()
#                     if similar_contract:
#                         similar_contracts.append({
#                             "contract": similar_contract,
#                             "similarity_score": item["similarity_score"]
#                         })
            
#             # Log activity
#             log_activity(
#                 db, 
#                 current_user.id, 
#                 "find_similar", 
#                 contract_id=contract_id, 
#                 details={"contract_id": contract_id, "results_count": len(similar_contracts)}, 
#                 request=request
#             )
            
#             return {"similar_contracts": similar_contracts}
    
#     return {"similar_contracts": []}

# @app.get("/api/contracts/")
# async def get_all_contracts(
#     skip: int = 0,
#     limit: int = 100,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Get all contracts with pagination (with strict role-based filtering)"""
#     print(f"=== get_all_contracts called ===")
#     print(f"Current user: {current_user.username}, Role: {current_user.role}, ID: {current_user.id}")
    
#     try:
#         # STRICT role-based filtering
#         if current_user.role == "director":
#             print("Director: Fetching all contracts")
#             query = db.query(models.Contract)
#         elif current_user.role == "program_manager":
#             print("Program Manager: Fetching contracts under review")
#             query = db.query(models.Contract).filter(
#                 (models.Contract.status == "under_review") | 
#                 (models.Contract.status == "reviewed") |
#                 (models.Contract.status == "approved") |
#                 (models.Contract.status == "draft")
#             )
#         else:  # project_manager
#             print(f"Project Manager: Fetching ONLY contracts created by user ID {current_user.id}")
#             query = db.query(models.Contract).filter(
#                 models.Contract.created_by == current_user.id
#             )
        
#         # Get contracts
#         contracts = query.order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
        
#         print(f"Found {len(contracts)} contracts for user {current_user.role}")
        
#         # Convert SQLAlchemy models to dictionaries with all fields
#         contracts_dict = []
#         for contract in contracts:
#             # Helper function to safely format dates
#             def format_date(date_value):
#                 if date_value and hasattr(date_value, 'isoformat'):
#                     return date_value.isoformat()
#                 return date_value
            
#             # Build the contract dictionary with ALL fields
#             contract_dict = {
#                 "id": contract.id,
#                 "filename": contract.filename or "Unknown",
#                 "uploaded_at": format_date(contract.uploaded_at),
#                 "status": contract.status or "draft",
#                 "investment_id": contract.investment_id,
#                 "project_id": contract.project_id,
#                 "grant_id": contract.grant_id,
#                 "extracted_reference_ids": contract.extracted_reference_ids or [],
#                 "comprehensive_data": contract.comprehensive_data or {},
#                 "contract_number": contract.contract_number,
#                 "grant_name": contract.grant_name or "Unnamed Contract",
#                 "grantor": contract.grantor or "Unknown Grantor",
#                 "grantee": contract.grantee or "Unknown Grantee",
#                 "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
#                 "start_date": format_date(contract.start_date),
#                 "end_date": format_date(contract.end_date),
#                 "purpose": contract.purpose,
#                 "payment_schedule": contract.payment_schedule,
#                 "terms_conditions": contract.terms_conditions,
#                 "chroma_id": contract.chroma_id,
#                 "created_by": contract.created_by,
#                 # Include basic_data for compatibility
#                 "basic_data": {
#                     "id": contract.id,
#                     "contract_number": contract.contract_number,
#                     "grant_name": contract.grant_name or "Unnamed Contract",
#                     "grantor": contract.grantor or "Unknown Grantor",
#                     "grantee": contract.grantee or "Unknown Grantee",
#                     "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
#                     "start_date": format_date(contract.start_date),
#                     "end_date": format_date(contract.end_date),
#                     "purpose": contract.purpose,
#                     "status": contract.status or "draft"
#                 }
#             }
            
#             contracts_dict.append(contract_dict)
        
#         # Log activity
#         log_activity(
#             db, 
#             current_user.id, 
#             "view_all_contracts", 
#             details={"skip": skip, "limit": limit, "count": len(contracts_dict)}, 
#             request=request
#         )
        
#         print(f"Returning {len(contracts_dict)} contracts")
#         return contracts_dict
        
#     except Exception as e:
#         import traceback
#         error_details = traceback.format_exc()
#         print(f"Error in get_all_contracts: {str(e)}")
#         print(f"Error details: {error_details}")
#         # Return empty array instead of error for frontend compatibility
#         return []

# @app.get("/api/contracts/{contract_id}")
# async def get_contract(
#     contract_id: int, 
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Get a single contract by ID"""
#     print(f"=== get_contract called for ID: {contract_id} ===")
    
#     # First, check if contract exists
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         print(f"Contract {contract_id} not found")
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     print(f"Found contract: {contract.id}, created_by: {contract.created_by}, status: {contract.status}")
#     print(f"Current user: {current_user.id}, role: {current_user.role}")
    
#     # Check permission based on role
#     if current_user.role == "project_manager":
#         # Project managers can only see contracts they created
#         if contract.created_by != current_user.id:
#             print(f"Permission denied: Contract created by {contract.created_by}, user is {current_user.id}")
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="You don't have permission to view this contract"
#             )
#     elif current_user.role == "program_manager":
#         # Program managers can only see contracts in review/approved status
#         if contract.status not in ["under_review", "reviewed", "approved", "draft"]:
#             print(f"Permission denied: Contract status is {contract.status}")
#             raise HTTPException(
#                 status_code=status.HTTP_403_FORBIDDEN,
#                 detail="You don't have permission to view this contract"
#             )
#     # Directors can see all contracts
    
#     # Helper function to safely format dates
#     def format_date(date_value):
#         if date_value and hasattr(date_value, 'isoformat'):
#             return date_value.isoformat()
#         return date_value
    
#     # Build the contract dictionary with ALL fields
#     contract_dict = {
#         "id": contract.id,
#         "filename": contract.filename or "Unknown",
#         "uploaded_at": format_date(contract.uploaded_at),
#         "status": contract.status or "draft",
#         "investment_id": contract.investment_id,
#         "project_id": contract.project_id,
#         "grant_id": contract.grant_id,
#         "extracted_reference_ids": contract.extracted_reference_ids or [],
#         "comprehensive_data": contract.comprehensive_data or {},
#         "contract_number": contract.contract_number,
#         "grant_name": contract.grant_name or "Unnamed Contract",
#         "grantor": contract.grantor or "Unknown Grantor",
#         "grantee": contract.grantee or "Unknown Grantee",
#         "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
#         "start_date": format_date(contract.start_date),
#         "end_date": format_date(contract.end_date),
#         "purpose": contract.purpose,
#         "payment_schedule": contract.payment_schedule,
#         "terms_conditions": contract.terms_conditions,
#         "chroma_id": contract.chroma_id,
#         "created_by": contract.created_by,
#         "basic_data": {
#             "id": contract.id,
#             "contract_number": contract.contract_number,
#             "grant_name": contract.grant_name or "Unnamed Contract",
#             "grantor": contract.grantor or "Unknown Grantor",
#             "grantee": contract.grantee or "Unknown Grantee",
#             "total_amount": float(contract.total_amount) if contract.total_amount else 0.0,
#             "start_date": format_date(contract.start_date),
#             "end_date": format_date(contract.end_date),
#             "purpose": contract.purpose,
#             "status": contract.status or "draft"
#         }
#     }
    
#     # Log activity
#     log_activity(
#         db, 
#         current_user.id, 
#         "view_contract", 
#         contract_id=contract_id, 
#         details={"contract_id": contract_id}, 
#         request=request
#     )
    
#     print(f"Returning contract {contract_id}")
#     return contract_dict

# @app.delete("/api/contracts/{contract_id}")
# async def delete_contract(
#     contract_id: int, 
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Delete a contract"""
#     # Check permission
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     # Only the creator or a director can delete
#     if contract.created_by != current_user.id and current_user.role != "director":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You don't have permission to delete this contract"
#         )
    
#     # Delete from ChromaDB
#     if contract.chroma_id:
#         vector_store.delete_by_contract_id(contract.id)
    
#     # Delete from database
#     db.delete(contract)
#     db.commit()
    
#     # Log activity
#     log_activity(
#         db, 
#         current_user.id, 
#         "delete_contract", 
#         contract_id=contract_id, 
#         details={"contract_id": contract_id}, 
#         request=request
#     )
    
#     return {"message": "Contract deleted successfully"}

# @app.post("/contracts/{contract_id}/submit-review")
# async def submit_for_review(
#     contract_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Submit contract for review - Project Manager (creator) only"""
#     # Check if user is project manager
#     if current_user.role != "project_manager":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only Project Managers can submit contracts for review"
#         )
    
#     contract = db.query(models.Contract).filter(
#         models.Contract.id == contract_id,
#         models.Contract.created_by == current_user.id
#     ).first()
    
#     if not contract:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Contract not found or not owned by you"
#         )
    
#     if contract.status not in ["draft", "rejected"]:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Contract cannot be submitted for review in its current status: {contract.status}"
#         )
    
#     # Update status
#     contract.status = "under_review"
    
#     # Add submission comment
#     if not contract.comprehensive_data:
#         contract.comprehensive_data = {}
    
#     if "comments" not in contract.comprehensive_data:
#         contract.comprehensive_data["comments"] = []
    
#     contract.comprehensive_data["comments"].append({
#         "type": "submission",
#         "comment": "Contract submitted for review",
#         "created_by": current_user.id,
#         "created_by_name": current_user.full_name or current_user.username,
#         "created_at": datetime.utcnow().isoformat(),
#         "role": current_user.role
#     })
    
#     db.commit()
    
#     # Log activity
#     log_activity(
#         db, 
#         current_user.id, 
#         "submit_review", 
#         contract_id=contract_id, 
#         details={"contract_id": contract_id, "status": "under_review"}, 
#         request=request
#     )
    
#     return {"message": "Contract submitted for review", "contract_id": contract_id}


# @app.post("/contracts/{contract_id}/review")
# async def review_contract(
#     contract_id: int,
#     comments: str,
#     action: str,  # "approve" or "reject"
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Review contract - Program Manager only"""
#     if current_user.role != "program_manager":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only Program Managers can review contracts"
#         )
    
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     if contract.status != "under_review":
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Contract is not under review"
#         )
    
#     if action == "approve":
#         contract.status = "reviewed"
#     elif action == "reject":
#         contract.status = "rejected"
#     else:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Action must be 'approve' or 'reject'"
#         )
    
#     # Store review comments
#     review_data = contract.comprehensive_data or {}
#     review_data["review_comments"] = comments
#     review_data["reviewed_by"] = current_user.id
#     review_data["reviewed_by_name"] = current_user.full_name or current_user.username
#     review_data["reviewed_at"] = datetime.utcnow().isoformat()
#     contract.comprehensive_data = review_data
    
#     db.commit()
    
#     # Log activity
#     log_activity(
#         db, 
#         current_user.id, 
#         "review", 
#         contract_id=contract_id, 
#         details={"contract_id": contract_id, "action": action, "comments": comments}, 
#         request=request
#     )
    
#     return {"message": f"Contract {action}d", "contract_id": contract_id}

# @app.post("/contracts/{contract_id}/final-approval")
# async def final_approval(
#     contract_id: int,
#     decision: str,  # "approve" or "reject"
#     comments: str,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Final approval - Director only"""
#     if current_user.role != "director":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only Directors can give final approval"
#         )
    
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     if contract.status != "reviewed":
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Contract must be reviewed first"
#         )
    
#     if decision == "approve":
#         contract.status = "approved"
#     elif decision == "reject":
#         contract.status = "rejected"
#     else:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Decision must be 'approve' or 'reject'"
#         )
    
#     # Store approval data
#     approval_data = contract.comprehensive_data or {}
#     approval_data["final_decision"] = decision
#     approval_data["approval_comments"] = comments
#     approval_data["approved_by"] = current_user.id
#     approval_data["approved_by_name"] = current_user.full_name or current_user.username
#     approval_data["approved_at"] = datetime.utcnow().isoformat()
#     contract.comprehensive_data = approval_data
    
#     db.commit()
    
#     # Log activity
#     log_activity(
#         db, 
#         current_user.id, 
#         "final_approval", 
#         contract_id=contract_id, 
#         details={"contract_id": contract_id, "decision": decision, "comments": comments}, 
#         request=request
#     )
    
#     return {"message": f"Contract {decision}d", "contract_id": contract_id}

# @app.get("/api/activity-logs")
# async def get_activity_logs(
#     contract_id: Optional[int] = None,
#     user_id: Optional[int] = None,
#     skip: int = 0,
#     limit: int = 100,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get activity logs - Director only"""
#     if current_user.role != "director":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only Directors can view activity logs"
#         )
    
#     query = db.query(ActivityLog)
    
#     if contract_id:
#         query = query.filter(ActivityLog.contract_id == contract_id)
    
#     if user_id:
#         query = query.filter(ActivityLog.user_id == user_id)
    
#     logs = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    
#     return logs

# # Keep existing endpoints for backward compatibility (protected)
# @app.post("/extract/")
# async def extract_from_text(
#     request_data: schemas.ExtractionRequest,
#     current_user: User = Depends(get_current_user)
# ):
#     """Extract data from raw text (for testing) - Requires authentication"""
#     extracted_data = ai_extractor.extract_contract_data(request_data.text)
#     return {"extracted_data": extracted_data}

# @app.get("/search/")
# async def semantic_search(
#     query: str, 
#     n_results: int = 5,
#     current_user: User = Depends(get_current_user)
# ):
#     """Semantic search using ChromaDB - Requires authentication"""
#     # Get embedding for query
#     query_embedding = ai_extractor.get_embedding(query)
    
#     # Search in ChromaDB
#     search_results = vector_store.search_similar(
#         query_embedding=query_embedding,
#         n_results=n_results
#     )
    
#     return {
#         "query": query,
#         "results": search_results
#     }

# # User management endpoints (Director only)
# @app.get("/api/users")
# async def get_all_users(
#     skip: int = 0,
#     limit: int = 100,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get all users - Director only"""
#     if current_user.role != "director":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only Directors can view all users"
#         )
    
#     users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
#     return users

# @app.put("/api/users/{user_id}/activate")
# async def activate_user(
#     user_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Activate or deactivate a user - Director only"""
#     if current_user.role != "director":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only Directors can activate/deactivate users"
#         )
    
#     user = db.query(User).filter(User.id == user_id).first()
#     if not user:
#         raise HTTPException(status_code=404, detail="User not found")
    
#     if user.id == current_user.id:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="You cannot deactivate yourself"
#         )
    
#     user.is_active = not user.is_active
#     action = "activated" if user.is_active else "deactivated"
#     db.commit()
    
#     # Log activity
#     log_activity(
#         db, 
#         current_user.id, 
#         f"user_{action}", 
#         details={"target_user_id": user_id, "action": action}, 
#         request=request
#     )
    
#     return {"message": f"User {action}", "user_id": user_id, "is_active": user.is_active}

# # New enhanced endpoints for workflow management
# @app.get("/api/user/permissions")
# async def get_user_permissions(
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get all permissions for current user"""
#     permissions = get_user_permissions_dict(current_user)
#     return {
#         "user": {
#             "id": current_user.id,
#             "username": current_user.username,
#             "role": current_user.role,
#             "full_name": current_user.full_name
#         },
#         "permissions": permissions
#     }

# @app.post("/api/contracts/{contract_id}/update-status")
# async def update_contract_status_endpoint(
#     contract_id: int,
#     status: str = Query(..., regex="^(draft|under_review|reviewed|approved|rejected)$"),
#     comments: Optional[str] = None,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Update contract status with workflow validation"""
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     # Check permissions based on status transition
#     allowed_transitions = {
#         "project_manager": {
#             "draft": ["under_review"],
#             "rejected": ["under_review"]
#         },
#         "program_manager": {
#             "under_review": ["reviewed", "rejected"]
#         },
#         "director": {
#             "reviewed": ["approved", "rejected"]
#         }
#     }
    
#     user_role = current_user.role
#     if user_role not in allowed_transitions:
#         raise HTTPException(status_code=403, detail="No permission to update status")
    
#     if status not in allowed_transitions[user_role].get(contract.status, []):
#         raise HTTPException(
#             status_code=400,
#             detail=f"Invalid status transition from {contract.status} to {status}"
#         )
    
#     # Additional validation
#     if user_role == "project_manager" and contract.created_by != current_user.id:
#         raise HTTPException(
#             status_code=403,
#             detail="Only the contract creator can submit for review"
#         )
    
#     # Update status
#     old_status = contract.status
#     contract.status = status
    
#     # Store comments and history
#     if not contract.comprehensive_data:
#         contract.comprehensive_data = {}
    
#     status_history = contract.comprehensive_data.get("status_history", [])
#     status_history.append({
#         "status": status,
#         "changed_by": current_user.id,
#         "changed_by_name": current_user.full_name or current_user.username,
#         "changed_at": datetime.utcnow().isoformat(),
#         "comments": comments,
#         "old_status": old_status
#     })
    
#     contract.comprehensive_data["status_history"] = status_history
    
#     db.commit()
    
#     # Log activity
#     log_activity(
#         db, 
#         current_user.id, 
#         "status_change", 
#         contract_id=contract_id, 
#         details={
#             "old_status": old_status,
#             "new_status": status,
#             "comments": comments
#         }, 
#         request=request
#     )
    
#     return {
#         "message": f"Contract status updated from {old_status} to {status}",
#         "contract_id": contract_id,
#         "status": status
#     }

# @app.get("/api/contracts/status/{status}")
# async def get_contracts_by_status(
#     status: str,
#     skip: int = 0,
#     limit: int = 100,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get contracts by status with role-based filtering"""
#     query = db.query(models.Contract).filter(models.Contract.status == status)
    
#     # Role-based filtering
#     if current_user.role == "project_manager":
#         query = query.filter(models.Contract.created_by == current_user.id)
#     elif current_user.role == "program_manager":
#         query = query.filter(
#             (models.Contract.status == "under_review") | 
#             (models.Contract.status == "reviewed")
#         )
#     # Director can see all
    
#     contracts = query.order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
    
#     return contracts

# @app.post("/api/contracts/{contract_id}/add-comment")
# async def add_contract_comment(
#     contract_id: int,
#     comment: str,
#     comment_type: str = Query(..., regex="^(review|general|question|issue)$"),
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Add comment to contract"""
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     # Check view permission
#     if not check_permission(current_user, contract_id, "view", db):
#         raise HTTPException(status_code=403, detail="No permission to add comments")
    
#     # Add comment to comprehensive data
#     if not contract.comprehensive_data:
#         contract.comprehensive_data = {}
    
#     comments_list = contract.comprehensive_data.get("comments", [])
#     comments_list.append({
#         "comment": comment,
#         "type": comment_type,
#         "created_by": current_user.id,
#         "created_by_name": current_user.full_name or current_user.username,
#         "created_at": datetime.utcnow().isoformat(),
#         "role": current_user.role
#     })
    
#     contract.comprehensive_data["comments"] = comments_list
#     db.commit()
    
#     # Log activity
#     log_activity(
#         db, 
#         current_user.id, 
#         "add_comment", 
#         contract_id=contract_id, 
#         details={"comment_type": comment_type, "comment_length": len(comment)}, 
#         request=request
#     )
    
#     return {"message": "Comment added successfully", "contract_id": contract_id}

# @app.get("/api/contracts/{contract_id}/workflow-history")
# async def get_workflow_history(
#     contract_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get workflow history for a contract"""
#     if not check_permission(current_user, contract_id, "view", db):
#         raise HTTPException(status_code=403, detail="No permission to view workflow history")
    
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     history = contract.comprehensive_data.get("status_history", []) if contract.comprehensive_data else []
#     comments = contract.comprehensive_data.get("comments", []) if contract.comprehensive_data else []
    
#     return {
#         "contract_id": contract_id,
#         "current_status": contract.status,
#         "workflow_history": history,
#         "comments": comments
#     }

# # Enhanced contract list with filters
# @app.get("/api/contracts/filtered")
# async def get_filtered_contracts(
#     status: Optional[str] = None,
#     grantor: Optional[str] = None,
#     start_date: Optional[str] = None,
#     end_date: Optional[str] = None,
#     search: Optional[str] = None,
#     skip: int = 0,
#     limit: int = 100,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get filtered contracts with advanced search"""
#     query = db.query(models.Contract)
    
#     # Base role filtering
#     if current_user.role == "project_manager":
#         query = query.filter(models.Contract.created_by == current_user.id)
#     elif current_user.role == "program_manager":
#         query = query.filter(
#             (models.Contract.status == "under_review") | 
#             (models.Contract.status == "reviewed")
#         )
    
#     # Apply filters
#     if status:
#         query = query.filter(models.Contract.status == status)
    
#     if grantor:
#         query = query.filter(models.Contract.grantor.ilike(f"%{grantor}%"))
    
#     if start_date:
#         try:
#             start_date_obj = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
#             query = query.filter(models.Contract.uploaded_at >= start_date_obj)
#         except ValueError:
#             raise HTTPException(status_code=400, detail="Invalid start_date format")
    
#     if end_date:
#         try:
#             end_date_obj = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
#             query = query.filter(models.Contract.uploaded_at <= end_date_obj)
#         except ValueError:
#             raise HTTPException(status_code=400, detail="Invalid end_date format")
    
#     if search:
#         query = query.filter(
#             (models.Contract.grant_name.ilike(f"%{search}%")) |
#             (models.Contract.contract_number.ilike(f"%{search}%")) |
#             (models.Contract.filename.ilike(f"%{search}%"))
#         )
    
#     total_count = query.count()
#     contracts = query.order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
    
#     return {
#         "total": total_count,
#         "skip": skip,
#         "limit": limit,
#         "contracts": contracts
#     }

# # Handle OPTIONS method for CORS preflight
# @app.options("/{rest_of_path:path}")
# async def preflight_handler(request: Request, rest_of_path: str):
#     return Response(
#         status_code=200,
#         headers={
#             "Access-Control-Allow-Origin": "*",
#             "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
#             "Access-Control-Allow-Headers": "Authorization, Content-Type",
#             "Access-Control-Allow-Credentials": "true",
#         }
#     )

# # Add redirect for endpoints without trailing slash
# @app.api_route("/api/contracts", methods=["GET", "POST", "DELETE", "PUT", "OPTIONS"])
# async def redirect_contracts_without_slash(request: Request):
#     """Redirect /api/contracts to /api/contracts/"""
#     return RedirectResponse(url="/api/contracts/")

# @app.api_route("/api/contracts/{contract_id}", methods=["GET", "DELETE", "PUT", "POST", "OPTIONS"])
# async def redirect_contract_without_slash(contract_id: int):
#     """Redirect /api/contracts/{id} to /api/contracts/{id}/ for consistency"""
#     return RedirectResponse(url=f"/api/contracts/{contract_id}/")

# @app.api_route("/auth/login", methods=["POST", "OPTIONS"])
# async def redirect_login_without_slash():
#     """Ensure /auth/login works"""
#     pass  # Already handled by existing route


# @app.post("/contracts/{contract_id}/fix-metadata")
# async def fix_contract_metadata(
#     contract_id: int,
#     metadata_update: Dict[str, Any],
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Fix/update contract metadata - Only Project Manager (creator) can do this before approval"""
#     # Get the contract
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     # Check if user is the creator
#     if contract.created_by != current_user.id:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only the contract creator can fix metadata"
#         )
    
#     # Check if contract status allows metadata updates (only in draft or rejected)
#     if contract.status not in ["draft", "rejected"]:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Cannot update metadata in current status: {contract.status}"
#         )
    
#     # Update metadata fields
#     update_fields = {
#         "grant_name": metadata_update.get("grant_name"),
#         "grantor": metadata_update.get("grantor"),
#         "grantee": metadata_update.get("grantee"),
#         "contract_number": metadata_update.get("contract_number"),
#         "total_amount": metadata_update.get("total_amount"),
#         "start_date": metadata_update.get("start_date"),
#         "end_date": metadata_update.get("end_date"),
#         "purpose": metadata_update.get("purpose")
#     }
    
#     # Update only non-None values
#     for key, value in update_fields.items():
#         if value is not None:
#             setattr(contract, key, value)
    
#     # Update comprehensive_data if provided
#     if metadata_update.get("comprehensive_data"):
#         contract.comprehensive_data = metadata_update.get("comprehensive_data")
    
#     # Log the metadata fix
#     log_activity(
#         db,
#         current_user.id,
#         "fix_metadata",
#         contract_id=contract_id,
#         details={"updated_fields": list(update_fields.keys())},
#         request=request
#     )
    
#     db.commit()
    
#     return {"message": "Metadata updated successfully", "contract_id": contract_id}


# @app.post("/contracts/{contract_id}/respond-to-comments")
# async def respond_to_reviewer_comments(
#     contract_id: int,
#     response_data: Dict[str, Any],
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db),
#     request: Request = None
# ):
#     """Respond to reviewer comments - Only Project Manager (creator) can do this"""
#     # Get the contract
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     # Check if user is the creator
#     if contract.created_by != current_user.id:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Only the contract creator can respond to comments"
#         )
    
#     # Check if contract is in a state that allows response (under review or rejected)
#     if contract.status not in ["under_review", "rejected"]:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Cannot respond to comments in current status: {contract.status}"
#         )
    
#     # Add response to comprehensive_data
#     if not contract.comprehensive_data:
#         contract.comprehensive_data = {}
    
#     # Initialize comments section if not exists
#     if "comments" not in contract.comprehensive_data:
#         contract.comprehensive_data["comments"] = []
    
#     # Add the response
#     response = {
#         "type": "creator_response",
#         "response": response_data.get("response"),
#         "created_by": current_user.id,
#         "created_by_name": current_user.full_name or current_user.username,
#         "created_at": datetime.utcnow().isoformat(),
#         "role": current_user.role
#     }
    
#     contract.comprehensive_data["comments"].append(response)
    
#     # If contract was rejected, update status back to draft for resubmission
#     if contract.status == "rejected":
#         contract.status = "draft"
    
#     # Log the response
#     log_activity(
#         db,
#         current_user.id,
#         "respond_to_comments",
#         contract_id=contract_id,
#         details={"response_length": len(response_data.get("response", ""))},
#         request=request
#     )
    
#     db.commit()
    
#     return {"message": "Response submitted successfully", "contract_id": contract_id}


# @app.get("/contracts/{contract_id}/versions")
# async def get_contract_versions(
#     contract_id: int,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Get all versions of a contract - Only creator and director can view"""
#     # Get the contract
#     contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
#     if not contract:
#         raise HTTPException(status_code=404, detail="Contract not found")
    
#     # Check permissions
#     if current_user.role != "director" and contract.created_by != current_user.id:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="You don't have permission to view contract versions"
#         )
    
#     # In a real implementation, you would query a versions table
#     # For now, return activity logs related to this contract
#     from app.auth_models import ActivityLog
    
#     activities = db.query(ActivityLog).filter(
#         ActivityLog.contract_id == contract_id
#     ).order_by(ActivityLog.created_at.desc()).all()
    
#     # Filter activities that represent version changes
#     version_activities = []
#     for activity in activities:
#         if activity.activity_type in ["upload", "status_change", "fix_metadata", "add_comment"]:
#             version_activities.append({
#                 "version_id": activity.id,
#                 "activity_type": activity.activity_type,
#                 "timestamp": activity.created_at.isoformat(),
#                 "user": activity.user.full_name if activity.user else "System",
#                 "details": activity.details
#             })
    
#     return {
#         "contract_id": contract_id,
#         "current_version": {
#             "id": contract.id,
#             "status": contract.status,
#             "last_updated": contract.uploaded_at.isoformat(),
#             "created_by": contract.created_by
#         },
#         "versions": version_activities
#     }






# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=4001)