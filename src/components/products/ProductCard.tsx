"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    image: string;
    category: string;
    isNew?: boolean;
}

export default function ProductCard({
    id,
    name,
    price,
    originalPrice,
    rating,
    image,
    category,
    isNew,
}: ProductCardProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col h-full min-w-[200px] cursor-default transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:shadow-lg">
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 shrink-0">
                {isNew && (
                    <span className="absolute top-3 right-3 z-10 bg-[#0d3b66] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        New
                    </span>
                )}
                {image && !imageError ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 p-6">
                        <span className="text-xs font-black text-slate-400 text-center uppercase tracking-widest leading-tight">
                            {name}
                        </span>
                    </div>
                )}
            </div>

            {/* Compact Product Details */}
            <div className="p-4 flex flex-col flex-1">
                <Link href={`/products/${id}`} className="hover:text-[#0d3b66] transition-colors">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                        {name}
                    </h3>
                </Link>

                {/* Rating row */}
                {typeof rating === "number" && rating > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-500 mb-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                                key={index}
                                className={`w-3 h-3 ${index < rating ? "fill-amber-400" : "fill-transparent"} stroke-amber-400`}
                            />
                        ))}
                        <span className="ml-1 text-[11px] text-gray-500">({rating})</span>
                    </div>
                )}

                {/* Price & Action */}
                <div className="mt-auto space-y-3">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-semibold text-[#0d3b66]">${price.toFixed(2)}</span>
                        {originalPrice && (
                            <span className="text-xs text-gray-400 line-through">
                                ${originalPrice.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <Button
                        className="w-full bg-[#0d3b66] hover:bg-slate-900 text-white font-semibold rounded-xl border-none shadow-md transition-all duration-300 ease-in-out active:scale-95"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Add to cart logic here
                        }}
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                    </Button>
                </div>
            </div>
        </div>
    );
}
