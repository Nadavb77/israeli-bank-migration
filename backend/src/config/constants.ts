// ============================================================
// Israeli Payroll System — Application Constants
// Bank of Israel bank codes: 3-digit format (POST-MIGRATION)
// ============================================================

/**
 * The required length for BOI bank codes.
 */
export const BANK_CODE_LENGTH = 3;

/**
 * Regex pattern for a valid bank code.
 * Exactly 3 decimal digits.
 */
export const BANK_CODE_REGEX = /^\d{3}$/;

/**
 * Regex pattern for validating bank codes in user input (allows leading spaces).
 */
export const BANK_CODE_INPUT_REGEX = /^\s*\d{1,3}\s*$/;

/**
 * The padding character used to normalize shorter codes.
 */
export const BANK_CODE_PAD_CHAR = '0';

/**
 * Branch number is always 3 digits (does NOT change with this migration).
 */
export const BRANCH_CODE_LENGTH = 3;

/**
 * MASAV file format: byte offset where the bank code field starts (0-indexed).
 * In a MASAV record, bytes 0–1 are the record type, byte 2 is a separator,
 * bytes 3–5 are the bank code (3 bytes), byte 6 is a separator.
 */
export const MASAV_BANK_CODE_OFFSET = 3;
export const MASAV_BANK_CODE_END    = 6;
export const MASAV_BRANCH_OFFSET    = 6;
export const MASAV_BRANCH_END       = 9;
export const MASAV_ACCOUNT_OFFSET   = 9;
export const MASAV_ACCOUNT_END      = 22;
export const MASAV_AMOUNT_OFFSET    = 22;
export const MASAV_AMOUNT_END       = 31;
export const MASAV_NAME_OFFSET      = 31;
export const MASAV_NAME_END         = 47;

/**
 * Total MASAV record length in bytes.
 */
export const MASAV_RECORD_LENGTH = 97;

/**
 * Display format string for bank code columns in reports.
 * Width is 3 to match BANK_CODE_LENGTH.
 */
export const BANK_CODE_DISPLAY_WIDTH = 3;

/**
 * Error messages — include expected length so they must change too.
 */
export const ERROR_MESSAGES = {
  INVALID_BANK_CODE_FORMAT : `Bank code must be exactly ${BANK_CODE_LENGTH} digits`,
  INVALID_BANK_CODE_LENGTH : `Bank code length must be ${BANK_CODE_LENGTH}`,
  UNKNOWN_BANK_CODE        : 'Bank code is not recognized by the Bank of Israel',
  BANK_CODE_REQUIRED       : 'Bank code is required',
};
