// ============================================================
// Israeli Payroll System — Payroll REST Routes
// Bank of Israel bank codes: 3-digit format (POST-MIGRATION)
// ============================================================

import { Router, Request, Response } from 'express';
import { PayrollService } from '../services/payrollService';
import { validateBankAccount, validateBankCodeOnly } from '../validators/bankValidator';
import { BANK_CODE_LENGTH } from '../config/constants';
import { isBankCode } from '../models/BankCode';

export function createPayrollRouter(service: PayrollService): Router {
  const router = Router();

  // ----------------------------------------------------------
  // GET /api/bank-codes
  // Returns all active BOI bank codes for dropdown population
  // ----------------------------------------------------------
  router.get('/bank-codes', async (_req: Request, res: Response) => {
    try {
      const codes = await service.getActiveBankCodes();
      // Format bank codes for display
      const formatted = codes.map(c => ({
        ...c,
        bankCodeDisplay: c.bankCode.padStart(3, '0'),
      }));
      res.json({ bankCodes: formatted });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve bank codes' });
    }
  });

  // ----------------------------------------------------------
  // POST /api/validate-bank-account
  // Validates a bank account triple: bank_code + branch + account
  // ----------------------------------------------------------
  router.post('/validate-bank-account', (req: Request, res: Response) => {
    const { bankCode, branchNumber, accountNumber } = req.body as {
      bankCode:      string;
      branchNumber:  string;
      accountNumber: string;
    };

    // Quick pre-check: bank code must be provided
    if (!bankCode) {
      return res.status(400).json({
        valid: false,
        errors: ['bankCode is required'],
      });
    }

    // Length guard
    if (bankCode.trim().length > BANK_CODE_LENGTH) {
      return res.status(400).json({
        valid:  false,
        errors: [`Bank code must not exceed ${BANK_CODE_LENGTH} digits`],
      });
    }

    const result = validateBankAccount(bankCode, branchNumber, accountNumber);

    if (!result.valid) {
      return res.status(400).json(result);
    }
    return res.json(result);
  });

  // ----------------------------------------------------------
  // GET /api/employees/:id/bank-account
  // Returns the bank account details for an employee
  // ----------------------------------------------------------
  router.get('/employees/:id/bank-account', async (req: Request, res: Response) => {
    try {
      const employee = await service.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      return res.json({
        employeeId:    employee.employeeId,
        fullName:      employee.fullName,
        bankCode:      employee.bankCode.padStart(3, '0'),
        bankName:      service.getBankName(employee.bankCode),
        branchNumber:  employee.branchNumber,
        accountNumber: employee.accountNumber,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ----------------------------------------------------------
  // PUT /api/employees/:id/bank-account
  // Updates an employee's bank account details
  // ----------------------------------------------------------
  router.put('/employees/:id/bank-account', async (req: Request, res: Response) => {
    const { bankCode, branchNumber, accountNumber } = req.body as {
      bankCode:      string;
      branchNumber:  string;
      accountNumber: string;
    };
    const changedBy = (req.headers['x-user-id'] as string) ?? 'system';

    // Inline validation: must be a known code
    if (!bankCode || !/^\d{1,3}$/.test(bankCode.trim())) {
      return res.status(400).json({
        error: `Bank code must be 1–${BANK_CODE_LENGTH} digits (will be zero-padded to ${BANK_CODE_LENGTH})`,
      });
    }

    const codeError = validateBankCodeOnly(bankCode);
    if (codeError) {
      return res.status(400).json({ error: codeError });
    }

    try {
      await service.updateEmployeeBankAccount(
        req.params.id,
        bankCode,
        branchNumber,
        accountNumber,
        changedBy,
      );
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // ----------------------------------------------------------
  // POST /api/payroll-runs
  // Start a new payroll run for a given pay period
  // ----------------------------------------------------------
  router.post('/payroll-runs', async (req: Request, res: Response) => {
    const { payPeriod, createdBy } = req.body as {
      payPeriod:  string;
      createdBy:  string;
    };

    if (!payPeriod || !/^\d{4}-\d{2}$/.test(payPeriod)) {
      return res.status(400).json({ error: 'payPeriod must be in YYYY-MM format' });
    }

    try {
      const run = await service.createPayrollRun(payPeriod, createdBy ?? 'system');
      return res.status(201).json(run);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // ----------------------------------------------------------
  // GET /api/payroll-runs/:runId/bank-summary
  // Summary of net payroll amounts grouped by bank
  // ----------------------------------------------------------
  router.get('/payroll-runs/:runId/bank-summary', async (req: Request, res: Response) => {
    try {
      const grouped = await service.getEntriesByBank(req.params.runId);
      const summary = Array.from(grouped.entries()).map(([bankCode, entries]) => ({
        bankCode:     bankCode.padStart(3, '0'),
        bankName:     service.getBankName(bankCode),
        entryCount:   entries.length,
        totalNet:     entries.reduce((sum, e) => sum + e.netSalary, 0),
        totalGross:   entries.reduce((sum, e) => sum + e.grossSalary, 0),
      }));
      return res.json({ summary });
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
