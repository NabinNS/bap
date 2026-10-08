export type CustomerBalance = {
  fiscal_year_id: number;
  opening_balance: string;
  remaining_balance: string;
};

export type Customer = {
  ulid: string;
  name: string;
  address: string | null;
  phone: string | null;
  telephone: string | null;
  vat_no: string | null;
  balances: CustomerBalance[];
};

export type FiscalYear = {
  id: number;
  ulid: string;
  name: string;
  sort_order: number;
};
