"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { SelectField } from "@/components/ui/form/FormField";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { CreateProductPanel } from "@/components/products/CreateProductPanel";
import { EditProductPanel } from "@/components/products/EditProductPanel";
import { StockSidebar } from "./StockSidebar";
import { ProductDetailCard } from "./ProductDetailCard";
import { StockLedger, StockLedgerHandle } from "./StockLedger";
import { ProductTransactionItemPanel, TransactionItemPanelItem } from "./ProductTransactionItemPanel";

type FiscalYear = { id: number; ulid: string; name: string };

type Meta = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
};

type Product = {
  ulid: string;
  name: string;
  thumbnail: string | null;
  sku: string | null;
  cost_price: number | null;
  wacc: number | null;
  sales_price: number | null;
  stock: number;
  low_stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  category: { ulid: string; name: string } | null;
  brand: { ulid: string; name: string } | null;
  active_discount: { percentage: number } | null;
  stock_balances?: { fiscal_year_id: number; opening_quantity: number; remaining_quantity: number }[];
};

export function ProductsWorkspace({
  title = "Products",
  description = "Manage your product catalogue, pricing and stock levels.",
}: {
  title?: string;
  description?: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");

  const [sideSearch, setSideSearch] = useState("");
  const [selectedProductUlid, setSelectedProductUlid] = useState<string | null>(productParam);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [panelItem, setPanelItem] = useState<TransactionItemPanelItem | null>(null);
  const [editingOpeningQuantity, setEditingOpeningQuantity] = useState(false);
  const [openingQuantityDraft, setOpeningQuantityDraft] = useState("");
  const [openingFiscalYearId, setOpeningFiscalYearId] = useState("");
  const ledgerRef = useRef<StockLedgerHandle>(null);

  const { data: sidebarProductsData, isLoading: sidebarLoading } = useQuery({
    queryKey: ["products-sidebar"],
    queryFn: () => apiFetch<{ data: Product[]; meta: Meta }>("/products?per_page=200&sort_by=name&sort_dir=asc"),
  });

  const { data: settingsData } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ data: { fiscal_year_id: number | null; fiscal_year: { ulid: string; name: string } | null } }>("/settings"),
  });

  const { data: fiscalYearsData } = useQuery({
    queryKey: ["fiscal-years"],
    queryFn: () => apiFetch<{ data: FiscalYear[] }>("/fiscal-years"),
    staleTime: Infinity,
  });

  const activeFiscalYear = settingsData?.data?.fiscal_year ?? null;
  const activeFiscalYearId = settingsData?.data?.fiscal_year_id ?? null;
  const fiscalYears = fiscalYearsData?.data ?? [];

  const sidebarProducts = sidebarProductsData?.data ?? [];
  const selectedProduct = sidebarProducts.find((p) => p.ulid === selectedProductUlid) ?? null;

  const activeBalance = activeFiscalYearId && selectedProduct
    ? selectedProduct.stock_balances?.find((b) => b.fiscal_year_id === activeFiscalYearId) ?? null
    : null;

  const saveStockBalanceMutation = useMutation({
    mutationFn: ({ ulid, opening_quantity, fiscal_year_id }: { ulid: string; opening_quantity: string; fiscal_year_id: string }) =>
      apiFetch(`/products/${ulid}/stock-balance`, {
        method: "POST",
        body: JSON.stringify({
          opening_quantity: parseInt(opening_quantity, 10),
          fiscal_year_id: parseInt(fiscal_year_id, 10),
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-sidebar"] });
      queryClient.invalidateQueries({ queryKey: ["product-transaction-items"] });
      toast.success("Opening quantity saved", "The stock balance has been updated.");
    },
    onError: () => toast.error("Failed to save", "Could not save the opening quantity."),
  });

  useEffect(() => {
    if (!selectedProductUlid && sidebarProducts.length > 0) setSelectedProductUlid(sidebarProducts[0].ulid);
  }, [sidebarProducts]);

  const deleteProduct = useMutation({
    mutationFn: (ulid: string) => apiFetch(`/products/${ulid}`, { method: "DELETE" }),
    onSuccess: (_, ulid) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-sidebar"] });
      if (selectedProductUlid === ulid) setSelectedProductUlid(null);
      toast.success("Product deleted", "The product has been removed.");
    },
    onError: () => toast.error("Failed to delete", "Something went wrong."),
  });

  return (
    <div className="flex gap-0 transition-all duration-300 h-full">
      <div className="flex-1 min-w-0 flex flex-col p-6 gap-6 h-full">
        <div>
          <h2 className="text-h3 font-bold text-text-default">{title}</h2>
          <p className="text-sm text-text-muted mt-0.5">{description}</p>
        </div>

        {/* Two-column body */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Side card */}
          <StockSidebar
            products={sidebarProducts}
            loading={sidebarLoading}
            activeFiscalYearId={activeFiscalYearId}
            selectedProductUlid={selectedProduct?.ulid}
            search={sideSearch}
            onSearchChange={setSideSearch}
            onSelect={(product) => setSelectedProductUlid(product.ulid)}
            onDelete={(product) => deleteProduct.mutate(product.ulid)}
            onAddClick={() => setAddProductOpen(true)}
            onEditClick={(product) => setEditingProduct(product)}
          />

          {/* Detail card + ledger */}
          <div className="flex-1 min-w-0 flex flex-col gap-4 h-full min-h-0">
            <ProductDetailCard
              product={selectedProduct}
              activeFiscalYearId={activeFiscalYearId}
              onEditOpeningQuantity={() => {
                setOpeningQuantityDraft(activeBalance ? String(activeBalance.opening_quantity) : "");
                setOpeningFiscalYearId(activeFiscalYearId ? String(activeFiscalYearId) : "");
                setEditingOpeningQuantity(true);
              }}
              onPurchaseClick={() => router.push(`/admin/accounts/goods-purchased?product=${selectedProduct?.ulid ?? ""}`)}
              onSalesClick={() => router.push(`/admin/products/goods-sold?product=${selectedProduct?.ulid ?? ""}`)}
              onEditClick={() => { if (selectedProduct) setEditingProduct(selectedProduct); }}
              onDelete={() => { if (selectedProduct) deleteProduct.mutate(selectedProduct.ulid); }}
            />

            <div className="flex-1 min-h-0 min-w-0 flex gap-4">
              <div className="flex-1 min-w-0">
                {selectedProduct ? (
                  <StockLedger
                    ref={ledgerRef}
                    productUlid={selectedProduct.ulid}
                    currentStock={selectedProduct.stock}
                    openingQuantity={activeBalance?.opening_quantity}
                    fiscalYearName={activeFiscalYear?.name}
                    onOpeningBalanceClick={() => {
                      setOpeningQuantityDraft(activeBalance ? String(activeBalance.opening_quantity) : "");
                      setOpeningFiscalYearId(activeFiscalYearId ? String(activeFiscalYearId) : "");
                      setEditingOpeningQuantity(true);
                    }}
                    onItemClick={(item) => setPanelItem(item)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center border border-slate-300 bg-slate-50 text-sm text-text-muted">
                    Select a product to view its stock ledger.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Opening quantity edit panel */}
      <SlidePanel
        open={!!(editingOpeningQuantity && selectedProduct)}
        onClose={() => setEditingOpeningQuantity(false)}
        title="Opening Quantity"
        description="Set the starting stock for a fiscal year."
        submitLabel="Save"
        onSubmit={() => {
          if (!selectedProduct) return;
          if (!openingFiscalYearId) { toast.warning("No fiscal year", "Select a fiscal year first."); return; }
          saveStockBalanceMutation.mutate({ ulid: selectedProduct.ulid, opening_quantity: openingQuantityDraft, fiscal_year_id: openingFiscalYearId });
          setEditingOpeningQuantity(false);
        }}
      >
        {selectedProduct && (
          <>
            <SelectField
              label="Fiscal Year"
              value={openingFiscalYearId}
              onChange={(e) => {
                const fyId = e.target.value;
                setOpeningFiscalYearId(fyId);
                const balance = selectedProduct.stock_balances?.find((b) => b.fiscal_year_id === Number(fyId));
                setOpeningQuantityDraft(balance ? String(balance.opening_quantity) : "");
              }}
              options={[
                { label: "— Select fiscal year —", value: "" },
                ...fiscalYears.map((fy) => ({ label: fy.name, value: String(fy.id) })),
              ]}
            />
            <div>
              <label className="block text-sm font-semibold text-text-default">Quantity</label>
              <input
                type="number" min="0"
                value={openingQuantityDraft}
                onChange={(e) => setOpeningQuantityDraft(e.target.value)}
                className="mt-1 w-full h-10 px-3 text-sm font-medium text-black border border-slate-400 focus:outline-none focus:border-slate-600 bg-white"
              />
            </div>
          </>
        )}
      </SlidePanel>

      <CreateProductPanel
        open={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        onCreated={(product) => setSelectedProductUlid(product.ulid)}
      />

      <EditProductPanel
        open={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onUpdated={() => queryClient.invalidateQueries({ queryKey: ["products-sidebar"] })}
      />

      <ProductTransactionItemPanel
        productUlid={selectedProduct?.ulid ?? ""}
        item={panelItem}
        onClose={() => setPanelItem(null)}
      />
    </div>
  );
}
