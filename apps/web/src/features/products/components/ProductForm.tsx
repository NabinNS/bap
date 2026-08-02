"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useWatch } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { ArrowLeft, MoreVertical, Plus } from "lucide-react";
import { InputField, NumberField, SelectField, ComboboxField } from "@/components/ui/form/FormField";
import { RichTextEditor } from "@/components/ui/form/RichTextEditor";
import { MultiImageUpload, type SavedImage } from "@/components/ui/form/MultiImageUpload";
import { uploadImages, type FileUploadState } from "@/lib/upload";
import { CreateCategoryModal } from "@/components/categories/CreateCategoryModal";
import { CreateBrandModal } from "@/components/brands/CreateBrandModal";
import { ProductDiscountModal, type ProductDiscount } from "@/components/discounts/ProductDiscountModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FormValues = {
  name: string;
  slug: string;
  sku: string;
  category: string;
  brand: string;
  cost_price: string;
  sales_price: string;
  stock: string;
  low_stock_quantity: string;
  description: string;
  status: string;
  is_featured: boolean;
};

type Category = { ulid: string; name: string };

export type ProductFormProduct = {
  ulid: string;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  cost_price: number | null;
  sales_price: number | null;
  stock: number;
  low_stock_quantity: number | null;
  is_active: boolean;
  is_featured: boolean;
  category: { ulid: string; name: string } | null;
  brand: { ulid: string; name: string } | null;
};

type ProductPayload = {
  name: string;
  slug: string | null;
  sku: string | null;
  category_ulid: string | null;
  brand_ulid: string | null;
  cost_price: number | null;
  sales_price: number | null;
  stock: number;
  low_stock_quantity: number | null;
  description: string;
  is_active: boolean;
  is_featured: boolean;
};

type Props = {
  product?: ProductFormProduct;
};

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const [savedProductUlid, setSavedProductUlid] = useState<string | undefined>(product?.ulid);
  const [images, setImages] = useState<File[]>([]);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [savedGroupUlid, setSavedGroupUlid] = useState<string | null>(null);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<ProductDiscount | null>(null);
  const [discountPage, setDiscountPage] = useState(1);
  const DISCOUNTS_PER_PAGE = 4;
  const slugTouched = useRef(false);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => apiFetch<{ data: Category[] }>("/categories?per_page=100"),
  });
  const { data: brandsData } = useQuery({
    queryKey: ["brands", "all"],
    queryFn: () => apiFetch<{ data: Category[] }>("/brands?per_page=100"),
  });
  const { data: discountsData } = useQuery({
    queryKey: ["product-discounts", savedProductUlid],
    queryFn: () => apiFetch<{ data: ProductDiscount[] }>(`/products/${savedProductUlid}/discounts`),
    enabled: !!savedProductUlid,
  });

  const categories = categoriesData?.data ?? [];
  const brands = brandsData?.data ?? [];
  const discounts = discountsData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { name: "", slug: "", sku: "", category: "", brand: "", cost_price: "", sales_price: "", stock: "", low_stock_quantity: "", description: "", status: "active", is_featured: false },
  });

  // Sync form whenever product data arrives (edit mode)
  useEffect(() => {
    if (!product) return;
    slugTouched.current = true; // don't overwrite the existing slug
    reset({
      name:               product.name,
      slug:               product.slug ?? "",
      sku:                product.sku ?? "",
      category:           product.category?.ulid ?? "",
      brand:              product.brand?.ulid ?? "",
      cost_price:         product.cost_price != null ? String(product.cost_price) : "",
      sales_price:        product.sales_price != null ? String(product.sales_price) : "",
      stock:              String(product.stock),
      low_stock_quantity: product.low_stock_quantity != null ? String(product.low_stock_quantity) : "",
      description:        product.description ?? "",
      status:             product.is_active ? "active" : "inactive",
      is_featured:        product.is_featured,
    });
  }, [product, reset]);

  // Auto-generate slug from name as user types (unless slug was manually edited)
  const watchedName = useWatch({ control, name: "name" });
  useEffect(() => {
    if (slugTouched.current || !watchedName) return;
    const slug = watchedName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setValue("slug", slug, { shouldDirty: false });
  }, [watchedName, setValue]);

  // Load existing images in edit mode
  useEffect(() => {
    if (!product) return;
    apiFetch<{ data: { ulid: string; name: string; items: SavedImage[] }[] }>(
      `/image-groups?imageable_type=product&imageable_ulid=${product.ulid}`
    )
      .then((res) => {
        setSavedImages(res.data.flatMap((g) => g.items));
        if (res.data[0]) {
          setSavedGroupUlid(res.data[0].ulid);
        }
      })
      .catch(() => {});
  }, [product]);

  const autoSaveMutation = useMutation({
    mutationFn: ({ ulid, payload }: { ulid?: string; payload: ProductPayload }) =>
      ulid
        ? apiFetch(`/products/${ulid}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch<{ data: ProductFormProduct }>("/products", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: (data, variables) => {
      if (!variables.ulid) {
        const created = (data as { data: ProductFormProduct }).data;
        setSavedProductUlid(created.ulid);
        queryClient.invalidateQueries({ queryKey: ["products"] });
      }
    },
  });

  function buildPayload(data: FormValues): ProductPayload {
    return {
      name:               data.name,
      slug:               data.slug || null,
      sku:                data.sku || null,
      category_ulid:      data.category || null,
      brand_ulid:         data.brand || null,
      cost_price:         data.cost_price !== "" ? Number(data.cost_price) : null,
      sales_price:        data.sales_price !== "" ? Number(data.sales_price) : null,
      stock:              Number(data.stock) || 0,
      low_stock_quantity: data.low_stock_quantity !== "" ? Number(data.low_stock_quantity) : null,
      description:        data.description,
      is_active:          data.status === "active",
      is_featured:        data.is_featured,
    };
  }

  function autoSave() {
    const data = getValues();
    if (!data.name.trim() || data.stock === "" || data.cost_price === "" || data.sales_price === "") return;
    autoSaveMutation.mutate({ ulid: savedProductUlid, payload: buildPayload(data) });
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

  async function toggleDiscountActive(discount: ProductDiscount) {
    if (!savedProductUlid) return;
    try {
      await apiFetch(`/products/${savedProductUlid}/discounts/${discount.ulid}`, {
        method: "PUT",
        body: JSON.stringify({
          percentage: discount.percentage,
          starts_at: discount.starts_at,
          ends_at: discount.ends_at,
          is_active: !discount.is_active,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["product-discounts", savedProductUlid] });
    } catch {
      toast.error("Failed to update", "Something went wrong.");
    }
  }

  async function deleteDiscount(discountUlid: string) {
    if (!savedProductUlid) return;
    try {
      await apiFetch(`/products/${savedProductUlid}/discounts/${discountUlid}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["product-discounts", savedProductUlid] });
      toast.success("Discount removed", "The discount has been deleted.");
    } catch {
      toast.error("Failed to delete", "Something went wrong.");
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

  async function uploadPendingPhotos(productUlid: string, filesToUpload: File[]) {
    if (filesToUpload.length === 0 || isUploading) return;
    setIsUploading(true);
    setSavingPhotos(true);
    setUploadStates([]);
    try {
      const uploaded = await uploadImages(filesToUpload, "products", setUploadStates);
      
      let groupUlid = savedGroupUlid;
      if (!groupUlid) {
        const group = await apiFetch<{ data: { ulid: string } }>("/image-groups", {
          method: "POST",
          body: JSON.stringify({
            imageable_type: "product",
            imageable_ulid:  productUlid,
            slug:            "product-image",
            name:            "product image",
          }),
        });
        groupUlid = group.data.ulid;
        setSavedGroupUlid(groupUlid);
      }
      
      await apiFetch(`/image-groups/${groupUlid}/items`, {
        method: "POST",
        body: JSON.stringify({
          items: uploaded.map((img, i) => ({ url: img.url, path: img.path, sort_order: i })),
        }),
      });

      // Refetch images to ensure we have the clean, updated database records with correct IDs
      const freshGroupRes = await apiFetch<{ data: { ulid: string; name: string; items: SavedImage[] }[] }>(
        `/image-groups?imageable_type=product&imageable_ulid=${productUlid}`
      );
      if (freshGroupRes.data && freshGroupRes.data[0]) {
        setSavedImages(freshGroupRes.data[0].items);
        setSavedGroupUlid(freshGroupRes.data[0].ulid);
      } else {
        const fallbackItems = uploaded.map((img, i) => ({
          ulid: `temp-${Date.now()}-${i}`,
          url: img.url,
          path: img.path,
        }));
        setSavedImages((prev) => [...prev, ...fallbackItems]);
      }
      
      setImages([]);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Photos saved", `${uploaded.length} photo(s) added.`);
    } catch (err: any) {
      toast.error("Upload failed", err?.message ?? "Something went wrong.");
      throw err;
    } finally {
      setSavingPhotos(false);
      setIsUploading(false);
    }
  }

  // Automatically upload images in the background once the product exists
  useEffect(() => {
    if (savedProductUlid && images.length > 0 && !isUploading && !savingPhotos) {
      uploadPendingPhotos(savedProductUlid, images);
    }
  }, [savedProductUlid, images, isUploading, savingPhotos]);

  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      const payload = buildPayload(data);
      let targetUlid = savedProductUlid;

      // 1. Create or update product
      if (targetUlid) {
        await apiFetch(`/products/${targetUlid}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        const res = await apiFetch<{ data: ProductFormProduct }>("/products", { method: "POST", body: JSON.stringify(payload) });
        targetUlid = res.data.ulid;
        setSavedProductUlid(targetUlid);
      }

      // 2. Upload any local images that haven't been uploaded yet
      if (images.length > 0) {
        if (!isUploading) {
          await uploadPendingPhotos(targetUlid, images);
        } else {
          // If already uploading, wait for it to complete
          while (isUploading) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        isEdit ? "Product updated" : "Product created",
        `"${payload.name}" has been ${isEdit ? "updated" : "added"}.`
      );
      router.push("/admin/products");
    } catch (err: any) {
      toast.error(
        isEdit ? "Failed to update product" : "Failed to create product",
        err?.message ?? "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Header & Breadcrumbs Area */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-default transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>

          <nav className="flex items-center gap-1.5 text-sm text-text-muted">
            <Link href="/admin" className="hover:text-text-default transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/admin/products" className="hover:text-text-default transition-colors">Products</Link>
            <span>/</span>
            <span className="text-text-default font-medium">{isEdit ? "Edit Product" : "Add Product"}</span>
          </nav>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-text-default tracking-tight">{isEdit ? "Edit Product" : "Add Product"}</h2>
          <p className="text-sm text-text-muted mt-0.5">
            {isEdit ? "Modify product details, inventory status, and media." : "Fill in the details to list a new product in the store."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 items-stretch">
          {/* Left Column */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="flex-1 bg-white border border-slate-200 p-6 space-y-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-slate-400 pb-3">
                General Information
              </h3>

              {/* Row 1: Name · Slug · SKU */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                  label="Product Name"
                  required
                  placeholder="e.g. Bosch Oil Filter"
                  error={errors.name?.message}
                  {...withAutoSave(register("name", { required: "Name is required." }))}
                />
                <InputField
                  label="Slug"
                  labelHint="(auto-fills from name)"
                  placeholder="auto-generated from name"
                  mono
                  {...register("slug", {
                    onChange: () => { slugTouched.current = true; },
                    onBlur:   () => autoSave(),
                  })}
                />
                <InputField
                  label="SKU / Part No."
                  placeholder="e.g. BSH-OF-3312"
                  mono
                  {...withAutoSave(register("sku"))}
                />
              </div>

              {/* Row 2: Category · Brand */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      onAddNew={(query) => { setNewCategoryName(query); setCategoryModalOpen(true); }}
                    />
                  )}
                />
                <Controller
                  name="brand"
                  control={control}
                  render={({ field }) => (
                    <ComboboxField
                      label="Brand"
                      placeholder="Select a brand"
                      options={brands.map((b) => ({ label: b.name, value: b.ulid }))}
                      value={field.value}
                      onChange={(val) => { field.onChange(val); autoSave(); }}
                      onAddNew={(query) => { setNewBrandName(query); setBrandModalOpen(true); }}
                    />
                  )}
                />
              </div>

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    label="Description"
                    placeholder="Write a short description of the product's features and compatibility..."
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={() => { field.onBlur(); autoSave(); }}
                  />
                )}
              />

              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-3">
                Pricing & Inventory
              </h3>
              <hr className="border-slate-400" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField
                  label="Cost Price (NPR)"
                  required
                  placeholder="e.g. 900"
                  error={errors.cost_price?.message}
                  {...withAutoSave(register("cost_price", {
                    required: "Cost price is required.",
                    min: { value: 0, message: "Cost price cannot be negative." },
                  }))}
                />
                <NumberField
                  label="Sales Price (NPR)"
                  required
                  placeholder="e.g. 1100"
                  error={errors.sales_price?.message}
                  {...withAutoSave(register("sales_price", {
                    required: "Sales price is required.",
                    min: { value: 0, message: "Sales price cannot be negative." },
                  }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <NumberField
                  label="Low Stock Quantity"
                  placeholder="e.g. 5"
                  error={errors.low_stock_quantity?.message}
                  {...withAutoSave(register("low_stock_quantity", {
                    min: { value: 0, message: "Low stock quantity cannot be negative." },
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col">
            <div className="h-full bg-white border border-slate-200 p-6 space-y-6">
              {/* Status Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted border-b border-slate-400 pb-3">
                  Visibility
                </h3>
                <SelectField
                  label="Product Status"
                  options={[
                    { label: "Active", value: "active" },
                    { label: "Inactive", value: "inactive" },
                  ]}
                  {...withAutoSave(register("status"))}
                />
                <Controller
                  name="is_featured"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-semibold text-text-default">Featured</p>
                        <p className="text-xs text-text-muted">Show on homepage & featured sections</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.value}
                        onClick={() => { field.onChange(!field.value); autoSave(); }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                          field.value ? "bg-slate-900" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                            field.value ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  )}
                />
              </div>

              {/* Product Media Section */}
              <div className="space-y-5 mt-6">
                <div className="flex items-center justify-between border-b border-slate-400 pb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                    Product Images
                  </h3>
                  {isUploading && (
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-200 animate-pulse font-medium">
                      Uploading...
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  Add up to 5 photos. Previews will upload automatically as soon as the product has basic details saved.
                </p>
                <div>
                  <MultiImageUpload
                    value={images}
                    onChange={setImages}
                    savedImages={savedImages}
                    onRemoveSaved={removeSavedImage}
                    saving={savingPhotos}
                    uploadStates={uploadStates}
                    max={5}
                  />
                </div>
              </div>
              {/* Discounts Section */}
              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between border-b border-slate-400 pb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
                    Discounts
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (!savedProductUlid) {
                        toast.error("Save the product first", "Fill in the required fields and the product will auto-save.");
                        return;
                      }
                      setEditingDiscount(null);
                      setDiscountModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-black text-white hover:bg-black/80 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Discount
                  </button>
                </div>

                {!savedProductUlid ? (
                  <p className="text-xs text-text-muted">Save the product first to add discounts.</p>
                ) : discounts.length === 0 ? (
                  <p className="text-xs text-text-muted">No discounts added yet.</p>
                ) : (() => {
                  const totalPages = Math.ceil(discounts.length / DISCOUNTS_PER_PAGE);
                  const paginated = discounts.slice((discountPage - 1) * DISCOUNTS_PER_PAGE, discountPage * DISCOUNTS_PER_PAGE);
                  return (
                  <div className="w-full text-xs">
                    <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-x-3 px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted border-b border-slate-200">
                      <span>Discount</span>
                      <span>Start</span>
                      <span>End</span>
                      <span>Active</span>
                      <span />
                    </div>
                    <div className="h-[144px] overflow-hidden">
                    {paginated.map((d) => (
                      <div
                        key={d.ulid}
                        className="grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-x-3 items-center px-1 py-2 border-b border-slate-100 last:border-0"
                      >
                        <span className="font-semibold">{d.percentage}%</span>
                        <span className="text-text-muted tabular-nums">{d.starts_at ?? "—"}</span>
                        <span className="text-text-muted tabular-nums">{d.ends_at ?? "—"}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={d.is_active}
                          onClick={() => toggleDiscountActive(d)}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                            d.is_active ? "bg-slate-900" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
                            style={{ transform: d.is_active ? "translateX(14px)" : "translateX(2px)" }}
                          />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="flex h-6 w-6 items-center justify-center hover:bg-slate-100 transition-colors"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-28 rounded-none p-0">
                            <DropdownMenuItem
                              className="cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none"
                              onClick={() => { setEditingDiscount(d); setDiscountModalOpen(true); }}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none text-red-500 focus:text-red-500"
                              onClick={() => deleteDiscount(d.ulid)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-1">
                        <span className="text-[10px] text-text-muted">{discounts.length} total</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={discountPage === 1}
                            onClick={() => setDiscountPage((p) => p - 1)}
                            className="h-5 w-5 flex items-center justify-center border border-slate-200 text-text-muted hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[10px]"
                          >
                            ‹
                          </button>
                          <span className="text-[10px] text-text-muted px-1">{discountPage}/{totalPages}</span>
                          <button
                            type="button"
                            disabled={discountPage === totalPages}
                            onClick={() => setDiscountPage((p) => p + 1)}
                            className="h-5 w-5 flex items-center justify-center border border-slate-200 text-text-muted hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-[10px]"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Full-width sticky action buttons card */}
        <div className="sticky bottom-0 z-10 bg-white border border-slate-200 p-4 flex items-center justify-end gap-3 mt-0">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 text-sm font-semibold text-text-muted hover:text-text-default border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || isUploading}
            className="px-5 py-2.5 bg-black text-white text-sm font-semibold hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center min-w-[120px]"
          >
            {submitting || isUploading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : isEdit ? (
              "Update Product"
            ) : (
              "Save Product"
            )}
          </button>
        </div>
      </form>

      <CreateCategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        initialName={newCategoryName}
        onCreated={(category) => { setValue("category", category.ulid); autoSave(); }}
      />
      <CreateBrandModal
        open={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        initialName={newBrandName}
        onCreated={(brand) => { setValue("brand", brand.ulid); autoSave(); }}
      />
      {savedProductUlid && (
        <ProductDiscountModal
          open={discountModalOpen}
          onClose={() => setDiscountModalOpen(false)}
          productUlid={savedProductUlid}
          discount={editingDiscount}
        />
      )}
    </div>
  );
}
