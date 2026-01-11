-- Client Auth Service Database Setup
-- Run this script to create the client_auth_db database

-- Create the database
CREATE DATABASE client_auth_db;

-- Connect to the new database
\c client_auth_db

-- Client Users Table
CREATE TABLE client_users (
    id VARCHAR(36) PRIMARY KEY,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'RIDER',
    status VARCHAR(20) DEFAULT 'PENDING',
    google_id VARCHAR(255),
    apple_id VARCHAR(255),
    profile_image_url TEXT,
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    -- Austin: Track terms acceptance for compliance
    terms_accepted BOOLEAN DEFAULT FALSE,
    terms_accepted_at TIMESTAMP,
    total_trips INTEGER DEFAULT 0,
    total_distance_km DECIMAL(10,2) DEFAULT 0,
    rating DECIMAL(2,1) DEFAULT 5.0,
    cancellations INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Refresh Tokens Table
CREATE TABLE client_refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES client_users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client OTPs Table
CREATE TABLE client_otps (
    id VARCHAR(36) PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password Reset Tokens Table
CREATE TABLE client_password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES client_users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Austin: Terms Acceptance Table for audit and compliance
CREATE TABLE client_terms_acceptances (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES client_users(id) ON DELETE CASCADE,
    terms_version VARCHAR(20) NOT NULL,
    privacy_version VARCHAR(20) NOT NULL,
    terms_accepted BOOLEAN DEFAULT FALSE,
    privacy_accepted BOOLEAN DEFAULT FALSE,
    accepted_at TIMESTAMP,
    ip_address VARCHAR(45),
    device_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_client_users_phone ON client_users(phone);
CREATE INDEX idx_client_users_email ON client_users(email);
CREATE INDEX idx_client_users_google_id ON client_users(google_id);
CREATE INDEX idx_client_refresh_tokens_user_id ON client_refresh_tokens(user_id);
CREATE INDEX idx_client_refresh_tokens_token ON client_refresh_tokens(token);
CREATE INDEX idx_client_otps_phone ON client_otps(phone);
CREATE INDEX idx_client_password_reset_tokens_user_id ON client_password_reset_tokens(user_id);
CREATE INDEX idx_client_terms_acceptances_user_id ON client_terms_acceptances(user_id);

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
