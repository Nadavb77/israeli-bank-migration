// ============================================================
// Israeli Payroll System — Bank Code Model
// Bank of Israel bank codes: 2-digit format (PRE-MIGRATION)
// ============================================================

/**
 * Union type of all valid Bank of Israel bank codes.
 * PRE-MIGRATION: 2-digit strings.
 *
 * TODO (MIGRATION): replace all 14 literals with their 3-digit equivalents:
 *   '04' → '004', '10' → '010', '11' → '011', '12' → '012',
 *   '13' → '013', '14' → '014', '17' → '017', '20' → '020',
 *   '26' → '026', '31' → '031', '34' → '034', '46' → '046',
 *   '52' → '052', '90' → '090'
 */
export type BankCode =
  | '04'   // Bank Yahav                   → '004'
  | '10'   // Bank Leumi                   → '010'
  | '11'   // Discount Bank                → '011'
  | '12'   // Bank Hapoalim                → '012'
  | '13'   // Union Bank (Igud)            → '013'
  | '14'   // Otzar Hahayal Bank           → '014'
  | '17'   // Mercantile Discount Bank     → '017'
  | '20'   // Mizrahi-Tefahot Bank         → '020'
  | '26'   // U-Bank                       → '026'
  | '31'   // International Bank (FIBI)    → '031'
  | '34'   // Arab Israel Bank             → '034'
  | '46'   // Bank of Jerusalem            → '046'
  | '52'   // Bank Poalei Agudat Israel    → '052'
  | '90';  // Israel Post Bank             → '090'

/**
 * Runtime array of all valid bank codes.
 * Used for validation and iteration.
 * TODO (MIGRATION): update all string literals to 3-digit
 */
export const VALID_BANK_CODES: readonly BankCode[] = [
  '04', '10', '11', '12', '13', '14', '17',
  '20', '26', '31', '34', '46', '52', '90',
] as const;

/**
 * Human-readable labels for each bank code.
 * TODO (MIGRATION): update all keys from 2-digit to 3-digit
 */
export const BANK_CODE_LABELS: Record<BankCode, string> = {
  '04': 'Bank Yahav',
  '10': 'Bank Leumi',
  '11': 'Discount Bank',
  '12': 'Bank Hapoalim',
  '13': 'Union Bank (Igud)',
  '14': 'Otzar Hahayal Bank',
  '17': 'Mercantile Discount Bank',
  '20': 'Mizrahi-Tefahot Bank',
  '26': 'U-Bank',
  '31': 'International Bank of Israel (FIBI)',
  '34': 'Arab Israel Bank',
  '46': 'Bank of Jerusalem',
  '52': 'Bank Poalei Agudat Israel',
  '90': 'Israel Post Bank',
};

/**
 * SWIFT/BIC codes where available.
 * TODO (MIGRATION): update all keys from 2-digit to 3-digit
 */
export const BANK_SWIFT_CODES: Partial<Record<BankCode, string>> = {
  '04': 'YAHVILITXXX',
  '10': 'LUMIILITXXX',
  '11': 'DISCILIT',
  '12': 'POALILIT',
  '13': 'UNIOILIT',
  '14': 'OTZRILIT',
  '17': 'MRCLILITMTE',
  '20': 'MIZBILIT',
  '26': 'UBNKILIT',
  '31': 'FIBIILIT',
  '46': 'JERSILJ1',
};

/**
 * Type guard: checks if a string is a valid BankCode.
 * TODO (MIGRATION): the VALID_BANK_CODES array update will make this work correctly for 3-digit
 */
export function isBankCode(value: string): value is BankCode {
  return (VALID_BANK_CODES as readonly string[]).includes(value);
}

/**
 * Interface for a bank account (used in payroll entries and employee records).
 */
export interface BankAccount {
  /** 2-digit BOI bank code. TODO (MIGRATION): update type to 3-digit */
  bankCode:      BankCode;
  /** Always 3 digits — does NOT change with this migration */
  branchNumber:  string;
  /** 6–13 digit account number */
  accountNumber: string;
}

/**
 * Interface for the bank_codes lookup table row.
 */
export interface BankCodeRecord {
  /** 2-digit code. TODO (MIGRATION): update to 3-digit */
  bankCode:  BankCode;
  bankName:  string;
  swiftCode: string | null;
  active:    boolean;
}
