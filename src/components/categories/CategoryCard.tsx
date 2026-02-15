"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
    name: string;
    count: string;
    image?: string;
    href: string;
}

export default function CategoryCard({ name, count, image, href }: CategoryCardProps) {
    return (
        <Link
            href={href}
            className="group relative block overflow-hidden rounded-2xl bg-white border border-slate-100 aspect-[4/5] sm:aspect-square transition-all duration-500 shadow-sm hover:shadow-xl"
        >

            {image ? (
                <>
                    <Image
                        src={image}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 16vw"
                        className="object-cover transition-opacity duration-300"
                    />

                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </>
            ) : (
                <div className="absolute inset-0 bg-slate-50 flex items-center justify-center p-6">
                    <h3 className="text-xl font-black text-black text-center uppercase tracking-tight">{name}</h3>
                </div>
            )}


            <div className={`absolute inset-0 p-4 sm:p-6 flex flex-col justify-end`}>
                <div className={`relative z-10 w-full transition-all duration-300 ${image ? 'text-white group-hover:text-black' : 'text-black'}`}>

                    {/* Count - Reveals on hover */}
                    <p className="text-[10px] sm:text-xs font-bold opacity-0 translate-y-2 uppercase tracking-[0.2em] mb-1 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 text-[#0d3b66]">
                        {count}
                    </p>

                    {/* Name - Slides up for image cards, fades in for empty ones */}
                    <h3 className={`text-lg sm:text-xl font-black leading-tight mb-3 transition-all duration-300 ${image ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] group-hover:drop-shadow-none' : ''} ${!image ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                        {name}
                    </h3>

                    {/* Animated Button/Arrow */}
                    <div className="flex items-center gap-3">
                        <div className="h-[2px] w-0 bg-[#0d3b66] transition-all duration-500 group-hover:w-8" />
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-[#0d3b66] border border-slate-200 transition-all duration-300 group-hover:bg-[#0d3b66] group-hover:text-white group-hover:border-[#0d3b66] group-hover:scale-110">
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle Border Glow on Hover */}
            <div className="absolute inset-0 border-2 border-transparent transition-colors duration-300 group-hover:border-[#0d3b66]/10 rounded-2xl pointer-events-none" />
        </Link>
    );
}
