"use client";

import { ChangeEvent, useRef } from "react";
import { Upload } from "lucide-react";

type BaseProps = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
};

type InputFieldProps = BaseProps & {
  type?: "text" | "email" | "number" | "password" | "url" | "tel";
  placeholder?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  mono?: boolean;
};

type TextAreaFieldProps = BaseProps & {
  placeholder?: string;
  value?: string;
  rows?: number;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
};

type SelectFieldProps = BaseProps & {
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
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

export function InputField({ label, required, hint, error, type = "text", placeholder, value, onChange, mono }: InputFieldProps) {
  return (
    <FieldWrapper hint={hint} error={error}>
      <Label label={label} required={required} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`mt-1 w-full h-10 px-3 text-sm border focus:outline-none transition-colors ${
          error ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-slate-500"
        } ${mono ? "font-mono" : ""}`}
      />
    </FieldWrapper>
  );
}

export function TextAreaField({ label, required, hint, error, placeholder, value, rows = 3, onChange }: TextAreaFieldProps) {
  return (
    <FieldWrapper hint={hint} error={error}>
      <Label label={label} required={required} />
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`mt-1 w-full px-3 py-2 text-sm border focus:outline-none resize-none transition-colors ${
          error ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-slate-500"
        }`}
      />
    </FieldWrapper>
  );
}

export function SelectField({ label, required, hint, error, value, onChange, options }: SelectFieldProps) {
  return (
    <FieldWrapper hint={hint} error={error}>
      <Label label={label} required={required} />
      <select
        value={value}
        onChange={onChange}
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
