"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Star, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";
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
          <p className="text-gray-700 mb-4">Product not found.</p>
          <Link href="/products" className="text-[#0d3b66] hover:underline">Back to Products</Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : [];
  const activeImage = selectedImage ?? images[0] ?? null;

  return (
    <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Main card */}
      <section className="border border-slate-300 bg-white">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px] gap-0">

          {/* Image column */}
          <div className="border-b xl:border-b-0 xl:border-r border-slate-300 flex flex-col">
            <div className="relative aspect-[4/3] xl:aspect-auto xl:min-h-[480px] bg-slate-50 flex-1">
              {activeImage ? (
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-body">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex items-center gap-2 p-4 border-t border-slate-200">
                {images.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(src)}
                    className={`relative h-14 w-14 border shrink-0 transition-colors ${
                      activeImage === src ? "border-[#0d3b66]" : "border-slate-300 hover:border-[#0d3b66]"
                    }`}
                  >
                    <Image src={src} alt={`${product.name} ${i + 1}`} fill sizes="56px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="p-6 md:p-8 flex flex-col xl:border-r border-slate-300">
            {(product.brand || product.category) && (
              <div className="flex items-center gap-2 mb-2">
                {product.category && (
                  <span className="text-sm-custom font-semibold uppercase tracking-wider text-text-muted">{product.category.name}</span>
                )}
                {product.brand && product.category && (
                  <span className="text-text-muted">·</span>
                )}
                {product.brand && (
                  <span className="text-sm-custom font-semibold uppercase tracking-wider text-[#0d3b66]">{product.brand.name}</span>
                )}
              </div>
            )}
            <h1 className="text-h2 font-bold text-gray-900 mb-2">{product.name}</h1>

            {product.sku && (
              <p className="text-sm-custom text-gray-400 font-mono mb-4">SKU: {product.sku}</p>
            )}

            {/* Static star rating */}
            <div className="flex items-center gap-1 text-amber-500 mb-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-transparent stroke-amber-400" />
              ))}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-h2 font-bold text-[#0d3b66]">
                Rs. {(product.sales_price ?? 0).toLocaleString()}
              </span>
              {product.cost_price && product.cost_price > (product.sales_price ?? 0) && (
                <span className="text-body text-gray-400 line-through">
                  Rs. {product.cost_price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div
                className="border-t border-slate-200 pt-5 mb-6 text-body leading-7 text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {/* Stock */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <span className="text-body font-semibold text-emerald-700">In Stock ({product.stock} available)</span>
              ) : (
                <span className="text-body font-semibold text-red-500">Out of Stock</span>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-8">
              <p className="text-body font-semibold text-gray-800">Quantity</p>
              <div className="inline-flex items-center border border-slate-300">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-10 w-10 text-h4 text-[#0d3b66] hover:bg-slate-50 transition-colors"
                >-</button>
                <span className="h-10 w-16 border-x border-slate-300 flex items-center justify-center text-body font-medium text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="h-10 w-10 text-h4 text-[#0d3b66] hover:bg-slate-50 transition-colors"
                >+</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="w-full sm:w-auto bg-[#0d3b66] hover:bg-slate-900 text-white rounded-none h-12 px-6 cursor-pointer">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
              <Button variant="outline" className="w-full sm:w-auto rounded-none border-slate-300 text-[#0d3b66] hover:bg-slate-50 h-12 px-6">
                Buy Now
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="bg-white divide-y divide-slate-300">
            <div className="p-4 mt-3">
              <h3 className="text-sm-custom font-bold uppercase text-text-default mb-3">Delivery & Availability</h3>
              <div className="space-y-2 text-sm-custom text-gray-600">
                <p><span className="font-semibold text-gray-500">In stock:</span>{" "}
                  <span className={`font-semibold ${product.stock > 0 ? "text-emerald-700" : "text-red-500"}`}>
                    {product.stock > 0 ? "Ready to ship" : "Out of stock"}
                  </span>
                </p>
                <p><span className="font-semibold text-gray-500">Estimated delivery:</span>{" "}
                  <span className="font-semibold text-gray-900">2-4 business days</span>
                </p>
                <p><span className="font-semibold text-gray-500">Shipping:</span>{" "}
                  <span className="font-semibold text-gray-900">Free above Rs. 5,000</span>
                </p>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm-custom font-bold uppercase text-text-default mb-2">Fitment Check</h3>
              <p className="text-sm-custom text-gray-600 leading-6 mb-3">Confirm compatibility with your vehicle model before checkout.</p>
              <p className="text-sm-custom font-semibold text-[#0d3b66]">Recommended before purchase</p>
            </div>
            <div className="p-4">
              <h3 className="text-sm-custom font-bold uppercase text-text-default mb-2">Warranty & Returns</h3>
              <ul className="space-y-2 text-sm-custom text-gray-600">
                <li><span className="font-semibold text-gray-900">6-month</span> manufacturer warranty</li>
                <li><span className="font-semibold text-gray-900">7-day</span> easy return policy</li>
                <li><span className="font-semibold text-gray-900">100%</span> genuine parts assurance</li>
              </ul>
            </div>
            <div className="p-4">
              <h3 className="text-sm-custom font-bold uppercase text-text-default mb-2">Need Help?</h3>
              <p className="text-sm-custom text-gray-600 leading-6">Our support team is available 10 AM - 7 PM.</p>
              <p className="text-[#0d3b66] font-bold mt-1">+977 9812 345 678</p>
            </div>
          </aside>
        </div>
      </section>

      {/* Additional Information */}
      {product.additional_information && product.additional_information.length > 0 && (
        <section className="border border-slate-300 bg-white">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-h4 font-bold text-gray-900 uppercase tracking-wide">Additional Information</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {product.additional_information.map((item, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenInfo(openInfo === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="text-body font-semibold text-gray-800">{item.title}</span>
                  {openInfo === i ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                </button>
                {openInfo === i && (
                  <div
                    className="px-6 pb-5 text-body text-gray-600 leading-7 prose prose-sm max-w-none"
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
