"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Phone, MessageCircle, Headphones } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type ApiOffer = {
  ulid: string;
  title: string;
  sub_title: string | null;
  thumbnail: string | null;
};

type Card = { title: string; sub_title: string | null; thumbnail: string | null };

const FALLBACK_CARDS: Card[] = [
  { title: "20% OFF", sub_title: "On All Batteries", thumbnail: "/images/promo_battery.png" },
  { title: "FREE DELIVERY", sub_title: "Above Rs. 5,000", thumbnail: "/images/promo_delivery.png" },
  { title: "BEST SELLERS", sub_title: "Top rated products", thumbnail: "/images/promo_oil.png" },
];

export default function PromoCards() {
  const { data } = useQuery({
    queryKey: ["public-offers"],
    queryFn: () => apiFetch<{ data: ApiOffer[] }>("/offers?per_page=3&is_active=true&sort_by=created_at&sort_dir=desc"),
  });

  const offers = data?.data ?? [];
  const filled: Card[] = [...offers.slice(0, 3), ...FALLBACK_CARDS].slice(0, 3);

  const [card1, card2, card3] = filled;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-col gap-4 w-full h-full justify-between">

      {/* Card 1: dark, text left, image right */}
      <div className="relative overflow-hidden bg-[#092d50] rounded-xl p-5 flex items-center justify-between h-[135px] border border-[#0d3b66] shadow-sm flex-1">
        <div className="w-1/2 flex flex-col justify-center h-full z-10 pr-2 gap-3">
          <div>
            <span className="text-2xl font-black text-white">{card1.title}</span>
            {card1.sub_title && <p className="text-sm text-blue-100/90 font-semibold mt-0.5">{card1.sub_title}</p>}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 border border-white/20 bg-white/5 hover:bg-white/10 text-white rounded-full px-4.5 py-1.5 text-xs font-bold transition-all w-fit"
          >
            Shop Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {card1.thumbnail && (
          <div className="absolute right-0 top-0 w-1/2 h-full p-3">
            <div className="relative w-full h-full">
              <Image src={card1.thumbnail} alt={card1.title} fill className="object-contain" sizes="(max-width: 768px) 50vw, 15vw" priority />
            </div>
          </div>
        )}
      </div>

      {/* Card 2: light, image left, text right */}
      <div className="relative overflow-hidden bg-white border border-gray-200/60 rounded-xl p-5 flex items-center justify-between h-[135px] shadow-sm flex-1">
        {card2.thumbnail && (
          <div className="absolute left-0 top-0 w-1/2 h-full p-3">
            <div className="relative w-full h-full">
              <Image src={card2.thumbnail} alt={card2.title} fill className="object-contain" sizes="(max-width: 768px) 50vw, 15vw" />
            </div>
          </div>
        )}
        <div className="w-1/2 ml-[50%] flex flex-col justify-center h-full z-10 text-right items-end pl-2 gap-3">
          <div>
            <span className="text-lg font-black">{card2.title}</span>
            {card2.sub_title && <p className="text-sm text-gray-700 font-semibold mt-0.5">{card2.sub_title}</p>}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-[#0d3b66] text-white rounded-full px-4.5 py-1.5 text-xs font-bold transition-all w-fit"
          >
            Shop Now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Card 3: light, text left, image right */}
      <div className="relative overflow-hidden bg-white border border-gray-200/60 rounded-xl p-5 flex items-center justify-between h-[135px] shadow-sm flex-1">
        <div className="w-1/2 flex flex-col justify-center h-full z-10 pr-2 gap-3">
          <div>
            <span className="text-lg font-black">{card3.title}</span>
            {card3.sub_title && <p className="text-sm text-gray-700 font-semibold mt-0.5">{card3.sub_title}</p>}
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-[#0d3b66] text-white rounded-full px-4.5 py-1.5 text-xs font-bold transition-all w-fit"
          >
            View Products <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {card3.thumbnail && (
          <div className="absolute right-0 top-0 w-1/2 h-full p-3">
            <div className="relative w-full h-full">
              <Image src={card3.thumbnail} alt={card3.title} fill className="object-contain" sizes="(max-width: 768px) 50vw, 15vw" />
            </div>
          </div>
        )}
      </div>

      {/* Card 4: Need Help — always static */}
      <div className="relative overflow-hidden bg-[#092d50] rounded-xl p-5 h-[135px] border border-[#0d3b66] shadow-sm flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-blue-300" />
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-widest">Need Help?</span>
          </div>
          <p className="text-white font-black text-base">Call: +977 9800-000-000</p>
          <p className="text-blue-200 text-xs font-semibold">Sun–Sat, 9am – 6pm</p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Link
            href="tel:+977XXXXXXXXXX"
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-lg py-2 text-xs font-bold transition-all"
          >
            <Phone className="w-3.5 h-3.5 text-blue-300" />
            Call Us
          </Link>
          <Link
            href="https://wa.me/977XXXXXXXXXX"
            target="_blank"
            className="flex-1 flex items-center justify-center gap-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 text-white rounded-lg py-2 text-xs font-bold transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            WhatsApp
          </Link>
          <Link
            href="/chat"
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-lg py-2 text-xs font-bold transition-all"
          >
            <Headphones className="w-3.5 h-3.5 text-blue-300" />
            Live Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
