export type FeaturedProduct = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  image: string;
  category: string;
  isNew?: boolean;
};

export type HomeCategory = {
  name: string;
  count: string;
  image: string;
  href: string;
};

export type HomeBrand = {
  name: string;
  logo: string;
};

export const featuredProducts: FeaturedProduct[] = [
  {
    id: "1",
    name: "Ceramic Brake Pads Set",
    price: 45.99,
    originalPrice: 59.99,
    rating: 5,
    image: "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=800&auto=format&fit=crop",
    category: "Brakes",
    isNew: true,
  },
  {
    id: "2",
    name: "High Performance Oil Filter",
    price: 12.5,
    rating: 4,
    image: "https://images.unsplash.com/photo-1629732047847-5047f551b89a?q=80&w=800&auto=format&fit=crop",
    category: "Filters",
  },
  {
    id: "3",
    name: "Iridium Spark Plugs (4 Pack)",
    price: 32,
    originalPrice: 40,
    rating: 5,
    image: "https://images.unsplash.com/photo-1606577924006-27d39b132ce0?q=80&w=800&auto=format&fit=crop",
    category: "Ignition",
  },
  {
    id: "4",
    name: "12V 70Ah Car Battery",
    price: 120,
    rating: 4,
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
    category: "Electrical",
  },
  {
    id: "1",
    name: "Ceramic Brake Pads Set",
    price: 45.99,
    originalPrice: 59.99,
    rating: 5,
    image: "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=800&auto=format&fit=crop",
    category: "Brakes",
    isNew: true,
  },
  {
    id: "2",
    name: "High Performance Oil Filter",
    price: 12.5,
    rating: 4,
    image: "https://images.unsplash.com/photo-1629732047847-5047f551b89a?q=80&w=800&auto=format&fit=crop",
    category: "Filters",
  },
  {
    id: "3",
    name: "Iridium Spark Plugs (4 Pack)",
    price: 32,
    originalPrice: 40,
    rating: 5,
    image: "https://images.unsplash.com/photo-1606577924006-27d39b132ce0?q=80&w=800&auto=format&fit=crop",
    category: "Ignition",
  },
  {
    id: "4",
    name: "12V 70Ah Car Battery",
    price: 120,
    rating: 4,
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
    category: "Electrical",
  },
  {
    id: "1",
    name: "Ceramic Brake Pads Set",
    price: 45.99,
    originalPrice: 59.99,
    rating: 5,
    image: "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=800&auto=format&fit=crop",
    category: "Brakes",
    isNew: true,
  },
  {
    id: "2",
    name: "High Performance Oil Filter",
    price: 12.5,
    rating: 4,
    image: "https://images.unsplash.com/photo-1629732047847-5047f551b89a?q=80&w=800&auto=format&fit=crop",
    category: "Filters",
  },
  {
    id: "3",
    name: "Iridium Spark Plugs (4 Pack)",
    price: 32,
    originalPrice: 40,
    rating: 5,
    image: "https://images.unsplash.com/photo-1606577924006-27d39b132ce0?q=80&w=800&auto=format&fit=crop",
    category: "Ignition",
  },
  {
    id: "4",
    name: "12V 70Ah Car Battery",
    price: 120,
    rating: 4,
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
    category: "Electrical",
  },
];

export const categories: HomeCategory[] = [
  {
    name: "Batteries",
    count: "250+ Items",
    image: "https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?auto=format&fit=crop&q=80&w=800",
    href: "/categories/batteries",
  },
  {
    name: "Lubricants & Oils",
    count: "450+ Items",
    image: "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&q=80&w=800",
    href: "/categories/lubricants",
  },
  {
    name: "Brake System",
    count: "800+ Items",
    image: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?auto=format&fit=crop&q=80&w=800",
    href: "/categories/brakes",
  },
  {
    name: "Lights & Bulbs",
    count: "350+ Items",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800",
    href: "/categories/lights",
  },
  {
    name: "Cleaning & Care",
    count: "200+ Items",
    image: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=800",
    href: "/categories/cleaning",
  },
  {
    name: "Miscellaneous",
    count: "500+ Items",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=800",
    href: "/categories/miscellaneous",
  },
];

export const brands: HomeBrand[] = [
  {
    name: "BOSCH",
    logo: "https://images.unsplash.com/photo-1588173889591-f5716c263162?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Brembo",
    logo: "https://images.unsplash.com/photo-1584526053134-1334216dd1ba?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "NGK",
    logo: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "MANN+HUMMEL",
    logo: "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "DENSO",
    logo: "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?auto=format&fit=crop&q=80&w=400",
  },
];
