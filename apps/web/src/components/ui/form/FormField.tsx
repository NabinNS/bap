"use client";

import { ChangeEvent, forwardRef, useRef } from "react";
import { Upload } from "lucide-react";

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

type TextAreaFieldProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type SelectFieldProps = BaseProps & React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { label: string; value: string }[];
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
          className={`mt-1 w-full h-10 px-3 text-sm border focus:outline-none bg-white transition-colors ${
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
