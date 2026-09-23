import { useQueryClient } from "@tanstack/react-query";

/**
 * Every mutation that changes a vendor transaction/item invalidates the same set of caches:
 * that vendor's transaction list, the vendor sidebar balance, and — when the transaction has
 * line items — the linked products' stock ledger. This used to be hand-copied into every page
 * that touches vendor transactions (admin/accounts, goods-purchased), and the copies drifted
 * out of sync more than once. Both pages should call this instead of invalidating by hand.
 */
export function useInvalidateVendorTransactions() {
  const queryClient = useQueryClient();

  return (vendorUlid: string) => {
    queryClient.invalidateQueries({ queryKey: ["acc-vendor-transactions", vendorUlid] });
    queryClient.invalidateQueries({ queryKey: ["acc-vendors"] });
    queryClient.invalidateQueries({ queryKey: ["product-transaction-items"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["products-sidebar"] });
  };
}

/** Customer mirror of {@link useInvalidateVendorTransactions}. */
export function useInvalidateCustomerTransactions() {
  const queryClient = useQueryClient();

  return (customerUlid: string) => {
    queryClient.invalidateQueries({ queryKey: ["acc-customer-transactions", customerUlid] });
    queryClient.invalidateQueries({ queryKey: ["acc-customers"] });
    queryClient.invalidateQueries({ queryKey: ["product-transaction-items"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["products-sidebar"] });
  };
}
