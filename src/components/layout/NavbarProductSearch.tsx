"use client";

import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

const DEBOUNCE_MS = 280;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

type NavbarSearchContextValue = {
  query: string;
  setQuery: (q: string) => void;
  onFocus: () => void;
  onBlur: () => void;
};

const NavbarSearchContext = createContext<NavbarSearchContextValue | null>(null);

function NavbarSearchProviderInner({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const inputFocusedRef = useRef(false);

  const onFocus = useCallback(() => {
    inputFocusedRef.current = true;
  }, []);

  const onBlur = useCallback(() => {
    inputFocusedRef.current = false;
  }, []);

  useEffect(() => {
    if (pathname !== "/products") {
      setQuery("");
      return;
    }
    if (inputFocusedRef.current) return;
    setQuery(searchParams.get("q") ?? "");
  }, [pathname, searchParams]);

  useEffect(() => {
    const q = debouncedQuery.trim();

    if (pathname === "/products") {
      const cat = searchParams.get("category")?.trim() ?? "";
      const currentQ = searchParams.get("q")?.trim() ?? "";
      if (q === currentQ && cat === (searchParams.get("category")?.trim() ?? "")) return;

      const params = new URLSearchParams();
      if (cat) params.set("category", cat);
      if (q) params.set("q", q);
      const qs = params.toString();
      const next =
        qs.length > 0
          ? `/products?${qs}`
          : cat
            ? `/products?category=${encodeURIComponent(cat)}`
            : "/products";
      router.replace(next, { scroll: false });
      return;
    }

    if (q.length > 0) {
      router.push(`/products?q=${encodeURIComponent(q)}`);
    }
  }, [debouncedQuery, pathname, router, searchParams]);

  const value: NavbarSearchContextValue = {
    query,
    setQuery,
    onFocus,
    onBlur,
  };

  return <NavbarSearchContext.Provider value={value}>{children}</NavbarSearchContext.Provider>;
}

export function NavbarSearchProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NavbarSearchProviderInner>{children}</NavbarSearchProviderInner>
    </Suspense>
  );
}

type NavbarSearchInputProps = {
  className?: string;
  inputClassName?: string;
};

export function NavbarSearchInput({ className = "", inputClassName = "" }: NavbarSearchInputProps) {
  const ctx = useContext(NavbarSearchContext);
  if (!ctx) {
    throw new Error("NavbarSearchInput must be used inside NavbarSearchProvider");
  }

  return (
    <div className={className}>
      <label className="relative block">
        <span className="sr-only">Search products</span>
        <input
          type="search"
          name="q"
          value={ctx.query}
          onChange={(e) => ctx.setQuery(e.target.value)}
          onFocus={ctx.onFocus}
          onBlur={ctx.onBlur}
          placeholder="Search products..."
          autoComplete="off"
          className={`w-full rounded-lg border border-white/20 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/90 ${inputClassName}`}
        />
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
      </label>
    </div>
  );
}
