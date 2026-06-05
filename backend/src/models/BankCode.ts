// ============================================================
// Israeli Payroll System — Bank Code Model
// Bank of Israel bank codes: 3-digit format (POST-MIGRATION)
// ============================================================

/**
 * Union type of all valid Bank of Israel bank codes.
 * POST-MIGRATION: 3-digit zero-padded strings.
 */
export type BankCode =
  | '004'  // Bank Yahav
  | '010'  // Bank Leumi
  | '011'  // Discount Bank
  | '012'  // Bank Hapoalim
  | '013'  // Union Bank (Igud)
  | '014'  // Otzar Hahayal Bank
  | '017'  // Mercantile Discount Bank
  | '020'  // Mizrahi-Tefahot Bank
  | '026'  // U-Bank
  | '031'  // International Bank (FIBI)
  | '034'  // Arab Israel Bank
  | '046'  // Bank of Jerusalem
  | '052'  // Bank Poalei Agudat Israel
  | '090'; // Israel Post Bank

/**
 * Runtime array of all valid bank codes.
 * Used for validation and iteration.
 */
export const VALID_BANK_CODES: readonly BankCode[] = [
  '004', '010', '011', '012', '013', '014', '017',
  '020', '026', '031', '034', '046', '052', '090',
] as const;

/**
 * Human-readable labels for each bank code.
 */
export const BANK_CODE_LABELS: Record<BankCode, string> = {
  '004': 'Bank Yahav',
  '010': 'Bank Leumi',
  '011': 'Discount Bank',
  '012': 'Bank Hapoalim',
  '013': 'Union Bank (Igud)',
  '014': 'Otzar Hahayal Bank',
  '017': 'Mercantile Discount Bank',
  '020': 'Mizrahi-Tefahot Bank',
  '026': 'U-Bank',
  '031': 'International Bank of Israel (FIBI)',
  '034': 'Arab Israel Bank',
  '046': 'Bank of Jerusalem',
  '052': 'Bank Poalei Agudat Israel',
  '090': 'Israel Post Bank',
};

/**
 * SWIFT/BIC codes where available.
 */
export const BANK_SWIFT_CODES: Partial<Record<BankCode, string>> = {
  '004': 'YAHVILITXXX',
  '010': 'LUMIILITXXX',
  '011': 'DISCILIT',
  '012': 'POALILIT',
  '013': 'UNIOILIT',
  '014': 'OTZRILIT',
  '017': 'MRCLILITMTE',
  '020': 'MIZBILIT',
  '026': 'UBNKILIT',
  '031': 'FIBIILIT',
  '046': 'JERSILJ1',
};

/**
 * Type guard: checks if a string is a valid BankCode.
 */
export function isBankCode(value: string): value is BankCode {
  return (VALID_BANK_CODES as readonly string[]).includes(value);
}

/**
 * Interface for a bank account (used in payroll entries and employee records).
 */
export interface BankAccount {
  /** 3-digit BOI bank code */
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
  /** 3-digit code */
  bankCode:  BankCode;
  bankName:  string;
  swiftCode: string | null;
  active:    boolean;
}
