from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, configure_mappers
from app.config import settings

# Create engine
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a single Base for all models
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def setup_database():
    """Initialize database and set up relationships"""
    try:
        # Import models after Base is defined
        from app import models, auth_models
        
        # Try to import deliverable models if they exist
        try:
            from app.deliverable_models import ContractDeliverable
            print("✓ Deliverable models imported")
        except ImportError:
            print("⚠ Deliverable models not found - creating basic table")
            # Create the table manually if model doesn't exist
            create_deliverables_table_manually()
        
        # Set up relationships to avoid circular imports
        models.Contract.creator = relationship(
            "User", 
            foreign_keys=[models.Contract.created_by],
            backref="created_contracts"
        )
        
        # Configure all mappers after setting up relationships
        configure_mappers()
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully!")
        
    except Exception as e:
        print(f"✗ Database setup failed: {e}")
        raise

def create_deliverables_table_manually():
    """Create deliverables table if model doesn't exist yet"""
    from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Date
    from sqlalchemy.sql import func
    
    class ContractDeliverable(Base):
        __tablename__ = "contract_deliverables"
        
        id = Column(Integer, primary_key=True, index=True)
        contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
        deliverable_name = Column(String(255), nullable=False)
        description = Column(Text)
        due_date = Column(Date)
        status = Column(String(50), default="pending")
        
        uploaded_file_path = Column(Text)
        uploaded_file_name = Column(String(500))
        uploaded_at = Column(DateTime(timezone=True))
        uploaded_by = Column(Integer, ForeignKey("users.id"))
        upload_notes = Column(Text)
        
        created_at = Column(DateTime(timezone=True), server_default=func.now())
        updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    print("✓ Created basic deliverables table structure")