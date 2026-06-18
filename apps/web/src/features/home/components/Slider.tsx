"use client";

import Image from "next/image";

export default function Slider() {
  return (
    <div className="relative aspect-[16/6] w-full overflow-hidden">
      <Image
        src="/images/slider/slider1.jpg"
        alt="Featured automotive products"
        fill
        priority
        className="object-cover"
      />
    </div>
  );
}
