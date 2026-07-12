"use client";

import { useRef, useState, useEffect } from "react";
import { Plus, X, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/dialog/ConfirmDialog";
import type { FileUploadState } from "@/lib/upload";

export type SavedImage = {
  ulid: string;
  url: string;
  path: string;
};

type Props = {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  value: File[];
  onChange: (files: File[]) => void;
  savedImages?: SavedImage[];
  max?: number;
  groupName?: string;
  onGroupNameChange?: (name: string) => void;
  onSave?: () => Promise<void>;
  onGroupNameBlur?: () => void;
  onRemoveSaved?: (ulid: string) => void;
  saving?: boolean;
  uploadStates?: FileUploadState[];
};

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function validateFiles(files: File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = [];
  const errors: string[] = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`"${file.name}" is not a supported image type.`);
    } else if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      errors.push(`"${file.name}" exceeds ${MAX_FILE_SIZE_MB}MB.`);
    } else {
      valid.push(file);
    }
  }
  return { valid, errors };
}

export function MultiImageUpload({ label, required, hint, error, value, onChange, savedImages = [], max, groupName, onGroupNameChange, onGroupNameBlur, onSave, onRemoveSaved, saving, uploadStates = [] }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  // Track object URLs per-file to avoid recreating URLs for unchanged files
  const [localPreviews, setLocalPreviews] = useState<{ file: File; url: string }[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "saved"; ulid: string } | { type: "local"; index: number } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    setLocalPreviews((prev) => {
      // Revoke URLs for files no longer in value
      const prevMap = new Map(prev.map((p) => [p.file, p.url]));
      const nextSet = new Set(value);
      for (const [file, url] of prevMap) {
        if (!nextSet.has(file)) URL.revokeObjectURL(url);
      }
      // Reuse existing URLs, only create for new files
      return value.map((file) => ({
        file,
        url: prevMap.get(file) ?? URL.createObjectURL(file),
      }));
    });
  }, [value]);

  // Cleanup all URLs on unmount
  useEffect(() => {
    return () => localPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewUrls = localPreviews.map((p) => p.url);
  const allPreviews = [...savedImages.map((s) => s.url), ...previewUrls];

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? null : (i + 1) % allPreviews.length));
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? null : (i - 1 + allPreviews.length) % allPreviews.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, allPreviews.length]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const { valid, errors } = validateFiles(files);
    setValidationErrors(errors);
    if (valid.length === 0) return;

    const remaining = max !== undefined ? max - value.length : valid.length;
    onChange([...value, ...valid.slice(0, remaining)]);
  }

  function remove(index: number) {
    // Close lightbox if the deleted image was open, or clamp index
    if (lightboxIndex !== null) {
      const deletedGlobalIndex = savedImages.length + index;
      if (lightboxIndex === deletedGlobalIndex) {
        setLightboxIndex(null);
      } else if (lightboxIndex > deletedGlobalIndex) {
        setLightboxIndex(lightboxIndex - 1);
      }
    }
    onChange(value.filter((_, i) => i !== index));
  }

  function removeSaved(ulid: string) {
    const deletedGlobalIndex = savedImages.findIndex((s) => s.ulid === ulid);
    if (lightboxIndex !== null && deletedGlobalIndex !== -1) {
      if (lightboxIndex === deletedGlobalIndex) {
        setLightboxIndex(null);
      } else if (lightboxIndex > deletedGlobalIndex) {
        setLightboxIndex(lightboxIndex - 1);
      }
    }
    onRemoveSaved?.(ulid);
  }

  const totalCount = savedImages.length + value.length;
  const atMax = max !== undefined && totalCount >= max;

  const confirmDescription =
    confirmDelete?.type === "saved"
      ? "This will permanently delete the image from the server. This cannot be undone."
      : "This will remove the image. It has not been saved yet.";

  return (
    <div className="space-y-3">
      {(label || max) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-sm font-semibold text-text-default">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
          )}
          {max && (
            <span className="text-xs text-text-muted">{totalCount}/{max}</span>
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
            onBlur={() => onGroupNameBlur?.()}
            className="flex-1 h-10 px-3 text-sm border border-slate-400 focus:border-slate-600 focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => onSave?.()}
            disabled={saving || value.length === 0}
            className="h-10 px-3 bg-black text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
          >
            {saving ? "Saving..." : "Add Photo"}
          </button>
        </div>
      )}


      {allPreviews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {savedImages.map((img, i) => (
            <div key={`saved-${img.ulid}`} className="relative group">
              <div
                className="aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 border-green-400 cursor-pointer"
                onClick={() => setLightboxIndex(i)}
              >
                <img src={img.url} alt="saved" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              </div>
              <div className="absolute top-1 left-1 h-4 w-4 bg-green-500 rounded-full flex items-center justify-center shadow">
                <CheckCircle className="h-2.5 w-2.5 text-white" />
              </div>
              <button
                type="button"
                onClick={() => setConfirmDelete({ type: "saved", ulid: img.ulid })}
                className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 shadow-md"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {previewUrls.map((url, i) => {
            const state = uploadStates[i];
            const isUploading = state && (state.status === "compressing" || state.status === "uploading");
            const isError = state?.status === "error";

            return (
              <div key={`local-${i}`} className="relative group">
                <div
                  className={`aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 border-dashed cursor-pointer ${isError ? "border-red-400" : "border-amber-400"}`}
                  onClick={() => !isUploading && setLightboxIndex(savedImages.length + i)}
                >
                  <img src={url} alt="preview" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

                  {/* Progress overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 px-2">
                      <span className="text-white text-[10px] font-medium">
                        {state.status === "compressing" ? "Compressing..." : `${state.progress}%`}
                      </span>
                      <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full transition-all duration-200"
                          style={{ width: state.status === "compressing" ? "100%" : `${state.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error overlay */}
                  {isError && (
                    <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>

                <div className={`absolute top-1 left-1 h-4 w-4 rounded-full flex items-center justify-center shadow ${isError ? "bg-red-500" : "bg-amber-400"}`}>
                  {isError
                    ? <AlertCircle className="h-2.5 w-2.5 text-white" />
                    : <Clock className="h-2.5 w-2.5 text-white" />
                  }
                </div>

                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete({ type: "local", index: i })}
                    className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600 shadow-md"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
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

      {validationErrors.length > 0 && (
        <ul className="space-y-0.5">
          {validationErrors.map((e, i) => (
            <li key={i} className="text-xs text-red-500">{e}</li>
          ))}
        </ul>
      )}

      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete image?"
        description={confirmDescription}
        confirmLabel="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          if (confirmDelete.type === "saved") removeSaved(confirmDelete.ulid);
          else remove(confirmDelete.index);
          setConfirmDelete(null);
        }}
      />

      {lightboxIndex !== null && lightboxIndex < allPreviews.length && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 h-9 w-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          {allPreviews.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + allPreviews.length) % allPreviews.length); }}
              className="absolute left-4 h-10 w-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <img
            src={allPreviews[lightboxIndex]}
            alt="preview"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {allPreviews.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % allPreviews.length); }}
              className="absolute right-4 h-10 w-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          <span className="absolute bottom-4 text-white/60 text-sm">
            {lightboxIndex + 1} / {allPreviews.length}
          </span>
        </div>
      )}
    </div>
  );
}
