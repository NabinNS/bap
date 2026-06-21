"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, MoreVertical, Pencil, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { InputField, TextAreaField, SelectField, FileUploadField } from "@/components/ui/form/FormField";
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

      <SlidePanel
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add Category"
        description="Fill in the details to create a new category."
        submitLabel="Save Category"
      >
        <InputField label="Name" required placeholder="e.g. Brake Parts" />
        <InputField label="Slug" required placeholder="e.g. brake-parts" mono hint="Used in URLs. Auto-generated from name." />
        <TextAreaField label="Description" placeholder="Short description of this category..." />
        <SelectField
          label="Status"
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
        />
        <FileUploadField label="Image" />
      </SlidePanel>
    </div>
  );
}
