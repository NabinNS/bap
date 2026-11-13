"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { SelectField } from "@/components/ui/form/FormField";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { BsDateInput, isValidBsDate } from "@/components/ui/form/BsDateInput";
import { ProductCombobox, ProductOption } from "@/components/products/ProductCombobox";
import { ConfirmDialog } from "@/components/ui/dialog/ConfirmDialog";
import { MultiImageUpload } from "@/components/ui/form/MultiImageUpload";
import { useImageGroup } from "@/hooks/useImageGroup";
import {
  TRANSACTION_PARTICULARS,
  getParticularLabel,
  getParticularDirection,
  ITEM_CAPABLE_PARTICULARS,
} from "@/app/(admin)/admin/accounts/constants";
import {
  useInvalidateVendorTransactions,
  useInvalidateCustomerTransactions,
} from "@/app/(admin)/admin/accounts/_components/useAccountingInvalidation";

export type BillEditPartyType = "vendor" | "customer";

export type BillEditTransactionItem = {
  ulid: string;
  product_ulid: string;
  product_name: string;
  quantity: number;
  rate: number;
  amount: number;
  discount: number;
  total: number;
};

export type BillEditTransaction = {
  ulid: string;
  date: string;
  particular: string;
  voucher_no: string | null;
  cheque_no?: string | null;
  type: string | null;
  debit: number | null;
  credit: number | null;
  discount_percent?: number | null;
  taxable_amount?: number | null;
  vat_amount?: number | null;
  grand_total?: number | null;
  vat_exempt?: boolean | null;
  items?: BillEditTransactionItem[];
};

const EMPTY_NEW_ITEM = { product_ulid: "", product_name: "", quantity: "", rate: "", discount: "0" };

const PARTY_CONFIG: Record<BillEditPartyType, {
  base: string;
  imageableType: string;
  imageFolder: string;
  vatParticular: string;
  vatExemptParticular: string;
}> = {
  vendor: {
    base: "acc-vendors",
    imageableType: "acc_vendor_transaction",
    imageFolder: "acc-vendor-transactions",
    vatParticular: "purchase",
    vatExemptParticular: "purchase_non_vat",
  },
  customer: {
    base: "acc-customers",
    imageableType: "acc_customer_transaction",
    imageFolder: "acc-customer-transactions",
    vatParticular: "sales",
    vatExemptParticular: "sales_non_vat",
  },
};

export interface BillEditPanelProps {
  partyType: BillEditPartyType;
  /** Vendor or customer ulid that owns this transaction. */
  partyUlid: string;
  /** The transaction to edit — panel is open whenever this is non-null. */
  transaction: BillEditTransaction | null;
  /** The react-query key for this party's transaction list — used for the optimistic VAT update. */
  queryKey: unknown[];
  onClose: () => void;
  /** Called when the user clicks the footer "Delete entry" button. Parent owns the confirm flow. */
  onDeleteTransaction?: (tx: BillEditTransaction) => void;
  /** Called when the user clicks "Need full details? Add items →". Omit to hide the link. */
  onAddItemsPage?: (tx: BillEditTransaction) => void;
}

/**
 * Rich, auto-saving bill edit panel shared by the vendor (accounts) and customer pages, and by
 * the product page's bill-linked transaction rows. Edits the transaction header, its line items
 * (with product picker), VAT, and receipt photo — auto-saving each field as it's changed.
 */
export function BillEditPanel({
  partyType,
  partyUlid,
  transaction,
  queryKey,
  onClose,
  onDeleteTransaction,
  onAddItemsPage,
}: BillEditPanelProps) {
  const queryClient = useQueryClient();
  const config = PARTY_CONFIG[partyType];
  const invalidateVendorTransactions = useInvalidateVendorTransactions();
  const invalidateCustomerTransactions = useInvalidateCustomerTransactions();
  const invalidate = partyType === "vendor" ? invalidateVendorTransactions : invalidateCustomerTransactions;

  const [txEdit, setTxEdit] = useState<{ date: string; particular: string; voucher_no: string; cheque_no: string; amount: string } | null>(null);
  const [itemEdits, setItemEdits] = useState<Record<string, { product_ulid: string; product_name: string; quantity: string; rate: string; discount: string }>>({});
  const [newItem, setNewItem] = useState(EMPTY_NEW_ITEM);
  const [addingItem, setAddingItem] = useState(false);
  const [confirmDeleteItemUlid, setConfirmDeleteItemUlid] = useState<string | null>(null);

  const loadedReceiptForRef = useRef<string | null>(null);
  // A fresh id per transaction-panel-open — tags every autosave call made while the panel
  // stays open for this transaction, so the backend can merge them into one log entry
  // instead of one row per field blur.
  const txEditSessionRef = useRef<string | null>(null);
  const receiptImage = useImageGroup(config.imageableType, config.imageFolder, "receipt");

  const transactionUlid = transaction?.ulid ?? null;

  useEffect(() => {
    txEditSessionRef.current = transactionUlid ? crypto.randomUUID() : null;
    setNewItem(EMPTY_NEW_ITEM);
    setAddingItem(false);
    if (!transaction) { setTxEdit(null); setItemEdits({}); receiptImage.reset(); loadedReceiptForRef.current = null; return; }
    setTxEdit({
      date: transaction.date,
      particular: transaction.particular,
      voucher_no: transaction.voucher_no ?? "",
      cheque_no: transaction.cheque_no ?? "",
      amount: String(transaction.debit ?? transaction.credit ?? ""),
    });
    setItemEdits(Object.fromEntries((transaction.items ?? []).map((it) => [it.ulid, {
      product_ulid: it.product_ulid,
      product_name: it.product_name,
      quantity: String(it.quantity),
      rate: String(it.rate),
      discount: String(it.discount),
    }])));
    if (loadedReceiptForRef.current !== transaction.ulid) {
      loadedReceiptForRef.current = transaction.ulid;
      receiptImage.load(transaction.ulid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionUlid]);

  const hasItems = !!(transaction?.items && transaction.items.length > 0);

  const updateTransactionMutation = useMutation({
    mutationFn: ({ txUlid, payload }: { txUlid: string; payload: object }) =>
      apiFetch(`/${config.base}/${partyUlid}/transactions/${txUlid}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: txEditSessionRef.current ? { "X-Activity-Session": txEditSessionRef.current } : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: [partyType === "vendor" ? "acc-vendors" : "acc-customers"] });
    },
    onError: (err: any) => toast.error("Failed to update transaction", err?.message ?? "Something went wrong."),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ txUlid, itemUlid, payload }: { txUlid: string; itemUlid: string; payload: object }) =>
      apiFetch(`/${config.base}/${partyUlid}/transactions/${txUlid}/items/${itemUlid}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: txEditSessionRef.current ? { "X-Activity-Session": txEditSessionRef.current } : undefined,
      }),
    onSuccess: () => invalidate(partyUlid),
    onError: (err: any) => toast.error("Failed to update item", err?.message ?? "Something went wrong."),
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ txUlid, itemUlid }: { txUlid: string; itemUlid: string }) =>
      apiFetch(`/${config.base}/${partyUlid}/transactions/${txUlid}/items/${itemUlid}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate(partyUlid);
      toast.success("Item removed", "The line item has been deleted.");
    },
    onError: (err: any) => toast.error("Failed to delete item", err?.message ?? "Something went wrong."),
  });

  const updateTotalsMutation = useMutation({
    mutationFn: ({ txUlid, body }: { txUlid: string; body: { vat_exempt: boolean } }) =>
      apiFetch(`/${config.base}/${partyUlid}/transactions/${txUlid}/totals`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => invalidate(partyUlid),
    onError: (err: any) => toast.error("Failed to update VAT", err?.message ?? "Something went wrong."),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ txUlid, payload }: { txUlid: string; payload: object }) =>
      apiFetch<{ data: { ulid: string; product_ulid: string; quantity: number; rate: number; discount: number; total: number } }>(
        `/${config.base}/${partyUlid}/transactions/${txUlid}/items`,
        {
          method: "POST",
          body: JSON.stringify(payload),
          headers: txEditSessionRef.current ? { "X-Activity-Session": txEditSessionRef.current } : undefined,
        }
      ),
    onSuccess: () => invalidate(partyUlid),
    onError: (err: any) => toast.error("Failed to add item", err?.message ?? "Something went wrong."),
  });

  function saveTransactionHeader() {
    if (!transactionUlid || !txEdit) return;
    if (!isValidBsDate(txEdit.date) || !txEdit.particular.trim()) return;
    const direction = getParticularDirection(txEdit.particular);
    updateTransactionMutation.mutate({
      txUlid: transactionUlid,
      payload: {
        date: txEdit.date,
        particular: txEdit.particular,
        voucher_no: txEdit.voucher_no || null,
        cheque_no: txEdit.particular === "cheque" ? txEdit.cheque_no || null : null,
        debit: direction === "debit" ? Number(txEdit.amount) || null : null,
        credit: direction === "credit" ? Number(txEdit.amount) || null : null,
      },
    });
  }

  async function saveVatExempt(exempt: boolean) {
    if (!transactionUlid || !transaction) return;

    const previousData = queryClient.getQueryData<{ data: BillEditTransaction[] }>(queryKey);

    // Optimistic — flips the checkbox, zeroes/restores VAT, and relabels the particular
    // immediately; reconciled with server-computed totals once both requests resolve.
    queryClient.setQueryData<{ data: BillEditTransaction[] } | undefined>(queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        data: old.data.map((t) => {
          if (t.ulid !== transactionUlid) return t;
          const vatAmount = exempt ? 0 : Math.round((t.taxable_amount ?? 0) * 0.13);
          return {
            ...t,
            vat_exempt: exempt,
            vat_amount: vatAmount,
            grand_total: (t.taxable_amount ?? 0) + vatAmount,
            particular: exempt ? config.vatExemptParticular : config.vatParticular,
          };
        }),
      };
    });

    try {
      await updateTotalsMutation.mutateAsync({ txUlid: transactionUlid, body: { vat_exempt: exempt } });
      // Keep the particular label in sync with the VAT toggle.
      await updateTransactionMutation.mutateAsync({
        txUlid: transactionUlid,
        payload: {
          date: transaction.date,
          particular: exempt ? config.vatExemptParticular : config.vatParticular,
          voucher_no: transaction.voucher_no || null,
          cheque_no: transaction.cheque_no || null,
        },
      });
    } catch {
      queryClient.setQueryData(queryKey, previousData);
    }
  }

  function suggestedRate(product: ProductOption | null): number | null {
    return product?.wacc ?? product?.cost_price ?? null;
  }

  // `overrides` lets a caller (e.g. the product combobox's onChange) save with values it
  // just computed, instead of relying on `itemEdits` state that a same-tick blur event
  // would still read as stale (React hasn't applied the update yet).
  function saveItem(itemUlid: string, overrides?: Partial<{ product_ulid: string; product_name: string; quantity: string; rate: string; discount: string }>) {
    const edit = itemEdits[itemUlid];
    if (!transactionUlid || !edit) return;
    const merged = overrides ? { ...edit, ...overrides } : edit;
    if (!merged.product_ulid || !merged.quantity || Number(merged.quantity) <= 0 || merged.rate === "") return;
    updateItemMutation.mutate({
      txUlid: transactionUlid,
      itemUlid,
      payload: {
        product_ulid: merged.product_ulid,
        quantity: Number(merged.quantity),
        rate: Number(merged.rate),
        discount: Number(merged.discount) || 0,
      },
    });
  }

  function saveNewItem() {
    if (!transactionUlid) return;
    if (!newItem.product_ulid || !newItem.quantity || Number(newItem.quantity) <= 0 || newItem.rate === "") return;
    addItemMutation.mutate(
      {
        txUlid: transactionUlid,
        payload: {
          product_ulid: newItem.product_ulid,
          quantity: Number(newItem.quantity),
          rate: Number(newItem.rate),
          discount: Number(newItem.discount) || 0,
        },
      },
      {
        onSuccess: (res) => {
          const it = res.data;
          setItemEdits((prev) => ({
            ...prev,
            [it.ulid]: {
              product_ulid: it.product_ulid,
              product_name: newItem.product_name,
              quantity: String(it.quantity),
              rate: String(it.rate),
              discount: String(it.discount),
            },
          }));
          setNewItem(EMPTY_NEW_ITEM);
          setAddingItem(false);
        },
      }
    );
  }

  function removeItem(itemUlid: string) {
    if (!transactionUlid) return;
    setConfirmDeleteItemUlid(itemUlid);
  }

  function confirmRemoveItem() {
    if (!transactionUlid || !confirmDeleteItemUlid) return;
    const itemUlid = confirmDeleteItemUlid;
    deleteItemMutation.mutate({ txUlid: transactionUlid, itemUlid });
    if (transaction?.items?.length === 1) onClose();
    setConfirmDeleteItemUlid(null);
  }

  return (
    <>
      <SlidePanel
        open={!!(transaction && txEdit)}
        onClose={onClose}
        title={transaction ? getParticularLabel(transaction.particular) : ""}
        description="Auto-saves as you edit."
        submitLabel={updateTransactionMutation.isPending ? "Saving..." : "Save"}
        onSubmit={() => { saveTransactionHeader(); onClose(); }}
        onDelete={transaction && onDeleteTransaction ? () => onDeleteTransaction(transaction) : undefined}
      >
        {transaction && txEdit && <>
          {onAddItemsPage && ITEM_CAPABLE_PARTICULARS.includes(transaction.particular) && (
            <button
              type="button"
              onClick={() => onAddItemsPage(transaction)}
              className="block w-full text-right text-xs font-semibold text-blue-800 underline hover:text-blue-900 transition-colors -mt-2 -mb-2"
            >
              Need full details? Add items →
            </button>
          )}

          {/* Header fields */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-text-default">Date</label>
              <BsDateInput
                value={txEdit.date}
                onChange={(v) => setTxEdit((s) => s && { ...s, date: v })}
                onBlur={saveTransactionHeader}
                className="mt-1 w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-default">Voucher No</label>
              <input
                type="text"
                value={txEdit.voucher_no}
                onChange={(e) => setTxEdit((s) => s && { ...s, voucher_no: e.target.value })}
                onBlur={saveTransactionHeader}
                className="mt-1 w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
              />
            </div>
            {!hasItems && (
              <>
                <div>
                  <SelectField
                    label="Particular"
                    value={txEdit.particular}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTxEdit((s) => s && { ...s, particular: value, cheque_no: value === "cheque" ? s.cheque_no : "" });
                      saveTransactionHeader();
                    }}
                    options={TRANSACTION_PARTICULARS.map((p) => ({ label: p.label, value: p.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-default">
                    Amount <span className="normal-case">({getParticularDirection(txEdit.particular) === "debit" ? "Debit" : "Credit"})</span>
                  </label>
                  <input
                    type="number" min="0"
                    value={txEdit.amount}
                    onChange={(e) => setTxEdit((s) => s && { ...s, amount: e.target.value })}
                    onBlur={saveTransactionHeader}
                    className="mt-1 w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
                  />
                </div>
                {txEdit.particular === "cheque" && (
                  <div>
                    <label className="block text-sm font-semibold text-text-default">Cheque No</label>
                    <input
                      type="text"
                      value={txEdit.cheque_no}
                      onChange={(e) => setTxEdit((s) => s && { ...s, cheque_no: e.target.value })}
                      onBlur={saveTransactionHeader}
                      className="mt-1 w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Items */}
          {hasItems && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-text-default flex items-center justify-between">
                <span>Items ({transaction.items!.length})</span>
                {(updateItemMutation.isPending || addItemMutation.isPending || deleteItemMutation.isPending) && (
                  <span className="text-xs font-normal text-text-muted">Saving...</span>
                )}
              </p>
              <div className="space-y-3">
                {transaction.items!.map((item) => {
                  const edit = itemEdits[item.ulid];
                  if (!edit) return null;
                  return (
                    <div key={item.ulid} className="border border-slate-300 p-3 space-y-3">
                      <div className="[&_input]:h-10 [&_input]:text-sm [&_input]:font-medium [&_input]:text-black [&_.mt-1]:mt-0">
                        <ProductCombobox
                          value={edit.product_ulid}
                          onChange={(val, product) => {
                            const rate = suggestedRate(product);
                            const rateStr = rate != null ? String(rate) : edit.rate;
                            setItemEdits((prev) => ({
                              ...prev,
                              [item.ulid]: {
                                ...prev[item.ulid],
                                product_ulid: val,
                                product_name: product?.name ?? prev[item.ulid].product_name,
                                rate: rateStr,
                              },
                            }));
                            saveItem(item.ulid, { product_ulid: val, rate: rateStr });
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-text-default mb-1">Qty</label>
                          <input
                            type="number" min="0"
                            value={edit.quantity}
                            onChange={(e) => setItemEdits((prev) => ({ ...prev, [item.ulid]: { ...prev[item.ulid], quantity: e.target.value } }))}
                            onBlur={() => saveItem(item.ulid)}
                            className="w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-text-default mb-1">Rate</label>
                          <input
                            type="number" min="0"
                            value={edit.rate}
                            onChange={(e) => setItemEdits((prev) => ({ ...prev, [item.ulid]: { ...prev[item.ulid], rate: e.target.value } }))}
                            onBlur={() => saveItem(item.ulid)}
                            className="w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-text-default mb-1">Discount</label>
                          <input
                            type="number" min="0"
                            value={edit.discount}
                            onChange={(e) => setItemEdits((prev) => ({ ...prev, [item.ulid]: { ...prev[item.ulid], discount: e.target.value } }))}
                            onBlur={() => saveItem(item.ulid)}
                            className="w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-sm text-text-body">Total <span className="font-semibold text-text-default">{item.total.toLocaleString()}</span></span>
                        <button onClick={() => removeItem(item.ulid)} className="text-text-muted hover:text-red-600 transition-colors cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {addingItem ? (
                <div className="border border-dashed border-slate-300 p-3 space-y-3">
                  <div className="[&_input]:h-10 [&_input]:text-sm [&_input]:font-medium [&_input]:text-black [&_.mt-1]:mt-0">
                    <ProductCombobox
                      value={newItem.product_ulid}
                      onChange={(val, product) => {
                        const rate = suggestedRate(product);
                        setNewItem((s) => ({ ...s, product_ulid: val, product_name: product?.name ?? s.product_name, rate: rate != null ? String(rate) : s.rate }));
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-text-default mb-1">Qty</label>
                      <input
                        type="number" min="0"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem((s) => ({ ...s, quantity: e.target.value }))}
                        className="w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-default mb-1">Rate</label>
                      <input
                        type="number" min="0"
                        value={newItem.rate}
                        onChange={(e) => setNewItem((s) => ({ ...s, rate: e.target.value }))}
                        className="w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-default mb-1">Discount</label>
                      <input
                        type="number" min="0"
                        value={newItem.discount}
                        onChange={(e) => setNewItem((s) => ({ ...s, discount: e.target.value }))}
                        className="w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button onClick={() => { setNewItem(EMPTY_NEW_ITEM); setAddingItem(false); }} className="h-9 px-3 text-sm font-semibold text-text-default hover:bg-slate-50 border border-slate-300 cursor-pointer">Cancel</button>
                    <button onClick={saveNewItem} className="h-9 px-3 text-sm font-semibold text-white bg-black hover:bg-black/80 cursor-pointer">Add</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingItem(true)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-text-default hover:text-black transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Item
                </button>
              )}

              <div className="pt-3 space-y-1.5 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm-custom text-text-body">Discount</span>
                  <span className="text-sm-custom text-text-default">{transaction.discount_percent ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm-custom text-text-body">Taxable Amount</span>
                  <span className="text-sm-custom text-text-default">{(transaction.taxable_amount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm-custom text-text-body">
                    VAT (13%)
                    <input
                      type="checkbox"
                      checked={transaction.vat_exempt ?? false}
                      onChange={(e) => saveVatExempt(e.target.checked)}
                      disabled={updateTotalsMutation.isPending || updateTransactionMutation.isPending}
                      className="h-3.5 w-3.5 accent-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </span>
                  <span className="text-sm-custom text-text-default">{(transaction.vat_amount ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm-custom font-bold text-text-default">Grand Total</span>
                  <span className="text-sm-custom font-bold text-text-default">{(transaction.grand_total ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <hr className="border-slate-200" />

          {/* Receipt photo */}
          <div>
            <MultiImageUpload
              label="Receipt Photo"
              value={receiptImage.images}
              onChange={receiptImage.setImages}
              savedImages={receiptImage.savedImages}
              groupName={receiptImage.groupName}
              onGroupNameChange={receiptImage.setGroupName}
              onGroupNameBlur={receiptImage.updateGroupName}
              onSave={() => receiptImage.save(transaction.ulid)}
              onRemoveSaved={receiptImage.removeSaved}
              saving={receiptImage.saving}
              uploadStates={receiptImage.uploadStates}
              max={1}
            />
          </div>
        </>}
      </SlidePanel>

      <ConfirmDialog
        open={confirmDeleteItemUlid !== null}
        title="Delete line item?"
        description="If this is the last item, the whole transaction will be removed too. This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteItemUlid(null)}
        onConfirm={confirmRemoveItem}
      />
    </>
  );
}
