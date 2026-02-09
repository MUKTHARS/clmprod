-- Add super admin user
INSERT INTO users (
    username, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    user_type, 
    is_active
) VALUES (
    'superadmin', 
    'superadmin@grantos.com', 
    '$2b$12$KBy98mSRWLXH/I4DKnNgjeIXyBLclR9xSBv./hpDA3G.5i5cdL8XW', -- password: admin123
    'Super', 
    'Admin', 
    'super_admin', 
    'internal', 
    true
);




-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR,
ADD COLUMN IF NOT EXISTS last_name VARCHAR,
ADD COLUMN IF NOT EXISTS company VARCHAR,
ADD COLUMN IF NOT EXISTS user_type VARCHAR DEFAULT 'internal';

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR NOT NULL,
    module_id INTEGER REFERENCES modules(id),
    permission VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    UNIQUE(role, module_id, permission)
);





-- Add all new columns for agreement workflow
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS assigned_pm_users JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS assigned_pgm_users JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS assigned_director_users JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS additional_documents JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS agreement_type VARCHAR,
ADD COLUMN IF NOT EXISTS effective_date VARCHAR,
ADD COLUMN IF NOT EXISTS renewal_date VARCHAR,
ADD COLUMN IF NOT EXISTS termination_date VARCHAR,
ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR,
ADD COLUMN IF NOT EXISTS governing_law VARCHAR,
ADD COLUMN IF NOT EXISTS special_conditions JSONB,
ADD COLUMN IF NOT EXISTS last_edited_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS published_by INTEGER REFERENCES users(id);

-- Create index for faster queries on draft status
CREATE INDEX IF NOT EXISTS idx_contracts_status_created_by ON contracts(status, created_by);
CREATE INDEX IF NOT EXISTS idx_contracts_last_edited_by ON contracts(last_edited_by);
CREATE INDEX IF NOT EXISTS idx_contracts_published_by ON contracts(published_by);

-- Create index for assigned users queries
CREATE INDEX IF NOT EXISTS idx_contracts_assigned_pm_users ON contracts USING GIN (assigned_pm_users);
CREATE INDEX IF NOT EXISTS idx_contracts_assigned_pgm_users ON contracts USING GIN (assigned_pgm_users);
CREATE INDEX IF NOT EXISTS idx_contracts_assigned_director_users ON contracts USING GIN (assigned_director_users);

-- Update any existing NULL values to empty arrays
UPDATE contracts 
SET assigned_pm_users = '[]' 
WHERE assigned_pm_users IS NULL;

UPDATE contracts 
SET assigned_pgm_users = '[]' 
WHERE assigned_pgm_users IS NULL;

UPDATE contracts 
SET assigned_director_users = '[]' 
WHERE assigned_director_users IS NULL;

UPDATE contracts 
SET additional_documents = '[]' 
WHERE additional_documents IS NULL;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contracts' 
ORDER BY ordinal_position;




CREATE TABLE user_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    notification_type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    contract_id INTEGER REFERENCES contracts(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_contract_id ON user_notifications(contract_id);
CREATE INDEX idx_user_notifications_is_read ON user_notifications(is_read);