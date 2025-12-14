"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// const images = [
//   "/images/slider/slider1.jpg",
//   "/images/slider/slider2.jpg",
//   "/images/slider/slider3.jpg",
//   "/images/slider/slider4.jpg",
// ];

const SLIDE_INTERVAL = 4000;

export default function Slider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  //   useEffect(() => {
  //     const timer = setInterval(() => {
  //       setCurrentIndex((prev) => (prev + 1) % images.length);
  //     }, SLIDE_INTERVAL);

  //     return () => clearInterval(timer);
  //   }, []);

  return (
    <div className="relative">
      <Image src="/images/slider/slider1.jpg" />
      {/* {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out
            ${index === currentIndex ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={src}
            alt={`Slide ${index + 1}`}
            fill
            priority={index === 0}
            
          />
        </div>
      ))} */}
    </div>
  );
}
