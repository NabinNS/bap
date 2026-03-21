"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import SimilarProducts from "@/components/products/SimilarProducts";

type ProductDetail = {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    rating: number;
    image: string;
    category: string;
    description: string;
    galleryImages: string[];
};

const productCatalog: Record<string, ProductDetail> = {
    "1": {
        id: "1",
        name: "Ceramic Brake Pads Set",
        price: 45.99,
        originalPrice: 59.99,
        rating: 5,
        image: "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
        category: "Brakes",
        description:
            "Premium ceramic brake pads designed for low dust, smooth braking, and reliable stopping performance for daily city and highway use.",
        galleryImages: [
            "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
        ],
    },
    "2": {
        id: "2",
        name: "High-Performance Air Filter",
        price: 24.5,
        originalPrice: 32,
        rating: 4,
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1400&auto=format&fit=crop",
        category: "Engine",
        description:
            "High-flow air filter that improves intake efficiency while maintaining strong filtration for better engine breathing and response.",
        galleryImages: [
            "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
        ],
    },
    "3": {
        id: "3",
        name: "Premium Synthetic Motor Oil",
        price: 38,
        rating: 5,
        image: "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=1400&auto=format&fit=crop",
        category: "Lubricants",
        description:
            "Advanced synthetic motor oil for improved thermal stability, wear protection, and cleaner engine performance over long intervals.",
        galleryImages: [
            "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
        ],
    },
    "4": {
        id: "4",
        name: "Halogen Headlight Bulb",
        price: 15.99,
        originalPrice: 19.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=1400&auto=format&fit=crop",
        category: "Electrical",
        description:
            "Bright and durable halogen bulb with stable beam focus, helping improve visibility and confidence during night driving.",
        galleryImages: [
            "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1400&auto=format&fit=crop",
        ],
    },
    "5": {
        id: "5",
        name: "Shock Absorber Front Set",
        price: 120,
        originalPrice: 150,
        rating: 5,
        image: "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1400&auto=format&fit=crop",
        category: "Suspension",
        description:
            "Front shock absorber kit engineered for improved handling, reduced vibration, and a comfortable ride across mixed road conditions.",
        galleryImages: [
            "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1549399500-6d710f972e48?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
        ],
    },
    "6": {
        id: "6",
        name: "Universal Oil Filter",
        price: 12.99,
        rating: 4,
        image: "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
        category: "Engine",
        description:
            "Compact high-efficiency oil filter designed to capture contaminants and support smoother, longer-lasting engine operation.",
        galleryImages: [
            "https://images.unsplash.com/photo-1486006396193-471ca6193b21?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-159742324403d-d19501a66377?q=80&w=1400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1620055282005-acc946535d51?q=80&w=1400&auto=format&fit=crop",
        ],
    },
};

type Review = {
    id: string;
    name: string;
    rating: 1 | 2 | 3 | 4 | 5;
    title: string;
    comment: string;
    date: string;
};

const reviewsByProductId: Record<string, Review[]> = {
    "1": [
        {
            id: "r1",
            name: "Aarav K.",
            rating: 5,
            title: "Strong braking response",
            comment:
                "Installed these on my sedan and braking feels smooth and confident. Very low dust compared to my previous set.",
            date: "Feb 18, 2026",
        },
        {
            id: "r2",
            name: "Nabin S.",
            rating: 4,
            title: "Good value",
            comment: "Great value for daily driving. Packaging was clean and fitment was accurate.",
            date: "Feb 10, 2026",
        },
        {
            id: "r3",
            name: "Ritesh M.",
            rating: 5,
            title: "Highly recommended",
            comment: "No noise after one week of usage. Performance is better than expected at this price.",
            date: "Jan 29, 2026",
        },
        {
            id: "r4",
            name: "Pratik J.",
            rating: 3,
            title: "Decent but average",
            comment: "Works fine but I expected slightly better bite. Still okay for city use.",
            date: "Jan 20, 2026",
        },
    ],
    "2": [
        {
            id: "r5",
            name: "Suman P.",
            rating: 5,
            title: "Noticeable improvement",
            comment: "Engine response feels better and pickup improved after replacing old filter.",
            date: "Feb 16, 2026",
        },
        {
            id: "r6",
            name: "Ravi T.",
            rating: 4,
            title: "Easy fit",
            comment: "Fit perfectly and quality looks solid. Would buy again.",
            date: "Feb 2, 2026",
        },
        {
            id: "r7",
            name: "Mina R.",
            rating: 4,
            title: "Good quality",
            comment: "Material feels premium and airflow is clearly improved.",
            date: "Jan 25, 2026",
        },
    ],
    "3": [
        {
            id: "r8",
            name: "Deepak B.",
            rating: 5,
            title: "Engine runs smoother",
            comment: "After switching, my engine noise reduced and performance is more consistent.",
            date: "Feb 14, 2026",
        },
        {
            id: "r9",
            name: "Anita G.",
            rating: 4,
            title: "Worth it",
            comment: "Good synthetic oil. Slightly expensive but quality is there.",
            date: "Jan 30, 2026",
        },
    ],
    "4": [
        {
            id: "r10",
            name: "Karan D.",
            rating: 4,
            title: "Brighter beam",
            comment: "Brightness is better than stock bulbs and installation was straightforward.",
            date: "Feb 6, 2026",
        },
        {
            id: "r11",
            name: "Sailesh K.",
            rating: 5,
            title: "Great at night",
            comment: "Night visibility improved a lot. Good beam pattern too.",
            date: "Jan 24, 2026",
        },
    ],
    "5": [
        {
            id: "r12",
            name: "Bikash N.",
            rating: 5,
            title: "Ride feels stable",
            comment: "Body roll reduced and comfort improved after installation.",
            date: "Feb 12, 2026",
        },
        {
            id: "r13",
            name: "Manoj L.",
            rating: 4,
            title: "Solid set",
            comment: "Quality seems robust and handling is much better now.",
            date: "Jan 27, 2026",
        },
    ],
    "6": [
        {
            id: "r14",
            name: "Nimesh A.",
            rating: 4,
            title: "Good filter",
            comment: "Fits well and works as expected. Good product overall.",
            date: "Feb 8, 2026",
        },
        {
            id: "r15",
            name: "Hari P.",
            rating: 5,
            title: "Very satisfied",
            comment: "Used for a recent oil change and engine feels smoother.",
            date: "Jan 22, 2026",
        },
    ],
};

type ProductQuestion = {
    id: string;
    question: string;
    answer: string;
};

const questionsByProductId: Record<string, ProductQuestion[]> = {
    "1": [
        { id: "q1", question: "Is this suitable for city driving?", answer: "Yes, these pads are tuned for low noise and smooth braking in daily city traffic." },
        { id: "q2", question: "Does this come as a pair?", answer: "Yes, this listing includes a complete set for one axle." },
    ],
    "2": [
        { id: "q3", question: "How often should I replace this filter?", answer: "For normal use, replacement every 10,000 to 15,000 km is recommended." },
        { id: "q4", question: "Is installation DIY friendly?", answer: "Yes, most users can install it in a few minutes with basic tools." },
    ],
    "3": [
        { id: "q5", question: "Can I use this in high temperatures?", answer: "Yes, this synthetic oil is designed for stable performance in high heat." },
        { id: "q6", question: "Is it compatible with turbo engines?", answer: "Yes, it is compatible with most modern turbocharged engines." },
    ],
    "4": [
        { id: "q7", question: "Will this improve night visibility?", answer: "Yes, it offers a brighter and more focused beam than standard old bulbs." },
        { id: "q8", question: "Is this plug-and-play?", answer: "Yes, it is designed for direct replacement with compatible sockets." },
    ],
    "5": [
        { id: "q9", question: "Does this help reduce body roll?", answer: "Yes, this set is designed to improve handling and reduce excessive roll." },
        { id: "q10", question: "Is wheel alignment needed after installation?", answer: "A quick alignment check is always recommended after suspension work." },
    ],
    "6": [
        { id: "q11", question: "Can this be used for long oil intervals?", answer: "Yes, it has good contaminant holding capacity for extended intervals." },
        { id: "q12", question: "Is this compatible with synthetic oils?", answer: "Yes, it works with both synthetic and conventional engine oils." },
    ],
};

export default function ProductDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const product = productCatalog[id as keyof typeof productCatalog];
    const [quantityInput, setQuantityInput] = useState("1");
    const [selectedImage, setSelectedImage] = useState(product?.image ?? "");
    const [selectedReviewFilter, setSelectedReviewFilter] = useState<"all" | 5 | 4 | 3 | 2 | 1>("all");

    if (!product) {
        return (
            <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 py-8">
                <div className="border border-slate-300 bg-white p-8">
                    <p className="text-gray-700 mb-4">Product not found.</p>
                    <Link href="/products" className="text-[#0d3b66] hover:underline">
                        Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    const parsedQuantity = Number.parseInt(quantityInput, 10);
    const quantity = Number.isNaN(parsedQuantity) ? 1 : Math.max(1, parsedQuantity);
    const allProductValues = Object.values(productCatalog);
    const categoryMatches = allProductValues.filter(
        (item) => item.id !== product.id && item.category === product.category
    );
    const fallbackMatches = allProductValues.filter((item) => item.id !== product.id);
    const similarProducts = (categoryMatches.length > 0 ? categoryMatches : fallbackMatches).slice(0, 4);
    const productReviews = reviewsByProductId[product.id] ?? [];
    const filteredReviews =
        selectedReviewFilter === "all"
            ? productReviews
            : productReviews.filter((review) => review.rating === selectedReviewFilter);
    const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: productReviews.filter((review) => review.rating === star).length,
    }));
    const productQuestions = questionsByProductId[product.id] ?? [];

    const updateQuantity = (nextValue: number) => {
        setQuantityInput(String(Math.max(1, nextValue)));
    };

    useEffect(() => {
        setSelectedImage(product.image);
    }, [product]);


    return (
        <div className="w-full max-w-[1700px] mx-auto px-4 md:px-6 py-8">
   
            <section className="border border-slate-300 bg-white">
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_340px] gap-0">
                    <div className="relative aspect-[4/3] xl:aspect-auto xl:min-h-[520px] border-b xl:border-b-0 xl:border-r border-slate-300 bg-slate-50">
                        <Image
                            src={selectedImage}
                            alt={product.name}
                            fill
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover"
                            priority
                        />
                    </div>

                    <div className="p-6 md:p-8 flex flex-col xl:border-r border-slate-300">
                        {/* <p className="text-xs font-semibold uppercase tracking-wider text-[#0d3b66] mb-3">
                            {product.category}
                        </p> */}
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            {product.name}
                        </h1>

                        <div className="flex items-center gap-1 text-amber-500 mb-5">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                    key={index}
                                    className={`w-4 h-4 ${index < product.rating ? "fill-amber-400" : "fill-transparent"} stroke-amber-400`}
                                />
                            ))}
                            <span className="ml-2 text-sm text-gray-500">({product.rating}.0 rating)</span>
                        </div>

                        <div className="flex items-baseline gap-3 mb-6">
                            <span className="text-3xl font-bold text-[#0d3b66]">
                                ${product.price.toFixed(2)}
                            </span>
                            {product.originalPrice && (
                                <span className="text-base text-gray-400 line-through">
                                    ${product.originalPrice.toFixed(2)}
                                </span>
                            )}
                        </div>

                        <p className="text-sm leading-7 text-gray-600 border-t border-slate-200 pt-5">
                            {product.description}
                        </p>

                        <div className="mt-6 flex items-center gap-3">
                            <p className="text-sm font-semibold text-gray-800">Quantity</p>
                            <div className="inline-flex items-center border border-slate-300">
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(quantity - 1)}
                                    className="h-10 w-10 text-lg text-[#0d3b66] hover:bg-slate-50 transition-colors"
                                    aria-label="Decrease quantity"
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    value={quantityInput}
                                    onChange={(e) => setQuantityInput(e.target.value)}
                                    onBlur={() => updateQuantity(quantity)}
                                    className="h-10 w-16 border-x border-slate-300 text-center text-sm font-medium text-gray-900 focus:outline-none"
                                    aria-label="Product quantity"
                                />
                                <button
                                    type="button"
                                    onClick={() => updateQuantity(quantity + 1)}
                                    className="h-10 w-10 text-lg text-[#0d3b66] hover:bg-slate-50 transition-colors"
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>
                        </div>



                        <div className="mt-5">
                            <div className="flex items-center gap-2">
                                {product.galleryImages.map((imageSrc, index) => (
                                    <button
                                        key={`${imageSrc}-${index}`}
                                        type="button"
                                        onMouseEnter={() => setSelectedImage(imageSrc)}
                                        onClick={() => setSelectedImage(imageSrc)}
                                        className={`relative h-14 w-14 border transition-colors ${
                                            selectedImage === imageSrc
                                                ? "border-[#0d3b66]"
                                                : "border-slate-300 hover:border-[#0d3b66]"
                                        }`}
                                        aria-label={`View product photo ${index + 1}`}
                                    >
                                        <Image
                                            src={imageSrc}
                                            alt={`${product.name} thumbnail ${index + 1}`}
                                            fill
                                            sizes="56px"
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
                            <Button className="w-full sm:w-auto bg-[#0d3b66] hover:bg-slate-900 text-white rounded-none h-12 px-6 cursor-pointer">
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Add to Cart
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto rounded-none border-slate-300 text-[#0d3b66] hover:bg-slate-50 h-12 px-6"
                                asChild
                            >
                                <Link href="/products">Buy Now</Link>
                            </Button>
                        </div>
                    </div>

                    <aside className="bg-white divide-y divide-slate-300">
                        <div className="p-4 mt-3">
                            <h3 className="text-[13px] font-black uppercase text-gray-900 mb-3">Delivery & Availability</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    <span className="font-semibold text-gray-500">In stock:</span>{" "}
                                    <span className="font-semibold text-emerald-700">Ready to ship</span>
                                </p>
                                <p>
                                    <span className="font-semibold text-gray-500">Estimated delivery:</span>{" "}
                                    <span className="font-semibold text-gray-900">2-4 business days</span>
                                </p>
                                <p>
                                    <span className="font-semibold text-gray-500">Shipping:</span>{" "}
                                    <span className="font-semibold text-gray-900">Free above $50</span>
                                </p>
                            </div>
                        </div>

                        <div className="p-4">
                            <h3 className="text-[13px] font-black uppercase  text-gray-900 mb-2">Fitment Check</h3>
                            <p className="text-sm text-gray-600 leading-6 mb-3">
                                Confirm compatibility with your vehicle model before checkout.
                            </p>
                            <p className="text-xs font-semibold text-[#0d3b66]">Recommended before purchase</p>
                        </div>

                        <div className="p-4">
                            <h3 className="text-[13px] font-black uppercase  text-gray-900 mb-2">Warranty & Returns</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><span className="font-semibold text-gray-900">6-month</span> manufacturer warranty</li>
                                <li><span className="font-semibold text-gray-900">7-day</span> easy return policy</li>
                                <li><span className="font-semibold text-gray-900">100%</span> genuine parts assurance</li>
                            </ul>
                        </div>

                        <div className="p-4">
                            <h3 className="text-[13px] font-black uppercase text-gray-900 mb-2">Need Help?</h3>
                            <p className="text-sm text-gray-600 leading-6">Our support team is available 10 AM - 7 PM.</p>
                            <p className="text-[#0d3b66] font-bold mt-1">+977 9812 345 678</p>
                        </div>
                    </aside>

                </div>
            </section>

            <section className="mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="border border-slate-300 p-4 bg-white flex flex-col h-[700px]">
                        <div className="mb-4 border-b border-slate-200 pb-3">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-lg font-black text-gray-900 whitespace-nowrap">Product Reviews</h3>
                                <select
                                    value={selectedReviewFilter}
                                    onChange={(e) =>
                                        setSelectedReviewFilter(
                                            e.target.value === "all"
                                                ? "all"
                                                : (Number(e.target.value) as 5 | 4 | 3 | 2 | 1)
                                        )
                                    }
                                    className="border border-slate-300 bg-white text-sm text-gray-700 px-3 py-2 rounded-none focus:outline-none focus:ring-2 focus:ring-[#0d3b66] min-w-0"
                                    aria-label="Filter reviews by star"
                                >
                                    <option value="all">All Reviews</option>
                                    <option value="5">5 Star Reviews</option>
                                    <option value="4">4 Star Reviews</option>
                                    <option value="3">3 Star Reviews</option>
                                    <option value="2">2 Star Reviews</option>
                                    <option value="1">1 Star Reviews</option>
                                </select>
                            </div>
                        </div>

                        <div className="border border-slate-300 p-3 mb-3">
                            <div className="space-y-2">
                                {ratingBreakdown.map((item) => (
                                    <div key={item.star} className="flex items-center gap-3 text-sm">
                                        <span className="w-12 text-gray-700">{item.star} star</span>
                                        <div className="h-2 flex-1 bg-slate-200 overflow-hidden">
                                            <div
                                                className="h-full bg-[#0d3b66]"
                                                style={{
                                                    width: `${
                                                        productReviews.length === 0
                                                            ? 0
                                                            : (item.count / productReviews.length) * 100
                                                    }%`,
                                                }}
                                            />
                                        </div>
                                        <span className="w-6 text-right text-gray-600">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 overflow-y-auto scrollbar-on-hover pr-1 flex-1 min-h-0">
                            {filteredReviews.map((review) => (
                                <article key={review.id} className="border border-slate-300 p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-semibold text-sm text-gray-900">{review.name}</p>
                                        <div className="flex items-center gap-1 text-amber-500">
                                            {Array.from({ length: 5 }).map((_, index) => (
                                                <Star
                                                    key={index}
                                                    className={`w-3.5 h-3.5 ${index < review.rating ? "fill-amber-400" : "fill-transparent"} stroke-amber-400`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-1">{review.date}</p>
                                    <p className="text-sm text-gray-600">{review.comment}</p>
                                </article>
                            ))}
                            {filteredReviews.length === 0 && (
                                <div className="border border-slate-300 p-3 text-sm text-gray-600">
                                    No reviews found for this filter.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border border-slate-300 p-4 bg-white flex flex-col h-[700px]">
                        <h3 className="text-lg font-black text-gray-900 mb-3">Questions About Product</h3>
                        <div className="space-y-3 overflow-y-auto scrollbar-on-hover pr-1 flex-1 min-h-0">
                            {productQuestions.map((item) => (
                                <article key={item.id} className="border border-slate-300 p-3">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">Q: {item.question}</p>
                                    <p className="text-sm text-gray-600">A: {item.answer}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <SimilarProducts products={similarProducts} />
        </div>
    );
}

