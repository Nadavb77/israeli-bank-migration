#!/usr/bin/env python3
"""
Israeli Payroll System — MASAV ACH File Generator
Bank of Israel bank codes: 3-digit format (POST-MIGRATION)

MASAV (Merkaz Slikat Asraot V'Massavot) is the Israeli interbank
clearing house. ACH transfer files have a fixed-width format.

POST-MIGRATION record layout (97 bytes per record):
  Bytes  0– 1  : Record type (e.g. '10' = payment, '20' = header)
  Byte   2     : Separator (space)
  Bytes  3– 5  : Bank code (3 digits)
  Bytes  6– 8  : Branch number (3 digits)
  Bytes  9–21  : Account number (13 digits, right-padded)
  Bytes 22–30  : Amount in agorot (9 digits, zero-padded)
  Bytes 31–46  : Payee name (16 chars, space-padded)
  Bytes 47–54  : Reference / employee ID (8 chars)
  Bytes 55–61  : Pay period YYYYMM (7 chars)
  Bytes 62–64  : Currency code (e.g. 'ILS')
  Bytes 65–96  : Reserved / filler spaces (32 chars)
"""

import os
import struct
from datetime import date
from typing import NamedTuple, List

# ============================================================
# Constants — all byte offsets (POST-MIGRATION)
# ============================================================

RECORD_TYPE_OFFSET   = 0
RECORD_TYPE_LEN      = 2

SEPARATOR_OFFSET     = 2
SEPARATOR_LEN        = 1

BANK_CODE_OFFSET     = 3
BANK_CODE_LEN        = 3

BRANCH_OFFSET        = 6
BRANCH_LEN           = 3

ACCOUNT_OFFSET       = 9
ACCOUNT_LEN          = 13

AMOUNT_OFFSET        = 22
AMOUNT_LEN           = 9

NAME_OFFSET          = 31
NAME_LEN             = 16

REF_OFFSET           = 47
REF_LEN              = 8

PERIOD_OFFSET        = 55
PERIOD_LEN           = 7

CURRENCY_OFFSET      = 62
CURRENCY_LEN         = 3

FILLER_OFFSET        = 65
FILLER_LEN           = 32

RECORD_LENGTH        = 97

RECORD_TYPE_PAYMENT  = '10'
RECORD_TYPE_HEADER   = '20'
RECORD_TYPE_TRAILER  = '90'

DEFAULT_CURRENCY     = 'ILS'


class MASAVRecord(NamedTuple):
    """A single MASAV payment record."""
    record_type:   str
    bank_code:     str   # 3-digit POST-MIGRATION
    branch:        str
    account:       str
    amount_agorot: int   # amount in agorot (1 ILS = 100 agorot)
    payee_name:    str
    reference:     str
    pay_period:    str   # YYYYMM


def _validate_bank_code(bank_code: str) -> str:
    """
    Validate and normalize a bank code to the canonical 3-digit format.
    """
    import re
    if not bank_code:
        raise ValueError("bank_code cannot be empty")
    normalized = bank_code.strip().zfill(3)
    if not re.match(r'^\d{3}$', normalized):
        raise ValueError(
            f"Invalid bank code '{bank_code}': must be a 3-digit numeric code"
        )
    return normalized


def build_record(rec: MASAVRecord) -> bytes:
    """
    Serialize a MASAVRecord into a fixed-width 97-byte record.
    """
    bank_code = _validate_bank_code(rec.bank_code)

    # Build record as a mutable bytearray filled with spaces
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

    # Bank code (bytes 3–5)
    write_field(BANK_CODE_OFFSET, BANK_CODE_LEN, bank_code, pad_char='0', align='right')

    # Branch (bytes 6–8)
    write_field(BRANCH_OFFSET, BRANCH_LEN, rec.branch.zfill(BRANCH_LEN), pad_char='0', align='right')

    # Account (bytes 9–21)
    write_field(ACCOUNT_OFFSET, ACCOUNT_LEN, rec.account.ljust(ACCOUNT_LEN))

    # Amount in agorot (bytes 22–30)
    write_field(AMOUNT_OFFSET, AMOUNT_LEN, str(rec.amount_agorot), pad_char='0', align='right')

    # Payee name (bytes 31–46)
    write_field(NAME_OFFSET, NAME_LEN, rec.payee_name[:NAME_LEN].ljust(NAME_LEN))

    # Reference (bytes 47–54)
    write_field(REF_OFFSET, REF_LEN, rec.reference[:REF_LEN].ljust(REF_LEN))

    # Pay period (bytes 55–61)
    write_field(PERIOD_OFFSET, PERIOD_LEN, rec.pay_period.ljust(PERIOD_LEN))

    # Currency (bytes 62–64)
    write_field(CURRENCY_OFFSET, CURRENCY_LEN, DEFAULT_CURRENCY)

    # Filler (bytes 65–96)
    write_field(FILLER_OFFSET, FILLER_LEN, '')

    assert len(record) == RECORD_LENGTH, f"Record length mismatch: {len(record)} != {RECORD_LENGTH}"
    return bytes(record)


def parse_record(raw: bytes) -> dict:
    """
    Parse a raw 97-byte record back into a dict of fields.
    Used for validation and testing.
    """
    if len(raw) != RECORD_LENGTH:
        raise ValueError(f"Expected {RECORD_LENGTH}-byte record, got {len(raw)}")

    return {
        'record_type':   raw[RECORD_TYPE_OFFSET : RECORD_TYPE_OFFSET + RECORD_TYPE_LEN].decode().strip(),
        'bank_code':     raw[BANK_CODE_OFFSET : BANK_CODE_OFFSET + BANK_CODE_LEN].decode().strip(),
        'branch':        raw[BRANCH_OFFSET : BRANCH_OFFSET + BRANCH_LEN].decode().strip(),
        'account':       raw[ACCOUNT_OFFSET : ACCOUNT_OFFSET + ACCOUNT_LEN].decode().strip(),
        'amount_agorot': int(raw[AMOUNT_OFFSET : AMOUNT_OFFSET + AMOUNT_LEN].decode().strip() or '0'),
        'payee_name':    raw[NAME_OFFSET : NAME_OFFSET + NAME_LEN].decode().strip(),
        'reference':     raw[REF_OFFSET : REF_OFFSET + REF_LEN].decode().strip(),
        'pay_period':    raw[PERIOD_OFFSET : PERIOD_OFFSET + PERIOD_LEN].decode().strip(),
        'currency':      raw[CURRENCY_OFFSET : CURRENCY_OFFSET + CURRENCY_LEN].decode().strip(),
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
            bank_code     = '000',
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
            bank_code     = '099',
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
            bank_code     = '010',  # Bank Leumi
            branch        = '100',
            account       = '1234567890000',
            amount_agorot = 1500000,   # 15,000 ILS
            payee_name    = 'Moshe Cohen',
            reference     = 'EMP00001',
            pay_period    = '2026-06 ',
        ),
        MASAVRecord(
            record_type   = RECORD_TYPE_PAYMENT,
            bank_code     = '012',  # Bank Hapoalim
            branch        = '200',
            account       = '9876543210000',
            amount_agorot = 2000000,   # 20,000 ILS
            payee_name    = 'Rivka Levi',
            reference     = 'EMP00002',
            pay_period    = '2026-06 ',
        ),
        MASAVRecord(
            record_type   = RECORD_TYPE_PAYMENT,
            bank_code     = '020',  # Mizrahi-Tefahot
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
