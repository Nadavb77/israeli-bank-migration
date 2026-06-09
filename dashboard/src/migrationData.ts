/**
 * Migration items data — every location in the codebase where a 2-digit
 * bank code assumption is hardcoded. Each item can be toggled between
 * "pending" and "fixed" to track migration progress.
 */

export type MigrationStatus = 'pending' | 'fixed';

export type Layer = 'DB' | 'Backend' | 'Frontend' | 'Scripts' | 'Config';

export interface MigrationItem {
  id: string;
  layer: Layer;
  file: string;
  line: number;
  description: string;
  category: string;
  status: MigrationStatus;
}

export const migrationItems: MigrationItem[] = [
  // ─── DB: db/schema.sql ─────────────────────────────────────────────
  { id: 'db-schema-1', layer: 'DB', file: 'db/schema.sql', line: 14, description: 'bank_codes.bank_code column: CHAR(2) → CHAR(3)', category: 'Column Type', status: 'pending' },
  { id: 'db-schema-2', layer: 'DB', file: 'db/schema.sql', line: 22, description: 'bank_codes CHECK constraint: ^[0-9]{2}$ → {3}', category: 'CHECK Constraint', status: 'pending' },
  { id: 'db-schema-3', layer: 'DB', file: 'db/schema.sql', line: 27, description: 'Seed INSERT: 14 bank code values (04,10,11…90) → zero-pad to 3 digits', category: 'Seed Data', status: 'pending' },
  { id: 'db-schema-4', layer: 'DB', file: 'db/schema.sql', line: 50, description: 'employees.bank_code column: CHAR(2) → CHAR(3)', category: 'Column Type', status: 'pending' },
  { id: 'db-schema-5', layer: 'DB', file: 'db/schema.sql', line: 63, description: 'employees CHECK constraint: ^[0-9]{2}$ → {3}', category: 'CHECK Constraint', status: 'pending' },
  { id: 'db-schema-6', layer: 'DB', file: 'db/schema.sql', line: 98, description: 'payroll_entries.bank_code column: CHAR(2) → CHAR(3)', category: 'Column Type', status: 'pending' },
  { id: 'db-schema-7', layer: 'DB', file: 'db/schema.sql', line: 114, description: 'payroll_entries CHECK constraint: ^[0-9]{2}$ → {3}', category: 'CHECK Constraint', status: 'pending' },
  { id: 'db-schema-8', layer: 'DB', file: 'db/schema.sql', line: 125, description: 'bank_code_audit.old_bank_code: CHAR(2) → CHAR(3)', category: 'Column Type', status: 'pending' },
  { id: 'db-schema-9', layer: 'DB', file: 'db/schema.sql', line: 126, description: 'bank_code_audit.new_bank_code: CHAR(2) → CHAR(3)', category: 'Column Type', status: 'pending' },
  { id: 'db-schema-10', layer: 'DB', file: 'db/schema.sql', line: 144, description: 'v_payroll_summary view: LPAD(pe.bank_code, 2) → 3', category: 'View/LPAD', status: 'pending' },
  { id: 'db-schema-11', layer: 'DB', file: 'db/schema.sql', line: 169, description: 'v_employee_bank_details view: LPAD(e.bank_code, 2) → 3', category: 'View/LPAD', status: 'pending' },

  // ─── DB: db/stored_procedures.sql ──────────────────────────────────
  { id: 'db-sp-1', layer: 'DB', file: 'db/stored_procedures.sql', line: 12, description: 'normalize_bank_code RETURNS CHAR(2) → CHAR(3)', category: 'Return Type', status: 'pending' },
  { id: 'db-sp-2', layer: 'DB', file: 'db/stored_procedures.sql', line: 16, description: 'normalized variable: CHAR(2) → CHAR(3)', category: 'Variable Type', status: 'pending' },
  { id: 'db-sp-3', layer: 'DB', file: 'db/stored_procedures.sql', line: 24, description: 'LPAD(TRIM(raw_code), 2, \'0\') → 3', category: 'LPAD', status: 'pending' },
  { id: 'db-sp-4', layer: 'DB', file: 'db/stored_procedures.sql', line: 28, description: 'Regex validation: ^[0-9]{2}$ → {3}', category: 'Regex', status: 'pending' },
  { id: 'db-sp-5', layer: 'DB', file: 'db/stored_procedures.sql', line: 29, description: 'Error message: "Expected 2-digit" → "3-digit"', category: 'Error Message', status: 'pending' },
  { id: 'db-sp-6', layer: 'DB', file: 'db/stored_procedures.sql', line: 55, description: 'validate_bank_account v_bank: CHAR(2) → CHAR(3)', category: 'Variable Type', status: 'pending' },
  { id: 'db-sp-7', layer: 'DB', file: 'db/stored_procedures.sql', line: 82, description: 'create_payroll_entry p_bank_code: CHAR(2) → CHAR(3)', category: 'Param Type', status: 'pending' },
  { id: 'db-sp-8', layer: 'DB', file: 'db/stored_procedures.sql', line: 128, description: 'get_entries_by_bank p_bank_code: CHAR(2) → CHAR(3)', category: 'Param Type', status: 'pending' },
  { id: 'db-sp-9', layer: 'DB', file: 'db/stored_procedures.sql', line: 142, description: 'Length check: length != 2 → != 3; regex {2} → {3}', category: 'Validation Logic', status: 'pending' },
  { id: 'db-sp-10', layer: 'DB', file: 'db/stored_procedures.sql', line: 143, description: 'Error message: "exactly 2 digits" → "3 digits"', category: 'Error Message', status: 'pending' },
  { id: 'db-sp-11', layer: 'DB', file: 'db/stored_procedures.sql', line: 167, description: 'update_employee_bank_details p_new_bank_code: CHAR(2) → CHAR(3)', category: 'Param Type', status: 'pending' },
  { id: 'db-sp-12', layer: 'DB', file: 'db/stored_procedures.sql', line: 176, description: 'v_old_bank_code variable: CHAR(2) → CHAR(3)', category: 'Variable Type', status: 'pending' },
  { id: 'db-sp-13', layer: 'DB', file: 'db/stored_procedures.sql', line: 220, description: 'bank_code_stats: LPAD(e.bank_code, 2) → 3', category: 'LPAD', status: 'pending' },

  // ─── Backend: config/constants.ts ──────────────────────────────────
  { id: 'be-const-1', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 10, description: 'BANK_CODE_LENGTH = 2 → 3', category: 'Constant', status: 'pending' },
  { id: 'be-const-2', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 17, description: 'BANK_CODE_REGEX = /^\\d{2}$/ → /^\\d{3}$/', category: 'Regex Constant', status: 'pending' },
  { id: 'be-const-3', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 23, description: 'BANK_CODE_INPUT_REGEX: {1,2} → {1,3}', category: 'Regex Constant', status: 'pending' },
  { id: 'be-const-4', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 42, description: 'MASAV_BANK_CODE_END = 5 → 6', category: 'MASAV Offset', status: 'pending' },
  { id: 'be-const-5', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 43, description: 'MASAV_BRANCH_OFFSET = 5 → 6', category: 'MASAV Offset', status: 'pending' },
  { id: 'be-const-6', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 44, description: 'MASAV_BRANCH_END = 8 → 9', category: 'MASAV Offset', status: 'pending' },
  { id: 'be-const-7', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 45, description: 'MASAV_ACCOUNT_OFFSET = 8 → 9', category: 'MASAV Offset', status: 'pending' },
  { id: 'be-const-8', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 46, description: 'MASAV_ACCOUNT_END = 21 → 22', category: 'MASAV Offset', status: 'pending' },
  { id: 'be-const-9', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 47, description: 'MASAV_AMOUNT_OFFSET = 21 → 22', category: 'MASAV Offset', status: 'pending' },
  { id: 'be-const-10', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 48, description: 'MASAV_AMOUNT_END = 30 → 31', category: 'MASAV Offset', status: 'pending' },
  { id: 'be-const-11', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 49, description: 'MASAV_NAME_OFFSET = 30 → 31', category: 'MASAV Offset', status: 'pending' },
  { id: 'be-const-12', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 50, description: 'MASAV_NAME_END = 46 → 47', category: 'MASAV Offset', status: 'pending' },
  { id: 'be-const-13', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 56, description: 'MASAV_RECORD_LENGTH = 96 → 97', category: 'MASAV Offset', status: 'pending' },
  { id: 'be-const-14', layer: 'Backend', file: 'backend/src/config/constants.ts', line: 63, description: 'BANK_CODE_DISPLAY_WIDTH = 2 → 3', category: 'Constant', status: 'pending' },

  // ─── Backend: models/BankCode.ts ───────────────────────────────────
  { id: 'be-model-1', layer: 'Backend', file: 'backend/src/models/BankCode.ts', line: 16, description: 'BankCode union type: 14 × 2-char literals → 3-char', category: 'Type Definition', status: 'pending' },
  { id: 'be-model-2', layer: 'Backend', file: 'backend/src/models/BankCode.ts', line: 37, description: 'VALID_BANK_CODES array: 14 × 2-digit strings → 3-digit', category: 'Constant Array', status: 'pending' },
  { id: 'be-model-3', layer: 'Backend', file: 'backend/src/models/BankCode.ts', line: 46, description: 'BANK_CODE_LABELS: 14 × 2-digit keys → 3-digit', category: 'Lookup Map', status: 'pending' },
  { id: 'be-model-4', layer: 'Backend', file: 'backend/src/models/BankCode.ts', line: 67, description: 'BANK_SWIFT_CODES: 10 × 2-digit keys → 3-digit', category: 'Lookup Map', status: 'pending' },

  // ─── Backend: validators/bankValidator.ts ──────────────────────────
  { id: 'be-val-1', layer: 'Backend', file: 'backend/src/validators/bankValidator.ts', line: 38, description: 'normalizeBankCode: padStart(2, \'0\') → padStart(3, \'0\')', category: 'Padding Logic', status: 'pending' },
  { id: 'be-val-2', layer: 'Backend', file: 'backend/src/validators/bankValidator.ts', line: 147, description: 'validateBankCodeOnly: padStart(2, \'0\') → padStart(3, \'0\')', category: 'Padding Logic', status: 'pending' },
  { id: 'be-val-3', layer: 'Backend', file: 'backend/src/validators/bankValidator.ts', line: 149, description: 'validateBankCodeOnly: regex /^\\d{2}$/ → /^\\d{3}$/', category: 'Regex', status: 'pending' },
  { id: 'be-val-4', layer: 'Backend', file: 'backend/src/validators/bankValidator.ts', line: 163, description: 'formatBankCode: padStart(2, \'0\') → padStart(3, \'0\')', category: 'Padding Logic', status: 'pending' },

  // ─── Backend: services/payrollService.ts ───────────────────────────
  { id: 'be-svc-1', layer: 'Backend', file: 'backend/src/services/payrollService.ts', line: 70, description: 'getActiveBankCodes SQL: LPAD(bank_code, 2) → 3', category: 'SQL Query', status: 'pending' },
  { id: 'be-svc-2', layer: 'Backend', file: 'backend/src/services/payrollService.ts', line: 115, description: 'getEmployee SQL: LPAD(bank_code, 2) → 3', category: 'SQL Query', status: 'pending' },
  { id: 'be-svc-3', layer: 'Backend', file: 'backend/src/services/payrollService.ts', line: 259, description: 'getEntriesByBank SQL: LPAD(bank_code, 2) → 3', category: 'SQL Query', status: 'pending' },
  { id: 'be-svc-4', layer: 'Backend', file: 'backend/src/services/payrollService.ts', line: 302, description: 'getAllActiveEmployees SQL: LPAD(bank_code, 2) → 3', category: 'SQL Query', status: 'pending' },

  // ─── Backend: routes/payrollRoutes.ts ──────────────────────────────
  { id: 'be-route-1', layer: 'Backend', file: 'backend/src/routes/payrollRoutes.ts', line: 26, description: 'GET /bank-codes: padStart(2, \'0\') → padStart(3, \'0\')', category: 'Padding Logic', status: 'pending' },
  { id: 'be-route-2', layer: 'Backend', file: 'backend/src/routes/payrollRoutes.ts', line: 85, description: 'GET /employees/:id/bank-account: padStart(2) → 3', category: 'Padding Logic', status: 'pending' },
  { id: 'be-route-3', layer: 'Backend', file: 'backend/src/routes/payrollRoutes.ts', line: 109, description: 'PUT validation: regex /^\\d{1,2}$/ → /^\\d{1,3}$/', category: 'Regex', status: 'pending' },
  { id: 'be-route-4', layer: 'Backend', file: 'backend/src/routes/payrollRoutes.ts', line: 165, description: 'GET /bank-summary: padStart(2, \'0\') → padStart(3, \'0\')', category: 'Padding Logic', status: 'pending' },

  // ─── Backend: tests/bankValidator.test.ts ──────────────────────────
  { id: 'be-test-1', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 28, description: 'normalizeBankCode(\'10\') expects \'10\' → \'010\'', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-2', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 33, description: 'normalizeBankCode(\'4\') expects \'04\' → \'004\'', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-3', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 38, description: 'normalizeBankCode(\'  12  \') expects \'12\' → \'012\'', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-4', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 60, description: 'BANK_CODE_LENGTH expects 2 → 3', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-5', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 75, description: 'All codes toHaveLength(2) → toHaveLength(3)', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-6', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 82, description: 'VALID_BANK_CODES toContain(\'10\') → toContain(\'010\')', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-7', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 87, description: 'VALID_BANK_CODES toContain(\'12\') → toContain(\'012\')', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-8', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 92, description: 'VALID_BANK_CODES toContain(\'20\') → toContain(\'020\')', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-9', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 97, description: 'not.toContain(\'010\') → toContain(\'010\')', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-10', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 102, description: 'not.toContain(\'012\') → toContain(\'012\')', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-11', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 113, description: 'isBankCode(\'10\') → isBankCode(\'010\') is true', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-12', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 118, description: 'isBankCode(\'010\') false → true (invert)', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-13', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 141, description: 'validateBankCode normalizedCode \'10\' → \'010\'', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-14', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 150, description: 'validateBankCode normalizedCode \'04\' → \'004\'', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-15', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 157, description: 'validateBankCode(\'010\') invalid → valid (invert)', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-16', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 192, description: 'validateBankAccount(\'12\',...) → (\'012\',...)', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-17', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 195, description: 'normalized.bankCode \'12\' → \'012\'', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-18', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 203, description: 'validateBankAccount(\'012\',...) invalid → valid (invert)', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-19', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 237, description: 'formatBankCode(\'4\') expects \'04\' → \'004\'', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-20', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 242, description: 'formatBankCode(\'10\') expects \'10\' → \'010\'', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-21', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 259, description: 'validateBankCodeOnly(\'20\') → (\'020\') returns null', category: 'Test Assertion', status: 'pending' },
  { id: 'be-test-22', layer: 'Backend', file: 'backend/tests/bankValidator.test.ts', line: 264, description: 'validateBankCodeOnly(\'020\') not null → null (invert)', category: 'Test Assertion', status: 'pending' },

  // ─── Frontend: PayrollForm.tsx ─────────────────────────────────────
  { id: 'fe-form-1', layer: 'Frontend', file: 'frontend/src/components/PayrollForm.tsx', line: 9, description: 'BANK_CODE_MAX_LENGTH = 2 → 3', category: 'Constant', status: 'pending' },
  { id: 'fe-form-2', layer: 'Frontend', file: 'frontend/src/components/PayrollForm.tsx', line: 10, description: 'BANK_CODE_PLACEHOLDER: \'e.g. 10\' → \'e.g. 010\'', category: 'Constant', status: 'pending' },
  { id: 'fe-form-3', layer: 'Frontend', file: 'frontend/src/components/PayrollForm.tsx', line: 70, description: 'Fallback bank options: 14 × 2-digit bankCode strings → 3-digit', category: 'Hardcoded Data', status: 'pending' },
  { id: 'fe-form-4', layer: 'Frontend', file: 'frontend/src/components/PayrollForm.tsx', line: 98, description: 'validateField regex: /^\\d{2}$/ and padStart(2) → {3} and padStart(3)', category: 'Validation', status: 'pending' },
  { id: 'fe-form-5', layer: 'Frontend', file: 'frontend/src/components/PayrollForm.tsx', line: 100, description: 'Error message: "valid 2-digit BOI code" → "3-digit"', category: 'Error Message', status: 'pending' },
  { id: 'fe-form-6', layer: 'Frontend', file: 'frontend/src/components/PayrollForm.tsx', line: 164, description: 'handleSubmit: padStart(2, \'0\') → padStart(3, \'0\')', category: 'Padding Logic', status: 'pending' },
  { id: 'fe-form-7', layer: 'Frontend', file: 'frontend/src/components/PayrollForm.tsx', line: 166, description: 'handleSubmit: regex /^\\d{2}$/ → /^\\d{3}$/', category: 'Regex', status: 'pending' },
  { id: 'fe-form-8', layer: 'Frontend', file: 'frontend/src/components/PayrollForm.tsx', line: 197, description: 'Label text: "(2-digit BOI code)" → "(3-digit BOI code)"', category: 'UI Label', status: 'pending' },
  { id: 'fe-form-9', layer: 'Frontend', file: 'frontend/src/components/PayrollForm.tsx', line: 213, description: 'Dropdown display: padStart(2, \'0\') → padStart(3, \'0\')', category: 'Padding Logic', status: 'pending' },
  { id: 'fe-form-10', layer: 'Frontend', file: 'frontend/src/components/PayrollForm.tsx', line: 227, description: 'Input maxLength driven by BANK_CODE_MAX_LENGTH (2→3)', category: 'Input Constraint', status: 'pending' },
  { id: 'fe-form-11', layer: 'Frontend', file: 'frontend/src/components/PayrollForm.tsx', line: 229, description: 'Input pattern="\\d{2}" → "\\d{3}"', category: 'Input Pattern', status: 'pending' },

  // ─── Scripts: masav_generator.py ───────────────────────────────────
  { id: 'sc-masav-1', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 53, description: 'BANK_CODE_LEN = 2 → 3', category: 'Constant', status: 'pending' },
  { id: 'sc-masav-2', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 56, description: 'BRANCH_OFFSET = 5 → 6', category: 'Byte Offset', status: 'pending' },
  { id: 'sc-masav-3', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 60, description: 'ACCOUNT_OFFSET = 8 → 9', category: 'Byte Offset', status: 'pending' },
  { id: 'sc-masav-4', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 64, description: 'AMOUNT_OFFSET = 21 → 22', category: 'Byte Offset', status: 'pending' },
  { id: 'sc-masav-5', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 68, description: 'NAME_OFFSET = 30 → 31', category: 'Byte Offset', status: 'pending' },
  { id: 'sc-masav-6', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 72, description: 'REF_OFFSET = 46 → 47', category: 'Byte Offset', status: 'pending' },
  { id: 'sc-masav-7', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 76, description: 'PERIOD_OFFSET = 54 → 55', category: 'Byte Offset', status: 'pending' },
  { id: 'sc-masav-8', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 80, description: 'CURRENCY_OFFSET = 61 → 62', category: 'Byte Offset', status: 'pending' },
  { id: 'sc-masav-9', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 84, description: 'FILLER_OFFSET = 64 → 65', category: 'Byte Offset', status: 'pending' },
  { id: 'sc-masav-10', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 88, description: 'RECORD_LENGTH = 96 → 97', category: 'Constant', status: 'pending' },
  { id: 'sc-masav-11', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 119, description: '_validate_bank_code: zfill(2) → zfill(3)', category: 'Padding Logic', status: 'pending' },
  { id: 'sc-masav-12', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 121, description: '_validate_bank_code: regex r\'^\\d{2}$\' → r\'^\\d{3}$\'', category: 'Regex', status: 'pending' },
  { id: 'sc-masav-13', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 124, description: 'Error message: "2-digit" → "3-digit"', category: 'Error Message', status: 'pending' },
  { id: 'sc-masav-14', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 230, description: 'Header bank_code \'00\' → \'000\' (⚠️ special record-type marker — verify MASAV spec)', category: 'Hardcoded Value', status: 'pending' },
  { id: 'sc-masav-15', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 249, description: 'Trailer bank_code \'99\' → \'099\' (⚠️ special record-type marker — verify MASAV spec)', category: 'Hardcoded Value', status: 'pending' },
  { id: 'sc-masav-16', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 270, description: 'Sample record bank_code \'10\' → \'010\'', category: 'Sample Data', status: 'pending' },
  { id: 'sc-masav-17', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 280, description: 'Sample record bank_code \'12\' → \'012\'', category: 'Sample Data', status: 'pending' },
  { id: 'sc-masav-18', layer: 'Scripts', file: 'scripts/masav_generator.py', line: 290, description: 'Sample record bank_code \'20\' → \'020\'', category: 'Sample Data', status: 'pending' },

  // ─── Scripts: reports.py ───────────────────────────────────────────
  { id: 'sc-rpt-1', layer: 'Scripts', file: 'scripts/reports.py', line: 26, description: 'BANK_CODE_WIDTH = 2 → 3', category: 'Constant', status: 'pending' },
  { id: 'sc-rpt-2', layer: 'Scripts', file: 'scripts/reports.py', line: 78, description: 'report_bank_distribution SQL: LPAD(e.bank_code, 2) → 3', category: 'SQL Query', status: 'pending' },
  { id: 'sc-rpt-3', layer: 'Scripts', file: 'scripts/reports.py', line: 136, description: 'report_payroll_ledger SQL: LPAD(pe.bank_code, 2) → 3', category: 'SQL Query', status: 'pending' },
  { id: 'sc-rpt-4', layer: 'Scripts', file: 'scripts/reports.py', line: 221, description: 'export_csv SQL: LPAD(pe.bank_code, 2) → 3', category: 'SQL Query', status: 'pending' },
  { id: 'sc-rpt-5', layer: 'Scripts', file: 'scripts/reports.py', line: 292, description: 'Validation regex: r\'^\\d{2}$\' → r\'^\\d{3}$\'', category: 'Regex', status: 'pending' },
  { id: 'sc-rpt-6', layer: 'Scripts', file: 'scripts/reports.py', line: 298, description: 'Validation message: format description references "2-digit"', category: 'Error Message', status: 'pending' },

  // ─── Config: bank_codes.json ───────────────────────────────────────
  { id: 'cfg-json-1', layer: 'Config', file: 'config/bank_codes.json', line: 7, description: 'All 14 JSON keys (04,10,11,…90) → zero-pad to 3 digits (004,010,011,…090)', category: 'JSON Keys', status: 'pending' },
];
