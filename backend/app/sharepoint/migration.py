#!/usr/bin/env python3
"""
Migration script to create SharePoint tables
Run: python migration.py
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    """Get database connection"""
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:1234@localhost:5432/grant_contracts')
    try:
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def create_tables():
    """Create SharePoint tables"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        print("📊 Creating SharePoint tables...")
        
        # Create sharepoint_connections table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sharepoint_connections (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
                site_url VARCHAR NOT NULL,
                site_name VARCHAR,
                access_token TEXT,
                refresh_token TEXT,
                token_expiry TIMESTAMP WITH TIME ZONE,
                microsoft_user_id VARCHAR,
                microsoft_email VARCHAR,
                microsoft_name VARCHAR,
                is_active BOOLEAN DEFAULT TRUE,
                last_connected_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """)
        print("  ✅ Created sharepoint_connections table")
        
        # Create sharepoint_files table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sharepoint_files (
                id SERIAL PRIMARY KEY,
                connection_id INTEGER NOT NULL REFERENCES sharepoint_connections(id) ON DELETE CASCADE,
                file_id VARCHAR NOT NULL,
                file_name VARCHAR NOT NULL,
                file_path VARCHAR NOT NULL,
                file_url TEXT,
                file_size INTEGER,
                file_type VARCHAR,
                import_status VARCHAR DEFAULT 'pending',
                import_error TEXT,
                contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
                imported_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        print("  ✅ Created sharepoint_files table")
        
        # Add SharePoint columns to contracts table
        try:
            cur.execute("""
                ALTER TABLE contracts 
                ADD COLUMN IF NOT EXISTS sharepoint_source BOOLEAN DEFAULT FALSE
            """)
            print("  ✅ Added sharepoint_source column to contracts")
        except Exception as e:
            print(f"  ⚠️ Note: {e}")
        
        # Create indexes for better performance
        try:
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_sharepoint_connections_user 
                ON sharepoint_connections(user_id)
            """)
            
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_sharepoint_files_connection 
                ON sharepoint_files(connection_id)
            """)
            
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_sharepoint_files_contract 
                ON sharepoint_files(contract_id)
            """)
            
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_sharepoint_files_import_status 
                ON sharepoint_files(import_status)
            """)
            
            print("  ✅ Created indexes")
        except Exception as e:
            print(f"  ⚠️ Index creation note: {e}")
        
        conn.commit()
        print("\n✅ SharePoint tables created successfully!")
        
        # Show created tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name LIKE 'sharepoint_%'
        """)
        tables = cur.fetchall()
        if tables:
            print(f"\n📋 Created tables: {', '.join([t[0] for t in tables])}")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error creating tables: {e}")
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

def drop_tables():
    """Drop SharePoint tables"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        print("⚠️  Dropping SharePoint tables...")
        
        # Drop in correct order due to foreign key constraints
        cur.execute("DROP TABLE IF EXISTS sharepoint_files CASCADE")
        print("  ✅ Dropped sharepoint_files")
        
        cur.execute("DROP TABLE IF EXISTS sharepoint_connections CASCADE")
        print("  ✅ Dropped sharepoint_connections")
        
        # Remove column from contracts
        try:
            cur.execute("ALTER TABLE contracts DROP COLUMN IF EXISTS sharepoint_source")
            print("  ✅ Removed sharepoint_source from contracts")
        except:
            pass
        
        conn.commit()
        print("\n✅ SharePoint tables dropped successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error dropping tables: {e}")
    finally:
        cur.close()
        conn.close()

def show_status():
    """Check if SharePoint tables exist"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        print("📋 Checking SharePoint tables status...")
        print("-" * 40)
        
        # Check sharepoint_connections
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'sharepoint_connections'
            )
        """)
        connections_exists = cur.fetchone()[0]
        print(f"sharepoint_connections: {'✅ EXISTS' if connections_exists else '❌ NOT FOUND'}")
        
        if connections_exists:
            cur.execute("SELECT COUNT(*) FROM sharepoint_connections")
            count = cur.fetchone()[0]
            print(f"  └─ Records: {count}")
        
        # Check sharepoint_files
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'sharepoint_files'
            )
        """)
        files_exists = cur.fetchone()[0]
        print(f"sharepoint_files: {'✅ EXISTS' if files_exists else '❌ NOT FOUND'}")
        
        if files_exists:
            cur.execute("SELECT COUNT(*) FROM sharepoint_files")
            count = cur.fetchone()[0]
            print(f"  └─ Records: {count}")
        
        # Check contracts column
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'contracts' AND column_name = 'sharepoint_source'
            )
        """)
        column_exists = cur.fetchone()[0]
        print(f"contracts.sharepoint_source: {'✅ EXISTS' if column_exists else '❌ NOT FOUND'}")
        
    except Exception as e:
        print(f"Error checking status: {e}")
    finally:
        cur.close()
        conn.close()

def show_help():
    """Show help message"""
    print("""
╔════════════════════════════════════════════════════════════╗
║           SharePoint Migration Script                      ║
╚════════════════════════════════════════════════════════════╝

Usage: python migration.py [command]

Commands:
  up      - Create SharePoint tables (default)
  down    - Drop SharePoint tables
  status  - Check table status
  help    - Show this help message

Examples:
  python migration.py          # Create tables
  python migration.py up       # Create tables
  python migration.py down     # Drop tables  
  python migration.py status   # Check status

Environment Variables:
  DATABASE_URL - PostgreSQL connection string (default: postgresql://postgres:1234@localhost:5432/grant_contracts)
    """)

if __name__ == "__main__":
    # Get command line argument
    command = sys.argv[1].lower() if len(sys.argv) > 1 else "up"
    
    if command == "up":
        create_tables()
    elif command == "down":
        print("\n⚠️  WARNING: This will delete all SharePoint connection data!")
        confirm = input("Are you sure you want to drop all SharePoint tables? (yes/no): ")
        if confirm.lower() == "yes":
            drop_tables()
        else:
            print("Operation cancelled")
    elif command == "status":
        show_status()
    elif command == "help":
        show_help()
    else:
        print(f"Unknown command: {command}")
        show_help()

# #!/usr/bin/env python3
# """
# Migration script to create SharePoint tables
# Run: python migration.py
# """

# import os
# import sys
# import psycopg2
# from psycopg2 import sql
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv()

# def get_db_connection():
#     """Get database connection from environment variables"""
#     database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:1234@localhost:5432/grant_contracts')
    
#     # Parse DATABASE_URL
#     # Format: postgresql://user:password@host:port/database
#     try:
#         conn = psycopg2.connect(database_url)
#         return conn
#     except Exception as e:
#         print(f"Error connecting to database: {e}")
#         sys.exit(1)

# def create_sharepoint_tables():
#     """Create SharePoint tables if they don't exist"""
#     conn = get_db_connection()
#     cur = conn.cursor()
    
#     try:
#         print("📊 Creating SharePoint tables...")
        
#         # Create sharepoint_connections table
#         cur.execute("""
#             CREATE TABLE IF NOT EXISTS sharepoint_connections (
#                 id SERIAL PRIMARY KEY,
#                 tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
#                 user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
#                 site_url VARCHAR NOT NULL,
#                 document_library VARCHAR NOT NULL,
#                 client_id VARCHAR NOT NULL,
#                 client_secret VARCHAR NOT NULL,
#                 tenant_name VARCHAR NOT NULL,
#                 connection_name VARCHAR,
#                 description TEXT,
#                 is_active BOOLEAN DEFAULT TRUE,
#                 sync_enabled BOOLEAN DEFAULT TRUE,
#                 sync_interval_minutes INTEGER DEFAULT 60,
#                 last_sync_at TIMESTAMP WITH TIME ZONE,
#                 auto_upload BOOLEAN DEFAULT FALSE,
#                 folder_path VARCHAR DEFAULT '/',
#                 created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
#                 updated_at TIMESTAMP WITH TIME ZONE,
#                 created_by INTEGER REFERENCES users(id)
#             )
#         """)
#         print("  ✅ Created sharepoint_connections table")
        
#         # Create index on tenant_id
#         cur.execute("""
#             CREATE INDEX IF NOT EXISTS idx_sharepoint_connections_tenant 
#             ON sharepoint_connections(tenant_id)
#         """)
#         print("  ✅ Created index on tenant_id")
        
#         # Create sharepoint_files table
#         cur.execute("""
#             CREATE TABLE IF NOT EXISTS sharepoint_files (
#                 id SERIAL PRIMARY KEY,
#                 connection_id INTEGER NOT NULL REFERENCES sharepoint_connections(id) ON DELETE CASCADE,
#                 file_id VARCHAR NOT NULL UNIQUE,
#                 file_name VARCHAR NOT NULL,
#                 file_path VARCHAR NOT NULL,
#                 file_url VARCHAR NOT NULL,
#                 file_size INTEGER,
#                 file_type VARCHAR,
#                 version VARCHAR,
#                 modified_by VARCHAR,
#                 modified_at TIMESTAMP WITH TIME ZONE,
#                 created_by VARCHAR,
#                 created_at TIMESTAMP WITH TIME ZONE,
#                 is_synced BOOLEAN DEFAULT FALSE,
#                 synced_at TIMESTAMP WITH TIME ZONE,
#                 import_status VARCHAR DEFAULT 'pending',
#                 import_error TEXT,
#                 contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
#                 created_at_local TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
#                 updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
#             )
#         """)
#         print("  ✅ Created sharepoint_files table")
        
#         # Create indexes on sharepoint_files
#         cur.execute("""
#             CREATE INDEX IF NOT EXISTS idx_sharepoint_files_connection 
#             ON sharepoint_files(connection_id)
#         """)
        
#         cur.execute("""
#             CREATE INDEX IF NOT EXISTS idx_sharepoint_files_import_status 
#             ON sharepoint_files(import_status)
#         """)
        
#         cur.execute("""
#             CREATE INDEX IF NOT EXISTS idx_sharepoint_files_contract 
#             ON sharepoint_files(contract_id)
#         """)
#         print("  ✅ Created indexes on sharepoint_files")
        
#         # Create sharepoint_sync_logs table
#         cur.execute("""
#             CREATE TABLE IF NOT EXISTS sharepoint_sync_logs (
#                 id SERIAL PRIMARY KEY,
#                 connection_id INTEGER NOT NULL REFERENCES sharepoint_connections(id) ON DELETE CASCADE,
#                 sync_type VARCHAR NOT NULL,
#                 status VARCHAR NOT NULL,
#                 files_found INTEGER DEFAULT 0,
#                 files_processed INTEGER DEFAULT 0,
#                 files_imported INTEGER DEFAULT 0,
#                 files_failed INTEGER DEFAULT 0,
#                 error_message TEXT,
#                 started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
#                 completed_at TIMESTAMP WITH TIME ZONE
#             )
#         """)
#         print("  ✅ Created sharepoint_sync_logs table")
        
#         # Create index on sync logs
#         cur.execute("""
#             CREATE INDEX IF NOT EXISTS idx_sharepoint_sync_logs_connection 
#             ON sharepoint_sync_logs(connection_id)
#         """)
#         print("  ✅ Created index on sharepoint_sync_logs")
        
#         # Add SharePoint columns to contracts table
#         try:
#             cur.execute("""
#                 ALTER TABLE contracts 
#                 ADD COLUMN IF NOT EXISTS sharepoint_source BOOLEAN DEFAULT FALSE,
#                 ADD COLUMN IF NOT EXISTS sharepoint_file_id VARCHAR,
#                 ADD COLUMN IF NOT EXISTS sharepoint_connection_id INTEGER 
#                     REFERENCES sharepoint_connections(id) ON DELETE SET NULL
#             """)
#             print("  ✅ Added SharePoint columns to contracts table")
#         except Exception as e:
#             print(f"  ⚠️ Note: {e}")
        
#         # Create index on sharepoint_file_id
#         try:
#             cur.execute("""
#                 CREATE INDEX IF NOT EXISTS idx_contracts_sharepoint_file 
#                 ON contracts(sharepoint_file_id) 
#                 WHERE sharepoint_file_id IS NOT NULL
#             """)
#         except Exception as e:
#             print(f"  ⚠️ Note: {e}")
        
#         # Commit changes
#         conn.commit()
#         print("\n✅ SharePoint tables created successfully!")
        
#         # Verify tables
#         cur.execute("""
#             SELECT table_name 
#             FROM information_schema.tables 
#             WHERE table_name LIKE 'sharepoint_%'
#         """)
#         tables = cur.fetchall()
#         print(f"\n📋 Created tables: {', '.join([t[0] for t in tables])}")
        
#     except Exception as e:
#         conn.rollback()
#         print(f"\n❌ Error creating tables: {e}")
#         sys.exit(1)
#     finally:
#         cur.close()
#         conn.close()

# def drop_sharepoint_tables():
#     """Drop SharePoint tables (for rollback)"""
#     conn = get_db_connection()
#     cur = conn.cursor()
    
#     try:
#         print("⚠️  Dropping SharePoint tables...")
        
#         # Drop in reverse order due to foreign key constraints
#         cur.execute("DROP TABLE IF EXISTS sharepoint_sync_logs CASCADE")
#         cur.execute("DROP TABLE IF EXISTS sharepoint_files CASCADE")
#         cur.execute("DROP TABLE IF EXISTS sharepoint_connections CASCADE")
        
#         # Remove columns from contracts
#         try:
#             cur.execute("""
#                 ALTER TABLE contracts 
#                 DROP COLUMN IF EXISTS sharepoint_source,
#                 DROP COLUMN IF EXISTS sharepoint_file_id,
#                 DROP COLUMN IF EXISTS sharepoint_connection_id
#             """)
#         except Exception as e:
#             print(f"  ⚠️ Note: {e}")
        
#         conn.commit()
#         print("✅ SharePoint tables dropped successfully!")
        
#     except Exception as e:
#         conn.rollback()
#         print(f"❌ Error dropping tables: {e}")
#     finally:
#         cur.close()
#         conn.close()

# def show_help():
#     """Show help message"""
#     print("""
# Usage: python migration.py [command]

# Commands:
#   up      - Create SharePoint tables (default)
#   down    - Drop SharePoint tables
#   status  - Check table status
#   help    - Show this help message

# Examples:
#   python migration.py up      # Create tables
#   python migration.py down    # Drop tables
#   python migration.py status  # Check status
#     """)

# def check_status():
#     """Check if SharePoint tables exist"""
#     conn = get_db_connection()
#     cur = conn.cursor()
    
#     try:
#         cur.execute("""
#             SELECT table_name 
#             FROM information_schema.tables 
#             WHERE table_name LIKE 'sharepoint_%'
#             ORDER BY table_name
#         """)
#         tables = cur.fetchall()
        
#         if tables:
#             print("\n✅ SharePoint tables exist:")
#             for table in tables:
#                 # Get row count
#                 cur.execute(f"SELECT COUNT(*) FROM {table[0]}")
#                 count = cur.fetchone()[0]
#                 print(f"  📊 {table[0]}: {count} rows")
#         else:
#             print("\n❌ No SharePoint tables found")
        
#         # Check contracts table columns
#         cur.execute("""
#             SELECT column_name 
#             FROM information_schema.columns 
#             WHERE table_name = 'contracts' 
#             AND column_name LIKE 'sharepoint_%'
#         """)
#         columns = cur.fetchall()
        
#         if columns:
#             print("\n📋 SharePoint columns in contracts table:")
#             for col in columns:
#                 print(f"  • {col[0]}")
        
#     except Exception as e:
#         print(f"Error checking status: {e}")
#     finally:
#         cur.close()
#         conn.close()

# if __name__ == "__main__":
#     # Get command line argument
#     command = sys.argv[1].lower() if len(sys.argv) > 1 else "up"
    
#     if command == "up":
#         create_sharepoint_tables()
#     elif command == "down":
#         confirm = input("Are you sure you want to drop all SharePoint tables? (yes/no): ")
#         if confirm.lower() == "yes":
#             drop_sharepoint_tables()
#         else:
#             print("Operation cancelled")
#     elif command == "status":
#         check_status()
#     elif command == "help":
#         show_help()
#     else:
#         print(f"Unknown command: {command}")
#         show_help()