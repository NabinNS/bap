export const TRANSACTION_PARTICULARS = [
  "Purchase",
  "Cash",
  "Sales",
  "Purchase Non VAT",
  "Debit Note",
  "Credit Note",
] as const;

export type TransactionParticular = (typeof TRANSACTION_PARTICULARS)[number];
