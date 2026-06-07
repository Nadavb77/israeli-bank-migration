-- ============================================================
-- Bank Code Migration: Zero-pad all existing 2-digit bank codes to 3 digits
-- ============================================================

-- Zero-pad all existing 2-digit bank codes to 3 digits
UPDATE bank_codes  SET bank_code   = LPAD(bank_code, 3, '0');
UPDATE employees   SET bank_code   = LPAD(bank_code, 3, '0');
UPDATE payroll_entries SET bank_code = LPAD(bank_code, 3, '0');
UPDATE bank_code_audit 
  SET old_bank_code = LPAD(old_bank_code, 3, '0'),
      new_bank_code = LPAD(new_bank_code, 3, '0');
