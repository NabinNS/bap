"use client";

import { Modal } from "@/components/ui/Modal";
import { BsDateInput } from "@/components/ui/form/BsDateInput";

type FilterModalProps = {
  open: boolean;
  onClose: () => void;
  dateFrom: string;
  dateTo: string;
  dateFromDraft: string;
  dateToDraft: string;
  resetKey: number;
  onDateFromDraftChange: (value: string) => void;
  onDateToDraftChange: (value: string) => void;
  onApply: () => void;
  onClearAll: () => void;
};

export function FilterModal({
  open,
  onClose,
  dateFrom,
  dateTo,
  dateFromDraft,
  dateToDraft,
  resetKey,
  onDateFromDraftChange,
  onDateToDraftChange,
  onApply,
  onClearAll,
}: FilterModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filter"
      description="Show only transactions within a date range."
      initialWidth={420}
      initialHeight={320}
      onSubmit={onApply}
      submitLabel="Apply"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">From Date</label>
          <BsDateInput key={`from-${resetKey}`} value={dateFromDraft} onChange={onDateFromDraftChange} placeholder="YYYY-MM-DD" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-default uppercase tracking-wide mb-1.5">To Date</label>
          <BsDateInput key={`to-${resetKey}`} value={dateToDraft} onChange={onDateToDraftChange} placeholder="YYYY-MM-DD" />
        </div>
      </div>
      {(dateFrom || dateTo || dateFromDraft || dateToDraft) && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm font-medium text-text-muted hover:text-text-default cursor-pointer"
        >
          Clear All Filters
        </button>
      )}
    </Modal>
  );
}
