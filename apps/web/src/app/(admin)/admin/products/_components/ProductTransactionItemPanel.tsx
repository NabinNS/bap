"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { ComboboxField, NumberField } from "@/components/ui/form/FormField";
import { BsDateInput, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { BillEditPanel, BillEditTransaction, BillEditPartyType } from "@/components/transactions/BillEditPanel";

const PARTICULAR_OPTIONS = [
  { value: "purchase", label: "Purchase" },
  { value: "sale", label: "Sale" },
];

export type TransactionItemPanelItem = {
  ulid: string;
  date: string;
  type: "purchase" | "sale";
  purchase_quantity: number | null;
  purchase_price: number | null;
  sales_quantity: number | null;
  sales_price: number | null;
  cost_price?: number | null;
  profit?: number | null;
  /** Set when this entry was recorded as a line item on a vendor bill — only then does a "full bill" page exist to open. */
  reference_type: string | null;
  bill: { transaction_ulid: string; party_ulid: string } | null;
};

/** Quick view/edit for a single purchase/sale entry — double-click the row for the full detail page. */
export function ProductTransactionItemPanel({
  productUlid,
  item,
  onClose,
}: {
  productUlid: string;
  item: TransactionItemPanelItem | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["product-transaction-items", productUlid] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["products-sidebar"] });
  }

  const updateMutation = useMutation({
    mutationFn: ({ itemUlid, payload }: { itemUlid: string; payload: object }) =>
      apiFetch(`/products/${productUlid}/product-transaction-items/${itemUlid}`, { method: "PATCH", body: JSON.stringify(payload) }),
    onSuccess: () => {
      invalidate();
      onClose();
      toast.success("Entry updated", "Stock transaction has been updated.");
    },
    onError: () => toast.error("Failed to update", "Could not update the transaction."),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemUlid: string) => apiFetch(`/products/${productUlid}/product-transaction-items/${itemUlid}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      onClose();
      toast.success("Entry deleted", "Stock transaction has been removed.");
    },
    onError: () => toast.error("Failed to delete", "Could not delete the transaction."),
  });

  if (item && item.bill) {
    // Bill-linked rows open the same rich, auto-saving bill-edit panel used on the
    // vendor/customer pages — full line items, product picker, VAT, receipt photo — instead
    // of a locked, redirect-only quick view.
    const bill = item.bill;
    return (
      <BillLinkedPanel
        key={item.ulid}
        productUlid={productUlid}
        item={{ ...item, bill }}
        onClose={onClose}
      />
    );
  }

  return (
    <PanelForm
      // Remounts the form (and its local field state) whenever a different row is opened,
      // so fields initialize straight from `item` instead of via an effect that can lose
      // the race against BsDateInput's own internal "first value wins" state.
      key={item?.ulid ?? "none"}
      productUlid={productUlid}
      item={item}
      onClose={onClose}
      updateMutation={updateMutation}
      deleteMutation={deleteMutation}
    />
  );
}

/** Fetches the full bill behind a bill-linked product-transaction row and edits it with the shared rich panel. */
function BillLinkedPanel({
  productUlid,
  item,
  onClose,
}: {
  productUlid: string;
  item: TransactionItemPanelItem & { bill: { transaction_ulid: string; party_ulid: string } };
  onClose: () => void;
}) {
  const router = useRouter();
  const partyType: BillEditPartyType = item.type === "purchase" ? "vendor" : "customer";
  const base = partyType === "vendor" ? "acc-vendors" : "acc-customers";
  const queryKey = [partyType === "vendor" ? "acc-vendor-transactions" : "acc-customer-transactions", item.bill.party_ulid];

  const { data } = useQuery({
    queryKey,
    queryFn: () => apiFetch<{ data: BillEditTransaction[] }>(`/${base}/${item.bill.party_ulid}/transactions?per_page=1000`),
  });

  const transaction = data?.data.find((t) => t.ulid === item.bill.transaction_ulid) ?? null;

  return (
    <BillEditPanel
      partyType={partyType}
      partyUlid={item.bill.party_ulid}
      transaction={transaction}
      queryKey={queryKey}
      onClose={onClose}
      onAddItemsPage={(tx) => {
        const page = partyType === "vendor" ? "/admin/accounts/goods-purchased" : "/admin/customers/goods-sold";
        const partyParam = partyType === "vendor" ? "vendor" : "customer";
        router.push(`${page}?${partyParam}=${item.bill.party_ulid}&transaction=${tx.ulid}&product=${productUlid}`);
      }}
    />
  );
}

function PanelForm({
  productUlid,
  item,
  onClose,
  updateMutation,
  deleteMutation,
}: {
  productUlid: string;
  item: TransactionItemPanelItem | null;
  onClose: () => void;
  updateMutation: UseMutationResult<unknown, unknown, { itemUlid: string; payload: object }>;
  deleteMutation: UseMutationResult<unknown, unknown, string>;
}) {
  const [date, setDate] = useState(item?.date ?? "");
  const [type, setType] = useState<"purchase" | "sale">(item?.type ?? "purchase");
  const [quantity, setQuantity] = useState(
    item ? String(item.type === "purchase" ? item.purchase_quantity ?? "" : item.sales_quantity ?? "") : ""
  );
  const [rate, setRate] = useState(
    item ? String(item.type === "purchase" ? item.purchase_price ?? "" : item.sales_price ?? "") : ""
  );

  const amount = quantity && rate ? Number(quantity) * Number(rate) : null;

  function save() {
    if (!item || !isValidBsDate(date) || !quantity || !rate) return;
    const isPurchase = type === "purchase";
    updateMutation.mutate({
      itemUlid: item.ulid,
      payload: {
        date,
        type,
        purchase_quantity: isPurchase ? Number(quantity) : null,
        purchase_price: isPurchase ? Number(rate) : null,
        sales_quantity: !isPurchase ? Number(quantity) : null,
        sales_price: !isPurchase ? Number(rate) : null,
      },
    });
  }

  return (
    <SlidePanel
      open={!!item}
      onClose={onClose}
      title={type === "purchase" ? "Purchase Entry" : "Sale Entry"}
      description="Quick view — double-click to open full detail."
      submitLabel={updateMutation.isPending ? "Saving..." : "Save Changes"}
      onSubmit={save}
      onDelete={item ? () => { if (confirm("Delete this entry?")) deleteMutation.mutate(item.ulid); } : undefined}
    >
      <ComboboxField label="Particular" options={PARTICULAR_OPTIONS} value={type} onChange={(v) => setType(v as "purchase" | "sale")} />
      <BsDateInput value={date} onChange={setDate} />
      <NumberField label="Quantity" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      <NumberField label="Rate" placeholder="0.00" allowDecimal value={rate} onChange={(e) => setRate(e.target.value)} />
      <div>
        <label className="block text-sm font-semibold text-text-default">Amount</label>
        <input
          type="text"
          readOnly
          value={amount != null ? amount.toLocaleString() : ""}
          placeholder="0.00"
          className="mt-1 w-full h-10 px-3 text-sm font-semibold border border-slate-300 bg-slate-100 text-black cursor-not-allowed"
        />
      </div>
      {item?.type === "sale" && item.profit != null && (
        <div>
          <label className="block text-sm font-semibold text-text-default">Profit</label>
          <input
            type="text"
            readOnly
            value={item.profit.toLocaleString()}
            className={`mt-1 w-full h-10 px-3 text-sm font-semibold border border-slate-300 bg-slate-100 cursor-not-allowed ${item.profit < 0 ? "text-red-600" : "text-emerald-600"}`}
          />
        </div>
      )}
    </SlidePanel>
  );
}
