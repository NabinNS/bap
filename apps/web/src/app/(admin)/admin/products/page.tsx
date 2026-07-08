"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, MoreVertical } from "lucide-react";
import Link from "next/link";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { InputField, NumberField, TextAreaField, SelectField, ComboboxField } from "@/components/ui/form/FormField";
import { MultiImageUpload } from "@/components/ui/form/MultiImageUpload";
import { CreateCategoryModal } from "@/components/categories/CreateCategoryModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────────

type Product = {
  ulid: string;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  category: { ulid: string; name: string } | null;
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

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = {
  ulid: string;
  name: string;
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


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [groupName, setGroupName] = useState("product image");
  const [autoSaving, setAutoSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Product[] }>("/products?per_page=50");
      setProducts(res.data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    apiFetch<{ data: Category[] }>("/categories?per_page=100")
      .then((res) => setCategories(res.data))
      .catch(() => toast.error("Failed to load categories"));
  }, [fetchProducts]);

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
    control,
    getValues,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<FormValues>({ defaultValues: INITIAL_VALUES });

  function openCreate() {
    setEditingProduct(null);
    setIsEditMode(false);
    setImages([]);
    setGroupName("");
    reset(INITIAL_VALUES);
    setDrawerOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setIsEditMode(true);
    setImages([]);
    reset({
      name:        product.name,
      category:    product.category?.ulid ?? "",
      price:       String(product.price),
      stock:       String(product.stock),
      description: product.description ?? "",
      status:      product.is_active ? "active" : "inactive",
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingProduct(null);
    setImages([]);
    setGroupName("product image");
    reset(INITIAL_VALUES);
  }

  async function autoSave() {
    const data = getValues();

    const payload = {
      name:          data.name,
      category_ulid: data.category || null,
      price:         Number(data.price) || 0,
      stock:         Number(data.stock) || 0,
      description:   data.description,
      is_active:     data.status === "active",
    };

    setAutoSaving(true);
    try {
      if (editingProduct) {
        // Product exists — update via PUT
        await apiFetch(`/products/${editingProduct.ulid}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else if (data.name.trim() && data.price && data.stock !== "") {
        // Minimum required fields filled — create via POST
        const res = await apiFetch<{ data: Product }>("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setEditingProduct(res.data);
        fetchProducts();
      }
    } catch {
      // silent — user can still manually save
    } finally {
      setAutoSaving(false);
    }
  }

  function withAutoSave<T extends { onBlur: (...args: any[]) => any }>(field: T): T {
    return {
      ...field,
      onBlur: (...args: any[]) => {
        field.onBlur(...args);
        autoSave();
      },
    };
  }

  async function onSubmit(data: FormValues) {
    const payload = {
      name:          data.name,
      category_ulid: data.category || null, // backend resolves ulid → integer id
      price:         Number(data.price),
      stock:         Number(data.stock),
      description:   data.description,
      is_active:     data.status === "active",
    };

    try {
      if (editingProduct) {
        await apiFetch(`/products/${editingProduct.ulid}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Product updated", `"${data.name}" has been updated.`);
      } else {
        await apiFetch("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Product created", `"${data.name}" has been added.`);
      }
      closeDrawer();
      fetchProducts();
    } catch (err: any) {
      if (err?.errors) {
        toast.warning("Please fix the errors", "Check the highlighted fields.");
      } else {
        toast.error(
          editingProduct ? "Failed to update product" : "Failed to create product",
          err?.message ?? "Something went wrong."
        );
      }
    }
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
          data={products}
          loading={loading}
          searchColumn="name"
          searchPlaceholder="Search products..."
        />
      </div>

      <CreateCategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        initialName={newCategoryName}
        onCreated={(category) => {
          setCategories((prev) => [category, ...prev]);
          setValue("category", category.ulid);
        }}
      />

      <SlidePanel
        open={drawerOpen}
        onClose={closeDrawer}
        title={isEditMode ? "Edit Product" : "Add Product"}
        description={isEditMode ? "Update the product details." : "Fill in the details to add a new product."}
        submitLabel={isSubmitting ? "Saving..." : isEditMode ? "Update Product" : "Save Product"}
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
          {...withAutoSave(register("name", { required: "Name is required." }))}
        />
        <Controller
          name="category"
          control={control}
          rules={{ required: "Category is required." }}
          render={({ field }) => (
            <ComboboxField
              label="Category"
              required
              placeholder="Select a category"
              options={categories.map((c) => ({ label: c.name, value: c.ulid }))}
              value={field.value}
              onChange={(val) => { field.onChange(val); autoSave(); }}
              error={errors.category?.message}
              onAddNew={(query) => {
                setNewCategoryName(query);
                setCategoryModalOpen(true);
              }}
            />
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Price (NPR)"
            required
            placeholder="e.g. 1200"
            error={errors.price?.message}
            {...withAutoSave(register("price", {
              required: "Price is required.",
              min: { value: 1, message: "Price must be greater than 0." },
            }))}
          />
          <NumberField
            label="Opening Stock"
            required
            placeholder="e.g. 50"
            error={errors.stock?.message}
            {...withAutoSave(register("stock", {
              required: "Stock is required.",
              min: { value: 0, message: "Stock cannot be negative." },
            }))}
          />
        </div>
        <TextAreaField
          label="Description"
          placeholder="Short description of this product..."
          {...withAutoSave(register("description"))}
        />
        <SelectField
          label="Status"
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
          {...withAutoSave(register("status"))}
        />
        <MultiImageUpload
          label="Product Photos"
          value={images}
          onChange={setImages}
          groupName={groupName}
          onGroupNameChange={setGroupName}
          max={5}
        />
      </SlidePanel>
    </div>
  );
}
