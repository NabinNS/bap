"use client";

import { useRef, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";

export type UploadedImage = {
  url: string;
  path: string;
};

type Props = {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  folder: string;           // upload folder, e.g. "products"
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  max?: number;             // max number of images allowed
  groupName?: string;       // name/title for the photo group
  onGroupNameChange?: (name: string) => void;
  onGroupSubmit?: (groupName: string, images: UploadedImage[]) => void;  // called when user clicks "Add Group"
};

export function MultiImageUpload({
  label,
  required,
  hint,
  error,
  folder,
  value,
  onChange,
  max,
  groupName,
  onGroupNameChange,
  onGroupSubmit,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Reset input so the same files can be picked again if needed
    e.target.value = "";

    setUploading(true);
    try {
      const uploadedImages: UploadedImage[] = [];

      // Upload each file sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await apiFetch<UploadedImage>(`/upload/${folder}`, {
          method: "POST",
          headers: {},
          body: (() => {
            const form = new FormData();
            form.append("image", file);
            return form;
          })(),
        });
        uploadedImages.push(res);
      }

      onChange([...value, ...uploadedImages]);
    } catch (err: any) {
      toast.error("Upload failed", err?.message ?? "Could not upload image.");
    } finally {
      setUploading(false);
    }
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleAddGroup() {
    if (!groupName?.trim()) {
      toast.error("Group name required", "Please enter a name for this photo group.");
      return;
    }

    if (value.length === 0) {
      toast.error("No images", "Please upload at least one image.");
      return;
    }

    onGroupSubmit?.(groupName, value);
    // Reset form
    onGroupNameChange?.("");
    onChange([]);
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
            <span className="text-xs text-text-muted">
              {value.length}/{max}
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {/* Group name input with Add Group button */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., Product photos, Gallery images"
            value={groupName || ""}
            onChange={(e) => onGroupNameChange?.(e.target.value)}
            className={`flex-1 h-10 px-3 text-sm border focus:outline-none transition-colors ${
              error ? "border-red-500 focus:border-red-600" : "border-slate-400 focus:border-slate-600"
            }`}
          />
          <button
            type="button"
            onClick={handleAddGroup}
            disabled={uploading || value.length === 0}
            className="px-3 h-10 bg-black text-white text-xs font-medium hover:bg-gray-800 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            Add Group
          </button>
        </div>

        {/* Upload zone */}
        {!atMax && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`w-full h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
              error
                ? "border-red-300 bg-red-50 hover:border-red-400 hover:bg-red-100"
                : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
            } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 text-slate-600 animate-spin" />
                <span className="text-xs text-slate-600 font-medium">Uploading...</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-slate-600" />
                <span className="text-xs text-slate-600 font-medium">Add images</span>
              </>
            )}
          </button>
        )}

        {/* Image grid */}
        {value.length > 0 && (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
            {value.map((img, i) => (
              <div key={img.path} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img
                    src={img.url}
                    alt="uploaded"
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  />
                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                </div>
                {/* Delete button — visible on hover */}
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
      </div>

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
    </div>
  );
}
