"use client";

import { MapPin, Phone, Receipt } from "lucide-react";
import { ComboboxField } from "@/components/ui/form/FormField";
import { Customer } from "./types";

type CustomerInfoBlockProps = {
  customer: Customer | null;
  /** When provided (with onSelectCustomer), the name renders as a searchable combobox instead of static text. */
  customers?: Customer[];
  onSelectCustomer?: (ulid: string) => void;
};

export function CustomerInfoBlock({ customer, customers, onSelectCustomer }: CustomerInfoBlockProps) {
  const selectable = !!customers && !!onSelectCustomer;

  return (
    <div>
      {selectable ? (
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-text-muted shrink-0">Name</span>
          <div className="w-80 [&_input]:h-9 [&_input]:text-sm [&_input]:font-semibold [&_.mt-1]:mt-0">
            <ComboboxField
              label=""
              placeholder="Select a customer..."
              options={customers!.map((c) => ({ label: c.name, value: c.ulid }))}
              value={customer?.ulid ?? ""}
              onChange={(ulid) => onSelectCustomer!(ulid)}
            />
          </div>
        </div>
      ) : (
        <p className="text-lg font-bold text-text-default leading-tight flex items-center gap-1.5">
          {customer ? (
            <>
              <span className="text-base font-medium text-text-muted">Name:</span>
              {customer.name}
            </>
          ) : (
            <span className="text-text-muted font-normal text-sm">Select a customer</span>
          )}
        </p>
      )}
      {selectable ? (
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="flex items-center gap-1 text-text-body text-sm-custom">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-text-muted">Address:</span>
            <span>{customer?.address || "—"}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-text-body text-sm-custom">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-text-muted">Phone:</span>
            <span>{[customer?.phone, customer?.telephone].filter(Boolean).join(" / ") || "—"}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-text-body text-sm-custom">
            <Receipt className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-text-muted">VAT No:</span>
            <span>{customer?.vat_no || "—"}</span>
          </div>
        </div>
      ) : customer && (
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {customer.address && (
            <div className="flex items-center gap-1 text-text-body text-sm-custom">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium text-text-muted">Address:</span>
              <span>{customer.address}</span>
            </div>
          )}
          {(customer.phone || customer.telephone) && (
            <>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1 text-text-body text-sm-custom">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium text-text-muted">Phone:</span>
                <span>{[customer.phone, customer.telephone].filter(Boolean).join(" / ")}</span>
              </div>
            </>
          )}
          {customer.vat_no && (
            <>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1 text-text-body text-sm-custom">
                <Receipt className="h-3.5 w-3.5 shrink-0" />
                <span>VAT No: {customer.vat_no}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
