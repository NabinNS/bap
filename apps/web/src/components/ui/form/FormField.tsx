"use client";

import { ChangeEvent, forwardRef, useRef, useState, useEffect, useId, useCallback } from "react";
import { Upload, Loader2 } from "lucide-react";

// BaseProps are shared across every field type
type BaseProps = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
};

type InputFieldProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement> & {
  mono?: boolean;
};

type NumberFieldProps = BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "inputMode" | "pattern"> & {
  allowDecimal?: boolean;
};

type TextAreaFieldProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type SelectFieldProps = BaseProps & React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { label: string; value: string }[];
};

type ComboboxOption = { label: string; value: string };

type ComboboxFieldProps = BaseProps & {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onAddNew?: (query: string) => void;
};

type FileUploadFieldProps = BaseProps & {
  accept?: string;
  preview?: string | null;
  onChange?: (file: File) => void;
};

function Label({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="text-sm font-semibold text-text-default">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function FieldWrapper({ children, hint, error }: { children: React.ReactNode; hint?: string; error?: string }) {
  return (
    <div className="space-y-2">
      {children}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// forwardRef lets React Hook Form attach its internal ref to the real <input> element
// Without this, register() cannot read the input's value
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, required, hint, error, mono, ...props }, ref) => {
    return (
      <FieldWrapper hint={hint} error={error}>
        <Label label={label} required={required} />
        <input
          ref={ref}
          {...props}
          className={`mt-1 w-full h-10 px-3 text-sm border focus:outline-none transition-colors ${
            error ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-slate-500"
          } ${mono ? "font-mono" : ""}`}
        />
      </FieldWrapper>
    );
  }
);
InputField.displayName = "InputField";

// NumberField uses type="text" so the browser never renders the up/down spinner arrows.
// inputMode="numeric" still shows a numeric keyboard on mobile.
// Only digits (and optionally a decimal point) are allowed — anything else is silently dropped.
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ label, required, hint, error, allowDecimal = false, onChange, ...props }, ref) => {
    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
      if (allowDecimal && e.key === ".") return;
      if (allowed.includes(e.key)) return;
      if (e.ctrlKey || e.metaKey) return; // allow copy/paste/select-all
      if (!/^\d$/.test(e.key)) e.preventDefault();
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const pattern = allowDecimal ? /[^\d.]/g : /\D/g;
      e.target.value = e.target.value.replace(pattern, "");
      onChange?.(e);
    }

    return (
      <FieldWrapper hint={hint} error={error}>
        <Label label={label} required={required} />
        <input
          ref={ref}
          type="text"
          inputMode={allowDecimal ? "decimal" : "numeric"}
          pattern={allowDecimal ? "[0-9]*\\.?[0-9]*" : "[0-9]*"}
          onKeyDown={handleKeyDown}
          onChange={handleChange}
          {...props}
          className={`mt-1 w-full h-10 px-3 text-sm border focus:outline-none transition-colors ${
            error ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-slate-500"
          }`}
        />
      </FieldWrapper>
    );
  }
);
NumberField.displayName = "NumberField";

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, required, hint, error, rows = 3, ...props }, ref) => {
    return (
      <FieldWrapper hint={hint} error={error}>
        <Label label={label} required={required} />
        <textarea
          ref={ref}
          rows={rows}
          {...props}
          className={`mt-1 w-full px-3 py-2 text-sm border focus:outline-none resize-none transition-colors ${
            error ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-slate-500"
          }`}
        />
      </FieldWrapper>
    );
  }
);
TextAreaField.displayName = "TextAreaField";

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, required, hint, error, options, ...props }, ref) => {
    return (
      <FieldWrapper hint={hint} error={error}>
        <Label label={label} required={required} />
        <select
          ref={ref}
          {...props}
          className={`mt-1 w-full h-10 px-3 text-sm border focus:outline-none bg-white appearance-none transition-colors ${
            error ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-slate-500"
          }`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FieldWrapper>
    );
  }
);
SelectField.displayName = "SelectField";

// ComboboxField — type directly in the field to filter options, click or press Enter to select.
// Supports keyboard navigation, ARIA accessibility, clearable value, disabled, and loading state.
// Must be wired up via React Hook Form's <Controller> since it has no native select element.
export function ComboboxField({
  label, required, hint, error,
  options, value, onChange,
  placeholder = "Select...",
  disabled = false,
  loading = false,
  emptyMessage = "No results found.",
  onAddNew,
}: ComboboxFieldProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const [inputValue, setInputValue] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filtered = inputValue.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(inputValue.toLowerCase()))
    : options;

  // Sync display text when value changes externally (e.g. form reset)
  useEffect(() => {
    setInputValue(options.find((o) => o.value === value)?.label ?? "");
  }, [value, options]);

  // Reset active highlight when filtered list changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [inputValue]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const closeAndRevert = useCallback(() => {
    setInputValue(options.find((o) => o.value === value)?.label ?? "");
    setOpen(false);
    setActiveIndex(-1);
  }, [value, options]);

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAndRevert();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [closeAndRevert]);

  function select(opt: ComboboxOption) {
    onChange(opt.value);
    setInputValue(opt.label);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setOpen(true);
    if (e.target.value === "") onChange("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setOpen(true);
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;

      case "Enter":
        e.preventDefault();
        if (open && activeIndex >= 0 && filtered[activeIndex]) {
          select(filtered[activeIndex]);
        }
        break;

      case "Escape":
        closeAndRevert();
        inputRef.current?.blur();
        break;

      case "Tab":
        closeAndRevert();
        break;
    }
  }

  const borderClass = error
    ? "border-red-400 focus:border-red-500"
    : "border-slate-300 focus:border-slate-500";

  return (
    <FieldWrapper hint={hint} error={error}>
      <Label label={label} required={required} />
      <div ref={containerRef} className="relative mt-1">
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-required={required}
          aria-invalid={!!error}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full h-10 px-3 pr-8 text-sm border focus:outline-none bg-white transition-colors ${borderClass} ${
            disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""
          }`}
        />

        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <Loader2 className="h-3.5 w-3.5 text-text-muted animate-spin" />
          </div>
        )}

        {open && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="absolute z-50 mt-1 w-full bg-white border border-slate-200 shadow-lg max-h-48 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <>
                <li role="option" aria-selected={false} className="px-3 py-2 text-sm text-text-muted">
                  {emptyMessage}
                </li>
                {onAddNew && inputValue.trim() && (
                  <li
                    role="option"
                    aria-selected={false}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onAddNew(inputValue.trim()); setOpen(false); }}
                    className="px-3 py-2 text-sm font-bold text-black cursor-pointer hover:bg-slate-50 border-t border-slate-100 transition-colors"
                  >
                    + Add "{inputValue.trim()}"
                  </li>
                )}
              </>
            ) : (
              filtered.map((opt, i) => (
                <li
                  key={opt.value}
                  id={`${listboxId}-option-${i}`}
                  role="option"
                  aria-selected={opt.value === value}
                  onMouseDown={(e) => e.preventDefault()} // keep input focused so onKeyDown still fires
                  onClick={() => select(opt)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors ${
                    opt.value === value
                      ? "bg-slate-100 font-semibold"
                      : i === activeIndex
                      ? "bg-slate-50"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && (
                    <span className="text-xs text-slate-400 shrink-0 ml-2">selected</span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </FieldWrapper>
  );
}

// FileUploadField is not registered with React Hook Form directly —
// file inputs are handled separately via Controller or a manual onChange
export function FileUploadField({ label, required, hint, error, accept = "image/*", preview, onChange }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && onChange) onChange(file);
  }

  return (
    <FieldWrapper hint={hint} error={error}>
      <Label label={label} required={required} />
      <div
        onClick={() => inputRef.current?.click()}
        className={`mt-1 flex flex-col items-center justify-center h-28 border-2 border-dashed cursor-pointer transition-colors ${
          error ? "border-red-400 hover:border-red-500" : "border-slate-300 hover:border-slate-400"
        }`}
      >
        {preview ? (
          <img src={preview} alt="preview" className="h-full w-full object-cover" />
        ) : (
          <>
            <Upload className="h-5 w-5 text-text-muted mb-1" />
            <p className="text-sm text-text-muted">Click to upload</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </FieldWrapper>
  );
}
