-- ============================================================
-- Israeli Payroll System — Stored Procedures & Functions
-- Bank of Israel bank codes: 2-digit format (PRE-MIGRATION)
-- ============================================================

-- ------------------------------------------------------------
-- Function: normalize_bank_code
-- Accepts a raw string, validates it is a known 2-digit BOI code.
-- NOTE (MIGRATION): LPAD 2 → 3; regex {2} → {3}
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION normalize_bank_code(raw_code TEXT)
RETURNS CHAR(2)   -- TODO (MIGRATION): return type CHAR(2) → CHAR(3)
LANGUAGE plpgsql
AS $$
DECLARE
    normalized CHAR(2);  -- TODO (MIGRATION): CHAR(2) → CHAR(3)
BEGIN
    IF raw_code IS NULL OR TRIM(raw_code) = '' THEN
        RAISE EXCEPTION 'Bank code cannot be null or empty';
    END IF;

    -- Zero-pad to 2 digits
    -- TODO (MIGRATION): LPAD(..., 2, '0') → LPAD(..., 3, '0')
    normalized := LPAD(TRIM(raw_code), 2, '0');

    -- Validate format: exactly 2 numeric digits
    -- TODO (MIGRATION): regex '^[0-9]{2}$' → '^[0-9]{3}$'
    IF normalized !~ '^[0-9]{2}$' THEN
        RAISE EXCEPTION 'Invalid bank code format: %. Expected 2-digit numeric code.', raw_code;
    END IF;

    -- Validate against lookup table
    IF NOT EXISTS (SELECT 1 FROM bank_codes WHERE bank_code = normalized AND active = TRUE) THEN
        RAISE EXCEPTION 'Unknown or inactive bank code: %', normalized;
    END IF;

    RETURN normalized;
END;
$$;

-- ------------------------------------------------------------
-- Function: validate_bank_account
-- Full validation of bank_code + branch + account_number
-- NOTE (MIGRATION): bank_code param type and length guard must change
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION validate_bank_account(
    p_bank_code     TEXT,
    p_branch        TEXT,
    p_account       TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_bank CHAR(2);  -- TODO (MIGRATION): CHAR(2) → CHAR(3)
BEGIN
    -- Validate and normalize bank code
    v_bank := normalize_bank_code(p_bank_code);

    -- Branch must be exactly 3 digits
    IF p_branch !~ '^[0-9]{3}$' THEN
        RAISE EXCEPTION 'Invalid branch number: %. Expected 3-digit numeric.', p_branch;
    END IF;

    -- Account number: 6–13 digits
    IF p_account !~ '^[0-9]{6,13}$' THEN
        RAISE EXCEPTION 'Invalid account number: %. Expected 6–13 digit numeric.', p_account;
    END IF;

    RETURN TRUE;
END;
$$;

-- ------------------------------------------------------------
-- Function: create_payroll_entry
-- Inserts a single payroll entry after validating bank details
-- NOTE (MIGRATION): bank_code CHAR(2) param → CHAR(3)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_payroll_entry(
    p_run_id        UUID,
    p_employee_id   UUID,
    p_bank_code     CHAR(2),   -- TODO (MIGRATION): CHAR(2) → CHAR(3)
    p_branch        CHAR(3),
    p_account       VARCHAR(13),
    p_gross         NUMERIC(12,2)
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_entry_id      UUID;
    v_income_tax    NUMERIC(12,2);
    v_national_ins  NUMERIC(12,2);
    v_health_ins    NUMERIC(12,2);
    v_pension       NUMERIC(12,2);
    v_net           NUMERIC(12,2);
BEGIN
    -- Validate bank account
    PERFORM validate_bank_account(p_bank_code, p_branch, p_account);

    -- Calculate deductions (simplified flat-rate for demo)
    v_income_tax   := ROUND(p_gross * 0.25, 2);
    v_national_ins := ROUND(p_gross * 0.04, 2);
    v_health_ins   := ROUND(p_gross * 0.031, 2);
    v_pension      := ROUND(p_gross * 0.06, 2);
    v_net          := p_gross - v_income_tax - v_national_ins - v_health_ins - v_pension;

    INSERT INTO payroll_entries (
        run_id, employee_id, bank_code, branch_number, account_number,
        gross_salary, income_tax, national_ins, health_ins, pension, net_salary
    )
    VALUES (
        p_run_id, p_employee_id, p_bank_code, p_branch, p_account,
        p_gross, v_income_tax, v_national_ins, v_health_ins, v_pension, v_net
    )
    RETURNING entry_id INTO v_entry_id;

    RETURN v_entry_id;
END;
$$;

-- ------------------------------------------------------------
-- Function: get_entries_by_bank
-- Returns all payroll entries for a specific bank code.
-- NOTE (MIGRATION): p_bank_code CHAR(2) → CHAR(3)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_entries_by_bank(
    p_bank_code  CHAR(2),   -- TODO (MIGRATION): CHAR(2) → CHAR(3)
    p_pay_period CHAR(7)
)
RETURNS TABLE (
    entry_id       UUID,
    full_name      VARCHAR(200),
    account_number VARCHAR(13),
    net_salary     NUMERIC(12,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate 2-digit format before querying
    -- TODO (MIGRATION): length check 2 → 3
    IF length(p_bank_code) != 2 OR p_bank_code !~ '^[0-9]{2}$' THEN
        RAISE EXCEPTION 'Bank code must be exactly 2 digits. Got: %', p_bank_code;
    END IF;

    RETURN QUERY
    SELECT
        pe.entry_id,
        e.full_name,
        pe.account_number,
        pe.net_salary
    FROM payroll_entries pe
    JOIN payroll_runs pr ON pr.run_id = pe.run_id
    JOIN employees    e  ON e.employee_id = pe.employee_id
    WHERE pe.bank_code = p_bank_code
      AND pr.pay_period = p_pay_period;
END;
$$;

-- ------------------------------------------------------------
-- Function: update_employee_bank_details
-- Updates employee's bank details and writes an audit record.
-- NOTE (MIGRATION): CHAR(2) params and audit columns → CHAR(3)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_employee_bank_details(
    p_employee_id   UUID,
    p_new_bank_code CHAR(2),   -- TODO (MIGRATION): CHAR(2) → CHAR(3)
    p_new_branch    CHAR(3),
    p_new_account   VARCHAR(13),
    p_changed_by    VARCHAR(100)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_old_bank_code CHAR(2);   -- TODO (MIGRATION): CHAR(2) → CHAR(3)
BEGIN
    -- Read current value for audit
    SELECT bank_code INTO v_old_bank_code
    FROM employees
    WHERE employee_id = p_employee_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee not found: %', p_employee_id;
    END IF;

    -- Validate new bank account
    PERFORM validate_bank_account(p_new_bank_code, p_new_branch, p_new_account);

    -- Apply update
    UPDATE employees
    SET bank_code      = p_new_bank_code,
        branch_number  = p_new_branch,
        account_number = p_new_account,
        updated_at     = NOW()
    WHERE employee_id = p_employee_id;

    -- Write audit record
    INSERT INTO bank_code_audit (table_name, record_id, old_bank_code, new_bank_code, changed_by)
    VALUES ('employees', p_employee_id, v_old_bank_code, p_new_bank_code, p_changed_by);
END;
$$;

-- ------------------------------------------------------------
-- Function: bank_code_stats
-- Returns a summary of employees per bank, formatted for reports.
-- NOTE (MIGRATION): display format LPAD 2 → 3
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION bank_code_stats()
RETURNS TABLE (
    bank_code_display   TEXT,
    bank_name           VARCHAR(100),
    employee_count      BIGINT,
    total_net_salary    NUMERIC(14,2)
)
LANGUAGE sql
AS $$
    SELECT
        -- TODO (MIGRATION): LPAD 2 → 3
        LPAD(e.bank_code, 2, '0')   AS bank_code_display,
        bc.bank_name,
        COUNT(e.employee_id)         AS employee_count,
        COALESCE(SUM(pe.net_salary), 0) AS total_net_salary
    FROM employees e
    JOIN bank_codes bc ON bc.bank_code = e.bank_code
    LEFT JOIN payroll_entries pe ON pe.employee_id = e.employee_id
    WHERE e.active = TRUE
    GROUP BY e.bank_code, bc.bank_name
    ORDER BY employee_count DESC;
$$;
