export const TRANSACTION_PARTICULARS = [
  { value: "sales",       label: "Sales" },
  { value: "cash",        label: "Cash" },
  { value: "cheque",      label: "Cheque" },
  { value: "debit_note",  label: "Debit Note" },
  { value: "credit_note", label: "Credit Note" },
] as const;

export type TransactionParticularValue = (typeof TRANSACTION_PARTICULARS)[number]["value"];

export function getParticularLabel(value: string): string {
  return TRANSACTION_PARTICULARS.find((p) => p.value === value)?.label ?? value;
}

// Sales and Debit Note increase what the customer owes us (credit). Cash, Cheque and
// Credit Note decrease it (debit).
const CREDIT_PARTICULARS = new Set<string>(["sales", "debit_note"]);

export function getParticularDirection(value: string): "debit" | "credit" {
  return CREDIT_PARTICULARS.has(value) ? "credit" : "debit";
}

// These particulars represent an itemized document (a sales invoice or a note against one)
// and must be created with line items via the Goods Sold page — never as a bare debit/credit
// entry from the quick-add ledger row, which would produce a same-looking "Sales" row with no
// stock movement, VAT, or items behind it.
export const ITEM_CAPABLE_PARTICULARS = ["sales", "debit_note", "credit_note"];
