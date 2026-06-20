"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, MoreVertical, Pencil, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
};

const columns: ColumnDef<Product, unknown>[] = [
  {
    accessorKey: "image",
    header: "Photo",
    enableSorting: false,
    size: 60,
    cell: ({ row }) => (
      <img
        src={row.original.image}
        alt={row.original.name}
        className="h-14 w-14 rounded-lg object-cover border border-slate-200"
      />
    ),
  },
  {
    accessorKey: "name",
    header: "Product",
  },
  {
    accessorKey: "category",
    header: "Category",
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
            <Eye className="h-4 w-4" /> View
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none">
            <Pencil className="h-4 w-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none text-red-500 focus:text-red-500">
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

const mockProducts: Product[] = [
  { id: 1, name: "Bosch Oil Filter", category: "Filters", price: 1200, stock: 45, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
  { id: 2, name: "NGK Spark Plug", category: "Ignition", price: 850, stock: 120, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
  { id: 3, name: "Brake Pad Set", category: "Brakes", price: 3200, stock: 30, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
  { id: 4, name: "Air Filter", category: "Filters", price: 950, stock: 0, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
  { id: 5, name: "Timing Belt", category: "Engine", price: 2400, stock: 18, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
  { id: 6, name: "Radiator Cap", category: "Cooling", price: 450, stock: 67, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
];

export default function AdminProducts() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
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
        <button className="flex items-center gap-2 bg-black px-4 py-2 text-h4 font-semibold text-white hover:bg-black/80 cursor-pointer transition-colors">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>
      <DataTable
        columns={columns}
        data={mockProducts}
        searchColumn="name"
        searchPlaceholder="Search products..."
      />
    </div>
  );
}
