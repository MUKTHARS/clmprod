CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'project_manager',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    department VARCHAR(100),
    phone VARCHAR(20)
);

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE TABLE contracts (
    id SERIAL PRIMARY KEY,
    filename VARCHAR NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Reference IDs
    investment_id VARCHAR(255),
    project_id VARCHAR(255),
    grant_id VARCHAR(255),
    extracted_reference_ids JSONB DEFAULT '[]',
    
    -- Basic extracted data
    contract_number VARCHAR,
    grant_name VARCHAR,
    grantor VARCHAR,
    grantee VARCHAR,
    total_amount DOUBLE PRECISION,
    start_date VARCHAR,
    end_date VARCHAR,
    purpose TEXT,
    payment_schedule JSONB,
    terms_conditions JSONB,
    
    -- Comprehensive data
    comprehensive_data JSONB,
    
    -- Raw text
    full_text TEXT,
    
    -- Metadata
    status VARCHAR,
    processing_time DOUBLE PRECISION,
    
    -- ChromaDB reference
    chroma_id VARCHAR(255),
    
    -- Version control for amendments
    document_type VARCHAR DEFAULT 'main_contract',
    parent_contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
    version INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT TRUE,
    amendment_status VARCHAR DEFAULT 'draft',
    amendment_date TIMESTAMP WITH TIME ZONE,
    amendment_reason TEXT,
    
    -- Workflow fields
    created_by INTEGER REFERENCES users(id),
    review_comments TEXT
);

CREATE TABLE amendment_comparisons (
    id SERIAL PRIMARY KEY,
    amendment_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    parent_contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    financial_impact JSONB,
    date_changes JSONB,
    comparison_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    comparison_confidence DOUBLE PRECISION DEFAULT 1.0,
    UNIQUE(amendment_id, parent_contract_id)
);

CREATE TABLE extraction_logs (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER,
    extraction_type VARCHAR,
    field_name VARCHAR,
    extracted_value TEXT,
    confidence_score DOUBLE PRECISION,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parent_contract_id INTEGER,
    previous_value TEXT
);

CREATE TABLE contract_permissions (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_type VARCHAR(20) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by INTEGER REFERENCES users(id)
);

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    activity_type VARCHAR(50) NOT NULL,
    contract_id INTEGER REFERENCES contracts(id),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE UNIQUE INDEX users_email_key ON users(email);
CREATE UNIQUE INDEX users_username_key ON users(username);

-- Contracts table indexes
CREATE INDEX idx_contracts_document_type ON contracts(document_type);
CREATE INDEX idx_contracts_grant_id ON contracts(grant_id);
CREATE INDEX idx_contracts_investment_id ON contracts(investment_id);
CREATE INDEX idx_contracts_parent_contract_id ON contracts(parent_contract_id);
CREATE INDEX idx_contracts_project_id ON contracts(project_id);
CREATE INDEX idx_contracts_version ON contracts(version);
CREATE INDEX ix_contracts_id ON contracts(id);

-- Amendment comparisons indexes
CREATE INDEX idx_amendment_comparisons_amendment_id ON amendment_comparisons(amendment_id);
CREATE INDEX idx_amendment_comparisons_parent_id ON amendment_comparisons(parent_contract_id);

-- Extraction logs indexes
CREATE INDEX idx_extraction_logs_parent_id ON extraction_logs(parent_contract_id);
CREATE INDEX ix_extraction_logs_contract_id ON extraction_logs(contract_id);
CREATE INDEX ix_extraction_logs_id ON extraction_logs(id);

-- User sessions indexes
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Contract permissions indexes
CREATE INDEX idx_contract_permissions_user_contract ON contract_permissions(user_id, contract_id);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user_contract ON activity_logs(user_id, contract_id);

-- Contracts relationships
ALTER TABLE contracts ADD CONSTRAINT contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);
ALTER TABLE contracts ADD CONSTRAINT fk_parent_contract FOREIGN KEY (parent_contract_id) REFERENCES contracts(id) ON DELETE SET NULL;

-- Amendment comparisons relationships
ALTER TABLE amendment_comparisons ADD CONSTRAINT amendment_comparisons_amendment_id_fkey FOREIGN KEY (amendment_id) REFERENCES contracts(id) ON DELETE CASCADE;
ALTER TABLE amendment_comparisons ADD CONSTRAINT amendment_comparisons_parent_contract_id_fkey FOREIGN KEY (parent_contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

-- User sessions relationships
ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Contract permissions relationships
ALTER TABLE contract_permissions ADD CONSTRAINT contract_permissions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;
ALTER TABLE contract_permissions ADD CONSTRAINT contract_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE contract_permissions ADD CONSTRAINT contract_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES users(id);

-- Activity logs relationships
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES contracts(id);







-- Create contract_versions table
CREATE TABLE IF NOT EXISTS contract_versions (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contract_data JSONB NOT NULL,
    changes_description TEXT,
    version_type VARCHAR(50) DEFAULT 'metadata_update',
    
    -- Unique constraint for contract and version
    UNIQUE(contract_id, version_number)
);

-- Create index for faster queries
CREATE INDEX idx_contract_versions_contract_id ON contract_versions(contract_id);
CREATE INDEX idx_contract_versions_created_by ON contract_versions(created_by);

-- Add version column to contracts table if not exists
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;




-- Create review_comments table
CREATE TABLE IF NOT EXISTS review_comments (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    comment_type VARCHAR(50) NOT NULL,
    comment TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    flagged_risk BOOLEAN DEFAULT FALSE,
    flagged_issue BOOLEAN DEFAULT FALSE,
    change_request JSONB,
    recommendation VARCHAR(20),
    resolution_response TEXT,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_review_comments_contract_id ON review_comments(contract_id);
CREATE INDEX idx_review_comments_user_id ON review_comments(user_id);
CREATE INDEX idx_review_comments_status ON review_comments(status);
CREATE INDEX idx_review_comments_flagged ON review_comments(flagged_risk, flagged_issue);































-- Add to your initdbwithroles.sql or run separately

-- Update review_comments table to support Jira-like features
ALTER TABLE review_comments 
ADD COLUMN IF NOT EXISTS parent_comment_id INTEGER REFERENCES review_comments(id),
ADD COLUMN IF NOT EXISTS thread_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_resolution BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolved_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';

-- Create comment_tags table
CREATE TABLE IF NOT EXISTS comment_tags (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES review_comments(id) ON DELETE CASCADE,
    tag_type VARCHAR(50) NOT NULL,
    tag_value VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS comment_reactions (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES review_comments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    reaction_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id, reaction_type)
);

-- Create comment_attachments table
CREATE TABLE IF NOT EXISTS comment_attachments (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES review_comments(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comment_mentions table
CREATE TABLE IF NOT EXISTS comment_mentions (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES review_comments(id) ON DELETE CASCADE,
    mentioned_user_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notified BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_comment_tags_comment_id ON comment_tags(comment_id);
CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX idx_comment_attachments_comment_id ON comment_attachments(comment_id);
CREATE INDEX idx_comment_mentions_comment_id ON comment_mentions(comment_id);
CREATE INDEX idx_review_comments_thread ON review_comments(thread_id);
CREATE INDEX idx_review_comments_parent ON review_comments(parent_comment_id);

-- Update the existing review_comments to add thread_id if not exists
UPDATE review_comments 
SET thread_id = CONCAT('thread_', id::text) 
WHERE thread_id IS NULL;

ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE contracts ADD COLUMN created_by INTEGER REFERENCES users(id);



-- First, let's add all missing columns to the contracts table
DO $$ 
BEGIN
    -- Add processing_time if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'processing_time'
    ) THEN
        ALTER TABLE contracts ADD COLUMN processing_time DOUBLE PRECISION;
    END IF;

    -- Add chroma_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'chroma_id'
    ) THEN
        ALTER TABLE contracts ADD COLUMN chroma_id VARCHAR(255);
    END IF;

    -- Add version if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'version'
    ) THEN
        ALTER TABLE contracts ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    -- Add review_comments if missing (TEMPORARY - we'll remove it from INSERT later)
    -- This is just to make the INSERT work, but we should fix the backend code
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'review_comments'
    ) THEN
        ALTER TABLE contracts ADD COLUMN review_comments JSONB DEFAULT '[]';
    END IF;

    -- Add created_by if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE contracts ADD COLUMN created_by INTEGER;
        
        -- Set default value
        UPDATE contracts SET created_by = 1 WHERE created_by IS NULL;
        
        -- Add foreign key constraint
        ALTER TABLE contracts 
        ADD CONSTRAINT contracts_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES users(id);
    END IF;

    -- Add uploaded_at if missing (this should already exist but just in case)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' AND column_name = 'uploaded_at'
    ) THEN
        ALTER TABLE contracts ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Make sure status has a default
    ALTER TABLE contracts ALTER COLUMN status SET DEFAULT 'draft';
    
    -- Make sure version has a default
    ALTER TABLE contracts ALTER COLUMN version SET DEFAULT 1;
    
    -- Make sure review_comments has a default
    ALTER TABLE contracts ALTER COLUMN review_comments SET DEFAULT '[]';
    
END $$;

-- Now, here's the complete CREATE TABLE statement with ALL columns
-- that your INSERT statement is trying to use:
/*
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    filename VARCHAR NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Reference IDs
    investment_id VARCHAR(255),
    project_id VARCHAR(255),
    grant_id VARCHAR(255),
    extracted_reference_ids JSONB DEFAULT '[]',
    
    -- Basic extracted data
    contract_number VARCHAR,
    grant_name VARCHAR,
    grantor VARCHAR,
    grantee VARCHAR,
    total_amount DOUBLE PRECISION,
    start_date VARCHAR,
    end_date VARCHAR,
    purpose TEXT,
    payment_schedule JSONB,
    terms_conditions JSONB,
    
    -- Comprehensive data
    comprehensive_data JSONB,
    
    -- Raw text
    full_text TEXT,
    
    -- Metadata
    status VARCHAR DEFAULT 'draft',
    processing_time DOUBLE PRECISION,
    
    -- ChromaDB reference
    chroma_id VARCHAR(255),
    
    -- Version control for amendments
    document_type VARCHAR DEFAULT 'main_contract',
    parent_contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
    version INTEGER DEFAULT 1,
    is_latest_version BOOLEAN DEFAULT TRUE,
    amendment_status VARCHAR DEFAULT 'draft',
    amendment_date TIMESTAMP WITH TIME ZONE,
    amendment_reason TEXT,
    
    -- Workflow fields
    created_by INTEGER REFERENCES users(id),
    
    -- TEMPORARY: review_comments column (should be removed from INSERT statement)
    -- This exists only because your backend code is trying to insert into it
    -- Ideally, remove 'review_comments' from the INSERT in your backend code
    review_comments JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_contracts_created_by ON contracts(created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_version ON contracts(version);
CREATE INDEX IF NOT EXISTS idx_contracts_investment_id ON contracts(investment_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_grant_id ON contracts(grant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_document_type ON contracts(document_type);
CREATE INDEX IF NOT EXISTS idx_contracts_parent_contract_id ON contracts(parent_contract_id);



-- One-time fix: Add ALL columns that might be missing
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'pending_review',
ADD COLUMN IF NOT EXISTS review_summary TEXT,
ADD COLUMN IF NOT EXISTS forwarded_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS forwarded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS program_manager_recommendation VARCHAR(20),
ADD COLUMN IF NOT EXISTS director_decision_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS director_decision_comments TEXT,
ADD COLUMN IF NOT EXISTS director_decided_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS director_decided_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS business_sign_off BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS risk_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lock_reason TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS review_comments JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS processing_time DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS chroma_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS created_by INTEGER DEFAULT 1;

-- Set defaults for existing rows
UPDATE contracts SET review_status = 'pending_review' WHERE review_status IS NULL;
UPDATE contracts SET business_sign_off = FALSE WHERE business_sign_off IS NULL;
UPDATE contracts SET risk_accepted = FALSE WHERE risk_accepted IS NULL;
UPDATE contracts SET is_locked = FALSE WHERE is_locked IS NULL;
UPDATE contracts SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE contracts SET review_comments = '[]'::JSONB WHERE review_comments IS NULL;
UPDATE contracts SET version = 1 WHERE version IS NULL;
UPDATE contracts SET created_by = 1 WHERE created_by IS NULL;

-- Add foreign key constraints
ALTER TABLE contracts 
ADD CONSTRAINT IF NOT EXISTS contracts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id);

ALTER TABLE contracts 
ADD CONSTRAINT IF NOT EXISTS contracts_forwarded_by_fkey 
FOREIGN KEY (forwarded_by) REFERENCES users(id);

ALTER TABLE contracts 
ADD CONSTRAINT IF NOT EXISTS contracts_director_decided_by_fkey 
FOREIGN KEY (director_decided_by) REFERENCES users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_review_status ON contracts(review_status);
CREATE INDEX IF NOT EXISTS idx_contracts_forwarded_by ON contracts(forwarded_by);
CREATE INDEX IF NOT EXISTS idx_contracts_director_decision_status ON contracts(director_decision_status);
CREATE INDEX IF NOT EXISTS idx_contracts_program_manager_recommendation ON contracts(program_manager_recommendation);



-- Change review_comments column from JSONB to TEXT
ALTER TABLE contracts 
ALTER COLUMN review_comments TYPE TEXT USING review_comments::TEXT;

-- Remove the default JSON array since it's now TEXT
ALTER TABLE contracts 
ALTER COLUMN review_comments DROP DEFAULT;

-- Set a new default as empty string
ALTER TABLE contracts 
ALTER COLUMN review_comments SET DEFAULT '';

-- Update existing rows
UPDATE contracts 
SET review_comments = '' 
WHERE review_comments IS NULL OR review_comments = '[]';

-- OR if you want to preserve existing JSON data as text:
-- UPDATE contracts 
-- SET review_comments = review_comments::TEXT 
-- WHERE review_comments IS NOT NULL;