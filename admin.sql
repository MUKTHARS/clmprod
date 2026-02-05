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