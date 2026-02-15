"use client";

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
    return (
        <div className="group relative bg-white rounded-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col h-full min-w-[200px]">
            {/* Reduced Height Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 shrink-0">
                {isNew && (
                    <span className="absolute top-2 left-2 z-10 bg-[#0d3b66] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        New
                    </span>
                )}
                {image ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-slate-50">
                        <span className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest">{name}</span>
                    </div>
                )}
            </div>

            {/* Compact Product Details */}
            <div className="p-3 flex flex-col flex-1">
                <p className="text-[9px] text-[#0d3b66] font-bold uppercase tracking-widest mb-1 opacity-70">
                    {category}
                </p>
                <h3 className="text-sm font-bold text-gray-900 mb-1 truncate group-hover:text-[#0d3b66] transition-colors">
                    {name}
                </h3>

                {/* Rating & Price row */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-black text-gray-900">${price.toFixed(2)}</span>
                            {originalPrice && (
                                <span className="text-[10px] text-gray-400 line-through">
                                    ${originalPrice.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons at the bottom */}
                    <div className="flex items-center transition-all">
                        <Button size="icon" className="h-7 w-7 rounded-full bg-[#0d3b66] text-white hover:bg-[#0d3b66]/90 border-none">
                            <ShoppingCart className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            <Link href={`/products/${id}`} className="absolute top-0 left-0 w-full h-[calc(100%-40px)] z-0">
                <span className="sr-only">View {name}</span>
            </Link>
        </div>
    );
}
