"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { InputField, SelectField } from "@/components/ui/form/FormField";

type FiscalYear = {
  id: number;
  ulid: string;
  name: string;
};

type TenantSettings = {
  fiscal_year_id: number | null;
  fiscal_year: { ulid: string; name: string } | null;
  meta: Record<string, unknown> | null;
  updated_at: string | null;
};

type TenantInfo = {
  ulid: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  vat_no: string | null;
};

type TenantForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  vat_no: string;
};

const INITIAL_TENANT_FORM: TenantForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  vat_no: "",
};

export default function AdminSettings() {
  const queryClient = useQueryClient();

  const { data: fiscalYearsData, isLoading: fiscalYearsLoading } = useQuery({
    queryKey: ["fiscal-years"],
    queryFn: () => apiFetch<{ data: FiscalYear[] }>("/fiscal-years"),
  });

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ data: TenantSettings }>("/settings"),
  });

  const { data: tenantData, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenant"],
    queryFn: () => apiFetch<{ data: TenantInfo }>("/tenant"),
  });

  const fiscalYears = fiscalYearsData?.data ?? [];
  const settings = settingsData?.data ?? null;

  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string>("");
  const [tenantForm, setTenantForm] = useState<TenantForm>(INITIAL_TENANT_FORM);

  useEffect(() => {
    if (settings !== null) {
      setSelectedFiscalYearId(settings.fiscal_year_id != null ? String(settings.fiscal_year_id) : "");
    }
  }, [settings]);

  useEffect(() => {
    if (tenantData?.data) {
      const t = tenantData.data;
      setTenantForm({
        name: t.name ?? "",
        email: t.email ?? "",
        phone: t.phone ?? "",
        address: t.address ?? "",
        vat_no: t.vat_no ?? "",
      });
    }
  }, [tenantData]);

  const updateSettingsMutation = useMutation({
    mutationFn: (fiscalYearId: number | null) =>
      apiFetch("/settings", {
        method: "PUT",
        body: JSON.stringify({ fiscal_year_id: fiscalYearId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved", "Fiscal year has been updated.");
    },
    onError: (err: any) => {
      toast.error("Failed to save", err?.message ?? "Something went wrong.");
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: (payload: TenantForm) =>
      apiFetch("/tenant", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("Company info saved", "Your company details have been updated.");
    },
    onError: (err: any) => {
      toast.error("Failed to save", err?.message ?? "Something went wrong.");
    },
  });

  const isLoading = fiscalYearsLoading || settingsLoading || tenantLoading;

  const fiscalYearOptions = fiscalYears.map((fy) => ({
    label: fy.name,
    value: String(fy.id),
  }));

  return (
    <div className="flex-1 min-w-0 space-y-6 p-6">
      <nav className="flex items-center gap-1.5 text-sm text-text-muted">
        <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-text-default font-medium">Settings</span>
      </nav>

      <div>
        <h2 className="text-h3 font-bold text-text-default">Settings</h2>
        <p className="text-sm text-text-muted mt-0.5">Manage your store configuration and preferences.</p>
      </div>

      {/* Company Info */}
      <div className="border border-slate-200 bg-white">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-text-default">Company Information</h3>
          <p className="text-xs text-text-muted mt-0.5">Your business details shown on invoices and documents.</p>
        </div>

        <div className="px-6 py-5 grid grid-cols-2 gap-5">
          {isLoading ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 animate-pulse" />
              ))}
            </>
          ) : (
            <>
              <InputField
                label="Company Name"
                required
                placeholder="e.g. Nepal Traders Pvt. Ltd."
                value={tenantForm.name}
                onChange={(e) => setTenantForm((f) => ({ ...f, name: e.target.value }))}
              />
              <InputField
                label="Email"
                placeholder="e.g. info@company.com"
                value={tenantForm.email}
                onChange={(e) => setTenantForm((f) => ({ ...f, email: e.target.value }))}
              />
              <InputField
                label="Phone"
                placeholder="e.g. 9801234567"
                value={tenantForm.phone}
                onChange={(e) => setTenantForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <InputField
                label="VAT No"
                placeholder="e.g. 123456789"
                value={tenantForm.vat_no}
                onChange={(e) => setTenantForm((f) => ({ ...f, vat_no: e.target.value }))}
              />
              <div className="col-span-2">
                <InputField
                  label="Address"
                  placeholder="e.g. Kathmandu, Nepal"
                  value={tenantForm.address}
                  onChange={(e) => setTenantForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => updateTenantMutation.mutate(tenantForm)}
            disabled={updateTenantMutation.isPending || isLoading}
            className="bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {updateTenantMutation.isPending ? "Saving..." : "Save Company Info"}
          </button>
        </div>
      </div>

      {/* Fiscal Year */}
      <div className="border border-slate-200 bg-white">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-text-default">Fiscal Year</h3>
          <p className="text-xs text-text-muted mt-0.5">Set the active fiscal year for your store.</p>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="h-10 bg-slate-100 animate-pulse w-full max-w-sm" />
          ) : (
            <div className="max-w-sm">
              <SelectField
                label="Active Fiscal Year"
                value={selectedFiscalYearId}
                onChange={(e) => setSelectedFiscalYearId(e.target.value)}
                options={[
                  { label: "— None —", value: "" },
                  ...fiscalYearOptions,
                ]}
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => updateSettingsMutation.mutate(selectedFiscalYearId ? parseInt(selectedFiscalYearId, 10) : null)}
            disabled={updateSettingsMutation.isPending || isLoading}
            className="bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
