// ============================================================
// Israeli Payroll System — Application Constants
// Bank of Israel bank codes: 2-digit format (PRE-MIGRATION)
// ============================================================

/**
 * The required length for BOI bank codes.
 * TODO (MIGRATION): update from 2 to 3
 */
export const BANK_CODE_LENGTH = 2;

/**
 * Regex pattern for a valid bank code.
 * Exactly 2 decimal digits.
 * TODO (MIGRATION): change {2} to {3}
 */
export const BANK_CODE_REGEX = /^\d{2}$/;

/**
 * Regex pattern for validating bank codes in user input (allows leading spaces).
 * TODO (MIGRATION): change {2} to {3}
 */
export const BANK_CODE_INPUT_REGEX = /^\s*\d{1,2}\s*$/;

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
 * bytes 3–4 are the bank code (2 bytes), byte 5 is a separator.
 * TODO (MIGRATION): after widening bank code by 1 byte, update all subsequent offsets.
 */
export const MASAV_BANK_CODE_OFFSET = 3;
export const MASAV_BANK_CODE_END    = 5;   // exclusive; TODO (MIGRATION): → 6
export const MASAV_BRANCH_OFFSET    = 5;   // TODO (MIGRATION): → 6
export const MASAV_BRANCH_END       = 8;   // TODO (MIGRATION): → 9
export const MASAV_ACCOUNT_OFFSET   = 8;   // TODO (MIGRATION): → 9
export const MASAV_ACCOUNT_END      = 21;  // TODO (MIGRATION): → 22
export const MASAV_AMOUNT_OFFSET    = 21;  // TODO (MIGRATION): → 22
export const MASAV_AMOUNT_END       = 30;  // TODO (MIGRATION): → 31
export const MASAV_NAME_OFFSET      = 30;  // TODO (MIGRATION): → 31
export const MASAV_NAME_END         = 46;  // TODO (MIGRATION): → 47

/**
 * Total MASAV record length in bytes.
 * TODO (MIGRATION): → 97 (add 1 for the widened bank code field)
 */
export const MASAV_RECORD_LENGTH = 96;

/**
 * Display format string for bank code columns in reports.
 * Width is 2 to match BANK_CODE_LENGTH.
 * TODO (MIGRATION): width → 3
 */
export const BANK_CODE_DISPLAY_WIDTH = 2;

/**
 * Error messages — include expected length so they must change too.
 */
export const ERROR_MESSAGES = {
  INVALID_BANK_CODE_FORMAT : `Bank code must be exactly ${BANK_CODE_LENGTH} digits`,
  INVALID_BANK_CODE_LENGTH : `Bank code length must be ${BANK_CODE_LENGTH}`,
  UNKNOWN_BANK_CODE        : 'Bank code is not recognized by the Bank of Israel',
  BANK_CODE_REQUIRED       : 'Bank code is required',
};
