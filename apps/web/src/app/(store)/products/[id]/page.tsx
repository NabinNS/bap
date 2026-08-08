"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, ChevronDown, ChevronUp, Phone, MessageCircle, Headphones, Truck, ShieldCheck, Wrench, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type Product = {
  ulid: string;
  name: string;
  sku: string | null;
  slug: string;
  description: string | null;
  sales_price: number | null;
  cost_price: number | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  thumbnail: string | null;
  images: string[];
  additional_information: { title: string; content: string }[] | null;
  category: { ulid: string; name: string } | null;
  brand: { ulid: string; name: string } | null;
  active_discount: { percentage: number } | null;
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const ulid = params?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", ulid],
    queryFn: () => apiFetch<{ data: Product }>(`/products/${ulid}`),
    enabled: !!ulid,
  });

  const product = data?.data;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openInfo, setOpenInfo] = useState<number | null>(0);


  if (isLoading) {
    return (
      <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 py-8">
        <div className="border border-slate-300 bg-white p-12 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-[#0d3b66] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 py-8">
        <div className="border border-slate-300 bg-white p-8">
          <p className="text-text-body mb-4">Product not found.</p>
          <Link href="/products" className="text-[#0d3b66] hover:underline">Back to Products</Link>
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
    <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 py-8 space-y-8">
      <section className="border border-slate-300 bg-white">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px] gap-0">

          {/* Image column */}
          <div className="border-b xl:border-b-0 xl:border-r border-slate-300 flex flex-col">
            <div className="relative aspect-[4/3] xl:aspect-auto xl:min-h-[480px] bg-slate-50 flex-1 flex items-center justify-center">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-4"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-body">No image</div>
              )}
              {discount && (
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-sm shadow">
                  -{discount.percentage}% OFF
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

          {/* Info column */}
          <div className="pt-6 px-6 md:pt-8 md:px-8 pb-0 flex flex-col xl:border-r border-slate-300">

            {/* Name */}
            <h1 className="text-h2 font-bold text-text-body mb-3 leading-tight">{product.name}</h1>


            {/* Price block */}
            <div className="mb-3 space-y-1">
              {discount ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-body text-text-default line-through">
                      Rs. {salesPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-sm">
                      -{discount.percentage}% OFF
                    </span>
                  </div>
                  <span className="text-h2 font-bold text-text-body">
                    Rs. {discountedPrice!.toLocaleString()}
                  </span>
                  <p className="text-xs text-emerald-600 font-medium">
                    You save Rs. {(salesPrice - discountedPrice!).toLocaleString()}
                  </p>
                </>
              ) : (
                <span className="text-h2 font-bold text-text-body">
                  Rs. {salesPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="max-h-[320px] overflow-y-auto border-t border-slate-300 pt-3" style={{ scrollbarWidth: "none" }}>
                <p className="text-h4 font-bold text-text-body mb-2">Description</p>
                <div
                  className="text-body leading-7 text-text-default prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Quantity + Stock + Actions */}
            <div className="mt-auto -mx-6 md:-mx-8 px-6 md:px-8 min-h-[88px] xl:h-[88px] shrink-0 border-t border-slate-300 flex items-center justify-between gap-4 flex-wrap py-3 xl:py-0">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-10 w-10 text-h4 text-[#0d3b66] hover:bg-slate-50 transition-colors cursor-pointer select-none"
                  >−</button>
                  <span className="h-10 w-14 border-x border-slate-300 flex items-center justify-center text-body font-semibold text-text-body">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="h-10 w-10 text-h4 text-[#0d3b66] hover:bg-slate-50 transition-colors cursor-pointer select-none"
                  >+</button>
                </div>
                <div>
                  {product.stock > 0 ? (
                    <>
                      <p className="text-sm font-semibold text-emerald-700">In Stock</p>
                      <p className="text-xs text-text-default">{product.stock} units available</p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-red-500">Out of Stock</p>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <Button
                  className="bg-[#0d3b66] hover:bg-slate-900 text-white rounded-none h-10 px-6 cursor-pointer"
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  className="rounded-none border-slate-300 text-[#0d3b66] hover:bg-slate-50 h-10 px-6 cursor-pointer"
                  disabled={product.stock === 0}
                >
                  Buy Now
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="bg-white flex flex-col divide-y divide-slate-200">

            {/* Delivery & Availability */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0d3b66]" />
                <h3 className="text-sm-custom font-bold uppercase tracking-wider text-text-default">Delivery & Availability</h3>
              </div>
              <div className="space-y-2 text-sm-custom text-text-body">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">In stock</span>
                  <span className={`font-semibold px-2 py-0.5 text-sm-custom rounded-xs ${
                    product.stock > 0
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}>
                    {product.stock > 0 ? "Ready to ship" : "Out of stock"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Estimated delivery</span>
                  <span className="font-semibold text-text-body">Within 24 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Shipping</span>
                  <span className="font-semibold text-text-body">Cost may vary</span>
                </div>
              </div>
            </div>

            {/* Fitment Check */}
            <div className="p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#0d3b66]" />
                <h3 className="text-sm-custom font-bold uppercase tracking-wider text-text-default">Fitment Check</h3>
              </div>
              <p className="text-sm-custom text-text-muted leading-relaxed">
                Confirm compatibility with your vehicle model before checkout.
              </p>
              <p className="text-sm-custom font-semibold text-[#0d3b66] flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Recommended before purchase
              </p>
            </div>

            {/* Warranty & Returns */}
            <div className="p-5 space-y-2.5 flex-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0d3b66]" />
                <h3 className="text-sm-custom font-bold uppercase tracking-wider text-text-default">Warranty & Returns</h3>
              </div>
              <ul className="space-y-2 text-sm-custom text-text-body">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0d3b66] shrink-0" />
                  <span><strong className="font-bold text-text-default">1-day</strong> easy return policy</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0d3b66] shrink-0" />
                  <span><strong className="font-bold text-text-default">100%</strong> genuine parts assurance</span>
                </li>
              </ul>
            </div>

            {/* Need Help */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-[#0d3b66]" />
                  <h3 className="text-sm-custom font-bold uppercase tracking-wider text-text-default">Need Help?</h3>
                </div>
                <span className="text-sm-custom font-semibold text-text-muted bg-white border border-slate-200 px-2 py-0.5 rounded-xs">
                  10am – 7pm
                </span>
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-sm p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm-custom text-text-muted font-medium uppercase tracking-wide mb-0.5">Customer Support</p>
                  <p className="text-sm-custom font-black text-text-default">+977 9812 345 678</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Link
                    href="tel:+9779812345678"
                    title="Call Us"
                    className="h-9 w-9 rounded-xs bg-[#0d3b66] hover:bg-[#092d50] text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                  </Link>
                  <Link
                    href="https://wa.me/9779812345678"
                    target="_blank"
                    title="WhatsApp"
                    className="h-9 w-9 rounded-xs bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </aside>
        </div>
      </section>

      {/* Additional Information */}
      {product.additional_information && product.additional_information.length > 0 && (
        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-h4 font-bold text-text-body uppercase tracking-wide">Additional Information</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {product.additional_information.map((item, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenInfo(openInfo === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span className="text-body font-semibold text-text-body">{item.title}</span>
                  {openInfo === i ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                </button>
                {openInfo === i && (
                  <div
                    className="px-6 pb-5 text-body text-text-body leading-7 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
