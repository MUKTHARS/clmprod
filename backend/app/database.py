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
    # Import models after Base is defined
    from app import models, auth_models
    
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
    print("Database tables created successfully!")