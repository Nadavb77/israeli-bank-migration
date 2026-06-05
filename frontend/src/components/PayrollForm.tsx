// ============================================================
// Israeli Payroll System — Payroll Entry Form (React)
// Bank of Israel bank codes: 3-digit format (POST-MIGRATION)
// ============================================================

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

const BANK_CODE_MAX_LENGTH = 3;
const BANK_CODE_PLACEHOLDER = 'e.g. 010';

interface BankCodeOption {
  /** 3-digit code */
  bankCode:  string;
  bankName:  string;
}

interface PayrollFormValues {
  employeeId:    string;
  /** 3-digit bank code */
  bankCode:      string;
  branchNumber:  string;
  accountNumber: string;
  grossSalary:   string;
}

interface FormErrors {
  bankCode?:      string;
  branchNumber?:  string;
  accountNumber?: string;
  grossSalary?:   string;
}

interface PayrollFormProps {
  employeeId:   string;
  employeeName: string;
  onSubmit:     (values: PayrollFormValues) => Promise<void>;
  onCancel:     () => void;
}

export default function PayrollForm({
  employeeId,
  employeeName,
  onSubmit,
  onCancel,
}: PayrollFormProps) {
  const [values, setValues] = useState<PayrollFormValues>({
    employeeId,
    bankCode:      '',
    branchNumber:  '',
    accountNumber: '',
    grossSalary:   '',
  });

  const [errors, setErrors]               = useState<FormErrors>({});
  const [bankOptions, setBankOptions]     = useState<BankCodeOption[]>([]);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);

  // Fetch bank code dropdown options on mount
  useEffect(() => {
    fetch('/api/bank-codes')
      .then(r => r.json())
      .then((data: { bankCodes: BankCodeOption[] }) => {
        setBankOptions(data.bankCodes);
      })
      .catch(() => {
        // Fallback: populate from known codes
        setBankOptions([
          { bankCode: '004', bankName: 'Bank Yahav' },
          { bankCode: '010', bankName: 'Bank Leumi' },
          { bankCode: '011', bankName: 'Discount Bank' },
          { bankCode: '012', bankName: 'Bank Hapoalim' },
          { bankCode: '013', bankName: 'Union Bank (Igud)' },
          { bankCode: '014', bankName: 'Otzar Hahayal Bank' },
          { bankCode: '017', bankName: 'Mercantile Discount Bank' },
          { bankCode: '020', bankName: 'Mizrahi-Tefahot Bank' },
          { bankCode: '026', bankName: 'U-Bank' },
          { bankCode: '031', bankName: 'International Bank (FIBI)' },
          { bankCode: '034', bankName: 'Arab Israel Bank' },
          { bankCode: '046', bankName: 'Bank of Jerusalem' },
          { bankCode: '052', bankName: 'Bank Poalei Agudat Israel' },
          { bankCode: '090', bankName: 'Israel Post Bank' },
        ]);
      });
  }, []);

  // ----------------------------------------------------------
  // Field-level validation
  // ----------------------------------------------------------

  function validateField(name: keyof PayrollFormValues, value: string): string | undefined {
    switch (name) {
      case 'bankCode': {
        if (!value) return 'Bank code is required';
        if (!/^\d{3}$/.test(value.padStart(3, '0'))) {
          return `Bank code must be a valid 3-digit BOI code`;
        }
        return undefined;
      }
      case 'branchNumber': {
        if (!value) return 'Branch number is required';
        if (!/^\d{3}$/.test(value)) return 'Branch must be exactly 3 digits';
        return undefined;
      }
      case 'accountNumber': {
        if (!value) return 'Account number is required';
        if (!/^\d{6,13}$/.test(value)) return 'Account must be 6–13 digits';
        return undefined;
      }
      case 'grossSalary': {
        if (!value) return 'Gross salary is required';
        const n = parseFloat(value);
        if (isNaN(n) || n <= 0) return 'Gross salary must be a positive number';
        return undefined;
      }
      default:
        return undefined;
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));

    // Clear error on change
    const error = validateField(name as keyof PayrollFormValues, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }

  // ----------------------------------------------------------
  // Form-level validation
  // ----------------------------------------------------------

  function validateAll(): boolean {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(values) as Array<keyof PayrollFormValues>).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }

  // ----------------------------------------------------------
  // Submit
  // ----------------------------------------------------------

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;

    // Final bank code check before submit
    const normalizedBankCode = values.bankCode.trim().padStart(3, '0');
    if (!/^\d{3}$/.test(normalizedBankCode)) {
      setErrors(prev => ({ ...prev, bankCode: 'Invalid bank code format' }));
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({ ...values, bankCode: normalizedBankCode });
    } catch (err: any) {
      setSubmitError(err.message ?? 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="payroll-form-container">
      <h2>Payroll Entry — {employeeName}</h2>

      <form onSubmit={handleSubmit} noValidate>

        {/* Bank Code */}
        <div className="form-group">
          <label htmlFor="bankCode">
            Bank Code <span className="hint">(3-digit BOI code)</span>
          </label>

          {/* Dropdown option — preferred */}
          <select
            id="bankCode"
            name="bankCode"
            value={values.bankCode}
            onChange={handleChange}
            aria-describedby="bankCodeError"
            aria-invalid={!!errors.bankCode}
          >
            <option value="">-- Select bank --</option>
            {bankOptions.map(opt => (
              <option key={opt.bankCode} value={opt.bankCode}>
                {opt.bankCode.padStart(3, '0')} — {opt.bankName}
              </option>
            ))}
          </select>

          {/* OR: manual text input for direct entry */}
          <input
            type="text"
            id="bankCodeManual"
            name="bankCode"
            value={values.bankCode}
            onChange={handleChange}
            placeholder={BANK_CODE_PLACEHOLDER}
            maxLength={BANK_CODE_MAX_LENGTH}
            inputMode="numeric"
            pattern="\d{3}"
            autoComplete="off"
            aria-label="Manual bank code entry"
          />

          {errors.bankCode && (
            <span id="bankCodeError" className="field-error" role="alert">
              {errors.bankCode}
            </span>
          )}
        </div>

        {/* Branch Number — stays 3 digits, no migration needed */}
        <div className="form-group">
          <label htmlFor="branchNumber">Branch Number <span className="hint">(3 digits)</span></label>
          <input
            type="text"
            id="branchNumber"
            name="branchNumber"
            value={values.branchNumber}
            onChange={handleChange}
            placeholder="e.g. 100"
            maxLength={3}
            inputMode="numeric"
            pattern="\d{3}"
            autoComplete="off"
          />
          {errors.branchNumber && (
            <span className="field-error" role="alert">{errors.branchNumber}</span>
          )}
        </div>

        {/* Account Number */}
        <div className="form-group">
          <label htmlFor="accountNumber">Account Number <span className="hint">(6–13 digits)</span></label>
          <input
            type="text"
            id="accountNumber"
            name="accountNumber"
            value={values.accountNumber}
            onChange={handleChange}
            placeholder="e.g. 1234567"
            maxLength={13}
            inputMode="numeric"
            pattern="\d{6,13}"
            autoComplete="off"
          />
          {errors.accountNumber && (
            <span className="field-error" role="alert">{errors.accountNumber}</span>
          )}
        </div>

        {/* Gross Salary */}
        <div className="form-group">
          <label htmlFor="grossSalary">Gross Salary (ILS)</label>
          <input
            type="number"
            id="grossSalary"
            name="grossSalary"
            value={values.grossSalary}
            onChange={handleChange}
            placeholder="e.g. 15000"
            min="1"
            step="0.01"
          />
          {errors.grossSalary && (
            <span className="field-error" role="alert">{errors.grossSalary}</span>
          )}
        </div>

        {submitError && (
          <div className="submit-error" role="alert">{submitError}</div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit Payroll Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
