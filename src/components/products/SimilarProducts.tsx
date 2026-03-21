import Link from "next/link";
import ProductCard from "./ProductCard";

type SimilarProduct = {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    image: string;
    category: string;
};

export default function SimilarProducts({
    products,
}: {
    products: SimilarProduct[];
}) {
    if (products.length === 0) return null;

    return (
        <section className="relative mt-8 py-10 px-4 md:px-8 border border-slate-300 bg-slate-100">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex flex-col mx-2">
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">Similar Products</h2>
                    <p className="text-gray-900 text-sm mt-1">
                        Discover related parts that pair well with this product.
                    </p>
                </div>
                <Link
                    href="/products"
                    className="group flex items-center gap-3 bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-bold transition-all hover:bg-[#0d3b66]"
                >
                    View All Products
                </Link>
            </div>

            <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar">
                {products.map((product) => (
                    <div key={product.id} className="min-w-[220px] sm:min-w-[240px] flex-shrink-0">
                        <ProductCard
                            id={product.id}
                            name={product.name}
                            price={product.price}
                            originalPrice={product.originalPrice}
                            rating={product.rating}
                            image={product.image}
                            category={product.category}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

