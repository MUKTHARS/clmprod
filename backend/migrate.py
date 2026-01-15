import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.config import settings

def add_chroma_id_column():
    """Add chroma_id column to contracts table"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'contracts' 
            AND column_name = 'chroma_id'
        """))
        
        if not result.fetchone():
            print("Adding chroma_id column to contracts table...")
            conn.execute(text("ALTER TABLE contracts ADD COLUMN chroma_id VARCHAR"))
            conn.commit()
            print("Column added successfully!")
        else:
            print("chroma_id column already exists")
        
        # Also check if old embedding column exists and remove it
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'contracts' 
            AND column_name = 'embedding'
        """))
        
        if result.fetchone():
            print("Removing old embedding column...")
            conn.execute(text("ALTER TABLE contracts DROP COLUMN embedding"))
            conn.commit()
            print("Old embedding column removed!")

if __name__ == "__main__":
    add_chroma_id_column()