export const TRANSACTION_PARTICULARS = [
  { value: "purchase",         label: "Purchase" },
  { value: "cash",             label: "Cash" },
  { value: "cheque",           label: "Cheque" },
  { value: "sales",            label: "Sales" },
  { value: "purchase_non_vat", label: "Purchase Non VAT" },
  { value: "sales_non_vat",    label: "Sales Non VAT" },
  { value: "debit_note",       label: "Debit Note" },
  { value: "credit_note",      label: "Credit Note" },
] as const;

export type TransactionParticularValue = (typeof TRANSACTION_PARTICULARS)[number]["value"];

export function getParticularLabel(value: string): string {
  return TRANSACTION_PARTICULARS.find((p) => p.value === value)?.label ?? value;
}

// Cash, Cheque, Debit Note and Sales (incl. Non VAT) reduce the balance owed to the vendor (debit).
// Purchase (incl. Non VAT) and Credit Note increase it (credit).
const DEBIT_PARTICULARS = new Set<string>(["cash", "cheque", "debit_note", "sales", "sales_non_vat"]);

export function getParticularDirection(value: string): "debit" | "credit" {
  return DEBIT_PARTICULARS.has(value) ? "debit" : "credit";
}

// These particulars represent an itemized document (a purchase/sales invoice or a note
// against one) and must be created with line items via the Goods Purchased page — never
// as a bare debit/credit entry from the quick-add ledger row, which would produce a
// same-looking "Purchase" row with no stock movement, VAT, or items behind it.
export const ITEM_CAPABLE_PARTICULARS = ["purchase", "purchase_non_vat", "sales", "sales_non_vat", "debit_note", "credit_note"];
