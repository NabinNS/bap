"use client";

import { MapPin, Phone, Receipt } from "lucide-react";
import { ComboboxField } from "@/components/ui/form/FormField";
import { Vendor } from "./types";

type VendorInfoBlockProps = {
  vendor: Vendor | null;
  /** When provided (with onSelectVendor), the name renders as a searchable combobox instead of static text. */
  vendors?: Vendor[];
  onSelectVendor?: (ulid: string) => void;
};

export function VendorInfoBlock({ vendor, vendors, onSelectVendor }: VendorInfoBlockProps) {
  const selectable = !!vendors && !!onSelectVendor;

  return (
    <div>
      {selectable ? (
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-text-muted shrink-0">Name</span>
          <div className="w-80 [&_input]:h-9 [&_input]:text-sm [&_input]:font-semibold [&_.mt-1]:mt-0">
            <ComboboxField
              label=""
              placeholder="Select a vendor..."
              options={vendors!.map((v) => ({ label: v.name, value: v.ulid }))}
              value={vendor?.ulid ?? ""}
              onChange={(ulid) => onSelectVendor!(ulid)}
            />
          </div>
        </div>
      ) : (
        <p className="text-lg font-bold text-text-default leading-tight flex items-center gap-1.5">
          {vendor ? (
            <>
              <span className="text-base font-medium text-text-muted">Name:</span>
              {vendor.name}
            </>
          ) : (
            <span className="text-text-muted font-normal text-sm">Select a vendor</span>
          )}
        </p>
      )}
      {selectable ? (
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="flex items-center gap-1 text-text-body text-sm-custom">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-text-muted">Address:</span>
            <span>{vendor?.address || "—"}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-text-body text-sm-custom">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-text-muted">Phone:</span>
            <span>{[vendor?.phone, vendor?.telephone].filter(Boolean).join(" / ") || "—"}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-text-body text-sm-custom">
            <Receipt className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-text-muted">VAT No:</span>
            <span>{vendor?.vat_no || "—"}</span>
          </div>
        </div>
      ) : vendor && (
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {vendor.address && (
            <div className="flex items-center gap-1 text-text-body text-sm-custom">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium text-text-muted">Address:</span>
              <span>{vendor.address}</span>
            </div>
          )}
          {(vendor.phone || vendor.telephone) && (
            <>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1 text-text-body text-sm-custom">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium text-text-muted">Phone:</span>
                <span>{[vendor.phone, vendor.telephone].filter(Boolean).join(" / ")}</span>
              </div>
            </>
          )}
          {vendor.vat_no && (
            <>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1 text-text-body text-sm-custom">
                <Receipt className="h-3.5 w-3.5 shrink-0" />
                <span>VAT No: {vendor.vat_no}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
