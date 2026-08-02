"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, MoreVertical } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Product = {
  ulid: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  category: { ulid: string; name: string } | null;
};

export default function AdminProducts() {
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<{ data: Product[] }>("/products?per_page=50"),
  });

  const products = productsData?.data ?? [];

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
            className="h-14 w-14 rounded-lg object-cover border border-slate-200"
          />
        ) : (
          <div className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-100" />
        ),
    },
    { accessorKey: "name", header: "Product" },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => row.original.category?.name ?? "—",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => `NPR ${row.original.price.toLocaleString()}`,
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => (
        <span className={row.original.stock === 0 ? "text-red-500 font-semibold" : ""}>
          {row.original.stock === 0 ? "Out of stock" : row.original.stock}
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
            <DropdownMenuItem className="gap-3 cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none">
              View
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
      />
    </div>
  );
}
