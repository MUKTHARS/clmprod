import os
import sys
from datetime import datetime, timedelta
from typing import Optional, List, Dict
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
    # Always allow viewing for all authenticated users (temporary fix)
    if required_permission == "view":
        return True
    
    # Admin/Director has all permissions
    if user.role == "director":
        return True
    
    # Program Manager can review and view
    if user.role == "program_manager" and required_permission in ["view", "review"]:
        return True
    
    # Project Manager specific permissions
    if user.role == "project_manager":
        # Check if this user created the contract
        contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
        if contract and contract.created_by == user.id:
            if required_permission in ["view", "edit", "upload"]:
                return True
        
        # Check explicit permissions
        permission = db.query(ContractPermission).filter(
            ContractPermission.contract_id == contract_id,
            ContractPermission.user_id == user.id,
            ContractPermission.permission_type == required_permission
        ).first()
        
        return permission is not None
    
    # Check explicit permissions for other users
    permission = db.query(ContractPermission).filter(
        ContractPermission.contract_id == contract_id,
        ContractPermission.user_id == user.id,
        ContractPermission.permission_type == required_permission
    ).first()
    
    return permission is not None
    
    # Check explicit permissions for other users
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
            "can_view_help": True
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
            "can_view_help": True
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
            "can_view_help": True
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
            status="draft"
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
    # TEMPORARY FIX: Allow all authenticated users to view
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check permission - temporarily bypass for viewing
    # if not check_permission(current_user, contract_id, "view", db):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="You don't have permission to view this contract"
    #     )
    
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
    """Get all contracts with pagination (temporarily show all to authenticated users)"""
    print(f"=== get_all_contracts called ===")
    print(f"Current user: {current_user.username}, Role: {current_user.role}, ID: {current_user.id}")
    
    try:
        # TEMPORARY FIX: Show all contracts to all authenticated users
        # Comment out the role-based filtering for now
        contracts = db.query(models.Contract).order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
        
        # Original code (commented out for now):
        # if current_user.role == "director":
        #     print("Director: Fetching all contracts")
        #     contracts = db.query(models.Contract).order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
        # elif current_user.role == "program_manager":
        #     print("Program Manager: Fetching contracts under review")
        #     contracts = db.query(models.Contract).filter(
        #         (models.Contract.status == "under_review") | 
        #         (models.Contract.status == "reviewed")
        #     ).order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
        # else:
        #     print(f"Project Manager: Fetching contracts created by user ID {current_user.id}")
        #     contracts = db.query(models.Contract).filter(
        #         models.Contract.created_by == current_user.id
        #     ).order_by(models.Contract.uploaded_at.desc()).offset(skip).limit(limit).all()
        
        print(f"Found {len(contracts)} contracts")
        
        # Log activity
        log_activity(
            db, 
            current_user.id, 
            "view_all_contracts", 
            details={"skip": skip, "limit": limit, "count": len(contracts)}, 
            request=request
        )
        
        return contracts
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in get_all_contracts: {str(e)}")
        print(f"Error details: {error_details}")
        return JSONResponse(content=[], status_code=200)

        
@app.get("/api/contracts/{contract_id}")
async def get_contract(
    contract_id: int, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Get a single contract by ID"""
    # TEMPORARY FIX: Allow all authenticated users to view contracts
    # Remove or modify this after testing
    contract = db.query(models.Contract).filter(models.Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check permission - temporarily bypass for viewing
    # if not check_permission(current_user, contract_id, "view", db):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="You don't have permission to view this contract"
    #     )
    
    # Log activity
    log_activity(
        db, 
        current_user.id, 
        "view_contract", 
        contract_id=contract_id, 
        details={"contract_id": contract_id}, 
        request=request
    )
    
    return contract

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

# Role-based workflow endpoints
@app.post("/contracts/{contract_id}/submit-review")
async def submit_for_review(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None
):
    """Submit contract for review - Project Manager only"""
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
    
    contract.status = "under_review"
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4001)