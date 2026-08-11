"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Meta = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
};

type Product = {
  ulid: string;
  name: string;
  thumbnail: string | null;
  sku: string | null;
  cost_price: number | null;
  sales_price: number | null;
  stock: number;
  low_stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  category: { ulid: string; name: string } | null;
  brand: { ulid: string; name: string } | null;
};

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [page, setPage] = useState(1);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", page],
    queryFn: () => apiFetch<{ data: Product[]; meta: Meta }>(`/products?page=${page}&per_page=15&sort_by=created_at&sort_dir=desc`),
  });

  const products = productsData?.data ?? [];
  const meta = productsData?.meta ?? null;

  const toggleFeatured = useMutation({
    mutationFn: ({ ulid, is_featured }: { ulid: string; is_featured: boolean }) =>
      apiFetch(`/products/${ulid}`, { method: "PUT", body: JSON.stringify({ is_featured }) }),
    onMutate: async ({ ulid, is_featured }) => {
      await queryClient.cancelQueries({ queryKey: ["products", page] });
      const previous = queryClient.getQueryData<{ data: Product[]; meta: Meta }>(["products", page]);
      queryClient.setQueryData<{ data: Product[]; meta: Meta }>(["products", page], (old) =>
        old ? { ...old, data: old.data.map((p) => p.ulid === ulid ? { ...p, is_featured } : p) } : old
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["products", page], ctx.previous);
      toast.error("Failed to update", "Could not toggle featured status.");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const columns: ColumnDef<Product, unknown>[] = [
    {
      accessorKey: "image",
      header: "Photo",
      enableSorting: false,
      size: 60,
      cell: ({ row }) =>
        row.original.thumbnail ? (
          <img
            src={row.original.thumbnail}
            alt={row.original.name}
            className="h-14 w-14 object-cover border border-slate-200"
          />
        ) : (
          <div className="h-14 w-14 border border-slate-200 bg-slate-100" />
        ),
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-text-default text-sm">{row.original.name}</p>
          {row.original.sku && (
            <p className="text-xs font-mono text-text-muted mt-0.5">{row.original.sku}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "brand",
      header: "Brand",
      cell: ({ row }) => row.original.brand?.name ?? <span className="text-text-muted">—</span>,
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category?.name ?? <span className="text-text-muted">—</span>,
    },
    {
      accessorKey: "sales_price",
      header: "Sales Price",
      cell: ({ row }) => {
        const { sales_price } = row.original;
        if (sales_price == null) return <span className="text-text-muted">—</span>;
        return <span className="font-semibold text-sm">{sales_price.toLocaleString()}</span>;
      },
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const { stock, low_stock_quantity } = row.original;
        const isOut = stock === 0;
        return (
          <span className={isOut ? "text-red-500" : ""}>
            {isOut ? "Out of stock" : stock}
          </span>
        );
      },
    },
    {
      accessorKey: "is_featured",
      header: "Featured",
      cell: ({ row }) => {
        const featured = row.original.is_featured;
        return (
          <button
            type="button"
            role="switch"
            aria-checked={featured}
            onClick={(e) => { e.stopPropagation(); toggleFeatured.mutate({ ulid: row.original.ulid, is_featured: !featured }); }}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
              featured ? "bg-slate-900" : "bg-slate-300"
            }`}
          >
            <span
              className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-md transition-transform duration-200"
              style={{ transform: featured ? "translateX(20px)" : "translateX(2px)" }}
            />
          </button>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span className={`text-xs font-semibold px-2 py-0.5 ${
          row.original.is_active
            ? "bg-green-50 text-green-700"
            : "bg-slate-100 text-slate-500"
        }`}>
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      size: 10,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-7 w-7 items-center justify-center hover:bg-slate-200 cursor-pointer transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-30 rounded-none p-0">
            <DropdownMenuItem asChild className="gap-3 cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none">
              <Link href={`/admin/products/${row.original.ulid}/view`}>View</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-3 cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none">
              <Link href={`/admin/products/${row.original.ulid}/edit`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none text-red-500 focus:text-red-500">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="flex-1 min-w-0 space-y-6 p-6">
      <nav className="flex items-center gap-1.5 text-sm text-text-muted">
        <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-text-default font-medium">Products</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h3 font-bold text-text-default">Products</h2>
          <p className="text-sm text-text-muted mt-0.5">Manage your product catalogue, pricing and stock levels.</p>
        </div>
        <Link
          href="/admin/products/create"
          className="flex items-center gap-2 bg-black px-4 py-2 text-h4 font-semibold text-white hover:bg-black/80 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={isLoading}
        searchColumn="name"
        searchPlaceholder="Search products..."
        onRowDoubleClick={(product) => router.push(`/admin/products/${product.ulid}/view`)}
        meta={meta}
        onPageChange={setPage}
      />
    </div>
  );
}
