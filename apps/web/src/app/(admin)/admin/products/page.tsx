"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, MoreVertical } from "lucide-react";
import Link from "next/link";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { InputField, TextAreaField, SelectField, FileUploadField } from "@/components/ui/form/FormField";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
};

// FormValues is what React Hook Form tracks — the shape of every field in the form
type FormValues = {
  name: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  status: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_VALUES: FormValues = {
  name: "",
  category: "",
  price: "",
  stock: "",
  description: "",
  status: "active",
};

const mockCategories = [
  { label: "Select a category", value: "" },
  { label: "Filters", value: "filters" },
  { label: "Ignition", value: "ignition" },
  { label: "Brakes", value: "brakes" },
  { label: "Engine", value: "engine" },
  { label: "Cooling", value: "cooling" },
];

const mockProducts: Product[] = [
  { id: 1, name: "Bosch Oil Filter", category: "Filters", price: 1200, stock: 45, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
  { id: 2, name: "NGK Spark Plug", category: "Ignition", price: 850, stock: 120, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
  { id: 3, name: "Brake Pad Set", category: "Brakes", price: 3200, stock: 30, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
  { id: 4, name: "Air Filter", category: "Filters", price: 950, stock: 0, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
  { id: 5, name: "Timing Belt", category: "Engine", price: 2400, stock: 18, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
  { id: 6, name: "Radiator Cap", category: "Cooling", price: 450, stock: 67, image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=80" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProducts() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // useForm is the single call that replaces:
  //   useState for form values
  //   useState for errors
  //   useState for submitting
  //   handleChange function
  //   validate function
  //
  // register  → connects an input to React Hook Form
  // handleSubmit → wraps your submit function, runs validation first
  // formState → gives you errors and isSubmitting
  // reset     → clears the form or pre-fills it with new values
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ defaultValues: INITIAL_VALUES });

  function openCreate() {
    setEditingProduct(null);
    setImagePreview(null);
    reset(INITIAL_VALUES); // wipe the form back to empty defaults
    setDrawerOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setImagePreview(product.image);
    // reset() pre-fills the form with the product's existing values
    reset({
      name:        product.name,
      category:    product.category.toLowerCase(),
      price:       String(product.price),
      stock:       String(product.stock),
      description: "",
      status:      "active",
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingProduct(null);
    setImagePreview(null);
    reset(INITIAL_VALUES);
  }

  // onSubmit only runs if all register() validations pass
  // React Hook Form calls this with the validated form data already typed as FormValues
  async function onSubmit(data: FormValues) {
    console.log("Submit payload:", data);
    // API call goes here when backend is ready
    closeDrawer();
  }

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
    { accessorKey: "name", header: "Product" },
    { accessorKey: "category", header: "Category" },
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
            <DropdownMenuItem
              className="gap-3 cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none"
              onClick={() => openEdit(row.original)}
            >
              Edit
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
    <div className="flex gap-0 transition-all duration-300 min-h-full">
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
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-black px-4 py-2 text-h4 font-semibold text-white hover:bg-black/80 cursor-pointer transition-colors"
          >
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

      <SlidePanel
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingProduct ? "Edit Product" : "Add Product"}
        description={editingProduct ? "Update the product details." : "Fill in the details to add a new product."}
        submitLabel={isSubmitting ? "Saving..." : editingProduct ? "Update Product" : "Save Product"}
        onSubmit={handleSubmit(onSubmit)}
        // handleSubmit(onSubmit) means:
        //   1. Run all validation rules from register()
        //   2. If any fail, show errors — do NOT call onSubmit
        //   3. If all pass, call onSubmit(data) with the clean form values
      >
        <InputField
          label="Name"
          required
          placeholder="e.g. Bosch Oil Filter"
          error={errors.name?.message}
          {...register("name", { required: "Name is required." })}
          // register("name") returns: { name, ref, onChange, onBlur }
          // spreading it on the input wires it up — no manual value or onChange needed
        />
        <SelectField
          label="Category"
          required
          options={mockCategories}
          error={errors.category?.message}
          {...register("category", { required: "Category is required." })}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Price (NPR)"
            required
            type="number"
            placeholder="e.g. 1200"
            error={errors.price?.message}
            {...register("price", {
              required: "Price is required.",
              min: { value: 1, message: "Price must be greater than 0." },
            })}
          />
          <InputField
            label="Stock"
            required
            type="number"
            placeholder="e.g. 50"
            error={errors.stock?.message}
            {...register("stock", {
              required: "Stock is required.",
              min: { value: 0, message: "Stock cannot be negative." },
            })}
          />
        </div>
        <TextAreaField
          label="Description"
          placeholder="Short description of this product..."
          {...register("description")}
        />
        <SelectField
          label="Status"
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
          {...register("status")}
        />
        <FileUploadField
          label="Product Image"
          preview={imagePreview}
          onChange={(file) => setImagePreview(URL.createObjectURL(file))}
        />
      </SlidePanel>
    </div>
  );
}
