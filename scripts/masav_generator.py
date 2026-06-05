#!/usr/bin/env python3
"""
Israeli Payroll System — MASAV ACH File Generator
Bank of Israel bank codes: 2-digit format (PRE-MIGRATION)

MASAV (Merkaz Slikat Asraot V'Massavot) is the Israeli interbank
clearing house. ACH transfer files have a fixed-width format.

PRE-MIGRATION record layout (96 bytes per record):
  Bytes  0– 1  : Record type (e.g. '10' = payment, '20' = header)
  Byte   2     : Separator (space)
  Bytes  3– 4  : Bank code (2 digits)         ← FIELD TO MIGRATE
  Bytes  5– 7  : Branch number (3 digits)
  Bytes  8–20  : Account number (13 digits, right-padded)
  Bytes 21–29  : Amount in agorot (9 digits, zero-padded)
  Bytes 30–45  : Payee name (16 chars, space-padded)
  Bytes 46–53  : Reference / employee ID (8 chars)
  Bytes 54–60  : Pay period YYYYMM (7 chars)
  Bytes 61–63  : Currency code (e.g. 'ILS')
  Bytes 64–95  : Reserved / filler spaces (32 chars)

TODO (MIGRATION): After widening bank code from 2 → 3 bytes,
ALL byte offsets from byte 5 onward shift by +1:
  Bank code:     bytes 3–5   (was 3–4)
  Branch:        bytes 6–8   (was 5–7)
  Account:       bytes 9–21  (was 8–20)
  Amount:        bytes 22–30 (was 21–29)
  Payee name:    bytes 31–46 (was 30–45)
  Reference:     bytes 47–54 (was 46–53)
  Pay period:    bytes 55–61 (was 54–60)
  Currency:      bytes 62–64 (was 61–63)
  Filler:        bytes 65–97 (was 64–95)
  Record length: 97 bytes    (was 96)
"""

import os
import struct
from datetime import date
from typing import NamedTuple, List

# ============================================================
# Constants — all byte offsets (PRE-MIGRATION)
# ============================================================

RECORD_TYPE_OFFSET   = 0
RECORD_TYPE_LEN      = 2

SEPARATOR_OFFSET     = 2
SEPARATOR_LEN        = 1

# TODO (MIGRATION): BANK_CODE_OFFSET unchanged (3), BANK_CODE_LEN 2 → 3
BANK_CODE_OFFSET     = 3
BANK_CODE_LEN        = 2    # TODO (MIGRATION): → 3

# TODO (MIGRATION): BRANCH_OFFSET 5 → 6
BRANCH_OFFSET        = 5    # TODO (MIGRATION): → 6
BRANCH_LEN           = 3

# TODO (MIGRATION): ACCOUNT_OFFSET 8 → 9
ACCOUNT_OFFSET       = 8    # TODO (MIGRATION): → 9
ACCOUNT_LEN          = 13

# TODO (MIGRATION): AMOUNT_OFFSET 21 → 22
AMOUNT_OFFSET        = 21   # TODO (MIGRATION): → 22
AMOUNT_LEN           = 9

# TODO (MIGRATION): NAME_OFFSET 30 → 31
NAME_OFFSET          = 30   # TODO (MIGRATION): → 31
NAME_LEN             = 16

# TODO (MIGRATION): REF_OFFSET 46 → 47
REF_OFFSET           = 46   # TODO (MIGRATION): → 47
REF_LEN              = 8

# TODO (MIGRATION): PERIOD_OFFSET 54 → 55
PERIOD_OFFSET        = 54   # TODO (MIGRATION): → 55
PERIOD_LEN           = 7

# TODO (MIGRATION): CURRENCY_OFFSET 61 → 62
CURRENCY_OFFSET      = 61   # TODO (MIGRATION): → 62
CURRENCY_LEN         = 3

# TODO (MIGRATION): FILLER_OFFSET 64 → 65; FILLER_LEN 32 → 32 (unchanged)
FILLER_OFFSET        = 64   # TODO (MIGRATION): → 65
FILLER_LEN           = 32

# TODO (MIGRATION): RECORD_LENGTH 96 → 97
RECORD_LENGTH        = 96   # TODO (MIGRATION): → 97

RECORD_TYPE_PAYMENT  = '10'
RECORD_TYPE_HEADER   = '20'
RECORD_TYPE_TRAILER  = '90'

DEFAULT_CURRENCY     = 'ILS'


class MASAVRecord(NamedTuple):
    """A single MASAV payment record."""
    record_type:   str
    bank_code:     str   # 2-digit PRE-MIGRATION; TODO (MIGRATION): → 3-digit
    branch:        str
    account:       str
    amount_agorot: int   # amount in agorot (1 ILS = 100 agorot)
    payee_name:    str
    reference:     str
    pay_period:    str   # YYYYMM


def _validate_bank_code(bank_code: str) -> str:
    """
    Validate and normalize a bank code to the canonical 2-digit format.
    TODO (MIGRATION): zfill(2) → zfill(3); regex {2} → {3}
    """
    import re
    if not bank_code:
        raise ValueError("bank_code cannot be empty")
    # Zero-pad to 2 digits
    # TODO (MIGRATION): zfill(2) → zfill(3)
    normalized = bank_code.strip().zfill(2)
    # TODO (MIGRATION): r'^\d{2}$' → r'^\d{3}$'
    if not re.match(r'^\d{2}$', normalized):
        raise ValueError(
            # TODO (MIGRATION): "2-digit" → "3-digit" in message
            f"Invalid bank code '{bank_code}': must be a 2-digit numeric code"
        )
    return normalized


def build_record(rec: MASAVRecord) -> bytes:
    """
    Serialize a MASAVRecord into a fixed-width 96-byte record.

    TODO (MIGRATION): after widening BANK_CODE_LEN to 3, all subsequent
    field placements must shift by +1.  The simplest way is to update
    all the _OFFSET constants above and this single function will be correct.
    """
    bank_code = _validate_bank_code(rec.bank_code)

    # Build record as a mutable bytearray filled with spaces
    # TODO (MIGRATION): RECORD_LENGTH 96 → 97
    record = bytearray(b' ' * RECORD_LENGTH)

    def write_field(offset: int, length: int, value: str, pad_char: str = ' ', align: str = 'left') -> None:
        """Write a fixed-width field into the record bytearray."""
        if align == 'right':
            encoded = value.rjust(length, pad_char)
        else:
            encoded = value.ljust(length, pad_char)
        encoded = encoded[:length]  # truncate if over length
        record[offset:offset + length] = encoded.encode('utf-8')

    # Record type (bytes 0–1)
    write_field(RECORD_TYPE_OFFSET, RECORD_TYPE_LEN, rec.record_type)

    # Separator (byte 2)
    record[SEPARATOR_OFFSET] = ord(' ')

    # Bank code (bytes 3–4)  ← TODO (MIGRATION): bytes 3–5 after widening
    write_field(BANK_CODE_OFFSET, BANK_CODE_LEN, bank_code, pad_char='0', align='right')

    # Branch (bytes 5–7)     ← TODO (MIGRATION): bytes 6–8
    write_field(BRANCH_OFFSET, BRANCH_LEN, rec.branch.zfill(BRANCH_LEN), pad_char='0', align='right')

    # Account (bytes 8–20)   ← TODO (MIGRATION): bytes 9–21
    write_field(ACCOUNT_OFFSET, ACCOUNT_LEN, rec.account.ljust(ACCOUNT_LEN))

    # Amount in agorot (bytes 21–29)  ← TODO (MIGRATION): bytes 22–30
    write_field(AMOUNT_OFFSET, AMOUNT_LEN, str(rec.amount_agorot), pad_char='0', align='right')

    # Payee name (bytes 30–45)  ← TODO (MIGRATION): bytes 31–46
    write_field(NAME_OFFSET, NAME_LEN, rec.payee_name[:NAME_LEN].ljust(NAME_LEN))

    # Reference (bytes 46–53)  ← TODO (MIGRATION): bytes 47–54
    write_field(REF_OFFSET, REF_LEN, rec.reference[:REF_LEN].ljust(REF_LEN))

    # Pay period (bytes 54–60)  ← TODO (MIGRATION): bytes 55–61
    write_field(PERIOD_OFFSET, PERIOD_LEN, rec.pay_period.ljust(PERIOD_LEN))

    # Currency (bytes 61–63)  ← TODO (MIGRATION): bytes 62–64
    write_field(CURRENCY_OFFSET, CURRENCY_LEN, DEFAULT_CURRENCY)

    # Filler (bytes 64–95)  ← TODO (MIGRATION): bytes 65–97
    write_field(FILLER_OFFSET, FILLER_LEN, '')

    assert len(record) == RECORD_LENGTH, f"Record length mismatch: {len(record)} != {RECORD_LENGTH}"
    return bytes(record)


def parse_record(raw: bytes) -> dict:
    """
    Parse a raw 96-byte record back into a dict of fields.
    Used for validation and testing.
    TODO (MIGRATION): update all slice indices to match shifted offsets.
    """
    if len(raw) != RECORD_LENGTH:
        raise ValueError(f"Expected {RECORD_LENGTH}-byte record, got {len(raw)}")

    return {
        'record_type':  raw[RECORD_TYPE_OFFSET : RECORD_TYPE_OFFSET + RECORD_TYPE_LEN].decode().strip(),
        # TODO (MIGRATION): BANK_CODE_OFFSET:BANK_CODE_OFFSET+BANK_CODE_LEN → 3:6
        'bank_code':    raw[BANK_CODE_OFFSET : BANK_CODE_OFFSET + BANK_CODE_LEN].decode().strip(),
        # TODO (MIGRATION): BRANCH_OFFSET:BRANCH_OFFSET+BRANCH_LEN → 6:9
        'branch':       raw[BRANCH_OFFSET : BRANCH_OFFSET + BRANCH_LEN].decode().strip(),
        # TODO (MIGRATION): ACCOUNT_OFFSET:ACCOUNT_OFFSET+ACCOUNT_LEN → 9:22
        'account':      raw[ACCOUNT_OFFSET : ACCOUNT_OFFSET + ACCOUNT_LEN].decode().strip(),
        # TODO (MIGRATION): AMOUNT_OFFSET:AMOUNT_OFFSET+AMOUNT_LEN → 22:31
        'amount_agorot': int(raw[AMOUNT_OFFSET : AMOUNT_OFFSET + AMOUNT_LEN].decode().strip() or '0'),
        # TODO (MIGRATION): NAME_OFFSET:NAME_OFFSET+NAME_LEN → 31:47
        'payee_name':   raw[NAME_OFFSET : NAME_OFFSET + NAME_LEN].decode().strip(),
        # TODO (MIGRATION): REF_OFFSET:REF_OFFSET+REF_LEN → 47:55
        'reference':    raw[REF_OFFSET : REF_OFFSET + REF_LEN].decode().strip(),
        # TODO (MIGRATION): PERIOD_OFFSET:PERIOD_OFFSET+PERIOD_LEN → 55:62
        'pay_period':   raw[PERIOD_OFFSET : PERIOD_OFFSET + PERIOD_LEN].decode().strip(),
        # TODO (MIGRATION): CURRENCY_OFFSET:CURRENCY_OFFSET+CURRENCY_LEN → 62:65
        'currency':     raw[CURRENCY_OFFSET : CURRENCY_OFFSET + CURRENCY_LEN].decode().strip(),
    }


def generate_masav_file(records: List[MASAVRecord], output_path: str) -> int:
    """
    Write a MASAV ACH file.  Returns the number of payment records written.
    """
    payment_records = [r for r in records if r.record_type == RECORD_TYPE_PAYMENT]

    with open(output_path, 'wb') as f:
        # Header record
        header = MASAVRecord(
            record_type   = RECORD_TYPE_HEADER,
            # TODO (MIGRATION): '00' → '000'
            bank_code     = '00',
            branch        = '000',
            account       = '0000000000000',
            amount_agorot = 0,
            payee_name    = 'HEADER',
            reference     = date.today().strftime('%Y%m%d'),
            pay_period    = date.today().strftime('%Y%m') + ' ',
        )
        f.write(build_record(header))

        # Payment records
        for rec in payment_records:
            f.write(build_record(rec))

        # Trailer record
        total_amount = sum(r.amount_agorot for r in payment_records)
        trailer = MASAVRecord(
            record_type   = RECORD_TYPE_TRAILER,
            # TODO (MIGRATION): '99' → '099'
            bank_code     = '99',
            branch        = '999',
            account       = '0000000000000',
            amount_agorot = total_amount,
            payee_name    = 'TRAILER',
            reference     = str(len(payment_records)).zfill(REF_LEN),
            pay_period    = date.today().strftime('%Y%m') + ' ',
        )
        f.write(build_record(trailer))

    return len(payment_records)


# ============================================================
# Example usage
# ============================================================

if __name__ == '__main__':
    sample_records = [
        MASAVRecord(
            record_type   = RECORD_TYPE_PAYMENT,
            bank_code     = '10',   # Bank Leumi — TODO (MIGRATION): → '010'
            branch        = '100',
            account       = '1234567890000',
            amount_agorot = 1500000,   # 15,000 ILS
            payee_name    = 'Moshe Cohen',
            reference     = 'EMP00001',
            pay_period    = '2026-06 ',
        ),
        MASAVRecord(
            record_type   = RECORD_TYPE_PAYMENT,
            bank_code     = '12',   # Bank Hapoalim — TODO (MIGRATION): → '012'
            branch        = '200',
            account       = '9876543210000',
            amount_agorot = 2000000,   # 20,000 ILS
            payee_name    = 'Rivka Levi',
            reference     = 'EMP00002',
            pay_period    = '2026-06 ',
        ),
        MASAVRecord(
            record_type   = RECORD_TYPE_PAYMENT,
            bank_code     = '20',   # Mizrahi-Tefahot — TODO (MIGRATION): → '020'
            branch        = '050',
            account       = '1111111110000',
            amount_agorot = 1800000,   # 18,000 ILS
            payee_name    = 'Yosef Mizrahi',
            reference     = 'EMP00003',
            pay_period    = '2026-06 ',
        ),
    ]

    output_file = 'masav_output_2026_06.dat'
    count = generate_masav_file(sample_records, output_file)
    print(f"MASAV file written: {output_file} ({count} payment records)")
    print(f"Record length: {RECORD_LENGTH} bytes")
    print(f"Bank code field: bytes {BANK_CODE_OFFSET}–{BANK_CODE_OFFSET + BANK_CODE_LEN - 1} "
          f"({BANK_CODE_LEN} bytes)")
