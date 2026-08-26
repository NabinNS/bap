"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ComboboxField } from "@/components/ui/form/FormField";

export type ProductOption = {
  ulid: string;
  name: string;
  sku: string | null;
  cost_price: number | null;
  wacc: number | null;
  sales_price: number | null;
};

type Props = {
  label?: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string, product: ProductOption | null) => void;
  error?: string;
  /** Called with the typed search text when no product matches — wire up a create panel/modal. */
  onAddNew?: (query: string) => void;
};

const DEBOUNCE_MS = 200;

/** Searchable product select, styled like the Category/Brand pickers in ProductForm. Shows the 5 most recent products by default, searches server-side once typing starts. */
export function ProductCombobox({ label = "", required, placeholder = "Select a product", value, onChange, error, onAddNew }: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isFetching } = useQuery({
    queryKey: ["products", "combobox", debouncedSearch],
    queryFn: () => apiFetch<{ data: ProductOption[] }>(
      `/products/search?per_page=${debouncedSearch ? 20 : 5}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`
    ),
    placeholderData: (prev) => prev,
  });

  // The currently selected product may not be in the latest/searched page — fetch it directly so its label still resolves.
  const { data: selectedData } = useQuery({
    queryKey: ["products", "combobox-selected", value],
    queryFn: () => apiFetch<{ data: ProductOption }>(`/products/${value}`),
    enabled: !!value,
    staleTime: 60_000,
  });

  const fetched = data?.data ?? [];
  const products = fetched.some((p) => p.ulid === value) || !selectedData?.data
    ? fetched
    : [selectedData.data, ...fetched];

  return (
    <ComboboxField
      label={label}
      required={required}
      placeholder={placeholder}
      loading={isFetching}
      options={products.map((p) => ({ label: p.sku ? `${p.name} (${p.sku})` : p.name, value: p.ulid }))}
      value={value}
      onChange={(val) => onChange(val, products.find((p) => p.ulid === val) ?? null)}
      onSearchChange={setSearch}
      error={error}
      onAddNew={onAddNew}
    />
  );
}
