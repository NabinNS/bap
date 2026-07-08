"use client";

import { useRef, useState, useEffect } from "react";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  value: File[];
  onChange: (files: File[]) => void;
  max?: number;
  groupName?: string;
  onGroupNameChange?: (name: string) => void;
};

export function MultiImageUpload({ label, required, hint, error, value, onChange, max, groupName, onGroupNameChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = value.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [value]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? null : (i + 1) % previews.length));
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? null : (i - 1 + previews.length) % previews.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, previews.length]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const remaining = max !== undefined ? max - value.length : files.length;
    onChange([...value, ...files.slice(0, remaining)]);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  const atMax = max !== undefined && value.length >= max;

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-text-default">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {max && (
            <span className="text-xs text-text-muted">{value.length}/{max}</span>
          )}
        </div>
      )}

      {onGroupNameChange && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Group name (e.g. Product photos)"
            value={groupName ?? ""}
            onChange={(e) => onGroupNameChange(e.target.value)}
            className="flex-1 h-10 px-3 text-sm border border-slate-400 focus:border-slate-600 focus:outline-none transition-colors"
          />
          <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-10 px-3 bg-black text-white text-xs font-medium hover:bg-gray-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              Add Photo
            </button>
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((url, i) => (
            <div key={i} className="relative group">
              <div
                className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer"
                onClick={() => setLightboxIndex(i)}
              >
                <img
                  src={url}
                  alt="preview"
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 shadow-md"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!atMax && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
            error
              ? "border-red-300 bg-red-50 hover:border-red-400 hover:bg-red-100"
              : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
          }`}
        >
          <Plus className="h-5 w-5 text-slate-600" />
          <span className="text-xs text-slate-600 font-medium">Add images</span>
        </button>
      )}

      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev */}
          {previews.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + previews.length) % previews.length); }}
              className="absolute left-4 h-10 w-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <img
            src={previews[lightboxIndex]}
            alt="preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {previews.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % previews.length); }}
              className="absolute right-4 h-10 w-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Counter */}
          <span className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIndex + 1} / {previews.length}
          </span>
        </div>
      )}
    </div>
  );
}
