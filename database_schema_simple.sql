-- AgisFL Enterprise Database Schema (Simplified)
-- Core tables for PostgreSQL deployment
-- Run this script in your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    is_active BOOLEAN DEFAULT TRUE,
    metadata_json JSONB DEFAULT '{}',

    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_until TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    mfa_backup_codes TEXT,
    login_history JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}'
);

-- Create fl_clients table
CREATE TABLE IF NOT EXISTS fl_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    is_active BOOLEAN DEFAULT TRUE,
    metadata_json JSONB DEFAULT '{}',

    client_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    organization VARCHAR(255),
    contact_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'inactive',
    last_seen TIMESTAMPTZ,
    capabilities JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    security_info JSONB DEFAULT '{}'
);

-- Create fl_experiments table
CREATE TABLE IF NOT EXISTS fl_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    is_active BOOLEAN DEFAULT TRUE,
    metadata_json JSONB DEFAULT '{}',

    name VARCHAR(255) NOT NULL,
    description TEXT,
    algorithm VARCHAR(100) NOT NULL,
    dataset_info JSONB DEFAULT '{}',
    hyperparameters JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'created',
    rounds_completed INTEGER DEFAULT 0,
    total_rounds INTEGER DEFAULT 10,
    participating_clients JSONB DEFAULT '[]',
    results JSONB DEFAULT '{}',
    model_checkpoints JSONB DEFAULT '[]',
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    global_accuracy DECIMAL(5,4),
    training_loss DECIMAL(10,6)
);

-- Create security_events table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    is_active BOOLEAN DEFAULT TRUE,
    metadata_json JSONB DEFAULT '{}',

    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    source VARCHAR(255) NOT NULL,
    target VARCHAR(255),
    user_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    is_active BOOLEAN DEFAULT TRUE,
    metadata_json JSONB DEFAULT '{}',

    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    user_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    changes JSONB DEFAULT '{}',
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    request_id VARCHAR(100),
    session_id VARCHAR(100)
);

-- Create datasets table
CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    is_active BOOLEAN DEFAULT TRUE,
    metadata_json JSONB DEFAULT '{}',

    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_hash VARCHAR(255),
    schema_info JSONB DEFAULT '{}',
    statistics JSONB DEFAULT '{}',
    privacy_level VARCHAR(50) DEFAULT 'internal',
    tags JSONB DEFAULT '[]',
    owner_id UUID NOT NULL,
    is_encrypted BOOLEAN DEFAULT FALSE,
    encryption_key_id VARCHAR(255),
    dataset_type VARCHAR(50) DEFAULT 'csv',
    num_samples INTEGER,
    num_features INTEGER
);

-- Create system_config table
CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    is_active BOOLEAN DEFAULT TRUE,
    metadata_json JSONB DEFAULT '{}',

    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    data_type VARCHAR(50) DEFAULT 'string',
    category VARCHAR(100),
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    encrypted_value BYTEA
);

-- Create training_metrics table
CREATE TABLE IF NOT EXISTS training_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    experiment_id UUID,
    round_number INTEGER NOT NULL,
    client_id VARCHAR(255),
    accuracy DECIMAL(5,4),
    loss DECIMAL(10,6),
    training_time_seconds INTEGER,
    num_samples INTEGER,
    metrics JSONB DEFAULT '{}'
);

-- Create model_versions table
CREATE TABLE IF NOT EXISTS model_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    experiment_id UUID,
    version VARCHAR(50) NOT NULL,
    model_path VARCHAR(500),
    accuracy DECIMAL(5,4),
    loss DECIMAL(10,6),
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_users_role ON users(role);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);
CREATE INDEX IF NOT EXISTS ix_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS ix_fl_clients_status ON fl_clients(status);
CREATE INDEX IF NOT EXISTS ix_fl_clients_location ON fl_clients(location);
CREATE INDEX IF NOT EXISTS ix_fl_clients_organization ON fl_clients(organization);
CREATE INDEX IF NOT EXISTS ix_fl_clients_last_seen ON fl_clients(last_seen);

CREATE INDEX IF NOT EXISTS ix_fl_experiments_status ON fl_experiments(status);
CREATE INDEX IF NOT EXISTS ix_fl_experiments_algorithm ON fl_experiments(algorithm);
CREATE INDEX IF NOT EXISTS ix_fl_experiments_created_by ON fl_experiments(created_by);
CREATE INDEX IF NOT EXISTS ix_fl_experiments_created_at ON fl_experiments(created_at);

CREATE INDEX IF NOT EXISTS ix_security_events_type_severity ON security_events(event_type, severity);
CREATE INDEX IF NOT EXISTS ix_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS ix_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS ix_security_events_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS ix_security_events_resolved ON security_events(resolved);

CREATE INDEX IF NOT EXISTS ix_audit_logs_action_entity ON audit_logs(action, entity_type);
CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS ix_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_request_id ON audit_logs(request_id);

CREATE INDEX IF NOT EXISTS ix_datasets_name ON datasets(name);
CREATE INDEX IF NOT EXISTS ix_datasets_owner ON datasets(owner_id);
CREATE INDEX IF NOT EXISTS ix_datasets_privacy ON datasets(privacy_level);
CREATE INDEX IF NOT EXISTS ix_datasets_type ON datasets(dataset_type);

CREATE INDEX IF NOT EXISTS ix_system_config_category ON system_config(category);
CREATE INDEX IF NOT EXISTS ix_system_config_key ON system_config(key);

CREATE INDEX IF NOT EXISTS ix_training_metrics_experiment_id ON training_metrics(experiment_id);
CREATE INDEX IF NOT EXISTS ix_training_metrics_round ON training_metrics(round_number);
CREATE INDEX IF NOT EXISTS ix_training_metrics_client ON training_metrics(client_id);

CREATE INDEX IF NOT EXISTS ix_model_versions_experiment_id ON model_versions(experiment_id);
CREATE INDEX IF NOT EXISTS ix_model_versions_version ON model_versions(version);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fl_clients_updated_at BEFORE UPDATE ON fl_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fl_experiments_updated_at BEFORE UPDATE ON fl_experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_events_updated_at BEFORE UPDATE ON security_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_logs_updated_at BEFORE UPDATE ON audit_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON datasets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_metrics_updated_at BEFORE UPDATE ON training_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_model_versions_updated_at BEFORE UPDATE ON model_versions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user with proper password hash
-- Password: admin123 (bcrypt hash)
INSERT INTO users (username, email, full_name, password_hash, role, is_verified, is_active)
VALUES (
    'admin',
    'admin@agisfl.com',
    'System Administrator',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeCt1uB0YgLpO6Q6m',
    'super_admin',
    TRUE,
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- Insert default system configuration
INSERT INTO system_config (key, value, data_type, category, description) VALUES
('app_name', 'AgisFL Enterprise', 'string', 'general', 'Application name'),
('app_version', '5.0.0', 'string', 'general', 'Application version'),
('debug_mode', 'false', 'boolean', 'general', 'Debug mode enabled'),
('max_clients', '100', 'integer', 'federated_learning', 'Maximum number of FL clients'),
('default_rounds', '10', 'integer', 'federated_learning', 'Default number of FL rounds'),
('privacy_budget', '1.0', 'float', 'privacy', 'Default differential privacy budget'),
('session_timeout', '3600', 'integer', 'security', 'Session timeout in seconds'),
('max_login_attempts', '5', 'integer', 'security', 'Maximum login attempts before lockout'),
('lockout_duration', '900', 'integer', 'security', 'Account lockout duration in seconds')
ON CONFLICT (key) DO NOTHING;

COMMIT;
