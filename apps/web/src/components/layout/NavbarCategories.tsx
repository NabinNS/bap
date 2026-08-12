"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type ApiCategory = {
  ulid: string;
  name: string;
};

export function NavbarCategories() {
  const { data } = useQuery({
    queryKey: ["navbar-categories"],
    queryFn: () => apiFetch<{ data: ApiCategory[] }>("/categories?per_page=6&is_active=true&sort_by=created_at&sort_dir=desc"),
    staleTime: 5 * 60 * 1000,
  });

  const categories = data?.data ?? [];

  return (
    <>
      {categories.map((cat) => (
        <Link
          key={cat.ulid}
          href={`/products?category_ulid=${cat.ulid}`}
          className="shrink-0 whitespace-nowrap px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/15 hover:text-white"
        >
          {cat.name}
        </Link>
      ))}
    </>
  );
}
