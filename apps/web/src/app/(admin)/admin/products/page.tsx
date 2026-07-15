"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, MoreVertical } from "lucide-react";
import Link from "next/link";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { InputField, NumberField, TextAreaField, SelectField, ComboboxField } from "@/components/ui/form/FormField";
import { MultiImageUpload, type SavedImage } from "@/components/ui/form/MultiImageUpload";
import { uploadImages, type FileUploadState } from "@/lib/upload";
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
  thumbnail: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  category: { ulid: string; name: string } | null;
};

type FormValues = {
  name: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  status: string;
};

type Category = {
  ulid: string;
  name: string;
};

type ProductPayload = {
  name: string;
  category_ulid: string | null;
  price: number;
  stock: number;
  description: string;
  is_active: boolean;
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
  const queryClient = useQueryClient();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [groupName, setGroupName] = useState("product image");
  const [savedGroupUlid, setSavedGroupUlid] = useState<string | null>(null);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<{ data: Product[] }>("/products?per_page=50"),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => apiFetch<{ data: Category[] }>("/categories?per_page=100"),
  });

  const products = productsData?.data ?? [];
  const categories = categoriesData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormValues>({ defaultValues: INITIAL_VALUES });

  const autoSaveMutation = useMutation({
    mutationFn: ({ ulid, payload }: { ulid?: string; payload: ProductPayload }) =>
      ulid
        ? apiFetch(`/products/${ulid}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch<{ data: Product }>("/products", { method: "POST", body: JSON.stringify(payload) }),

    onSuccess: (data, variables) => {
      if (!variables.ulid) {
        setEditingProduct((data as { data: Product }).data);
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ ulid, payload }: { ulid?: string; payload: ProductPayload }) =>
      ulid
        ? apiFetch(`/products/${ulid}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch<{ data: Product }>("/products", { method: "POST", body: JSON.stringify(payload) }),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        variables.ulid ? "Product updated" : "Product created",
        variables.ulid ? `"${variables.payload.name}" has been updated.` : `"${variables.payload.name}" has been added.`
      );
      closeDrawer();
    },

    onError: (err: any) => {
      if (err?.errors) {
        toast.warning("Please fix the errors", "Check the highlighted fields.");
      } else {
        toast.error(
          editingProduct ? "Failed to update product" : "Failed to create product",
          err?.message ?? "Something went wrong."
        );
      }
    },
  });

  function buildPayload(data: FormValues): ProductPayload {
    return {
      name:          data.name,
      category_ulid: data.category || null,
      price:         Number(data.price) || 0,
      stock:         Number(data.stock) || 0,
      description:   data.description,
      is_active:     data.status === "active",
    };
  }

  function openCreate() {
    setEditingProduct(null);
    setIsEditMode(false);
    setImages([]);
    setSavedImages([]);
    setSavedGroupUlid(null);
    setGroupName("product image");
    reset(INITIAL_VALUES);
    setDrawerOpen(true);
  }

  async function openEdit(product: Product) {
    setEditingProduct(product);
    setIsEditMode(true);
    setImages([]);
    setSavedImages([]);
    try {
      const res = await apiFetch<{ data: { ulid: string; name: string; items: SavedImage[] }[] }>(
        `/image-groups?imageable_type=product&imageable_ulid=${product.ulid}`
      );
      const items = res.data.flatMap((g) => g.items);
      setSavedImages(items);
      if (res.data[0]) {
        setSavedGroupUlid(res.data[0].ulid);
        setGroupName(res.data[0].name);
      }
    } catch {
      // non-critical, images just won't show
    }
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
    setSavedImages([]);
    setSavedGroupUlid(null);
    setGroupName("product image");
    setUploadStates([]);
    reset(INITIAL_VALUES);
  }

  async function updateGroupName() {
    if (!savedGroupUlid || !groupName.trim()) return;
    try {
      await apiFetch(`/image-groups/${savedGroupUlid}`, {
        method: "PATCH",
        body: JSON.stringify({ name: groupName }),
      });
    } catch {
      toast.error("Failed to update group name", "Something went wrong.");
    }
  }

  async function removeSavedImage(ulid: string) {
    try {
      await apiFetch(`/image-items/${ulid}`, { method: "DELETE" });
      setSavedImages((prev) => prev.filter((img) => img.ulid !== ulid));
    } catch {
      toast.error("Failed to delete image", "Something went wrong.");
    }
  }

  async function savePhotos() {
    const data = getValues();
    if (!data.name.trim()) {
      toast.error("Product name required", "Fill in the product name before adding photos.");
      return;
    }
    if (!data.price) {
      toast.error("Price required", "Fill in the price before adding photos.");
      return;
    }
    if (data.stock === "") {
      toast.error("Stock required", "Fill in the stock before adding photos.");
      return;
    }
    if (!editingProduct) {
      toast.error("Save product first", "The product must be saved before you can upload photos.");
      return;
    }
    if (images.length === 0) {
      toast.error("No images selected", "Pick at least one image first.");
      return;
    }

    setSavingPhotos(true);
    setUploadStates([]);
    try {
      const uploaded = await uploadImages(images, "products", setUploadStates);

      const group = await apiFetch<{ data: { ulid: string } }>("/image-groups", {
        method: "POST",
        body: JSON.stringify({
          imageable_type: "product",
          imageable_ulid:  editingProduct.ulid,
          slug:            "product-image",
          name:            groupName || "product image",
        }),
      });

      await apiFetch(`/image-groups/${group.data.ulid}/items`, {
        method: "POST",
        body: JSON.stringify({
          items: uploaded.map((img, i) => ({ url: img.url, path: img.path, sort_order: i })),
        }),
      });

      setSavedImages((prev) => [
        ...prev,
        ...uploaded.map((img, i) => ({ ulid: `temp-${Date.now()}-${i}`, url: img.url, path: img.path })),
      ]);
      setImages([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Photos saved", `${uploaded.length} photo(s) added to "${groupName || "product image"}".`);
    } catch (err: any) {
      toast.error("Upload failed", err?.message ?? "Something went wrong.");
    } finally {
      setSavingPhotos(false);
    }
  }

  function autoSave() {
    const data = getValues();
    if (!data.name.trim() || !data.price || data.stock === "") return;
    autoSaveMutation.mutate({ ulid: editingProduct?.ulid, payload: buildPayload(data) });
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

  function onSubmit(data: FormValues) {
    saveMutation.mutate({ ulid: editingProduct?.ulid, payload: buildPayload(data) });
  }

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
    <div className="flex gap-0 transition-all duration-300 h-full">
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
          loading={isLoading}
          searchColumn="name"
          searchPlaceholder="Search products..."
        />
      </div>

      <CreateCategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        initialName={newCategoryName}
        onCreated={(category) => {
          setValue("category", category.ulid);
        }}
      />

      <SlidePanel
        open={drawerOpen}
        onClose={closeDrawer}
        title={isEditMode ? "Edit Product" : "Add Product"}
        description={isEditMode ? "Update the product details." : "Fill in the details to add a new product."}
        submitLabel={saveMutation.isPending ? "Saving..." : isEditMode ? "Update Product" : "Save Product"}
        onSubmit={handleSubmit(onSubmit)}
        editHref={editingProduct ? `/admin/products/${editingProduct.ulid}/edit` : undefined}
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
          savedImages={savedImages}
          groupName={groupName}
          onGroupNameChange={setGroupName}
          onSave={savePhotos}
          onGroupNameBlur={updateGroupName}
          onRemoveSaved={removeSavedImage}
          saving={savingPhotos}
          uploadStates={uploadStates}
          max={5}
        />
      </SlidePanel>
    </div>
  );
}
