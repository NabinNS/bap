"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  ArrowLeft,
  BadgePercent,
  Star,
  MessageCircle,
  Image as ImageIcon,
  ClipboardList,
  TrendingUp,
  Activity,
  Check,
} from "lucide-react";

type ProductDiscount = {
  ulid: string;
  percentage: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

type Product = {
  ulid: string;
  name: string;
  sku: string | null;
  slug: string;
  description: string | null;
  sales_price: number | null;
  cost_price: number | null;
  wacc: number | null;
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
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  barcode?: string | null;
};

const TABS = [
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "questions", label: "Questions", icon: MessageCircle },
  { key: "discounts", label: "Discounts", icon: BadgePercent },
  { key: "images", label: "Product Images", icon: ImageIcon },
  { key: "inventory_history", label: "Inventory History", icon: ClipboardList },
  { key: "price_history", label: "Price History", icon: TrendingUp },
  { key: "activities", label: "Activities", icon: Activity },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function AdminProductViewPage() {
  const { ulid } = useParams<{ ulid: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", ulid],
    queryFn: () => apiFetch<{ data: Product }>(`/products/${ulid}`),
    enabled: !!ulid,
  });

  const { data: discountsData } = useQuery({
    queryKey: ["product-discounts", ulid],
    queryFn: () => apiFetch<{ data: ProductDiscount[] }>(`/products/${ulid}/discounts`),
    enabled: !!ulid,
  });

  const product = data?.data;
  const discounts = discountsData?.data ?? [];
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("reviews");

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="border border-slate-300 bg-white p-12 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex-1 p-6">
        <div className="border border-slate-300 bg-white p-8">
          <p className="text-sm text-red-500">Product not found.</p>
          <Link href="/admin/products" className="text-sm text-text-muted hover:text-text-default mt-2 inline-block">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : [];
  const activeImage = selectedImage ?? images[0] ?? null;
  const salesPrice = product.sales_price ?? 0;
  const activeDiscount = product.active_discount;
  const discountedPrice = activeDiscount ? Math.round(salesPrice * (1 - activeDiscount.percentage / 100)) : null;
  const inStock = product.stock > 0;

  return (
    <div className="flex-1 min-w-0 space-y-5 p-6 bg-[#f5f7fa]">

      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-default transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
          <nav className="flex items-center gap-1.5 text-sm text-text-muted">
            <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/admin/products" className="hover:text-text-default transition-colors">Products</Link>
            <span>/</span>
            <span className="text-text-default font-medium truncate max-w-[240px]">{product.name}</span>
          </nav>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-h2 font-bold text-text-default tracking-tight">Product Details</h2>
            <p className="text-sm text-text-muted mt-0.5">View and manage product information, inventory and more.</p>
          </div>
          <div className="flex items-center shrink-0">
            <Link href={`/admin/products/${ulid}/edit`} className="px-4 py-2 text-sm font-semibold bg-black text-white hover:bg-black/80 transition-colors">
              Edit Product
            </Link>
            <Link href="#" className="px-4 py-2 text-sm font-semibold border border-l-0 border-red-300 text-red-600 hover:bg-red-50 transition-colors">
              Delete
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3-column body ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr_360px] gap-5 items-stretch">

        {/* ── Col 1: Image Gallery ── */}
        <div className="bg-white border border-slate-300 overflow-hidden">
          <div className="relative aspect-square bg-slate-50 flex items-center justify-center">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.name}
                fill
                sizes="400px"
                className="object-contain p-6"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-text-subtle text-sm">No image</div>
            )}
            {activeDiscount && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-sm shadow">
                -{activeDiscount.percentage}% OFF
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="h-[88px] shrink-0 flex items-center gap-2 px-4 border-t border-slate-300">
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

        {/* ── Col 2: Product Details ── */}
        <div className="bg-white border border-slate-300 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-slate-300 flex items-center justify-between gap-4">
            <h3 className="text-h3 font-bold text-text-default leading-snug">{product.name}</h3>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 border ${
                product.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"
              }`}>
                {product.is_active ? "Active" : "Inactive"}
              </span>
              {product.is_featured && (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                  Featured
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-7">

            {/* General Information */}
            <div>
              <h4 className="text-h4 font-semibold uppercase tracking-wider text-text-default mb-3 pb-2 border-b border-slate-400 -mx-6 px-6">
                General Information
              </h4>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow label="SKU / Part No." value={product.sku} />
                {product.barcode && <InfoRow label="Barcode" value={product.barcode} />}
                <InfoRow label="Category" value={product.category?.name} />
                <InfoRow label="Brand" value={product.brand?.name} />
                <InfoRow label="Slug" value={product.slug} mono />
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-h4 font-semibold uppercase tracking-wider text-text-default mb-3 pb-2 border-b border-slate-400 -mx-6 px-6">
                Description
              </h4>
              {product.description ? (
                <div
                  className="max-h-64 overflow-y-auto text-sm leading-7 text-text-default prose prose-sm max-w-none -mx-6 px-6"
                  style={{ scrollbarWidth: "thin" }}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-sm text-text-muted">—</p>
              )}
            </div>

            {/* Additional Information */}
            {product.additional_information && product.additional_information.length > 0 && (
              <div>
                <h4 className="text-h4 font-semibold uppercase tracking-wider text-text-default mb-3 pb-2 border-b border-slate-400 -mx-6 px-6">
                  Additional Information
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {product.additional_information.map((item, i) => (
                    <InfoRow key={i} label={item.title} valueHtml={item.content} />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Col 3: Sidebar ── */}
        <div className="flex flex-col gap-4 h-full">

          {/* Pricing */}
          <div className="bg-white border border-slate-300 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-300">
              <h3 className="text-h4 font-semibold uppercase tracking-wider text-text-default">Pricing</h3>
            </div>
            <div className="p-4 space-y-3">
              <SidebarRow label="Cost Price" value={<span className="text-sm text-text-default">{product.cost_price != null ? `Rs. ${product.cost_price.toLocaleString()}` : "—"}</span>} />
              <SidebarRow label="WACC" value={<span className="text-sm text-text-default">{product.wacc != null ? `Rs. ${product.wacc.toLocaleString()}` : "—"}</span>} />
              <SidebarRow label="Selling Price" value={<span className="text-sm text-text-default">Rs. {salesPrice.toLocaleString()}</span>} />
              <SidebarRow label="Discount" value={<span className="text-sm text-text-default">{activeDiscount ? `${activeDiscount.percentage}%` : "—"}</span>} />
              <SidebarRow label="Final Price" value={<span className={`text-sm font-semibold ${discountedPrice != null ? "text-red-500" : "text-text-default"}`}>{discountedPrice != null ? `Rs. ${discountedPrice.toLocaleString()}` : `Rs. ${salesPrice.toLocaleString()}`}</span>} />
            </div>
          </div>

          {/* Stock */}
          <div className="bg-white border border-slate-300 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-300">
              <h3 className="text-h4 font-semibold uppercase tracking-wider text-text-default">Inventory</h3>
            </div>
            <div className="p-4 space-y-3">
              <SidebarRow label="Stock" value={
                <span className={`text-sm font-semibold ${product.stock === 0 ? "text-red-500" : "text-text-default"}`}>
                  {product.stock === 0 ? "Out of stock" : `${product.stock} units`}
                </span>
              } />
              <SidebarRow label="Low Stock Alert" value={
                <span className="text-sm text-text-default">
                  {product.low_stock_quantity != null ? `${product.low_stock_quantity} units` : "—"}
                </span>
              } />
              <SidebarRow label="Status" value={
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 border ${
                  inStock ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                }`}>
                  {inStock ? <><Check className="h-3 w-3" />In Stock</> : "Out of Stock"}
                </span>
              } />
            </div>
          </div>

          {/* Status & Visibility */}
          <div className="bg-white border border-slate-300 overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-slate-300">
              <h3 className="text-h4 font-semibold uppercase tracking-wider text-text-default">Status &amp; Visibility</h3>
            </div>
            <div className="p-4 space-y-3">
              <SidebarRow label="Product Status" value={
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 border ${
                  product.is_active
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}>
                  {product.is_active ? "Active" : "Inactive"}
                </span>
              } />
              <SidebarRow label="Visibility" value={
                product.is_featured ? (
                  <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200">
                    Featured
                  </span>
                ) : (
                  <span className="text-sm text-text-muted">—</span>
                )
              } />
              <SidebarRow label="Published At" value={<span className="text-xs text-text-default tabular-nums">{formatDate(product.published_at)}</span>} />
              <SidebarRow label="Updated At" value={<span className="text-xs text-text-default tabular-nums">{formatDate(product.updated_at)}</span>} />
            </div>
          </div>




        </div>
      </div>

      {/* ── Tabs Section ── */}
      <div className="bg-white border border-slate-300 overflow-hidden">
        <div className="flex items-center border-b border-slate-300 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  isActive
                    ? "border-[#0d3b66] text-[#0d3b66]"
                    : "border-transparent text-text-muted hover:text-text-default hover:border-slate-300 cursor-pointer"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === "reviews" && (
            <div className="text-sm text-text-muted flex items-center gap-2">
              <Star className="h-4 w-4" />No reviews yet.
            </div>
          )}
          {activeTab === "questions" && (
            <div className="text-sm text-text-muted flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />No questions yet.
            </div>
          )}
          {activeTab === "discounts" && (
            <div>
              {discounts.length === 0 ? (
                <p className="text-sm text-text-muted">No discounts added yet.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300">
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-text-muted pb-2 pr-6">Discount</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-text-muted pb-2 pr-6">Starts</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-text-muted pb-2 pr-6">Ends</th>
                      <th className="text-left text-xs font-semibold uppercase tracking-wider text-text-muted pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {discounts.map((d) => (
                      <tr key={d.ulid}>
                        <td className="py-3 pr-6 font-semibold text-text-default">{d.percentage}% off</td>
                        <td className="py-3 pr-6 text-text-muted tabular-nums">{formatDate(d.starts_at)}</td>
                        <td className="py-3 pr-6 text-text-muted tabular-nums">{formatDate(d.ends_at)}</td>
                        <td className="py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 border ${
                            d.is_active
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            {d.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {activeTab === "images" && (
            <div>
              {images.length === 0 ? (
                <p className="text-sm text-text-muted">No images uploaded.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {images.map((src, i) => (
                    <div key={i} className="relative aspect-square border border-slate-300 bg-slate-50 overflow-hidden">
                      <Image src={src} alt={`Image ${i + 1}`} fill sizes="120px" className="object-contain p-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeTab === "inventory_history" && (
            <div className="text-sm text-text-muted flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />No inventory history yet.
            </div>
          )}
          {activeTab === "price_history" && (
            <div className="text-sm text-text-muted flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />No price history yet.
            </div>
          )}
          {activeTab === "activities" && (
            <div className="text-sm text-text-muted flex items-center gap-2">
              <Activity className="h-4 w-4" />No activities recorded.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/* ── Helper components ── */

function InfoRow({ label, value, valueHtml, mono }: {
  label: string;
  value?: string | null;
  valueHtml?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-sm-custom font-semibold text-text-default mb-0.5">{label}</p>
      {valueHtml ? (
        <div
          className="text-table-data text-text-default prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: valueHtml }}
        />
      ) : (
        <p className={`text-table-data text-text-default ${mono ? "font-mono" : ""}`}>{value ?? "—"}</p>
      )}
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm-custom font-semibold text-text-default shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}

