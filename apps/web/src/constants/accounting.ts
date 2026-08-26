export const TRANSACTION_PARTICULARS = [
  { value: "purchase",         label: "Purchase" },
  { value: "cash",             label: "Cash" },
  { value: "cheque",           label: "Cheque" },
  { value: "sales",            label: "Sales" },
  { value: "purchase_non_vat", label: "Purchase Non VAT" },
  { value: "debit_note",       label: "Debit Note" },
  { value: "credit_note",      label: "Credit Note" },
] as const;

export type TransactionParticularValue = (typeof TRANSACTION_PARTICULARS)[number]["value"];

export function getParticularLabel(value: string): string {
  return TRANSACTION_PARTICULARS.find((p) => p.value === value)?.label ?? value;
}
