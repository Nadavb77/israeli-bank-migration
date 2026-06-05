// ============================================================
// Israeli Payroll System — Payroll Service
// Bank of Israel bank codes: 2-digit format (PRE-MIGRATION)
// ============================================================

import { Pool } from 'pg';
import { BankCode, BankCodeRecord, BankAccount, BANK_CODE_LABELS } from '../models/BankCode';
import { validateBankAccount, normalizeBankCode, formatBankCode } from '../validators/bankValidator';
import { BANK_CODE_LENGTH, BANK_CODE_DISPLAY_WIDTH } from '../config/constants';

export interface Employee {
  employeeId:    string;
  fullName:      string;
  idNumber:      string;
  /** 2-digit BOI bank code. TODO (MIGRATION): → 3-digit */
  bankCode:      BankCode;
  branchNumber:  string;
  accountNumber: string;
  department?:   string;
  position?:     string;
  hireDate:      Date;
  active:        boolean;
}

export interface PayrollEntry {
  entryId:       string;
  runId:         string;
  employeeId:    string;
  /** 2-digit BOI bank code snapshot. TODO (MIGRATION): → 3-digit */
  bankCode:      BankCode;
  branchNumber:  string;
  accountNumber: string;
  grossSalary:   number;
  incomeTax:     number;
  nationalIns:   number;
  healthIns:     number;
  pension:       number;
  netSalary:     number;
}

export interface PayrollRun {
  runId:        string;
  runDate:      Date;
  payPeriod:    string;
  status:       'pending' | 'processing' | 'completed' | 'failed';
  totalGross:   number;
  totalNet:     number;
}

export class PayrollService {
  constructor(private readonly db: Pool) {}

  // ----------------------------------------------------------
  // Bank code lookups
  // ----------------------------------------------------------

  /**
   * Fetch all active bank codes from the database.
   * Returns records with 2-digit codes.
   * TODO (MIGRATION): response objects will have 3-digit codes after migration
   */
  async getActiveBankCodes(): Promise<BankCodeRecord[]> {
    const result = await this.db.query<{
      bank_code:  string;
      bank_name:  string;
      swift_code: string | null;
      active:     boolean;
    }>(
      // TODO (MIGRATION): LPAD 2 → 3 in this query
      `SELECT LPAD(bank_code, 2, '0') AS bank_code, bank_name, swift_code, active
       FROM bank_codes
       WHERE active = TRUE
       ORDER BY bank_code`
    );
    return result.rows.map(r => ({
      bankCode:  r.bank_code as BankCode,
      bankName:  r.bank_name,
      swiftCode: r.swift_code,
      active:    r.active,
    }));
  }

  /**
   * Look up a bank name by its code.
   * TODO (MIGRATION): BANK_CODE_LABELS keys will update automatically
   */
  getBankName(bankCode: string): string {
    // TODO (MIGRATION): normalizeBankCode pads to 2 → will pad to 3
    const normalized = normalizeBankCode(bankCode);
    return BANK_CODE_LABELS[normalized as BankCode] ?? `Unknown bank (${normalized})`;
  }

  // ----------------------------------------------------------
  // Employee management
  // ----------------------------------------------------------

  /**
   * Retrieve an employee by ID.
   */
  async getEmployee(employeeId: string): Promise<Employee | null> {
    const result = await this.db.query<{
      employee_id:    string;
      full_name:      string;
      id_number:      string;
      bank_code:      string;
      branch_number:  string;
      account_number: string;
      department:     string | null;
      position:       string | null;
      hire_date:      Date;
      active:         boolean;
    }>(
      // TODO (MIGRATION): LPAD 2 → 3
      `SELECT employee_id, full_name, id_number,
              LPAD(bank_code, 2, '0') AS bank_code,
              branch_number, account_number, department, position, hire_date, active
       FROM employees
       WHERE employee_id = $1`,
      [employeeId]
    );
    if (result.rowCount === 0) return null;
    const r = result.rows[0];
    return {
      employeeId:    r.employee_id,
      fullName:      r.full_name,
      idNumber:      r.id_number,
      bankCode:      r.bank_code as BankCode,
      branchNumber:  r.branch_number,
      accountNumber: r.account_number,
      department:    r.department ?? undefined,
      position:      r.position ?? undefined,
      hireDate:      r.hire_date,
      active:        r.active,
    };
  }

  /**
   * Update an employee's bank account details.
   * Validates the new bank code before persisting.
   * TODO (MIGRATION): validateBankAccount internally checks 2-digit → will check 3-digit
   */
  async updateEmployeeBankAccount(
    employeeId:    string,
    bankCode:      string,
    branchNumber:  string,
    accountNumber: string,
    changedBy:     string,
  ): Promise<void> {
    const validation = validateBankAccount(bankCode, branchNumber, accountNumber);
    if (!validation.valid) {
      throw new Error(`Invalid bank account: ${validation.errors.join('; ')}`);
    }

    const { normalized } = validation;
    if (!normalized) throw new Error('Normalization failed unexpectedly');

    await this.db.query(
      `SELECT update_employee_bank_details($1, $2, $3, $4, $5)`,
      [employeeId, normalized.bankCode, normalized.branchNumber, normalized.accountNumber, changedBy]
    );
  }

  // ----------------------------------------------------------
  // Payroll run management
  // ----------------------------------------------------------

  /**
   * Create a new payroll run for the given pay period.
   */
  async createPayrollRun(payPeriod: string, createdBy: string): Promise<PayrollRun> {
    if (!/^\d{4}-\d{2}$/.test(payPeriod)) {
      throw new Error(`Invalid pay period format: "${payPeriod}". Expected YYYY-MM.`);
    }
    const result = await this.db.query<{
      run_id:      string;
      run_date:    Date;
      pay_period:  string;
      status:      string;
      total_gross: string;
      total_net:   string;
    }>(
      `INSERT INTO payroll_runs (run_date, pay_period, created_by)
       VALUES (CURRENT_DATE, $1, $2)
       RETURNING run_id, run_date, pay_period, status, total_gross, total_net`,
      [payPeriod, createdBy]
    );
    const r = result.rows[0];
    return {
      runId:      r.run_id,
      runDate:    r.run_date,
      payPeriod:  r.pay_period,
      status:     r.status as PayrollRun['status'],
      totalGross: parseFloat(r.total_gross),
      totalNet:   parseFloat(r.total_net),
    };
  }

  /**
   * Process all active employees into a payroll run.
   * Validates each employee's bank code during processing.
   * TODO (MIGRATION): formatting calls use BANK_CODE_DISPLAY_WIDTH = 2 → 3
   */
  async processPayrollRun(runId: string, grossSalaryMap: Record<string, number>): Promise<void> {
    const employees = await this.getAllActiveEmployees();
    let totalGross = 0;
    let totalNet   = 0;

    for (const emp of employees) {
      const gross = grossSalaryMap[emp.employeeId];
      if (!gross) continue;

      // Validate bank code is still a valid 2-digit code before processing
      // TODO (MIGRATION): this will naturally validate 3-digit after validator update
      const validation = validateBankAccount(emp.bankCode, emp.branchNumber, emp.accountNumber);
      if (!validation.valid) {
        console.error(
          // TODO (MIGRATION): BANK_CODE_DISPLAY_WIDTH is 2 → 3
          `Skipping employee ${emp.fullName}: invalid bank account ` +
          `(bank: ${formatBankCode(emp.bankCode).padStart(BANK_CODE_DISPLAY_WIDTH, '0')})`
        );
        continue;
      }

      const result = await this.db.query<{ net_salary: string }>(
        `SELECT create_payroll_entry($1, $2, $3, $4, $5, $6) AS entry_id`,
        [runId, emp.employeeId, emp.bankCode, emp.branchNumber, emp.accountNumber, gross]
      );

      totalGross += gross;
    }

    // Update run totals
    await this.db.query(
      `UPDATE payroll_runs SET total_gross = $1, total_net = $2, status = 'completed' WHERE run_id = $3`,
      [totalGross, totalNet, runId]
    );
  }

  /**
   * Retrieve all entries for a payroll run, grouped by bank code.
   * Used by the MASAV file generator.
   * TODO (MIGRATION): result bank_code values will be 2-digit → update to 3-digit
   */
  async getEntriesByBank(runId: string): Promise<Map<string, PayrollEntry[]>> {
    const result = await this.db.query<{
      entry_id:       string;
      bank_code:      string;
      branch_number:  string;
      account_number: string;
      gross_salary:   string;
      income_tax:     string;
      national_ins:   string;
      health_ins:     string;
      pension:        string;
      net_salary:     string;
      employee_id:    string;
    }>(
      // TODO (MIGRATION): LPAD 2 → 3
      `SELECT entry_id, LPAD(bank_code, 2, '0') AS bank_code,
              branch_number, account_number, gross_salary, income_tax,
              national_ins, health_ins, pension, net_salary, employee_id
       FROM payroll_entries
       WHERE run_id = $1
       ORDER BY bank_code, branch_number, account_number`,
      [runId]
    );

    const grouped = new Map<string, PayrollEntry[]>();
    for (const r of result.rows) {
      const entries = grouped.get(r.bank_code) ?? [];
      entries.push({
        entryId:       r.entry_id,
        runId,
        employeeId:    r.employee_id,
        bankCode:      r.bank_code as BankCode,
        branchNumber:  r.branch_number,
        accountNumber: r.account_number,
        grossSalary:   parseFloat(r.gross_salary),
        incomeTax:     parseFloat(r.income_tax),
        nationalIns:   parseFloat(r.national_ins),
        healthIns:     parseFloat(r.health_ins),
        pension:       parseFloat(r.pension),
        netSalary:     parseFloat(r.net_salary),
      });
      grouped.set(r.bank_code, entries);
    }
    return grouped;
  }

  private async getAllActiveEmployees(): Promise<Employee[]> {
    const result = await this.db.query<{
      employee_id:    string;
      full_name:      string;
      id_number:      string;
      bank_code:      string;
      branch_number:  string;
      account_number: string;
      hire_date:      Date;
    }>(
      // TODO (MIGRATION): LPAD 2 → 3
      `SELECT employee_id, full_name, id_number,
              LPAD(bank_code, 2, '0') AS bank_code,
              branch_number, account_number, hire_date
       FROM employees
       WHERE active = TRUE`
    );
    return result.rows.map(r => ({
      employeeId:    r.employee_id,
      fullName:      r.full_name,
      idNumber:      r.id_number,
      bankCode:      r.bank_code as BankCode,
      branchNumber:  r.branch_number,
      accountNumber: r.account_number,
      hireDate:      r.hire_date,
      active:        true,
    }));
  }
}
