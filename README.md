# Israeli Payroll System — Bank Code Migration (2-digit → 3-digit)

## Background

The Bank of Israel (BOI) has issued a regulatory directive requiring all financial systems
to update bank identification codes from a **2-digit** format to a **3-digit** zero-padded format.

**Example:** Bank Leumi was `"10"` — it is now `"010"`.

This codebase is a realistic multi-layer payroll system with the **2-digit assumption embedded
throughout every layer**: database schema, validation logic, service code, REST routes, the
frontend form, fixed-width MASAV file generation, Python reports, and unit tests.

---

## Official BOI Bank Code Mapping (2-digit → 3-digit)

| Bank Name                    | Old Code | New Code |
|------------------------------|----------|----------|
| Bank Yahav                   | `04`     | `004`    |
| Bank Leumi                   | `10`     | `010`    |
| Discount Bank                | `11`     | `011`    |
| Bank Hapoalim                | `12`     | `012`    |
| Union Bank (Igud)            | `13`     | `013`    |
| Otzar Hahayal Bank           | `14`     | `014`    |
| Mercantile Discount Bank     | `17`     | `017`    |
| Mizrahi-Tefahot Bank         | `20`     | `020`    |
| U-Bank                       | `26`     | `026`    |
| International Bank (FIBI)    | `31`     | `031`    |
| Arab Israel Bank             | `34`     | `034`    |
| Bank of Jerusalem            | `46`     | `046`    |
| Bank Poalei Agudat Israel    | `52`     | `052`    |
| Israel Post Bank             | `90`     | `090`    |

---

## Repository Structure

```
israeli-bank-migration/
├── README.md
├── .github/
│   └── ISSUE_TEMPLATE/
│       └── devin-task.md          ← Devin task prompt (GitHub Issue)
├── db/
│   ├── schema.sql                 ← PostgreSQL schema (CHAR(2) columns, CHECK constraints)
│   └── stored_procedures.sql      ← DB functions with 2-digit assumptions
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── constants.ts       ← BANK_CODE_LENGTH = 2, regex patterns
│   │   ├── models/
│   │   │   └── BankCode.ts        ← TypeScript union type of 14 literal 2-char strings
│   │   ├── validators/
│   │   │   └── bankValidator.ts   ← Validation: length checks, padStart(2,'0'), regex /^\d{2}$/
│   │   ├── services/
│   │   │   └── payrollService.ts  ← Business logic using 2-digit codes throughout
│   │   └── routes/
│   │       └── payrollRoutes.ts   ← REST endpoints with inline validation
│   ├── tests/
│   │   └── bankValidator.test.ts  ← Tests written to PASS on 2-digit; FAIL post-migration
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   └── src/
│       └── components/
│           └── PayrollForm.tsx    ← React form: maxLength={2}, regex /^\d{2}$/
├── scripts/
│   ├── masav_generator.py         ← MASAV ACH fixed-width file; bank code at bytes 3–4
│   └── reports.py                 ← BANK_CODE_WIDTH = 2 throughout
└── config/
    └── bank_codes.json            ← Lookup table with 2-digit keys
```

---

## The Migration Task (for Devin)

See `.github/ISSUE_TEMPLATE/devin-task.md` for the full task specification.

**In short:** migrate every reference to bank codes from 2-digit to 3-digit across all layers.
This is NOT a simple find-and-replace — byte offsets in the MASAV file shift, DB CHECK constraints
must be rewritten, TypeScript union types must be regenerated, and tests must be inverted.

---

## Definition of Done

A correct migration satisfies **all** of the following:

- [ ] `db/schema.sql` — `bank_code CHAR(2)` changed to `CHAR(3)` in all tables and views
- [ ] `db/schema.sql` — CHECK constraint `^[0-9]{2}$` updated to `^[0-9]{3}$`
- [ ] `db/stored_procedures.sql` — length guards and `LPAD(..., 2, '0')` changed to 3
- [ ] `backend/src/config/constants.ts` — `BANK_CODE_LENGTH = 2` updated to `3`; regex updated
- [ ] `backend/src/models/BankCode.ts` — union type updated from 14 × 2-char to 14 × 3-char literals
- [ ] `backend/src/validators/bankValidator.ts` — `padStart(2, '0')` → `padStart(3, '0')`; regex updated
- [ ] `backend/src/services/payrollService.ts` — all normalization, formatting, and comparison logic updated
- [ ] `backend/src/routes/payrollRoutes.ts` — inline validation updated
- [ ] `backend/tests/bankValidator.test.ts` — all test assertions inverted to 3-digit expectations
- [ ] `frontend/src/components/PayrollForm.tsx` — `maxLength={2}` → `maxLength={3}`; regex updated
- [ ] `scripts/masav_generator.py` — bank code field widened from 2 to 3 bytes; all subsequent field offsets shifted by +1
- [ ] `scripts/reports.py` — `BANK_CODE_WIDTH = 2` → `3`; all column formatting updated
- [ ] `config/bank_codes.json` — all keys updated from 2-digit to 3-digit strings
- [ ] All existing tests pass with 3-digit bank codes
- [ ] No hardcoded 2-digit bank code strings remain anywhere in the codebase

---

## Running the Project

### Database
```bash
psql -U postgres -f db/schema.sql
psql -U postgres -f db/stored_procedures.sql
```

### Backend
```bash
cd backend
npm install
npm run build
npm start
```

### Tests
```bash
cd backend
npm test
```

### MASAV Generator
```bash
cd scripts
pip install -r requirements.txt
python masav_generator.py
```

### Reports
```bash
cd scripts
python reports.py
```
