// ============================================================
// Israeli Payroll System — Transfer Tests (3-Digit Initiative)
// Tests money transfers between accounts using old (2-digit)
// and new (3-digit) bank code formats, verifying normalization
// handles all combinations correctly.
// ============================================================

import {
  normalizeBankCode,
  validateBankCode,
  validateBankAccount,
  formatBankCode,
} from '../src/validators/bankValidator';
import { VALID_BANK_CODES, isBankCode, BankCode, BANK_CODE_LABELS } from '../src/models/BankCode';
import { BANK_CODE_LENGTH } from '../src/config/constants';

// ============================================================
// Test Helpers — simulate transfer account pairs
// ============================================================

interface TransferAccount {
  bankCode:      string;
  branchNumber:  string;
  accountNumber: string;
  label?:        string;
}

interface TransferResult {
  valid:         boolean;
  senderNormalized:   string;
  receiverNormalized: string;
  sameBank:      boolean;
  errors:        string[];
}

/**
 * Simulates validating a transfer between two accounts.
 * Both sender and receiver bank codes are normalized to 3-digit format.
 */
function validateTransfer(sender: TransferAccount, receiver: TransferAccount): TransferResult {
  const errors: string[] = [];

  const senderValidation = validateBankAccount(sender.bankCode, sender.branchNumber, sender.accountNumber);
  if (!senderValidation.valid) {
    errors.push(...senderValidation.errors.map(e => `Sender: ${e}`));
  }

  const receiverValidation = validateBankAccount(receiver.bankCode, receiver.branchNumber, receiver.accountNumber);
  if (!receiverValidation.valid) {
    errors.push(...receiverValidation.errors.map(e => `Receiver: ${e}`));
  }

  const senderNormalized = normalizeBankCode(sender.bankCode);
  const receiverNormalized = normalizeBankCode(receiver.bankCode);

  return {
    valid: errors.length === 0,
    senderNormalized,
    receiverNormalized,
    sameBank: senderNormalized === receiverNormalized,
    errors,
  };
}

// ============================================================
// Transfer between NEW (3-digit) accounts
// ============================================================

describe('Transfer between new 3-digit accounts', () => {
  it('validates transfer from Bank Leumi (010) to Bank Hapoalim (012)', () => {
    const result = validateTransfer(
      { bankCode: '010', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '012', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('010');
    expect(result.receiverNormalized).toBe('012');
    expect(result.sameBank).toBe(false);
  });

  it('validates same-bank transfer within Bank Hapoalim (012)', () => {
    const result = validateTransfer(
      { bankCode: '012', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '012', branchNumber: '300', accountNumber: '9876543' },
    );
    expect(result.valid).toBe(true);
    expect(result.sameBank).toBe(true);
  });

  it('validates transfer from Mizrahi-Tefahot (020) to Israel Post Bank (090)', () => {
    const result = validateTransfer(
      { bankCode: '020', branchNumber: '450', accountNumber: '1122334455' },
      { bankCode: '090', branchNumber: '001', accountNumber: '998877' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('020');
    expect(result.receiverNormalized).toBe('090');
  });

  it('validates transfer from Bank Yahav (004) to Discount Bank (011)', () => {
    const result = validateTransfer(
      { bankCode: '004', branchNumber: '010', accountNumber: '123456' },
      { bankCode: '011', branchNumber: '020', accountNumber: '654321' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('004');
    expect(result.receiverNormalized).toBe('011');
  });
});

// ============================================================
// Transfer between OLD (2-digit) accounts — normalization
// ============================================================

describe('Transfer between old 2-digit accounts (normalization)', () => {
  it('normalizes 2-digit "10" to "010" and "12" to "012" for cross-bank transfer', () => {
    const result = validateTransfer(
      { bankCode: '10', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '12', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('010');
    expect(result.receiverNormalized).toBe('012');
  });

  it('normalizes single-digit "4" to "004" for Bank Yahav', () => {
    const result = validateTransfer(
      { bankCode: '4', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '20', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('004');
    expect(result.receiverNormalized).toBe('020');
  });

  it('normalizes same-bank old format "12" to "012" and detects same-bank', () => {
    const result = validateTransfer(
      { bankCode: '12', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '12', branchNumber: '300', accountNumber: '9876543' },
    );
    expect(result.valid).toBe(true);
    expect(result.sameBank).toBe(true);
    expect(result.senderNormalized).toBe('012');
    expect(result.receiverNormalized).toBe('012');
  });

  it('normalizes "90" to "090" for Israel Post Bank transfer', () => {
    const result = validateTransfer(
      { bankCode: '90', branchNumber: '001', accountNumber: '998877' },
      { bankCode: '31', branchNumber: '050', accountNumber: '1122334' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('090');
    expect(result.receiverNormalized).toBe('031');
  });

  it('normalizes all 14 old-format codes to valid 3-digit codes', () => {
    const oldCodes = ['04', '10', '11', '12', '13', '14', '17', '20', '26', '31', '34', '46', '52', '90'];
    const expectedNew = ['004', '010', '011', '012', '013', '014', '017', '020', '026', '031', '034', '046', '052', '090'];

    oldCodes.forEach((oldCode, i) => {
      const normalized = normalizeBankCode(oldCode);
      expect(normalized).toBe(expectedNew[i]);
      expect(isBankCode(normalized)).toBe(true);
    });
  });
});

// ============================================================
// MIXED transfers — sender old format, receiver new format
// ============================================================

describe('Mixed transfers: sender old (2-digit), receiver new (3-digit)', () => {
  it('sender "10" (old) → receiver "012" (new): normalizes sender to "010"', () => {
    const result = validateTransfer(
      { bankCode: '10', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '012', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('010');
    expect(result.receiverNormalized).toBe('012');
    expect(result.sameBank).toBe(false);
  });

  it('sender "4" (old single-digit) → receiver "020" (new): normalizes to "004"', () => {
    const result = validateTransfer(
      { bankCode: '4', branchNumber: '555', accountNumber: '9988776' },
      { bankCode: '020', branchNumber: '450', accountNumber: '1122334455' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('004');
    expect(result.receiverNormalized).toBe('020');
  });

  it('sender "52" (old) → receiver "090" (new): cross-bank transfer succeeds', () => {
    const result = validateTransfer(
      { bankCode: '52', branchNumber: '001', accountNumber: '123456' },
      { bankCode: '090', branchNumber: '002', accountNumber: '654321' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('052');
    expect(result.receiverNormalized).toBe('090');
  });

  it('sender "12" (old) and receiver "012" (new) are detected as same bank', () => {
    const result = validateTransfer(
      { bankCode: '12', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '012', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(true);
    expect(result.sameBank).toBe(true);
  });
});

// ============================================================
// MIXED transfers — sender new format, receiver old format
// ============================================================

describe('Mixed transfers: sender new (3-digit), receiver old (2-digit)', () => {
  it('sender "010" (new) → receiver "12" (old): normalizes receiver to "012"', () => {
    const result = validateTransfer(
      { bankCode: '010', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '12', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('010');
    expect(result.receiverNormalized).toBe('012');
  });

  it('sender "020" (new) → receiver "90" (old): both normalize correctly', () => {
    const result = validateTransfer(
      { bankCode: '020', branchNumber: '300', accountNumber: '5566778' },
      { bankCode: '90', branchNumber: '001', accountNumber: '112233' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('020');
    expect(result.receiverNormalized).toBe('090');
  });

  it('sender "004" (new) → receiver "17" (old): normalizes receiver to "017"', () => {
    const result = validateTransfer(
      { bankCode: '004', branchNumber: '010', accountNumber: '123456' },
      { bankCode: '17', branchNumber: '025', accountNumber: '987654' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('004');
    expect(result.receiverNormalized).toBe('017');
  });

  it('sender "031" (new) and receiver "31" (old) are same bank', () => {
    const result = validateTransfer(
      { bankCode: '031', branchNumber: '001', accountNumber: '1234567' },
      { bankCode: '31', branchNumber: '002', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(true);
    expect(result.sameBank).toBe(true);
  });
});

// ============================================================
// Transfer with whitespace in bank codes
// ============================================================

describe('Transfer with whitespace-padded bank codes', () => {
  it('strips whitespace from sender " 10 " before normalizing', () => {
    const result = validateTransfer(
      { bankCode: ' 10 ', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '012', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('010');
  });

  it('strips whitespace from receiver "  12  " before normalizing', () => {
    const result = validateTransfer(
      { bankCode: '010', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '  12  ', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(true);
    expect(result.receiverNormalized).toBe('012');
  });

  it('handles both sender and receiver with whitespace', () => {
    const result = validateTransfer(
      { bankCode: '  4 ', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: ' 90  ', branchNumber: '001', accountNumber: '998877' },
    );
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('004');
    expect(result.receiverNormalized).toBe('090');
  });
});

// ============================================================
// Transfer failure cases — invalid bank codes
// ============================================================

describe('Transfer with invalid bank codes', () => {
  it('rejects transfer when sender has unknown code "099"', () => {
    const result = validateTransfer(
      { bankCode: '099', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '012', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /Sender/i.test(e))).toBe(true);
  });

  it('rejects transfer when receiver has unknown code "55"', () => {
    const result = validateTransfer(
      { bankCode: '010', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '55', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /Receiver/i.test(e))).toBe(true);
  });

  it('rejects transfer when both codes are invalid', () => {
    const result = validateTransfer(
      { bankCode: '99', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: 'AB', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects transfer with empty sender bank code', () => {
    const result = validateTransfer(
      { bankCode: '', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '012', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /Sender/i.test(e))).toBe(true);
  });

  it('rejects transfer with empty receiver bank code', () => {
    const result = validateTransfer(
      { bankCode: '010', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /Receiver/i.test(e))).toBe(true);
  });
});

// ============================================================
// Transfer validation — branch and account edge cases
// ============================================================

describe('Transfer validation with branch/account edge cases', () => {
  it('rejects sender with invalid branch number (2 digits)', () => {
    const result = validateTransfer(
      { bankCode: '010', branchNumber: '12', accountNumber: '1234567' },
      { bankCode: '012', branchNumber: '200', accountNumber: '7654321' },
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /branch/i.test(e))).toBe(true);
  });

  it('rejects receiver with account number too short (5 digits)', () => {
    const result = validateTransfer(
      { bankCode: '010', branchNumber: '100', accountNumber: '1234567' },
      { bankCode: '012', branchNumber: '200', accountNumber: '12345' },
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /account/i.test(e))).toBe(true);
  });

  it('accepts accounts with maximum length account numbers (13 digits)', () => {
    const result = validateTransfer(
      { bankCode: '010', branchNumber: '100', accountNumber: '1234567890123' },
      { bankCode: '012', branchNumber: '200', accountNumber: '9876543210123' },
    );
    expect(result.valid).toBe(true);
  });

  it('accepts accounts with minimum length account numbers (6 digits)', () => {
    const result = validateTransfer(
      { bankCode: '010', branchNumber: '100', accountNumber: '123456' },
      { bankCode: '012', branchNumber: '200', accountNumber: '654321' },
    );
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// Normalization consistency for transfers
// ============================================================

describe('Normalization consistency across transfer pairs', () => {
  it('same code in old and new format always normalizes to identical value', () => {
    const pairs: [string, string][] = [
      ['4', '004'],
      ['10', '010'],
      ['11', '011'],
      ['12', '012'],
      ['13', '013'],
      ['14', '014'],
      ['17', '017'],
      ['20', '020'],
      ['26', '026'],
      ['31', '031'],
      ['34', '034'],
      ['46', '046'],
      ['52', '052'],
      ['90', '090'],
    ];

    pairs.forEach(([old, new3]) => {
      expect(normalizeBankCode(old)).toBe(new3);
      expect(normalizeBankCode(new3)).toBe(new3);
      expect(normalizeBankCode(old)).toBe(normalizeBankCode(new3));
    });
  });

  it('formatBankCode produces same result for old and new format inputs', () => {
    expect(formatBankCode('10')).toBe(formatBankCode('010'));
    expect(formatBankCode('4')).toBe(formatBankCode('004'));
    expect(formatBankCode('90')).toBe(formatBankCode('090'));
  });

  it('validateBankCode accepts old 2-digit codes via normalization', () => {
    const oldCodes = ['4', '10', '11', '12', '13', '14', '17', '20', '26', '31', '34', '46', '52', '90'];
    oldCodes.forEach(code => {
      const result = validateBankCode(code);
      expect(result.valid).toBe(true);
      expect(result.normalizedCode).toHaveLength(3);
    });
  });

  it('validateBankCode accepts new 3-digit codes directly', () => {
    VALID_BANK_CODES.forEach(code => {
      const result = validateBankCode(code);
      expect(result.valid).toBe(true);
      expect(result.normalizedCode).toBe(code);
    });
  });
});

// ============================================================
// Real-world transfer scenarios
// ============================================================

describe('Real-world transfer scenarios', () => {
  it('salary transfer from employer (Leumi 010) to employee (Hapoalim 012)', () => {
    const employer = { bankCode: '010', branchNumber: '800', accountNumber: '5566778899' };
    const employee = { bankCode: '012', branchNumber: '185', accountNumber: '1234567' };
    const result = validateTransfer(employer, employee);
    expect(result.valid).toBe(true);
    expect(result.sameBank).toBe(false);
  });

  it('salary transfer with employer using legacy 2-digit code "10"', () => {
    const employer = { bankCode: '10', branchNumber: '800', accountNumber: '5566778899' };
    const employee = { bankCode: '012', branchNumber: '185', accountNumber: '1234567' };
    const result = validateTransfer(employer, employee);
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('010');
  });

  it('inter-branch transfer within Discount Bank (old "11" and new "011")', () => {
    const branch1 = { bankCode: '11', branchNumber: '001', accountNumber: '1234567' };
    const branch2 = { bankCode: '011', branchNumber: '050', accountNumber: '7654321' };
    const result = validateTransfer(branch1, branch2);
    expect(result.valid).toBe(true);
    expect(result.sameBank).toBe(true);
    expect(result.senderNormalized).toBe('011');
    expect(result.receiverNormalized).toBe('011');
  });

  it('pension fund transfer from Otzar Hahayal (old "14") to Poalei Agudat (new "052")', () => {
    const source = { bankCode: '14', branchNumber: '030', accountNumber: '8877665' };
    const target = { bankCode: '052', branchNumber: '010', accountNumber: '1122334' };
    const result = validateTransfer(source, target);
    expect(result.valid).toBe(true);
    expect(result.senderNormalized).toBe('014');
    expect(result.receiverNormalized).toBe('052');
  });

  it('multi-transfer batch: all 14 banks can send to Bank Leumi "010"', () => {
    const receiver = { bankCode: '010', branchNumber: '100', accountNumber: '9999999' };
    const oldCodes = ['04', '10', '11', '12', '13', '14', '17', '20', '26', '31', '34', '46', '52', '90'];

    oldCodes.forEach(senderCode => {
      const result = validateTransfer(
        { bankCode: senderCode, branchNumber: '001', accountNumber: '1234567' },
        receiver,
      );
      expect(result.valid).toBe(true);
    });
  });

  it('multi-transfer batch: all 14 banks (new format) can receive from Hapoalim "012"', () => {
    const sender = { bankCode: '012', branchNumber: '500', accountNumber: '8888888' };

    VALID_BANK_CODES.forEach(receiverCode => {
      const result = validateTransfer(
        sender,
        { bankCode: receiverCode, branchNumber: '001', accountNumber: '1234567' },
      );
      expect(result.valid).toBe(true);
    });
  });
});
