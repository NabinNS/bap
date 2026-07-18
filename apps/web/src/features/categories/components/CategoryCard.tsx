"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface CategoryCardProps {
    name: string;
    image?: string;
    href: string;
}

export default function CategoryCard({ name, image, href }: CategoryCardProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <Link
            href={href}
            className="group relative block overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col h-full w-full min-w-0 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-md"
        >
            {/* Image Container */}
            <div className="relative aspect-[3/2] overflow-hidden bg-slate-50 shrink-0">
                {image && !imageError ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 33vw, 15vw"
                        className="object-cover w-full"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 p-4">
                        <span className="text-[10px] font-black text-slate-400 text-center uppercase tracking-widest ">
                            {name}
                        </span>
                    </div>
                )}
            </div>

            {/* Category Details */}
            <div className="p-2 text-center border-t border-slate-50 min-w-0 w-full">
                <h3 title={name} className="text-sm-custom font-semibold text-gray-800 group-hover:text-[#0d3b66] transition-colors truncate">
                    {name}
                </h3>
            </div>
        </Link>
    );
}
