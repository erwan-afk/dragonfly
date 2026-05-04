import { useEffect, useMemo, useRef, useState } from 'react';
import { getLocaleForCurrency } from '@/utils/format-price';

type ClassNames = {
  label?: string;
  inputWrapper?: string;
  input?: string;
  mainWrapper?: string;
  errorMessage?: string;
};

export default function NumberInput({
  label,
  labelPlacement = 'outside',
  placeholder,
  value,
  onValueChange,
  isDisabled,
  isInvalid,
  errorMessage,
  className,
  classNames,
  currency
}: {
  label?: string;
  labelPlacement?: 'outside' | 'inside';
  placeholder?: string;
  value: number;
  onValueChange: (val: number) => void;
  isDisabled?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
  classNames?: ClassNames;
  currency?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat(getLocaleForCurrency(currency), {
        maximumFractionDigits: 0
      }),
    [currency]
  );

  const formatNumber = (n: number) => {
    if (!Number.isFinite(n)) return '';
    return formatter.format(Math.max(0, Math.trunc(n)));
  };

  const [displayValue, setDisplayValue] = useState<string>(() =>
    value > 0 ? formatNumber(value) : ''
  );

  // Keep display in sync with external value updates.
  useEffect(() => {
    const next = value > 0 ? formatNumber(value) : '';
    setDisplayValue(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commitDigits = (raw: string) => {
    const digitsOnly = raw.replace(/[^\d]/g, '');
    if (!digitsOnly) {
      console.log('[NumberInput] commitDigits -> 0 (empty)');
      onValueChange(0);
      return;
    }
    const n = Number(digitsOnly);
    console.log('[NumberInput] commitDigits', { raw, digitsOnly, n });
    onValueChange(Number.isFinite(n) ? Math.max(0, n) : 0);
  };

  return (
    <div className={classNames?.mainWrapper}>
      {label && labelPlacement === 'outside' && (
        <label className={classNames?.label}>{label}</label>
      )}

      <div className={classNames?.inputWrapper}>
        {label && labelPlacement === 'inside' && (
          <label className={classNames?.label}>{label}</label>
        )}
        <input
          ref={inputRef}
          className={[className, classNames?.input].filter(Boolean).join(' ')}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={isDisabled}
          placeholder={placeholder}
          value={displayValue}
          onChange={(e) => {
            const nextRaw = e.target.value;
            const digitsOnly = nextRaw.replace(/[^\d]/g, '');
            setDisplayValue(digitsOnly);
            commitDigits(digitsOnly);
          }}
          onBlur={() => {
            // Format nicely on blur.
            setDisplayValue(value > 0 ? formatNumber(value) : '');
          }}
          onFocus={() => {
            // Show raw digits on focus to ease editing.
            setDisplayValue(value > 0 ? String(Math.max(0, Math.trunc(value))) : '');
          }}
          aria-invalid={isInvalid ? 'true' : 'false'}
        />
      </div>

      {isInvalid && errorMessage ? (
        <div className={classNames?.errorMessage}>{errorMessage}</div>
      ) : null}
    </div>
  );
}


