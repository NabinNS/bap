export interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    image: string;
    category: string;
    isNew?: boolean;
    description: string;
}

const baseProducts: Omit<Product, "id">[] = [
    {
        name: "Ceramic Brake Pads Set",
        price: 45.99,
        originalPrice: 59.99,
        rating: 5,
        image: "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1200&auto=format&fit=crop",
        category: "Brakes",
        isNew: true,
        description:
            "Premium ceramic brake pads designed for low dust, quieter operation, and confident stopping performance across city and highway driving.",
    },
    {
        name: "High-Performance Air Filter",
        price: 24.5,
        originalPrice: 32,
        rating: 4,
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1200&auto=format&fit=crop",
        category: "Engine",
        description:
            "A high-flow air filter that helps improve airflow and throttle response while retaining strong dust-trapping efficiency.",
    },
    {
        name: "Premium Synthetic Motor Oil",
        price: 38,
        rating: 5,
        image: "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=1200&auto=format&fit=crop",
        category: "Lubricants",
        isNew: true,
        description:
            "Advanced synthetic formulation for improved engine protection, temperature stability, and longer performance between service intervals.",
    },
    {
        name: "Halogen Headlight Bulb",
        price: 15.99,
        originalPrice: 19.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=1200&auto=format&fit=crop",
        category: "Electrical",
        description:
            "Reliable halogen headlight bulb with balanced brightness and beam focus for safer night-time visibility.",
    },
    {
        name: "Shock Absorber Front Set",
        price: 120,
        originalPrice: 150,
        rating: 5,
        image: "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1200&auto=format&fit=crop",
        category: "Suspension",
        description:
            "Front suspension set tuned for comfort and control, helping reduce body roll and improve road handling.",
    },
    {
        name: "Universal Oil Filter",
        price: 12.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1200&auto=format&fit=crop",
        category: "Engine",
        description:
            "Durable oil filter with high contaminant holding capacity to support cleaner lubrication and smoother engine life.",
    },
];

export const allProducts: Product[] = Array.from({ length: 10 }, (_, round) =>
    baseProducts.map((product, index) => ({
        ...product,
        id: `${round + 1}-${index + 1}`,
    }))
).flat();

