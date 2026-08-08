"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Pencil, ChevronDown, ChevronUp } from "lucide-react";

type Product = {
  ulid: string;
  name: string;
  sku: string | null;
  slug: string;
  description: string | null;
  sales_price: number | null;
  cost_price: number | null;
  stock: number;
  low_stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  thumbnail: string | null;
  images: string[];
  additional_information: { title: string; content: string }[] | null;
  category: { ulid: string; name: string } | null;
  brand: { ulid: string; name: string } | null;
  active_discount: { percentage: number } | null;
};

export default function AdminProductViewPage() {
  const { ulid } = useParams<{ ulid: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", ulid],
    queryFn: () => apiFetch<{ data: Product }>(`/products/${ulid}`),
    enabled: !!ulid,
  });

  const product = data?.data;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openInfo, setOpenInfo] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="border border-slate-300 bg-white p-12 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-[#0d3b66] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex-1 p-6">
        <div className="border border-slate-300 bg-white p-8">
          <p className="text-sm text-red-500">Product not found.</p>
          <Link href="/admin/products" className="text-sm text-[#0d3b66] hover:underline mt-2 inline-block">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : [];
  const activeImage = selectedImage ?? images[0] ?? null;
  const discount = product.active_discount;
  const salesPrice = product.sales_price ?? 0;
  const discountedPrice = discount ? Math.round(salesPrice * (1 - discount.percentage / 100)) : null;

  return (
    <div className="flex-1 min-w-0 space-y-6 p-6">

      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-sm text-text-muted">
          <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/admin/products" className="hover:text-text-default transition-colors">Products</Link>
          <span>/</span>
          <span className="text-text-default font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
        <Link
          href={`/admin/products/${ulid}/edit`}
          className="flex items-center gap-2 bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Product
        </Link>
      </div>

      {/* Main card */}
      <div className="border border-slate-300 bg-white">
        <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-0">

          {/* Image column */}
          <div className="border-b xl:border-b-0 xl:border-r border-slate-300 flex flex-col">
            <div className="relative aspect-square bg-slate-50 flex items-center justify-center">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  sizes="380px"
                  className="object-contain p-4"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-sm">No image</div>
              )}
              {discount && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 shadow">
                  -{discount.percentage}% OFF
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex items-center gap-2 p-4 border-t border-slate-200 flex-wrap">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(src)}
                    className={`relative h-14 w-14 border shrink-0 transition-colors cursor-pointer bg-white ${
                      activeImage === src ? "border-[#0d3b66]" : "border-slate-300 hover:border-[#0d3b66]"
                    }`}
                  >
                    <Image src={src} alt={`${product.name} ${i + 1}`} fill sizes="56px" className="object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details column */}
          <div className="p-6 md:p-8 space-y-6">

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-h3 font-bold text-text-default leading-tight">{product.name}</h1>
                {product.sku && (
                  <p className="text-xs font-mono text-text-muted mt-1">SKU: {product.sku}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 ${
                  product.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}>
                  {product.is_active ? "Active" : "Inactive"}
                </span>
                {product.is_featured && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200">
                    Featured
                  </span>
                )}
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-slate-200 p-3 space-y-0.5">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Category</p>
                <p className="text-sm font-semibold text-text-default">{product.category?.name ?? "—"}</p>
              </div>
              <div className="border border-slate-200 p-3 space-y-0.5">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Brand</p>
                <p className="text-sm font-semibold text-text-default">{product.brand?.name ?? "—"}</p>
              </div>
              <div className="border border-slate-200 p-3 space-y-0.5">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Stock</p>
                <p className={`text-sm font-semibold ${product.stock === 0 ? "text-red-500" : "text-text-default"}`}>
                  {product.stock === 0 ? "Out of stock" : `${product.stock} units`}
                </p>
              </div>
              <div className="border border-slate-200 p-3 space-y-0.5">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold">Low Stock Alert</p>
                <p className="text-sm font-semibold text-text-default">
                  {product.low_stock_quantity != null ? `${product.low_stock_quantity} units` : "—"}
                </p>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Pricing</h3>
              <div className="flex items-end gap-6 flex-wrap">
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Cost Price</p>
                  <p className="text-lg font-bold text-text-default">
                    {product.cost_price != null ? `Rs. ${product.cost_price.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">Sales Price</p>
                  <p className="text-lg font-bold text-text-default">
                    Rs. {salesPrice.toLocaleString()}
                  </p>
                </div>
                {discount && (
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">After Discount ({discount.percentage}% off)</p>
                    <p className="text-lg font-bold text-red-500">
                      Rs. {discountedPrice!.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Description</h3>
                <div
                  className="text-sm leading-7 text-text-default prose prose-sm max-w-none border border-slate-200 p-4"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      {product.additional_information && product.additional_information.length > 0 && (
        <div className="border border-slate-300 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-default">Additional Information</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {product.additional_information.map((item, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenInfo(openInfo === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-semibold text-text-default">{item.title}</span>
                  {openInfo === i
                    ? <ChevronUp className="h-4 w-4 text-text-muted shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-text-muted shrink-0" />
                  }
                </button>
                {openInfo === i && (
                  <div
                    className="px-6 pb-5 text-sm text-text-default leading-7 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
