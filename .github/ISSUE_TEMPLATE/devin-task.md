---
name: "🤖 Devin Task — Bank Code Migration"
about: "Regulatory migration: 2-digit bank codes → 3-digit (Bank of Israel directive)"
title: "[MIGRATION] Migrate all bank codes from 2-digit to 3-digit format"
labels: migration, regulatory, devin-task
assignees: ''
---

## Overview

The Bank of Israel has issued a regulatory directive requiring all financial systems to update
bank identification codes from 2-digit to 3-digit zero-padded format.

**Old format:** `"10"` (Bank Leumi)
**New format:** `"010"` (Bank Leumi)

The migration rule is simple: **zero-pad every existing 2-digit code to 3 digits.**
`bank_code.padStart(3, '0')`

---

## Scope

This affects **every layer** of the system. You must update:

| File | What to change |
|------|---------------|
| `db/schema.sql` | `CHAR(2)` → `CHAR(3)`, CHECK constraint `^[0-9]{2}$` → `^[0-9]{3}$` |
| `db/stored_procedures.sql` | `LPAD(..., 2, '0')` → `LPAD(..., 3, '0')`, length guards |
| `backend/src/config/constants.ts` | `BANK_CODE_LENGTH = 2` → `3`, regex constant |
| `backend/src/models/BankCode.ts` | Union type literals: `"10"` → `"010"`, etc. (14 codes) |
| `backend/src/validators/bankValidator.ts` | `padStart(2, '0')` → `padStart(3, '0')`, regex `/^\d{2}$/` → `/^\d{3}$/` |
| `backend/src/services/payrollService.ts` | All normalization and formatting logic |
| `backend/src/routes/payrollRoutes.ts` | Inline validation in route handlers |
| `backend/tests/bankValidator.test.ts` | Invert test assertions to expect 3-digit codes |
| `frontend/src/components/PayrollForm.tsx` | `maxLength={2}` → `maxLength={3}`, regex in JSX |
| `scripts/masav_generator.py` | Bank code field: bytes 3–4 → bytes 3–5; shift all subsequent field offsets by +1 |
| `scripts/reports.py` | `BANK_CODE_WIDTH = 2` → `3`, all column format strings |
| `config/bank_codes.json` | All JSON keys: `"10"` → `"010"`, etc. |

---

## Official Bank Code Mapping

```
"04" → "004"   Bank Yahav
"10" → "010"   Bank Leumi
"11" → "011"   Discount Bank
"12" → "012"   Bank Hapoalim
"13" → "013"   Union Bank (Igud)
"14" → "014"   Otzar Hahayal Bank
"17" → "017"   Mercantile Discount Bank
"20" → "020"   Mizrahi-Tefahot Bank
"26" → "026"   U-Bank
"31" → "031"   International Bank of Israel (FIBI)
"34" → "034"   Arab Israel Bank
"46" → "046"   Bank of Jerusalem
"52" → "052"   Bank Poalei Agudat Israel
"90" → "090"   Israel Post Bank
```

---

## Definition of Done

- [ ] All `CHAR(2)` columns changed to `CHAR(3)` in schema
- [ ] All CHECK constraints updated to `^[0-9]{3}$`
- [ ] All `padStart(2, '0')` calls changed to `padStart(3, '0')`
- [ ] TypeScript union type updated to 3-char literals
- [ ] React form `maxLength` updated to `3`
- [ ] MASAV byte offsets corrected throughout `masav_generator.py`
- [ ] `BANK_CODE_WIDTH` constant updated to `3` in `reports.py`
- [ ] All JSON keys in `bank_codes.json` updated
- [ ] All tests pass with 3-digit bank codes
- [ ] `grep -r '"[0-9]\{2\}"' .` returns no matches in source files (outside of test fixtures)
- [ ] A migration SQL script is provided to `UPDATE` existing rows (zero-pad existing data)

---

## Notes

- Do **not** change the bank code values themselves — only zero-pad them
- The MASAV file is a fixed-width format; byte positions matter. Widening the bank code field
  by 1 byte shifts every field that follows it. Be careful with the offset arithmetic.
- The test file has comments marking exactly which assertions must be inverted
