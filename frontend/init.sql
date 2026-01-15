-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create grant_contracts table (will be created by SQLAlchemy, but adding for reference)
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
    embedding VECTOR(1536),
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
CREATE INDEX IF NOT EXISTS idx_grant_contracts_embedding ON grant_contracts USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_extraction_logs_contract_id ON extraction_logs(contract_id);


ALTER TABLE contracts ADD COLUMN chroma_id VARCHAR(255);