# C:\saple.ai\POC\backend\fix_superadmin.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from app.config import settings

# Create engine and session
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

# Initialize password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def fix_superadmin_password():
    """Fix super admin password"""
    try:
        # Check if superadmin exists
        from sqlalchemy import text
        result = db.execute(text("SELECT * FROM users WHERE username = 'superadmin' OR email = 'superadmin@grantos.com'"))
        user = result.fetchone()
        
        if user:
            print(f"Found user: {user}")
            
            # Create correct password hash for 'password123'
            correct_hash = pwd_context.hash('password123')
            print(f"Correct hash for 'password123': {correct_hash}")
            
            # Update the password
            db.execute(
                text("UPDATE users SET password_hash = :hash WHERE username = 'superadmin'"),
                {"hash": correct_hash}
            )
            db.commit()
            print("✓ Super admin password updated successfully!")
            
            # Also ensure super_admin role is set
            db.execute(
                text("UPDATE users SET role = 'super_admin' WHERE username = 'superadmin'")
            )
            db.commit()
            print("✓ Super admin role confirmed!")
        else:
            print("Super admin user not found. Creating...")
            
            # Create super admin user
            from datetime import datetime
            db.execute(text("""
                INSERT INTO users (
                    username, email, password_hash, first_name, last_name,
                    role, user_type, is_active, created_at
                ) VALUES (
                    'superadmin', 'superadmin@grantos.com', :hash,
                    'Super', 'Admin', 'super_admin', 'internal', true, :now
                )
            """), {
                "hash": pwd_context.hash('password123'),
                "now": datetime.utcnow()
            })
            db.commit()
            print("✓ Super admin user created!")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_superadmin_password()