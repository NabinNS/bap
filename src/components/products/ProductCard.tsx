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
        <div className="group relative bg-white rounded-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col h-full min-w-[200px] cursor-default">
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
                        className="object-cover"
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
                    <h3 className="text-sm font-bold text-gray-900 mb-2 truncate line-clamp-2 white-space-normal h-6 overflow-hidden">
                        {name}
                    </h3>
                </Link>

                {/* Price & Action row */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-[#0d3b66]">${price.toFixed(2)}</span>
                            {originalPrice && (
                                <span className="text-xs text-gray-400 line-through">
                                    ${originalPrice.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Larger Cart Button */}
                    <Button
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-[#0d3b66] text-white hover:bg-slate-900 border-none shadow-md transition-all active:scale-95 cursor-pointer relative z-20"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Add to cart logic here
                        }}
                    >
                        <ShoppingCart className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
