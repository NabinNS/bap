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

// Cash, Cheque, Debit Note and Sales reduce the balance owed to the vendor (debit).
// Purchase, Purchase Non VAT and Credit Note increase it (credit).
const DEBIT_PARTICULARS = new Set<string>(["cash", "cheque", "debit_note", "sales"]);

export function getParticularDirection(value: string): "debit" | "credit" {
  return DEBIT_PARTICULARS.has(value) ? "debit" : "credit";
}
