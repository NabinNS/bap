"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, MoreVertical, Pencil, Eye, Trash2, X } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  products: number;
  isActive: boolean;
};

const columns: ColumnDef<Category, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span>{row.original.slug}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span>{row.original.description || "—"}</span>
    ),
  },
  {
    accessorKey: "products",
    header: "Products",
    cell: ({ row }) => (
      <span className="font-semibold">{row.original.products}</span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={
          row.original.isActive
            ? "inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700"
            : "inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-600"
        }
      >
        {row.original.isActive ? "Active" : "Inactive"}
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
        <DropdownMenuContent align="end" className="w-32 rounded-none p-0">
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

const mockCategories: Category[] = [
  { id: 1, name: "Brakes", slug: "brakes", description: "Brake pads, rotors and calipers", products: 24, isActive: true },
  { id: 2, name: "Engine Parts", slug: "engine-parts", description: "Pistons, gaskets and engine components", products: 58, isActive: true },
  { id: 3, name: "Filters", slug: "filters", description: "Oil, air and fuel filters", products: 31, isActive: true },
  { id: 4, name: "Ignition", slug: "ignition", description: "Spark plugs, coils and ignition systems", products: 17, isActive: true },
  { id: 5, name: "Cooling", slug: "cooling", description: "Radiators, coolant and water pumps", products: 12, isActive: false },
  { id: 6, name: "Suspension", slug: "suspension", description: "Shocks, struts and control arms", products: 39, isActive: true },
];

export default function AdminCategories() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex gap-0 transition-all duration-300 min-h-full">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6 p-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-text-muted">
          <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-text-default font-medium">Categories</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">Categories</h2>
            <p className="text-sm text-text-muted mt-0.5">Manage product categories for your store.</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 bg-black px-4 py-2 text-h4 font-semibold text-white hover:bg-black/80 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        <DataTable
          columns={columns}
          data={mockCategories}
          searchColumn="name"
          searchPlaceholder="Search categories..."
        />
      </div>

      {/* Form Panel */}
      <div
        className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          drawerOpen ? "w-[400px]" : "w-0"
        }`}
      >
      <div className="w-[400px] bg-white border-l border-slate-300 flex flex-col h-full">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-h4 font-bold text-text-default">Add Category</h3>
            <p className="text-sm text-text-muted mt-0.5">Fill in the details to create a new category.</p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex h-8 w-8 items-center justify-center hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="h-4 w-4 text-text-muted" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-default">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. Brake Parts"
              className="w-full h-10 px-3 text-sm border border-slate-300 focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-default">Slug <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="e.g. brake-parts"
              className="w-full h-10 px-3 text-sm border border-slate-300 focus:border-slate-500 focus:outline-none font-mono"
            />
            <p className="text-xs text-text-muted">Used in URLs. Auto-generated from name.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-default">Description</label>
            <textarea
              rows={3}
              placeholder="Short description of this category..."
              className="w-full px-3 py-2 text-sm border border-slate-300 focus:border-slate-500 focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-default">Status</label>
            <select className="w-full h-10 px-3 text-sm border border-slate-300 focus:border-slate-500 focus:outline-none bg-white">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-text-default">Image</label>
            <div className="flex items-center justify-center h-28 border-2 border-dashed border-slate-300 cursor-pointer hover:border-slate-400 transition-colors">
              <p className="text-sm text-text-muted">Click to upload image</p>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex-1 h-10 border border-slate-300 text-sm font-semibold text-text-default hover:bg-slate-50 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button className="flex-1 h-10 bg-black text-white text-sm font-semibold hover:bg-black/80 cursor-pointer transition-colors">
            Save Category
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
