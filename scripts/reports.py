#!/usr/bin/env python3
"""
Israeli Payroll System — Payroll Reports
Bank of Israel bank codes: 3-digit format (POST-MIGRATION)

Generates payroll summary and bank distribution reports.
Bank code column width is driven by BANK_CODE_WIDTH.
"""

import csv
import io
from datetime import date
from typing import List, Optional
import psycopg2

# ============================================================
# Constants
# ============================================================

BANK_CODE_WIDTH = 3

# Column widths for fixed-width report formatting
COL_BANK_CODE  = BANK_CODE_WIDTH
COL_BANK_NAME  = 30
COL_BRANCH     = 6
COL_ACCOUNT    = 14
COL_NAME       = 25
COL_GROSS      = 12
COL_NET        = 12
COL_COUNT      = 8

# Header separator width — sums all columns + padding
SEPARATOR_WIDTH = (
    COL_BANK_CODE + 2 +
    COL_BANK_NAME + 2 +
    COL_BRANCH    + 2 +
    COL_ACCOUNT   + 2 +
    COL_NAME      + 2 +
    COL_GROSS     + 2 +
    COL_NET       + 2
)


def _format_bank_code(code: str) -> str:
    """Format a bank code for display with zero-padding."""
    return code.strip().zfill(BANK_CODE_WIDTH)


def _format_ils(amount: float) -> str:
    """Format an ILS amount with thousands separator."""
    return f"{amount:,.2f}"


# ============================================================
# Report 1: Employee bank distribution
# ============================================================

def report_bank_distribution(conn) -> str:
    """
    Returns a fixed-width report showing how many employees
    bank at each BOI institution, plus total net payroll.
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            LPAD(e.bank_code, 3, '0')          AS bank_code,
            bc.bank_name,
            COUNT(e.employee_id)               AS emp_count,
            COALESCE(SUM(pe.net_salary), 0)    AS total_net
        FROM employees e
        JOIN bank_codes bc ON bc.bank_code = e.bank_code
        LEFT JOIN payroll_entries pe ON pe.employee_id = e.employee_id
        WHERE e.active = TRUE
        GROUP BY e.bank_code, bc.bank_name
        ORDER BY emp_count DESC
    """)
    rows = cursor.fetchall()

    lines = []
    lines.append("PAYROLL DISTRIBUTION BY BANK — Bank of Israel")
    lines.append(f"Generated: {date.today().isoformat()}")
    lines.append("=" * SEPARATOR_WIDTH)

    # Header row
    header = (
        f"{'Code':>{COL_BANK_CODE}}  "
        f"{'Bank Name':<{COL_BANK_NAME}}  "
        f"{'Employees':>{COL_COUNT}}  "
        f"{'Total Net (ILS)':>{COL_GROSS}}"
    )
    lines.append(header)
    lines.append("-" * SEPARATOR_WIDTH)

    for row in rows:
        bank_code, bank_name, emp_count, total_net = row
        line = (
            f"{_format_bank_code(bank_code):>{COL_BANK_CODE}}  "
            f"{bank_name:<{COL_BANK_NAME}}  "
            f"{emp_count:>{COL_COUNT}}  "
            f"{_format_ils(float(total_net)):>{COL_GROSS}}"
        )
        lines.append(line)

    lines.append("=" * SEPARATOR_WIDTH)
    return "\n".join(lines)


# ============================================================
# Report 2: Full payroll ledger for a pay period
# ============================================================

def report_payroll_ledger(conn, pay_period: str) -> str:
    """
    Full payroll ledger for a given pay period (YYYY-MM format).
    One row per employee showing gross, deductions, and net.
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            e.full_name,
            LPAD(pe.bank_code, 3, '0')   AS bank_code,
            pe.branch_number,
            pe.account_number,
            pe.gross_salary,
            (pe.income_tax + pe.national_ins + pe.health_ins + pe.pension)
                                         AS total_deductions,
            pe.net_salary
        FROM payroll_entries pe
        JOIN payroll_runs pr ON pr.run_id = pe.run_id
        JOIN employees    e  ON e.employee_id = pe.employee_id
        WHERE pr.pay_period = %s
        ORDER BY e.full_name
    """, (pay_period,))
    rows = cursor.fetchall()

    lines = []
    lines.append(f"PAYROLL LEDGER — Period: {pay_period}")
    lines.append(f"Generated: {date.today().isoformat()}")
    lines.append("=" * SEPARATOR_WIDTH)

    # Column headers
    header = (
        f"{'Name':<{COL_NAME}}  "
        f"{'Code':>{COL_BANK_CODE}}  "
        f"{'Branch':>{COL_BRANCH}}  "
        f"{'Account':<{COL_ACCOUNT}}  "
        f"{'Gross (ILS)':>{COL_GROSS}}  "
        f"{'Deductions':>{COL_NET}}  "
        f"{'Net (ILS)':>{COL_NET}}"
    )
    lines.append(header)
    lines.append("-" * SEPARATOR_WIDTH)

    total_gross = 0.0
    total_net   = 0.0

    for row in rows:
        name, bank_code, branch, account, gross, deductions, net = row
        gross      = float(gross)
        deductions = float(deductions)
        net_val    = float(net)
        total_gross += gross
        total_net   += net_val

        line = (
            f"{name[:COL_NAME]:<{COL_NAME}}  "
            f"{_format_bank_code(bank_code):>{COL_BANK_CODE}}  "
            f"{branch:>{COL_BRANCH}}  "
            f"{account:<{COL_ACCOUNT}}  "
            f"{_format_ils(gross):>{COL_GROSS}}  "
            f"{_format_ils(deductions):>{COL_NET}}  "
            f"{_format_ils(net_val):>{COL_NET}}"
        )
        lines.append(line)

    lines.append("=" * SEPARATOR_WIDTH)
    lines.append(
        f"{'TOTALS':<{COL_NAME}}  "
        f"{'':{COL_BANK_CODE + COL_BRANCH + COL_ACCOUNT + 6}}  "
        f"{_format_ils(total_gross):>{COL_GROSS}}  "
        f"{'':>{COL_NET}}  "
        f"{_format_ils(total_net):>{COL_NET}}"
    )
    return "\n".join(lines)


# ============================================================
# Report 3: CSV export for external systems
# ============================================================

def export_csv(conn, pay_period: str) -> str:
    """
    CSV export of payroll data for integration with external systems.
    The 'bank_code' column is zero-padded to BANK_CODE_WIDTH digits.
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            e.id_number,
            e.full_name,
            LPAD(pe.bank_code, 3, '0')   AS bank_code,
            pe.branch_number,
            pe.account_number,
            pe.gross_salary,
            pe.income_tax,
            pe.national_ins,
            pe.health_ins,
            pe.pension,
            pe.net_salary
        FROM payroll_entries pe
        JOIN payroll_runs pr ON pr.run_id = pe.run_id
        JOIN employees    e  ON e.employee_id = pe.employee_id
        WHERE pr.pay_period = %s
        ORDER BY e.full_name
    """, (pay_period,))
    rows = cursor.fetchall()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        'id_number', 'full_name', 'bank_code', 'branch_number', 'account_number',
        'gross_salary', 'income_tax', 'national_ins', 'health_ins', 'pension', 'net_salary',
    ])

    for row in rows:
        id_num, name, bank_code, branch, account, gross, tax, nat_ins, health, pension, net = row
        writer.writerow([
            id_num,
            name,
            bank_code.strip().zfill(BANK_CODE_WIDTH),
            branch,
            account,
            f"{float(gross):.2f}",
            f"{float(tax):.2f}",
            f"{float(nat_ins):.2f}",
            f"{float(health):.2f}",
            f"{float(pension):.2f}",
            f"{float(net):.2f}",
        ])

    return output.getvalue()


# ============================================================
# Report 4: Bank code validation report
# ============================================================

def report_bank_code_validation(conn) -> str:
    """
    Checks all employees for invalid or unrecognized bank codes.
    Flags any code that is not a valid 3-digit BOI code.
    """
    import re
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.employee_id, e.full_name, e.bank_code
        FROM employees e
        WHERE e.active = TRUE
        ORDER BY e.bank_code, e.full_name
    """)
    rows = cursor.fetchall()

    issues = []
    for emp_id, name, bank_code in rows:
        normalized = bank_code.strip().zfill(BANK_CODE_WIDTH)
        if not re.match(r'^\d{3}$', normalized):
            issues.append(f"  [{emp_id}] {name}: invalid code '{bank_code}'")

    lines = ["BANK CODE VALIDATION REPORT"]
    lines.append(
        f"Expected format: {BANK_CODE_WIDTH}-digit numeric code (e.g. '010')"
    )
    lines.append(f"Employees checked: {len(rows)}")

    if issues:
        lines.append(f"Issues found: {len(issues)}")
        lines.extend(issues)
    else:
        lines.append("No issues found. All bank codes are valid.")

    return "\n".join(lines)


# ============================================================
# Main entry point
# ============================================================

if __name__ == '__main__':
    import os

    db_url = os.environ.get('DATABASE_URL', 'postgresql://localhost/payroll_dev')

    try:
        conn = psycopg2.connect(db_url)

        print(report_bank_distribution(conn))
        print()
        print(report_payroll_ledger(conn, '2026-06'))
        print()
        print(report_bank_code_validation(conn))

        csv_output = export_csv(conn, '2026-06')
        with open('payroll_2026_06.csv', 'w') as f:
            f.write(csv_output)
        print(f"\nCSV exported: payroll_2026_06.csv")
        print(f"Bank code column width: {BANK_CODE_WIDTH} digits")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")
        print("Set DATABASE_URL env var to connect to a real database.")
