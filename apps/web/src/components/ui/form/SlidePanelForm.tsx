"use client";

import { X } from "lucide-react";

type SlidePanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onSubmit?: () => void;
  submitLabel?: string;
  children: React.ReactNode;
};

export function SlidePanel({
  open,
  onClose,
  title,
  description,
  onSubmit,
  submitLabel = "Save",
  children,
}: SlidePanelProps) {
  return (
    <div
      className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
        open ? "w-[400px]" : "w-0"
      }`}
    >
      <div className="w-[400px] bg-white border-l border-slate-300 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-black">
          <div>
            <h3 className="text-h4 font-bold text-white">{title}</h3>
            {description && (
              <p className="text-sm text-white mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center ">
          <button
            onClick={onClose}
            className="flex-1 h-12 border border-slate-300 text-sm font-semibold text-text-default hover:bg-slate-50 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 h-12 bg-black text-white text-sm font-semibold hover:bg-black/80 cursor-pointer transition-colors"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
