// ============================================================
// Israeli Payroll System — Bank Validator Tests
// PRE-MIGRATION: tests written to PASS with 2-digit bank codes
//
// ⚠️  MIGRATION NOTE ⚠️
// After migrating to 3-digit bank codes, EVERY assertion in this
// file that references a specific code string must be updated.
// Search for: // TODO-TEST to find all assertions that need inversion.
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
  it('returns the code unchanged when already 2 digits', () => {
    // TODO-TEST (MIGRATION): change expected from '10' → '010'
    expect(normalizeBankCode('10')).toBe('10');
  });

  it('zero-pads a single digit to 2 characters', () => {
    // TODO-TEST (MIGRATION): change expected from '04' → '004'
    expect(normalizeBankCode('4')).toBe('04');
  });

  it('strips surrounding whitespace before padding', () => {
    // TODO-TEST (MIGRATION): change expected from '12' → '012'
    expect(normalizeBankCode('  12  ')).toBe('12');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeBankCode('')).toBe('');
  });

  it('does NOT truncate a code that is already longer than 2 digits', () => {
    // After migration, '012' (3 digits) should pass through unchanged.
    // PRE-MIGRATION: '012' is longer than BANK_CODE_LENGTH (2) and should fail validation.
    // TODO-TEST (MIGRATION): change to expect(normalizeBankCode('012')).toBe('012')
    expect(normalizeBankCode('012')).toBe('012'); // normalize itself just pads; validation rejects it
  });
});

// ============================================================
// BANK_CODE_LENGTH constant
// ============================================================

describe('BANK_CODE_LENGTH constant', () => {
  it('is 2 (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): change toBe(2) → toBe(3)
    expect(BANK_CODE_LENGTH).toBe(2);
  });
});

// ============================================================
// VALID_BANK_CODES
// ============================================================

describe('VALID_BANK_CODES', () => {
  it('contains 14 entries', () => {
    expect(VALID_BANK_CODES.length).toBe(14);
  });

  it('all codes are exactly 2 characters long (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): change toHaveLength(2) → toHaveLength(3)
    VALID_BANK_CODES.forEach(code => {
      expect(code).toHaveLength(2);
    });
  });

  it('contains Bank Leumi as "10" (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): change '10' → '010'
    expect(VALID_BANK_CODES).toContain('10');
  });

  it('contains Bank Hapoalim as "12" (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): change '12' → '012'
    expect(VALID_BANK_CODES).toContain('12');
  });

  it('contains Mizrahi-Tefahot as "20" (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): change '20' → '020'
    expect(VALID_BANK_CODES).toContain('20');
  });

  it('does NOT contain 3-digit code "010" (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): invert — expect(VALID_BANK_CODES).toContain('010')
    expect(VALID_BANK_CODES).not.toContain('010');
  });

  it('does NOT contain 3-digit code "012" (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): invert — expect(VALID_BANK_CODES).toContain('012')
    expect(VALID_BANK_CODES).not.toContain('012');
  });
});

// ============================================================
// isBankCode type guard
// ============================================================

describe('isBankCode', () => {
  it('returns true for a valid 2-digit code (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): '10' → '010'
    expect(isBankCode('10')).toBe(true);
  });

  it('returns false for a 3-digit code (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): invert — isBankCode('010') should be true
    expect(isBankCode('010')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isBankCode('')).toBe(false);
  });

  it('returns false for an unknown code', () => {
    expect(isBankCode('99')).toBe(false);
  });
});

// ============================================================
// validateBankCode
// ============================================================

describe('validateBankCode', () => {
  it('accepts a valid 2-digit code (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): '10' → '010'
    const result = validateBankCode('10');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    // TODO-TEST (MIGRATION): normalizedCode '10' → '010'
    expect(result.normalizedCode).toBe('10');
  });

  it('zero-pads single digit and accepts if valid (PRE-MIGRATION)', () => {
    // '4' pads to '04' which is Bank Yahav — valid
    // TODO-TEST (MIGRATION): '4' pads to '004' → check against 3-digit lookup
    const result = validateBankCode('4');
    expect(result.valid).toBe(true);
    // TODO-TEST (MIGRATION): '04' → '004'
    expect(result.normalizedCode).toBe('04');
  });

  it('rejects a 3-digit code PRE-MIGRATION', () => {
    // '010' is 3 digits — fails the /^\d{2}$/ regex PRE-MIGRATION
    // TODO-TEST (MIGRATION): invert — '010' should be valid after migration
    const result = validateBankCode('010');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/must be exactly/i);
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

  it('rejects an unknown 2-digit code (PRE-MIGRATION)', () => {
    // '99' is 2 digits but not a real BOI code
    const result = validateBankCode('99');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/unknown/i);
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
  it('accepts a complete valid bank account (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): first arg '12' → '012'
    const result = validateBankAccount('12', '123', '1234567');
    expect(result.valid).toBe(true);
    // TODO-TEST (MIGRATION): normalized.bankCode '12' → '012'
    expect(result.normalized?.bankCode).toBe('12');
    expect(result.normalized?.branchNumber).toBe('123');
    expect(result.normalized?.accountNumber).toBe('1234567');
  });

  it('rejects a 3-digit bank code PRE-MIGRATION', () => {
    // TODO-TEST (MIGRATION): invert — '012' should pass
    const result = validateBankAccount('012', '123', '1234567');
    expect(result.valid).toBe(false);
  });

  it('rejects an invalid branch (not 3 digits)', () => {
    const result = validateBankAccount('12', '12', '1234567');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /branch/i.test(e))).toBe(true);
  });

  it('rejects an account number that is too short', () => {
    const result = validateBankAccount('12', '123', '12345');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /account/i.test(e))).toBe(true);
  });

  it('rejects an account number that is too long', () => {
    const result = validateBankAccount('12', '123', '12345678901234');
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
  it('pads a single-char code to 2 digits (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): '04' → '004'
    expect(formatBankCode('4')).toBe('04');
  });

  it('leaves a 2-digit code unchanged (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): '10' → '010'
    expect(formatBankCode('10')).toBe('10');
  });

  it('does NOT truncate a 3-digit code (PRE-MIGRATION)', () => {
    // PRE-MIGRATION formatBankCode pads to 2 — '010' stays '010' (already longer)
    // TODO-TEST (MIGRATION): this test should pass naturally since '010' pads to '010'
    expect(formatBankCode('010')).toBe('010');
  });
});

// ============================================================
// validateBankCodeOnly (field-level validator)
// ============================================================

describe('validateBankCodeOnly', () => {
  it('returns null (no error) for a valid 2-digit code (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): '20' → '020'
    expect(validateBankCodeOnly('20')).toBeNull();
  });

  it('returns an error for a 3-digit code (PRE-MIGRATION)', () => {
    // TODO-TEST (MIGRATION): invert — '020' should return null
    expect(validateBankCodeOnly('020')).not.toBeNull();
  });

  it('returns required error for empty input', () => {
    expect(validateBankCodeOnly('')).toMatch(/required/i);
  });

  it('returns unknown error for an invalid code', () => {
    expect(validateBankCodeOnly('55')).toMatch(/unknown/i);
  });
});
