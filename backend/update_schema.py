import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, Column, String, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

def update_schema():
    """Update database schema for comprehensive data"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Updating database schema for comprehensive extraction...")
        
        # Check if comprehensive_data column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'contracts' 
            AND column_name = 'comprehensive_data'
        """))
        
        if not result.fetchone():
            print("Adding comprehensive_data column...")
            conn.execute(text("ALTER TABLE contracts ADD COLUMN comprehensive_data JSONB"))
            conn.commit()
            print("✓ comprehensive_data column added")
        else:
            print("✓ comprehensive_data column already exists")
        
        # Also ensure we have the basic columns
        columns_to_check = [
            ('contract_number', 'VARCHAR'),
            ('grant_name', 'VARCHAR'),
            ('grantor', 'VARCHAR'),
            ('grantee', 'VARCHAR'),
            ('total_amount', 'DOUBLE PRECISION'),
            ('start_date', 'VARCHAR'),
            ('end_date', 'VARCHAR'),
            ('purpose', 'TEXT'),
            ('payment_schedule', 'JSONB'),
            ('terms_conditions', 'JSONB')
        ]
        
        for column_name, column_type in columns_to_check:
            result = conn.execute(text(f"""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'contracts' 
                AND column_name = '{column_name}'
            """))
            
            if not result.fetchone():
                print(f"Adding {column_name} column...")
                conn.execute(text(f"ALTER TABLE contracts ADD COLUMN {column_name} {column_type}"))
        
        conn.commit()
        print("✓ Database schema updated successfully!")

if __name__ == "__main__":
    update_schema()