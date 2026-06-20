"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";

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
    cell: ({ row }) => (
      <img
        src={row.original.image}
        alt={row.original.name}
        className="h-10 w-10 rounded-lg object-cover border border-slate-200"
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
      <div className="flex items-center justify-between">
        <h2 className="text-h3 font-bold text-text-default">Products</h2>
        <button className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/80 transition-colors">
          + Add Product
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
