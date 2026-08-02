"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProductCardProps {
  ulid: string;
  name: string;
  price: number;
  originalPrice?: number;
  thumbnail: string | null;
  category: string | null;
  isNew?: boolean;
}

export default function ProductCard({ ulid, name, price, originalPrice, thumbnail, category, isNew }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Link
      href={`/products/${ulid}`}
      className="group relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col w-[250px] h-[340px] shrink-0 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/2] overflow-hidden bg-slate-50 shrink-0">
        {isNew && (
          <span className="absolute top-3 right-3 z-10 bg-[#0d3b66] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            New
          </span>
        )}
        {thumbnail && !imageError ? (
          <Image
            src={thumbnail}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 p-6">
            <span className="text-xs font-black text-slate-400 text-center uppercase tracking-widest">
              {name}
            </span>
          </div>
        )}
      </div>

      {/* Compact Product Details */}
      <div className="p-3 flex flex-col flex-1">
        <h3 title={name} className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 h-[48px] overflow-hidden group-hover:text-[#0d3b66] transition-colors">
          {name}
        </h3>

        {/* Rating row — static for now */}
        <div className="flex items-center gap-1 text-xs text-amber-500 mb-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              className="w-3 h-3 fill-transparent stroke-amber-400"
            />
          ))}
        </div>

        {/* Price & Action */}
        <div className="mt-auto space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-[#0d3b66]">${price.toFixed(2)}</span>
            {originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <Button
            className="w-full bg-[#0d3b66] hover:bg-slate-900 text-white font-semibold rounded-xl border-none shadow-md transition-all duration-300 ease-in-out active:scale-95 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </Link>
  );
}
