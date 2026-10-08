"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { Modal } from "@/components/ui/Modal";
import { BsDateInput } from "@/components/ui/form/BsDateInput";
import { PurchaseOrderForm } from "./PurchaseOrderForm";
import { VendorSidebar } from "../../accounts/_components/VendorSidebar";
import { VendorFormPanel, VendorFormState, VendorFormErrors } from "../../accounts/_components/VendorFormPanel";
import { Vendor, FiscalYear } from "../../accounts/_components/types";
import { useViewingFiscalYear } from "@/features/fiscal-year/ViewingFiscalYearProvider";

type PurchaseOrderItem = {
  ulid: string;
  product_ulid: string;
  product_name: string;
  quantity: number | null;
};

type PurchaseOrder = {
  ulid: string;
  fiscal_year_id: number | null;
  vendor: { ulid: string; name: string; address: string | null; vat_no: string | null } | null;
  date: string;
  voucher_no: string | null;
  items: PurchaseOrderItem[];
};

export default function PurchaseOrderPage() {
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendorUlid, setSelectedVendorUlid] = useState<string | null>(null);
  const [selectedUlid, setSelectedUlid] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const [trashedOpen, setTrashedOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: () => apiFetch<{ data: PurchaseOrder[] }>("/purchase-orders?per_page=100"),
  });

  const { data: vendorsData, isLoading: vendorsLoading } = useQuery({
    queryKey: ["acc-vendors"],
    queryFn: () => apiFetch<{ data: Vendor[] }>("/acc-vendors?per_page=100"),
  });
  const vendors = vendorsData?.data ?? [];
  const { viewingFiscalYearId: activeFiscalYearId } = useViewingFiscalYear();

  useEffect(() => {
    if (!selectedVendorUlid && vendors.length > 0) setSelectedVendorUlid(vendors[0].ulid);
  }, [vendors, selectedVendorUlid]);

  const selectedVendor = vendors.find((v) => v.ulid === selectedVendorUlid) ?? null;

  const { data: fiscalYearsData } = useQuery({
    queryKey: ["fiscal-years"],
    queryFn: () => apiFetch<{ data: FiscalYear[] }>("/fiscal-years"),
    staleTime: Infinity,
  });
  const fiscalYears = fiscalYearsData?.data ?? [];

  const VENDOR_INITIAL_FORM: VendorFormState = { name: "", address: "", phone: "", telephone: "", vat_no: "", fiscal_year_id: "", opening_balance: "" };
  const [vendorPanelOpen, setVendorPanelOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState<VendorFormState>(VENDOR_INITIAL_FORM);
  const [vendorErrors, setVendorErrors] = useState<VendorFormErrors>({});
  // Set once the name field is blurred and the vendor record is first created — further field
  // blurs then PATCH this same vendor instead of creating duplicates.
  const [draftVendorUlid, setDraftVendorUlid] = useState<string | null>(null);
  const draftVendorUlidRef = useRef<string | null>(null);

  function vendorPayload() {
    return {
      name: vendorForm.name,
      address: vendorForm.address || null,
      phone: vendorForm.phone || null,
      telephone: vendorForm.telephone || null,
      vat_no: vendorForm.vat_no || null,
    };
  }

  const createVendorMutation = useMutation({
    mutationFn: (payload: ReturnType<typeof vendorPayload>) =>
      apiFetch<{ data: Vendor }>("/acc-vendors", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
      toast.success("Vendor created", `"${res.data.name}" has been added.`);
      draftVendorUlidRef.current = res.data.ulid;
      setDraftVendorUlid(res.data.ulid);
      setSelectedVendorUlid(res.data.ulid);
    },
    onError: (err: any) => {
      if (err?.errors) {
        setVendorErrors(err.errors);
        toast.warning("Please fix the errors", "Check the highlighted fields.");
      } else {
        toast.error("Failed to create vendor", err?.message ?? "Something went wrong.");
      }
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({ ulid, payload }: { ulid: string; payload: ReturnType<typeof vendorPayload> }) =>
      apiFetch<{ data: Vendor }>(`/acc-vendors/${ulid}`, { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["acc-vendors"] }),
    onError: (err: any) => toast.error("Failed to update vendor", err?.message ?? "Something went wrong."),
  });

  function saveVendorDraft() {
    if (!vendorForm.name.trim()) return;
    if (draftVendorUlidRef.current) {
      updateVendorMutation.mutate({ ulid: draftVendorUlidRef.current, payload: vendorPayload() });
    } else {
      createVendorMutation.mutate(vendorPayload());
    }
  }

  function submitVendorForm() {
    if (!vendorForm.name.trim()) { setVendorErrors({ name: "Name is required." }); return; }
    saveVendorDraft();
    setVendorPanelOpen(false);
    setVendorForm(VENDOR_INITIAL_FORM);
    draftVendorUlidRef.current = null;
    setDraftVendorUlid(null);
  }

  const { data: trashedData, isLoading: trashedLoading } = useQuery({
    queryKey: ["purchase-orders-trashed"],
    queryFn: () => apiFetch<{ data: PurchaseOrder[] }>("/purchase-orders/trashed"),
    enabled: trashedOpen,
  });

  const restoreMutation = useMutation({
    mutationFn: (purchaseOrder: PurchaseOrder) =>
      apiFetch(`/acc-vendors/${purchaseOrder.vendor!.ulid}/purchase-orders/${purchaseOrder.ulid}/restore`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders-trashed"] });
      toast.success("Purchase order restored", "The purchase order has been restored.");
    },
    onError: (err: any) => toast.error("Failed to restore purchase order", err?.message ?? "Something went wrong."),
  });

  const purchaseOrders = data?.data ?? [];
  const vendorOrders = purchaseOrders.filter((po) => po.vendor?.ulid === selectedVendorUlid);
  const totalOrderQuantity = vendorOrders.reduce((sum, po) => sum + po.items.reduce((s, item) => s + (item.quantity ?? 0), 0), 0);

  // PurchaseOrderForm's side panels (vendor price comparison, add-product) are portaled here so
  // they span the page's full height instead of being squeezed below the vendor info card.
  const [sidePanelsContainer, setSidePanelsContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div className="flex gap-0 h-full">
    <div className="flex-1 min-w-0 p-6 flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-h3 font-bold text-text-default">Purchase Order</h2>
        <p className="text-sm text-text-muted mt-0.5">All purchase orders recorded across vendors.</p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar: vendor list */}
        <VendorSidebar
          vendors={vendors}
          vendorsLoading={vendorsLoading}
          activeFiscalYearId={activeFiscalYearId}
          selectedVendorUlid={selectedVendorUlid}
          search={vendorSearch}
          onSearchChange={setVendorSearch}
          onSelect={(vendor) => {
            setSelectedVendorUlid((prev) => (prev === vendor.ulid ? null : vendor.ulid));
            setSelectedUlid(null);
          }}
          showBalance={false}
          headerRight={
            <button
              type="button"
              onClick={() => {
                setVendorForm({ ...VENDOR_INITIAL_FORM, fiscal_year_id: activeFiscalYearId ? String(activeFiscalYearId) : "" });
                setVendorErrors({});
                draftVendorUlidRef.current = null;
                setDraftVendorUlid(null);
                setVendorPanelOpen(true);
              }}
              className="flex items-center gap-1.5 h-9 bg-black px-3 text-h4 font-semibold text-white hover:bg-black/80 transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          }
        />

        {/* Detail panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-2 h-full min-h-0">
          {!selectedVendor ? (
            <div className="flex-1 flex items-center justify-center text-sm text-text-muted border border-slate-300 bg-white">
              Select a vendor to view its purchase orders.
            </div>
          ) : (
            <>
              {/* Vendor info card */}
              <div className="bg-white px-5 py-4 space-y-3 shrink-0">
                <p className="text-lg font-bold text-text-default leading-tight">
                  <span className="text-base font-medium text-text-muted">Name:</span> {selectedVendor.name}
                </p>

                <div className="flex items-center gap-3 flex-wrap text-sm-custom text-text-body">
                  <span><span className="font-medium text-text-muted">Address:</span> {selectedVendor.address || "—"}</span>
                  <span className="text-slate-300">|</span>
                  <span><span className="font-medium text-text-muted">Phone:</span> {[selectedVendor.phone, selectedVendor.telephone].filter(Boolean).join(" / ") || "—"}</span>
                  <span className="text-slate-300">|</span>
                  <span><span className="font-medium text-text-muted">VAT No:</span> {selectedVendor.vat_no || "—"}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-300">
                  <div>
                    <p className="text-sm-custom text-text-body">Total Order Quantity</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">{totalOrderQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm-custom text-text-body">Total Orders</p>
                    <p className="text-sm-custom font-bold text-text-default mt-0.5">{vendorOrders.length}</p>
                  </div>
                </div>
              </div>

              {/* Add purchase order items */}
              <div className="flex-1 min-h-0 flex">
                <PurchaseOrderForm
                  key={selectedVendor.ulid}
                  initialVendorUlid={selectedVendor.ulid}
                  initialPurchaseOrderUlid={null}
                  onExit={() => queryClient.invalidateQueries({ queryKey: ["purchase-orders"] })}
                  sidePanelsContainer={sidePanelsContainer}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        open={trashedOpen}
        onClose={() => setTrashedOpen(false)}
        title="Recently Deleted Purchase Orders"
        description="Deleted purchase orders. Restoring brings the purchase order and its items back."
        initialWidth={480}
        initialHeight={420}
      >
        {trashedLoading && <p className="text-sm text-text-muted">Loading…</p>}
        {!trashedLoading && (trashedData?.data.length ?? 0) === 0 && (
          <p className="text-sm text-text-muted">No deleted purchase orders.</p>
        )}
        {!trashedLoading && (trashedData?.data.length ?? 0) > 0 && (
          <div className="space-y-2">
            {trashedData!.data.map((purchaseOrder) => (
              <div key={purchaseOrder.ulid} className="flex items-center justify-between border border-slate-200 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-default truncate">
                    {purchaseOrder.date} · Order #{purchaseOrder.voucher_no || "—"}
                  </p>
                  <p className="text-xs text-text-muted truncate">{purchaseOrder.vendor?.name ?? "—"} · {purchaseOrder.items.length} item(s)</p>
                </div>
                <button
                  type="button"
                  disabled={restoreMutation.isPending}
                  onClick={() => restoreMutation.mutate(purchaseOrder)}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold text-text-default border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter Purchase Orders"
        description="Show only purchase orders within a date range."
        initialWidth={480}
        initialHeight={360}
        submitLabel="Apply"
        onSubmit={() => {
          setAppliedRange(dateFrom || dateTo ? { from: dateFrom, to: dateTo } : null);
          setFilterOpen(false);
        }}
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-text-default uppercase tracking-wide mb-1">From</p>
            <BsDateInput value={dateFrom} onChange={setDateFrom} />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-default uppercase tracking-wide mb-1">To</p>
            <BsDateInput value={dateTo} onChange={setDateTo} />
          </div>
          {appliedRange && (
            <button
              type="button"
              onClick={() => { setDateFrom(""); setDateTo(""); setAppliedRange(null); }}
              className="text-xs font-semibold text-text-muted hover:text-text-default underline cursor-pointer"
            >
              Clear filter
            </button>
          )}
        </div>
      </Modal>
    </div>

      <VendorFormPanel
        open={vendorPanelOpen}
        onClose={() => setVendorPanelOpen(false)}
        isEditing={false}
        saving={createVendorMutation.isPending || updateVendorMutation.isPending}
        form={vendorForm}
        errors={vendorErrors}
        fiscalYears={fiscalYears}
        onFieldChange={(field, value) => {
          setVendorForm((f) => ({ ...f, [field]: value }));
          if (field === "name") setVendorErrors((prev) => ({ ...prev, name: undefined }));
        }}
        onFieldBlur={saveVendorDraft}
        onOpeningBalanceBlur={() => {}}
        onSubmit={submitVendorForm}
      />

      <div ref={setSidePanelsContainer} className="shrink-0 h-full flex" />
    </div>
  );
}
