# app/migrate_database.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine, SessionLocal

def migrate_database():
    """Add missing created_by column to contracts table"""
    print("Starting database migration...")
    
    # Check if column exists
    check_query = """
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='contracts' and column_name='created_by';
    """
    
    add_column_query = """
    ALTER TABLE contracts 
    ADD COLUMN created_by INTEGER REFERENCES users(id);
    """
    
    try:
        with engine.connect() as connection:
            # Check if column exists
            result = connection.execute(text(check_query))
            column_exists = result.fetchone() is not None
            
            if not column_exists:
                print("Adding created_by column to contracts table...")
                connection.execute(text(add_column_query))
                connection.commit()
                print("✓ Successfully added created_by column")
            else:
                print("✓ created_by column already exists")
                
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate_database()