import ProductCard from "@/components/products/ProductCard";
import { ChevronRight, Filter } from "lucide-react";
import Link from "next/link";

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
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">All Products</span>
            </nav>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters - Placeholder */}
                <aside className="w-full md:w-64 shrink-0">
                    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Filter className="w-5 h-5 text-[#0d3b66]" />
                            <h2 className="font-bold text-gray-900 text-lg">Filters</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">Categories</h3>
                                <div className="space-y-2">
                                    {["All", "Engine", "Brakes", "Suspension", "Electrical", "Lubricants"].map((cat) => (
                                        <label key={cat} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-[#0d3b66]">
                                            <input type="checkbox" className="rounded border-gray-300 text-[#0d3b66] focus:ring-[#0d3b66]" />
                                            {cat}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
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
