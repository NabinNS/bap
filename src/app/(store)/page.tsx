import Link from "next/link";
import styles from "./page.module.css";
import HeroSlider from "../../components/hero/HeroSlider";

export default function StoreHomePage() {
  return (
    <div className="space-y-8">
      <div className="flex h-[500px]">
        <div className="flex-[7] h-full">
          <HeroSlider />
        </div>

        <div className="flex-[3]">
          <div></div>
        </div>
      </div>
      {/* Hero section */}
      {/* <section className="bg-gray-100 rounded-lg p-6">
        <h1 className="text-4xl font-bold mb-2">Welcome to MyStore</h1>
        <p className="text-gray-700">Discover amazing products!</p>
        <Link href="/products" className="text-blue-600 underline mt-2 block">
          Browse Products
        </Link>
      </section> */}

      {/* Featured Products */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"></div>
      </section>
    </div>
  );
}
