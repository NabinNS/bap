"use client";

import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/form/FormField";
import { FiscalYear } from "./types";

type FiscalYearModalProps = {
  open: boolean;
  onClose: () => void;
  fiscalYears: FiscalYear[];
  draft: string;
  onDraftChange: (value: string) => void;
  onApply: () => void;
};

export function FiscalYearModal({ open, onClose, fiscalYears, draft, onDraftChange, onApply }: FiscalYearModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Fiscal Year"
      description="Choose which fiscal year's ledger to view for this vendor."
      initialWidth={460}
      initialHeight={320}
      onSubmit={onApply}
      submitLabel="Apply"
    >
      {fiscalYears.length === 0 ? (
        <p className="text-sm text-text-muted">No fiscal years configured yet.</p>
      ) : (
        <SelectField
          label="Fiscal Year"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          options={fiscalYears.map((fy) => ({
            label: fy.name,
            value: String(fy.id),
          }))}
        />
      )}
    </Modal>
  );
}
