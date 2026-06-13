"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import SimilarProducts from "@/components/products/SimilarProducts";
import { productCatalog, reviewsByProductId, questionsByProductId } from "@/data/productDetails";

export default function ProductDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const product = productCatalog[id as keyof typeof productCatalog];
    const [quantityInput, setQuantityInput] = useState("1");
    const [selectedImage, setSelectedImage] = useState(product?.image ?? "");
    const [selectedReviewFilter, setSelectedReviewFilter] = useState<"all" | 5 | 4 | 3 | 2 | 1>("all");
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);

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
    const DESCRIPTION_PREVIEW_LIMIT = 120;
    const hasLongDescription = product.description.length > DESCRIPTION_PREVIEW_LIMIT;
    const visibleDescription =
        descriptionExpanded || !hasLongDescription
            ? product.description
            : `${product.description.slice(0, DESCRIPTION_PREVIEW_LIMIT).trimEnd()}...`;

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

                        <div className="border-t border-slate-200 pt-5">
                            <p className="text-sm leading-7 text-gray-600">{visibleDescription}</p>
                            {hasLongDescription && (
                                <button
                                    type="button"
                                    onClick={() => setDescriptionExpanded((v) => !v)}
                                    className="mt-2 text-sm font-semibold text-[#0d3b66] hover:underline cursor-pointer"
                                >
                                    {descriptionExpanded ? "Read less" : "Read more"}
                                </button>
                            )}
                        </div>

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

