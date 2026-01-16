-- Create grant_contracts table without vector
CREATE TABLE IF NOT EXISTS grant_contracts (
    id SERIAL PRIMARY KEY,
    filename VARCHAR NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    contract_number VARCHAR,
    grant_name VARCHAR,
    grantor VARCHAR,
    grantee VARCHAR,
    effective_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    total_amount DOUBLE PRECISION,
    currency VARCHAR DEFAULT 'USD',
    payment_schedule JSONB,
    deliverables JSONB,
    reporting_requirements JSONB,
    raw_text TEXT,
    summary TEXT,
    extracted_data JSONB,
    file_size INTEGER,
    page_count INTEGER
);

-- Create extraction_logs table
CREATE TABLE IF NOT EXISTS extraction_logs (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES grant_contracts(id),
    extraction_method VARCHAR,
    extracted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    confidence_score DOUBLE PRECISION,
    raw_output JSONB,
    status VARCHAR
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_grant_contracts_filename ON grant_contracts(filename);
CREATE INDEX IF NOT EXISTS idx_grant_contracts_grantor ON grant_contracts(grantor);
CREATE INDEX IF NOT EXISTS idx_grant_contracts_grantee ON grant_contracts(grantee);
CREATE INDEX IF NOT EXISTS idx_grant_contracts_uploaded_at ON grant_contracts(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_extraction_logs_contract_id ON extraction_logs(contract_id);

-- Optional: add chroma_id column to a table if it exists
-- ALTER TABLE contracts ADD COLUMN chroma_id VARCHAR(255);

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS investment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS project_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS grant_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS extracted_reference_ids JSONB DEFAULT '[]';

-- Create index for faster searching
CREATE INDEX IF NOT EXISTS idx_contracts_investment_id ON contracts(investment_id);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_grant_id ON contracts(grant_id);