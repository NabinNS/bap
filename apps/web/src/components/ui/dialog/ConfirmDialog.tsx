"use client";

import { useEffect } from "react";
import { X, Trash2 } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="bg-white w-full max-w-lg mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-black">
          <h3 className="text-h4 font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex gap-4">
          <div className="shrink-0 h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-red-700" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text-default">Are you sure?</p>
            {description && <p className="text-sm text-text-muted">{description}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-12 border-r border-slate-200 text-sm font-semibold text-text-default hover:bg-slate-50 cursor-pointer transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-12 bg-red-700 text-white text-sm font-semibold hover:bg-red-800 cursor-pointer transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
