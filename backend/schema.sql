-- WorkZen / HRX - Minimal MVP Database Schema (PostgreSQL)
-- Notes:
-- - Uses timestamptz for time-sensitive fields
-- - Adds company_id to payruns for multi-tenant scoping
-- - Keeps roles/status as VARCHAR with CHECKs (no enums) for fast iteration
-- - Keeps uniqueness/advanced constraints minimal per MVP request

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-----------------------------------------------------
-- COMPANY
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) UNIQUE NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------
-- USERS & ROLES
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    login_id VARCHAR(50) UNIQUE NOT NULL,            -- OI format login
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin','hr','employee','payroll')) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    is_first_login BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------
-- DEPARTMENTS
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    UNIQUE (company_id, name)
);

-----------------------------------------------------
-- EMPLOYEE MASTER PROFILE
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id),

    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(20),
    location VARCHAR(150),
    manager_id UUID REFERENCES employees(id),

    avatar_url TEXT,
    resume_url TEXT,                                -- Uploaded CV

    about_job TEXT,
    interests TEXT,
    hobbies TEXT,

    dob DATE,
    nationality VARCHAR(50),
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    address TEXT,
    date_of_joining DATE NOT NULL,
    joining_serial INT,                              -- For OI ID formula

    has_bank_account BOOLEAN DEFAULT TRUE,
    has_manager BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------
-- BANK & ID DETAILS
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    account_number VARCHAR(35),
    bank_name VARCHAR(150),
    ifsc_code VARCHAR(20),
    pan VARCHAR(20),
    uan VARCHAR(20),
    employee_code VARCHAR(50)
);

-----------------------------------------------------
-- SKILLS & CERTIFICATIONS
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS employee_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    skill VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    issuer VARCHAR(200),
    issued_on DATE,
    expires_on DATE
);

-----------------------------------------------------
-- ATTENDANCE
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    work_hours DECIMAL(5,2),
    break_hours DECIMAL(5,2),
    extra_hours DECIMAL(5,2),

    status VARCHAR(15) CHECK (status IN ('present','leave','absent')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (date);

-----------------------------------------------------
-- LEAVE TYPES
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    is_paid BOOLEAN DEFAULT TRUE
);

-----------------------------------------------------
-- LEAVE ALLOCATION (HR)
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    allocated_days INT NOT NULL,
    used_days INT DEFAULT 0,
    valid_from DATE,
    valid_to DATE,
    notes TEXT,
    attachment_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------
-- LEAVE REQUESTS (EMPLOYEE)
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    attachment_url TEXT,

    status VARCHAR(20) CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------
-- SALARY STRUCTURE (PER EMPLOYEE)
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS salary_structure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE REFERENCES employees(id) ON DELETE CASCADE,

    monthly_wage DECIMAL(12,2) NOT NULL,
    yearly_wage DECIMAL(12,2) GENERATED ALWAYS AS (monthly_wage * 12) STORED,

    working_days_per_week INT,
    break_hours DECIMAL(5,2),

    pf_employee_rate DECIMAL(5,2) DEFAULT 12,
    pf_employer_rate DECIMAL(5,2) DEFAULT 12,
    professional_tax_override DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------
-- SALARY COMPONENTS (CONFIG)
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,

    name VARCHAR(100),
    computation_type VARCHAR(20) CHECK (computation_type IN ('fixed','percentage')),
    value DECIMAL(8,2), -- percentage or fixed
    amount DECIMAL(12,2), -- computed result
    is_deduction BOOLEAN DEFAULT FALSE
);

-----------------------------------------------------
-- PAYRUN (MONTHLY BATCH)
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS payruns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    period_month INT,
    period_year INT,
    employee_count INT,
    total_employer_cost DECIMAL(12,2),
    created_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------
-- PAYSLIPS
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payrun_id UUID REFERENCES payruns(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,

    payable_days INT,
    total_worked_days INT,
    total_leaves INT,

    basic_wage DECIMAL(12,2),
    gross_wage DECIMAL(12,2),
    net_wage DECIMAL(12,2),

    status VARCHAR(20) DEFAULT 'generated', 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------
-- PAYSLIP COMPONENTS (BREAKDOWN)
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS payslip_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payslip_id UUID REFERENCES payslips(id) ON DELETE CASCADE,
    component_name VARCHAR(100),
    amount DECIMAL(12,2),
    is_deduction BOOLEAN
);

-----------------------------------------------------
-- PASSWORD RESET TOKENS (MVP)
-----------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(200) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
