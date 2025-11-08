-- Facial Recognition System Migration
-- Created: 2025-11-09
-- Purpose: Add facial recognition check-in capability

-----------------------------------------------------
-- FACE ENROLLMENTS TABLE
-----------------------------------------------------
-- Stores employee face photos for recognition
CREATE TABLE IF NOT EXISTS face_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Cloudinary URLs
    face_photo_url TEXT NOT NULL,              -- Main face photo URL
    cloudinary_public_id TEXT,                 -- For deletion if needed
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,            -- Allow multiple enrollments, only one active
    quality_score DECIMAL(3,2),                -- Optional: 0.00-1.00 face detection confidence
    
    -- Audit trail
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    enrolled_by UUID REFERENCES users(id),     -- Who enrolled (self or admin)
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one active enrollment per employee
    CONSTRAINT unique_active_enrollment UNIQUE NULLS NOT DISTINCT (employee_id, is_active)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_face_enrollments_employee ON face_enrollments(employee_id) WHERE is_active = TRUE;

-----------------------------------------------------
-- FACE CHECK-IN LOGS TABLE
-----------------------------------------------------
-- Audit log of all face check-in attempts (successful or failed)
CREATE TABLE IF NOT EXISTS face_checkin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
    
    -- Check-in details
    success BOOLEAN NOT NULL,                  -- Did face match?
    confidence_score DECIMAL(5,4),             -- Similarity score (0.0000-1.0000)
    temp_photo_url TEXT,                       -- Temporary Cloudinary URL (deleted after)
    
    -- Error tracking
    error_reason TEXT,                         -- e.g., "No face detected", "Low confidence"
    
    -- Audit
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,                           -- Optional: track location
    user_agent TEXT                            -- Optional: track device
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_face_checkin_logs_employee ON face_checkin_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_face_checkin_logs_date ON face_checkin_logs(attempted_at);

-----------------------------------------------------
-- COMMENTS
-----------------------------------------------------
COMMENT ON TABLE face_enrollments IS 'Stores employee face photos for facial recognition check-in';
COMMENT ON TABLE face_checkin_logs IS 'Audit log of all facial recognition check-in attempts';
COMMENT ON COLUMN face_enrollments.quality_score IS 'Face detection confidence from face-api.js (0.00-1.00)';
COMMENT ON COLUMN face_checkin_logs.confidence_score IS 'Face similarity score from face-api.js comparison';
