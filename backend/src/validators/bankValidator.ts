// ============================================================
// Israeli Payroll System — Bank Account Validator
// Bank of Israel bank codes: 2-digit format (PRE-MIGRATION)
// ============================================================

import { BankCode, VALID_BANK_CODES, isBankCode } from '../models/BankCode';
import {
  BANK_CODE_LENGTH,
  BANK_CODE_REGEX,
  BRANCH_CODE_LENGTH,
  ERROR_MESSAGES,
} from '../config/constants';

export interface ValidationResult {
  valid:   boolean;
  errors:  string[];
  normalized?: {
    bankCode:      string;
    branchNumber:  string;
    accountNumber: string;
  };
}

/**
 * Normalize a raw bank code input to the canonical 2-digit format.
 * Strips whitespace, then zero-pads to 2 characters.
 *
 * TODO (MIGRATION): change padStart(2, '0') → padStart(3, '0')
 *
 * @example
 *   normalizeBankCode('10')  // → '10'
 *   normalizeBankCode(' 10 ') // → '10'
 *   normalizeBankCode('4')   // → '04'   (zero-padded)
 */
export function normalizeBankCode(raw: string): string {
  if (!raw) return '';
  // TODO (MIGRATION): padStart(2, '0') → padStart(3, '0')
  return raw.trim().padStart(2, '0');
}

/**
 * Validate a single bank code string.
 *
 * Rules:
 * 1. Must not be empty
 * 2. After normalization, must match /^\d{2}$/ (exactly 2 digits)
 * 3. Must be a known BOI bank code
 *
 * TODO (MIGRATION):
 *  - Step 2 regex: /^\d{2}$/ → /^\d{3}$/
 *  - BANK_CODE_LENGTH check: 2 → 3 (already driven by constant, but verify)
 *
 * @returns { valid, errors, normalizedCode }
 */
export function validateBankCode(raw: string): {
  valid: boolean;
  errors: string[];
  normalizedCode?: BankCode;
} {
  const errors: string[] = [];

  if (!raw || raw.trim() === '') {
    return { valid: false, errors: [ERROR_MESSAGES.BANK_CODE_REQUIRED] };
  }

  const normalized = normalizeBankCode(raw);

  // Format check: must be exactly 2 digits
  // TODO (MIGRATION): update regex to /^\d{3}$/
  if (!BANK_CODE_REGEX.test(normalized)) {
    errors.push(ERROR_MESSAGES.INVALID_BANK_CODE_FORMAT);
    return { valid: false, errors };
  }

  // Length double-check (defensive guard)
  // TODO (MIGRATION): BANK_CODE_LENGTH is 2 — will become 3 after constant update
  if (normalized.length !== BANK_CODE_LENGTH) {
    errors.push(ERROR_MESSAGES.INVALID_BANK_CODE_LENGTH);
    return { valid: false, errors };
  }

  // Known code check
  if (!isBankCode(normalized)) {
    errors.push(`${ERROR_MESSAGES.UNKNOWN_BANK_CODE}: "${normalized}"`);
    return { valid: false, errors };
  }

  return { valid: true, errors: [], normalizedCode: normalized };
}

/**
 * Validate a complete bank account (bank code + branch + account number).
 *
 * TODO (MIGRATION): after updating validateBankCode, this function will
 * automatically handle 3-digit codes if the regex and constant are updated.
 */
export function validateBankAccount(
  rawBankCode:    string,
  branchNumber:   string,
  accountNumber:  string,
): ValidationResult {
  const errors: string[] = [];

  // --- Bank code ---
  const bankResult = validateBankCode(rawBankCode);
  if (!bankResult.valid) {
    errors.push(...bankResult.errors);
  }

  // --- Branch number ---
  // Branch is always 3 digits — does NOT change with this migration
  if (!branchNumber || !/^\d{3}$/.test(branchNumber.trim())) {
    errors.push('Branch number must be exactly 3 digits');
  }

  // --- Account number ---
  if (!accountNumber || !/^\d{6,13}$/.test(accountNumber.trim())) {
    errors.push('Account number must be 6 to 13 digits');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    normalized: {
      // TODO (MIGRATION): normalizeBankCode returns 2-char → will return 3-char after update
      bankCode:      normalizeBankCode(rawBankCode),
      branchNumber:  branchNumber.trim(),
      accountNumber: accountNumber.trim(),
    },
  };
}

/**
 * Validate bank code only (no branch/account).
 * Thin wrapper used in form field-level validation.
 *
 * TODO (MIGRATION): regex literal here must also change
 */
export function validateBankCodeOnly(raw: string): string | null {
  if (!raw || raw.trim() === '') {
    return ERROR_MESSAGES.BANK_CODE_REQUIRED;
  }
  const normalized = raw.trim().padStart(2, '0');  // TODO (MIGRATION): padStart(3, '0')
  // TODO (MIGRATION): /^\d{2}$/ → /^\d{3}$/
  if (!/^\d{2}$/.test(normalized)) {
    return ERROR_MESSAGES.INVALID_BANK_CODE_FORMAT;
  }
  if (!isBankCode(normalized)) {
    return ERROR_MESSAGES.UNKNOWN_BANK_CODE;
  }
  return null; // no error
}

/**
 * Format a bank code for display: always shows full padded digits.
 * TODO (MIGRATION): padStart(2, '0') → padStart(3, '0')
 */
export function formatBankCode(code: string): string {
  return code.padStart(2, '0');  // TODO (MIGRATION)
}

/**
 * Returns a list of all valid bank codes for dropdown menus.
 * TODO (MIGRATION): VALID_BANK_CODES already drives this — updating the array is enough
 */
export function getValidBankCodes(): readonly BankCode[] {
  return VALID_BANK_CODES;
}
