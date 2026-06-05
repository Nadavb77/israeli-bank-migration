// ============================================================
// Israeli Payroll System — Bank Validator Tests
// POST-MIGRATION: tests written to PASS with 3-digit bank codes
// ============================================================

import {
  normalizeBankCode,
  validateBankCode,
  validateBankAccount,
  validateBankCodeOnly,
  formatBankCode,
} from '../src/validators/bankValidator';
import { VALID_BANK_CODES, isBankCode } from '../src/models/BankCode';
import { BANK_CODE_LENGTH } from '../src/config/constants';

// ============================================================
// normalizeBankCode
// ============================================================

describe('normalizeBankCode', () => {
  it('zero-pads a 2-digit code to 3 characters', () => {
    expect(normalizeBankCode('10')).toBe('010');
  });

  it('zero-pads a single digit to 3 characters', () => {
    expect(normalizeBankCode('4')).toBe('004');
  });

  it('strips surrounding whitespace before padding', () => {
    expect(normalizeBankCode('  12  ')).toBe('012');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeBankCode('')).toBe('');
  });

  it('returns a 3-digit code unchanged', () => {
    expect(normalizeBankCode('012')).toBe('012');
  });
});

// ============================================================
// BANK_CODE_LENGTH constant
// ============================================================

describe('BANK_CODE_LENGTH constant', () => {
  it('is 3 (POST-MIGRATION)', () => {
    expect(BANK_CODE_LENGTH).toBe(3);
  });
});

// ============================================================
// VALID_BANK_CODES
// ============================================================

describe('VALID_BANK_CODES', () => {
  it('contains 14 entries', () => {
    expect(VALID_BANK_CODES.length).toBe(14);
  });

  it('all codes are exactly 3 characters long (POST-MIGRATION)', () => {
    VALID_BANK_CODES.forEach(code => {
      expect(code).toHaveLength(3);
    });
  });

  it('contains Bank Leumi as "010" (POST-MIGRATION)', () => {
    expect(VALID_BANK_CODES).toContain('010');
  });

  it('contains Bank Hapoalim as "012" (POST-MIGRATION)', () => {
    expect(VALID_BANK_CODES).toContain('012');
  });

  it('contains Mizrahi-Tefahot as "020" (POST-MIGRATION)', () => {
    expect(VALID_BANK_CODES).toContain('020');
  });

  it('DOES contain 3-digit code "010" (POST-MIGRATION)', () => {
    expect(VALID_BANK_CODES).toContain('010');
  });

  it('DOES contain 3-digit code "012" (POST-MIGRATION)', () => {
    expect(VALID_BANK_CODES).toContain('012');
  });
});

// ============================================================
// isBankCode type guard
// ============================================================

describe('isBankCode', () => {
  it('returns true for a valid 3-digit code (POST-MIGRATION)', () => {
    expect(isBankCode('010')).toBe(true);
  });

  it('returns false for a 2-digit code (POST-MIGRATION)', () => {
    expect(isBankCode('10')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isBankCode('')).toBe(false);
  });

  it('returns false for an unknown code', () => {
    expect(isBankCode('099')).toBe(false);
  });
});

// ============================================================
// validateBankCode
// ============================================================

describe('validateBankCode', () => {
  it('accepts a valid 3-digit code (POST-MIGRATION)', () => {
    const result = validateBankCode('010');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.normalizedCode).toBe('010');
  });

  it('zero-pads single digit and accepts if valid (POST-MIGRATION)', () => {
    // '4' pads to '004' which is Bank Yahav — valid
    const result = validateBankCode('4');
    expect(result.valid).toBe(true);
    expect(result.normalizedCode).toBe('004');
  });

  it('accepts a 3-digit code POST-MIGRATION', () => {
    // '010' is 3 digits — passes the /^\d{3}$/ regex
    const result = validateBankCode('010');
    expect(result.valid).toBe(true);
    expect(result.normalizedCode).toBe('010');
  });

  it('rejects an empty string', () => {
    const result = validateBankCode('');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/required/i);
  });

  it('rejects a non-numeric code', () => {
    const result = validateBankCode('AB');
    expect(result.valid).toBe(false);
  });

  it('rejects an unknown 3-digit code (POST-MIGRATION)', () => {
    // '099' is 3 digits but not a real BOI code
    const result = validateBankCode('099');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/not recognized/i);
  });

  it('rejects whitespace-only input', () => {
    const result = validateBankCode('   ');
    expect(result.valid).toBe(false);
  });
});

// ============================================================
// validateBankAccount
// ============================================================

describe('validateBankAccount', () => {
  it('accepts a complete valid bank account (POST-MIGRATION)', () => {
    const result = validateBankAccount('012', '123', '1234567');
    expect(result.valid).toBe(true);
    expect(result.normalized?.bankCode).toBe('012');
    expect(result.normalized?.branchNumber).toBe('123');
    expect(result.normalized?.accountNumber).toBe('1234567');
  });

  it('accepts a 3-digit bank code POST-MIGRATION', () => {
    const result = validateBankAccount('012', '123', '1234567');
    expect(result.valid).toBe(true);
  });

  it('rejects an invalid branch (not 3 digits)', () => {
    const result = validateBankAccount('012', '12', '1234567');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /branch/i.test(e))).toBe(true);
  });

  it('rejects an account number that is too short', () => {
    const result = validateBankAccount('012', '123', '12345');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /account/i.test(e))).toBe(true);
  });

  it('rejects an account number that is too long', () => {
    const result = validateBankAccount('012', '123', '12345678901234');
    expect(result.valid).toBe(false);
  });

  it('accumulates multiple errors', () => {
    const result = validateBankAccount('', '', '');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

// ============================================================
// formatBankCode
// ============================================================

describe('formatBankCode', () => {
  it('pads a single-char code to 3 digits (POST-MIGRATION)', () => {
    expect(formatBankCode('4')).toBe('004');
  });

  it('pads a 2-digit code to 3 digits (POST-MIGRATION)', () => {
    expect(formatBankCode('10')).toBe('010');
  });

  it('leaves a 3-digit code unchanged (POST-MIGRATION)', () => {
    expect(formatBankCode('010')).toBe('010');
  });
});

// ============================================================
// validateBankCodeOnly (field-level validator)
// ============================================================

describe('validateBankCodeOnly', () => {
  it('returns null (no error) for a valid 3-digit code (POST-MIGRATION)', () => {
    expect(validateBankCodeOnly('020')).toBeNull();
  });

  it('returns null for a 3-digit code (POST-MIGRATION)', () => {
    expect(validateBankCodeOnly('020')).toBeNull();
  });

  it('returns required error for empty input', () => {
    expect(validateBankCodeOnly('')).toMatch(/required/i);
  });

  it('returns unknown error for an invalid code', () => {
    expect(validateBankCodeOnly('055')).toMatch(/not recognized/i);
  });
});
