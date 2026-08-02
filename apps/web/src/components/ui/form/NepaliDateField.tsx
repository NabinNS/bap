"use client";

import "@zener/nepali-datepicker-react/index.css";
import NepaliDatePicker, { NepaliDate, toAD, toBS } from "@zener/nepali-datepicker-react";

type Props = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  value?: string | null;
  onChange?: (adDate: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

function Label({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="text-sm font-semibold text-text-default">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

export function NepaliDateField({ label, required, hint, error, value, onChange, placeholder = "Select date", disabled }: Props) {
  const bsValue = (() => {
    if (!value) return null;
    try {
      const bs = toBS(value);
      return new NepaliDate(bs.year, bs.month - 1, bs.date);
    } catch {
      return null;
    }
  })();

  function handleChange(date: NepaliDate | null) {
    if (!date || !onChange) { onChange?.(null); return; }
    try {
      const bsStr = `${date.getFullYear()}-${String((date.getMonth() as number) + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const ad = toAD(bsStr);
      const adStr = `${ad.year}-${String(ad.month).padStart(2, "0")}-${String(ad.date).padStart(2, "0")}`;
      onChange(adStr);
    } catch {
      onChange(null);
    }
  }

  return (
    <div className="space-y-2">
      <Label label={label} required={required} />
      <div className={`nepali-date-field mt-1 ${error ? "nepali-date-field--error" : ""} ${disabled ? "opacity-50" : ""}`}>
        <NepaliDatePicker
          value={bsValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          lang="en"
        />
      </div>
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
