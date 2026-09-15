export type VendorBalance = {
  fiscal_year_id: number;
  opening_balance: string;
  remaining_balance: string;
};

export type Vendor = {
  ulid: string;
  name: string;
  address: string | null;
  phone: string | null;
  telephone: string | null;
  vat_no: string | null;
  balances: VendorBalance[];
};

export type FiscalYear = {
  id: number;
  ulid: string;
  name: string;
};
