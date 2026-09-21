-- ==============================================================================
-- DATABASE SCHEMA: QR-Based Rental Asset Tracking & Return Management System (RentIQ)
-- Target Database: PostgreSQL 14+
-- ==============================================================================

-- Create Extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'BORROWER', -- 'ADMIN', 'STAFF', 'BORROWER'
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. ASSET CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS asset_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_categories_name ON asset_categories(name);

-- 3. ASSETS TABLE
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(36) PRIMARY KEY,
    asset_code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(36) NOT NULL REFERENCES asset_categories(id) ON DELETE RESTRICT,
    description TEXT,
    specifications TEXT, -- JSON or serialized text format
    qr_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE', 
    -- 'AVAILABLE', 'REQUESTED', 'APPROVED', 'ISSUED', 'RETURN_INITIATED', 'INSPECTION', 'VERIFIED', 'DAMAGED', 'MAINTENANCE'
    current_condition VARCHAR(50) NOT NULL DEFAULT 'EXCELLENT', 
    -- 'EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_qr_token ON assets(qr_token);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON assets(category_id);

-- 4. RENTAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS rental_requests (
    id VARCHAR(36) PRIMARY KEY,
    asset_id VARCHAR(36) NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    borrower_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', 
    -- 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'
    approved_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rental_requests_asset ON rental_requests(asset_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_borrower ON rental_requests(borrower_id);
CREATE INDEX IF NOT EXISTS idx_rental_requests_status ON rental_requests(status);
CREATE INDEX IF NOT EXISTS idx_rental_requests_dates ON rental_requests(start_date, due_date);

-- 5. RENTALS TABLE (Active & Historical checkouts)
CREATE TABLE IF NOT EXISTS rentals (
    id VARCHAR(36) PRIMARY KEY,
    request_id VARCHAR(36) REFERENCES rental_requests(id) ON DELETE SET NULL,
    asset_id VARCHAR(36) NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    borrower_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    issued_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    returned_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', 
    -- 'ACTIVE', 'OVERDUE', 'RETURN_INITIATED', 'INSPECTION', 'COMPLETED', 'CANCELLED'
    pre_condition VARCHAR(50) NOT NULL DEFAULT 'EXCELLENT',
    pre_notes TEXT,
    pre_photos TEXT, -- JSON array of file paths / URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rentals_asset ON rentals(asset_id);
CREATE INDEX IF NOT EXISTS idx_rentals_borrower ON rentals(borrower_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_due_date ON rentals(due_date);

-- 6. ASSET CONDITIONS / RETURNS TABLE (Digital Return Inspection)
CREATE TABLE IF NOT EXISTS asset_conditions (
    id VARCHAR(36) PRIMARY KEY,
    rental_id VARCHAR(36) NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    received_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    condition VARCHAR(50) NOT NULL, -- 'EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'
    remarks TEXT,
    photo_urls TEXT, -- JSON array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_asset_conditions_rental ON asset_conditions(rental_id);

-- 7. DAMAGE REPORTS TABLE
CREATE TABLE IF NOT EXISTS damage_reports (
    id VARCHAR(36) PRIMARY KEY,
    asset_id VARCHAR(36) NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    rental_id VARCHAR(36) REFERENCES rentals(id) ON DELETE SET NULL,
    reported_by VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_REVIEW', 'RESOLVED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_damage_reports_asset ON damage_reports(asset_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON damage_reports(status);

-- 8. MAINTENANCE TABLE
CREATE TABLE IF NOT EXISTS maintenance (
    id VARCHAR(36) PRIMARY KEY,
    asset_id VARCHAR(36) NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    damage_report_id VARCHAR(36) REFERENCES damage_reports(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    maintenance_status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'
    cost DECIMAL(10, 2) DEFAULT 0.00,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_maintenance_asset ON maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(maintenance_status);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_value TEXT, -- JSON string or text summary
    new_value TEXT, -- JSON string or text summary
    ip_address VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
