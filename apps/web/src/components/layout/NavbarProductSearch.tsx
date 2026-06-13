"use client";

import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

const DEBOUNCE_MS = 280;

/** Debounces `query`, but resets immediately when `pathname` changes so stale text never drives `router.replace` on /products after navigating away. */
function useDebouncedSearchQuery(query: string, delay: number, pathname: string) {
  const [debounced, setDebounced] = useState(query);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setDebounced(query);
    }

    const t = setTimeout(() => setDebounced(query), delay);
    return () => clearTimeout(t);
  }, [query, delay, pathname]);

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
  const debouncedQuery = useDebouncedSearchQuery(query, DEBOUNCE_MS, pathname);
  const inputFocusedRef = useRef(false);

  const onFocus = useCallback(() => {
    inputFocusedRef.current = true;
  }, []);

  const onBlur = useCallback(() => {
    inputFocusedRef.current = false;
  }, []);

  /** Clear search as soon as we leave /products (before paint), so stale debounced text cannot trigger router.push back to /products. */
  useLayoutEffect(() => {
    if (pathname !== "/products") {
      setQuery("");
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/products") return;
    if (inputFocusedRef.current) return;
    setQuery(searchParams.get("q") ?? "");
  }, [pathname, searchParams]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    const live = query.trim();

    if (pathname === "/products") {
      /** Avoid writing /products?q=… from a stale debounce after input was cleared (e.g. user hit Home). */
      if (live.length === 0 && q.length > 0) return;

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

    /** Only navigate from other routes when both debounced and current input agree — avoids redirect after user clicked Home while debounce still held old text. */
    if (q.length > 0 && live.length > 0) {
      router.push(`/products?q=${encodeURIComponent(q)}`);
    }
  }, [debouncedQuery, query, pathname, router, searchParams]);

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
