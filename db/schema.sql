-- ============================================================
-- Israeli Payroll System — Database Schema
-- Bank of Israel bank codes: 3-digit format (POST-MIGRATION)
-- ============================================================

-- Extension for UUID primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- Lookup table: valid BOI bank codes
-- NOTE: bank_code is CHAR(3) — migrated from CHAR(2)
-- ------------------------------------------------------------
CREATE TABLE bank_codes (
    bank_code   CHAR(3)      NOT NULL,
    bank_name   VARCHAR(100) NOT NULL,
    swift_code  VARCHAR(11),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_bank_codes PRIMARY KEY (bank_code),
    CONSTRAINT chk_bank_code_format CHECK (bank_code ~ '^[0-9]{3}$')
);

-- Seed: official BOI 3-digit codes (POST-MIGRATION)
INSERT INTO bank_codes (bank_code, bank_name, swift_code) VALUES
    ('004', 'Bank Yahav',                    'YAHVILITXXX'),
    ('010', 'Bank Leumi',                    'LUMIILITXXX'),
    ('011', 'Discount Bank',                 'DISCILIT'),
    ('012', 'Bank Hapoalim',                 'POALILIT'),
    ('013', 'Union Bank (Igud)',              'UNIOILIT'),
    ('014', 'Otzar Hahayal Bank',            'OTZRILIT'),
    ('017', 'Mercantile Discount Bank',      'MRCLILITMTE'),
    ('020', 'Mizrahi-Tefahot Bank',          'MIZBILIT'),
    ('026', 'U-Bank',                        'UBNKILIT'),
    ('031', 'International Bank of Israel',  'FIBIILIT'),
    ('034', 'Arab Israel Bank',              NULL),
    ('046', 'Bank of Jerusalem',             'JERSILJ1'),
    ('052', 'Bank Poalei Agudat Israel',     NULL),
    ('090', 'Israel Post Bank',              NULL);

-- ------------------------------------------------------------
-- Employees table
-- ------------------------------------------------------------
CREATE TABLE employees (
    employee_id     UUID         NOT NULL DEFAULT uuid_generate_v4(),
    full_name       VARCHAR(200) NOT NULL,
    id_number       CHAR(9)      NOT NULL,   -- Israeli Teudat Zehut
    bank_code       CHAR(3)      NOT NULL,
    branch_number   CHAR(3)      NOT NULL,
    account_number  VARCHAR(13)  NOT NULL,
    department      VARCHAR(100),
    position        VARCHAR(100),
    hire_date       DATE         NOT NULL,
    active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_employees PRIMARY KEY (employee_id),
    CONSTRAINT uq_employees_id_number UNIQUE (id_number),
    CONSTRAINT chk_employees_bank_code CHECK (bank_code ~ '^[0-9]{3}$'),
    CONSTRAINT chk_employees_branch CHECK (branch_number ~ '^[0-9]{3}$'),
    CONSTRAINT chk_employees_account CHECK (account_number ~ '^[0-9]{6,13}$'),
    CONSTRAINT fk_employees_bank_code FOREIGN KEY (bank_code)
        REFERENCES bank_codes (bank_code)
);

-- ------------------------------------------------------------
-- Payroll runs table
-- ------------------------------------------------------------
CREATE TABLE payroll_runs (
    run_id          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    run_date        DATE         NOT NULL,
    pay_period      CHAR(7)      NOT NULL,  -- format: YYYY-MM
    status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
    total_gross     NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_net       NUMERIC(14,2) NOT NULL DEFAULT 0,
    masav_file_path VARCHAR(500),
    created_by      VARCHAR(100),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_payroll_runs PRIMARY KEY (run_id),
    CONSTRAINT chk_payroll_status CHECK (status IN ('pending','processing','completed','failed')),
    CONSTRAINT chk_pay_period CHECK (pay_period ~ '^\d{4}-\d{2}$')
);

-- ------------------------------------------------------------
-- Payroll entries table (one row per employee per payroll run)
-- ------------------------------------------------------------
CREATE TABLE payroll_entries (
    entry_id        UUID          NOT NULL DEFAULT uuid_generate_v4(),
    run_id          UUID          NOT NULL,
    employee_id     UUID          NOT NULL,
    -- Snapshot the bank details at time of payroll (denormalized intentionally)
    bank_code       CHAR(3)       NOT NULL,
    branch_number   CHAR(3)       NOT NULL,
    account_number  VARCHAR(13)   NOT NULL,
    gross_salary    NUMERIC(12,2) NOT NULL,
    income_tax      NUMERIC(12,2) NOT NULL DEFAULT 0,
    national_ins    NUMERIC(12,2) NOT NULL DEFAULT 0,
    health_ins      NUMERIC(12,2) NOT NULL DEFAULT 0,
    pension         NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_salary      NUMERIC(12,2) NOT NULL,
    masav_sequence  INTEGER,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_payroll_entries PRIMARY KEY (entry_id),
    CONSTRAINT fk_payroll_entries_run FOREIGN KEY (run_id) REFERENCES payroll_runs (run_id),
    CONSTRAINT fk_payroll_entries_emp FOREIGN KEY (employee_id) REFERENCES employees (employee_id),
    CONSTRAINT chk_entry_bank_code CHECK (bank_code ~ '^[0-9]{3}$')
);

-- ------------------------------------------------------------
-- Audit log table — tracks all bank code changes
-- ------------------------------------------------------------
CREATE TABLE bank_code_audit (
    audit_id        BIGSERIAL    NOT NULL,
    table_name      VARCHAR(100) NOT NULL,
    record_id       UUID         NOT NULL,
    old_bank_code   CHAR(3),
    new_bank_code   CHAR(3),
    changed_by      VARCHAR(100),
    changed_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_bank_code_audit PRIMARY KEY (audit_id)
);

-- ------------------------------------------------------------
-- View: payroll summary with bank names
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_payroll_summary AS
SELECT
    pe.entry_id,
    pr.pay_period,
    pr.run_date,
    e.full_name,
    e.id_number,
    LPAD(pe.bank_code, 3, '0')                          AS bank_code_display,
    bc.bank_name,
    pe.branch_number,
    pe.account_number,
    pe.gross_salary,
    pe.income_tax,
    pe.national_ins,
    pe.health_ins,
    pe.pension,
    pe.net_salary,
    pr.status                                            AS run_status
FROM payroll_entries pe
JOIN payroll_runs     pr ON pr.run_id      = pe.run_id
JOIN employees        e  ON e.employee_id  = pe.employee_id
JOIN bank_codes       bc ON bc.bank_code   = pe.bank_code;

-- ------------------------------------------------------------
-- View: employees with full bank details
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_employee_bank_details AS
SELECT
    e.employee_id,
    e.full_name,
    e.id_number,
    LPAD(e.bank_code, 3, '0')    AS bank_code,
    bc.bank_name,
    bc.swift_code,
    e.branch_number,
    e.account_number,
    e.department,
    e.active
FROM employees   e
JOIN bank_codes  bc ON bc.bank_code = e.bank_code
WHERE e.active = TRUE;

-- ------------------------------------------------------------
-- Indexes
-- ------------------------------------------------------------
CREATE INDEX idx_employees_bank_code     ON employees       (bank_code);
CREATE INDEX idx_payroll_entries_run     ON payroll_entries (run_id);
CREATE INDEX idx_payroll_entries_emp     ON payroll_entries (employee_id);
CREATE INDEX idx_payroll_entries_bank    ON payroll_entries (bank_code);
CREATE INDEX idx_payroll_runs_period     ON payroll_runs    (pay_period);
