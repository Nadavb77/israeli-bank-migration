// ============================================================
// Israeli Payroll System — Bank Account Validator
// Bank of Israel bank codes: 3-digit format (POST-MIGRATION)
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
 * Normalize a raw bank code input to the canonical 3-digit format.
 * Strips whitespace, then zero-pads to 3 characters.
 *
 * @example
 *   normalizeBankCode('10')  // → '010'
 *   normalizeBankCode(' 10 ') // → '010'
 *   normalizeBankCode('4')   // → '004'
 */
export function normalizeBankCode(raw: string): string {
  if (!raw) return '';
  return raw.trim().padStart(3, '0');
}

/**
 * Validate a single bank code string.
 *
 * Rules:
 * 1. Must not be empty
 * 2. After normalization, must match /^\d{3}$/ (exactly 3 digits)
 * 3. Must be a known BOI bank code
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

  // Format check: must be exactly 3 digits
  if (!BANK_CODE_REGEX.test(normalized)) {
    errors.push(ERROR_MESSAGES.INVALID_BANK_CODE_FORMAT);
    return { valid: false, errors };
  }

  // Length double-check (defensive guard)
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
      bankCode:      normalizeBankCode(rawBankCode),
      branchNumber:  branchNumber.trim(),
      accountNumber: accountNumber.trim(),
    },
  };
}

/**
 * Validate bank code only (no branch/account).
 * Thin wrapper used in form field-level validation.
 */
export function validateBankCodeOnly(raw: string): string | null {
  if (!raw || raw.trim() === '') {
    return ERROR_MESSAGES.BANK_CODE_REQUIRED;
  }
  const normalized = raw.trim().padStart(3, '0');
  if (!/^\d{3}$/.test(normalized)) {
    return ERROR_MESSAGES.INVALID_BANK_CODE_FORMAT;
  }
  if (!isBankCode(normalized)) {
    return ERROR_MESSAGES.UNKNOWN_BANK_CODE;
  }
  return null; // no error
}

/**
 * Format a bank code for display: always shows full padded digits.
 */
export function formatBankCode(code: string): string {
  return code.padStart(3, '0');
}

/**
 * Returns a list of all valid bank codes for dropdown menus.
 */
export function getValidBankCodes(): readonly BankCode[] {
  return VALID_BANK_CODES;
}
