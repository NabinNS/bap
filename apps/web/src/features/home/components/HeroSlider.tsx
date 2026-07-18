"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type ApiSlider = {
  ulid: string;
  name: string;
  thumbnail: string | null;
};

const SLIDE_INTERVAL = 5000;

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data } = useQuery({
    queryKey: ["public-sliders"],
    queryFn: () => apiFetch<{ data: ApiSlider[] }>("/sliders?per_page=20&is_active=true"),
  });

  const sliders = (data?.data ?? []).filter((s) => s.thumbnail);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliders.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [sliders.length]);

  if (sliders.length === 0) return null;

  return (
    <div className="relative h-full">
      {sliders.map((slider, index) => (
        <div
          key={slider.ulid}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out
            ${index === currentIndex ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={slider.thumbnail!}
            alt={slider.name}
            fill
            sizes="(max-width: 768px) 100vw, 70vw"
            priority={index === 0}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
