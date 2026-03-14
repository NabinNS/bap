import ProductCard from "@/components/products/ProductCard";
import ProductFilters from "@/components/products/ProductFilters";

const allProducts = [
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
        name: "High-Performance Air Filter",
        price: 24.50,
        originalPrice: 32.00,
        rating: 4,
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
    },
    {
        id: "3",
        name: "Premium Synthetic Motor Oil",
        price: 38.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=800&auto=format&fit=crop",
        category: "Lubricants",
        isNew: true,
    },
    {
        id: "4",
        name: "Halogen Headlight Bulb",
        price: 15.99,
        originalPrice: 19.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=800&auto=format&fit=crop",
        category: "Electrical",
    },
    {
        id: "5",
        name: "Shock Absorber Front Set",
        price: 120.00,
        originalPrice: 150.00,
        rating: 5,
        image: "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=800&auto=format&fit=crop",
        category: "Suspension",
    },
    {
        id: "6",
        name: "Universal Oil Filter",
        price: 12.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=800&auto=format&fit=crop",
        category: "Engine",
    },
];

export default function ProductsPage() {
    return (
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full md:w-70 shrink-0">
                    <ProductFilters />
                </aside>

                {/* Product Grid */}
                <main className="flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-black text-gray-900">Total Products ({allProducts.length})</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Sort by:</span>
                            <select className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d3b66]">
                                <option>Newest First</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                                <option>Rating</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {allProducts.map((product) => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
