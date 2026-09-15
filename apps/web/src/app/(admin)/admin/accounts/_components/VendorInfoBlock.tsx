"use client";

import { MapPin, Phone, Receipt } from "lucide-react";
import { Vendor } from "./types";

export function VendorInfoBlock({ vendor }: { vendor: Vendor | null }) {
  return (
    <div>
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
      {vendor && (
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
