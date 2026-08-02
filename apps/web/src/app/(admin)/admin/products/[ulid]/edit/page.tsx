"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import ProductForm, { type ProductFormProduct } from "@/features/products/components/ProductForm";

export default function EditProductPage() {
  const { ulid } = useParams<{ ulid: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["product", ulid],
    queryFn: () => apiFetch<{ data: ProductFormProduct }>(`/products/${ulid}`),
    enabled: !!ulid,
  });

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-text-muted">Loading product...</div>
    );
  }

  if (!data?.data) {
    return (
      <div className="p-6 text-sm text-red-500">Product not found.</div>
    );
  }

  return <ProductForm product={data.data} />;
}
