"""
Initialize the database with default users and setup relationships
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.database import setup_database, Base, engine
from passlib.context import CryptContext

# Create password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_default_users():
    """Create default users for testing"""
    # Setup database first
    setup_database()
    
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Import after setup_database
        from app.auth_models import User
        
        default_users = [
            {
                "username": "pm1",
                "email": "pm1@grantanalyzer.com",
                "password": "password123",
                "full_name": "Project Manager One",
                "role": "project_manager",
                "department": "Projects",
                "is_active": True
            },
            {
                "username": "pgm1",
                "email": "pgm1@grantanalyzer.com",
                "password": "password123",
                "full_name": "Program Manager One",
                "role": "program_manager",
                "department": "Program Management",
                "is_active": True
            },
            {
                "username": "dir1",
                "email": "dir1@grantanalyzer.com",
                "password": "password123",
                "full_name": "Director One",
                "role": "director",
                "department": "Leadership",
                "is_active": True
            }
        ]
        
        for user_data in default_users:
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if not existing_user:
                user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    password_hash=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                    department=user_data["department"],
                    is_active=user_data["is_active"]
                )
                db.add(user)
                print(f"✓ Created user: {user_data['username']} ({user_data['role']})")
            else:
                print(f"✓ User already exists: {user_data['username']}")
        
        db.commit()
        print("\n✓ Database initialized successfully!")
        print("\nDefault users created:")
        print("- Project Manager: pm1 / password123")
        print("- Program Manager: pgm1 / password123")
        print("- Director: dir1 / password123")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_default_users()