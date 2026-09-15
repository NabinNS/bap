"use client";

import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { InputField, NumberField, SelectField } from "@/components/ui/form/FormField";
import { FiscalYear } from "./types";

export type VendorFormState = {
  name: string;
  address: string;
  phone: string;
  telephone: string;
  vat_no: string;
  fiscal_year_id: string;
  opening_balance: string;
};

export type VendorFormErrors = Partial<Record<keyof VendorFormState, string>>;

type VendorFormPanelProps = {
  open: boolean;
  onClose: () => void;
  isEditing: boolean;
  saving: boolean;
  form: VendorFormState;
  errors: VendorFormErrors;
  fiscalYears: FiscalYear[];
  onFieldChange: <K extends keyof VendorFormState>(field: K, value: VendorFormState[K]) => void;
  onFieldBlur: () => void;
  onOpeningBalanceBlur: () => void;
  onSubmit: () => void;
};

export function VendorFormPanel({
  open,
  onClose,
  isEditing,
  saving,
  form,
  errors,
  fiscalYears,
  onFieldChange,
  onFieldBlur,
  onOpeningBalanceBlur,
  onSubmit,
}: VendorFormPanelProps) {
  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Vendor" : "Add Vendor"}
      description={isEditing ? "Update the vendor details." : "Fill in the details to create a new vendor."}
      submitLabel={saving ? "Saving..." : isEditing ? "Update Vendor" : "Save Vendor"}
      onSubmit={onSubmit}
    >
      <InputField
        label="Name"
        required
        placeholder="e.g. Nepal Traders Pvt. Ltd."
        value={form.name}
        onChange={(e) => onFieldChange("name", e.target.value)}
        onBlur={onFieldBlur}
        error={errors.name}
      />
      <InputField
        label="Address"
        placeholder="e.g. Kathmandu, Nepal"
        value={form.address}
        onChange={(e) => onFieldChange("address", e.target.value)}
        onBlur={onFieldBlur}
      />
      <InputField
        label="Phone"
        placeholder="e.g. 9801234567"
        value={form.phone}
        onChange={(e) => onFieldChange("phone", e.target.value)}
        onBlur={onFieldBlur}
      />
      <InputField
        label="Telephone"
        placeholder="e.g. 01-4123456"
        value={form.telephone}
        onChange={(e) => onFieldChange("telephone", e.target.value)}
        onBlur={onFieldBlur}
      />
      <InputField
        label="VAT No"
        placeholder="e.g. 123456789"
        value={form.vat_no}
        onChange={(e) => onFieldChange("vat_no", e.target.value)}
        onBlur={onFieldBlur}
      />
      <SelectField
        label="Fiscal Year"
        value={form.fiscal_year_id}
        onChange={(e) => onFieldChange("fiscal_year_id", e.target.value)}
        options={[
          { label: "— Select fiscal year —", value: "" },
          ...fiscalYears.map((fy) => ({ label: fy.name, value: String(fy.id) })),
        ]}
      />

      <NumberField
        label="Opening Balance"
        placeholder="0.00"
        allowDecimal
        value={form.opening_balance}
        onChange={(e) => onFieldChange("opening_balance", e.target.value)}
        onBlur={onOpeningBalanceBlur}
      />
    </SlidePanel>
  );
}
