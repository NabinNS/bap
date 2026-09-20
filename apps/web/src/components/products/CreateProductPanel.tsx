"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { uploadImages, type FileUploadState } from "@/lib/upload";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { InputField, NumberField, ComboboxField } from "@/components/ui/form/FormField";
import { MultiImageUpload } from "@/components/ui/form/MultiImageUpload";
import { CreateCategoryModal } from "@/components/categories/CreateCategoryModal";
import { CreateBrandModal } from "@/components/brands/CreateBrandModal";
import type { ProductOption } from "@/components/products/ProductCombobox";

type Category = { ulid: string; name: string };

type FormValues = {
  name: string;
  sku: string;
  category: string;
  brand: string;
  cost_price: string;
  sales_price: string;
  stock: string;
  low_stock_quantity: string;
};

const EMPTY_VALUES: FormValues = {
  name: "",
  sku: "",
  category: "",
  brand: "",
  cost_price: "",
  sales_price: "",
  stock: "0",
  low_stock_quantity: "0",
};

type Props = {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  onCreated: (product: ProductOption) => void;
};

/** Quick "essential fields only" product creation, used when a product combobox turns up no results. */
export function CreateProductPanel({ open, onClose, initialName = "", onCreated }: Props) {
  const queryClient = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
  } = useForm<FormValues>({ defaultValues: EMPTY_VALUES });

  const [images, setImages] = useState<File[]>([]);
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  useEffect(() => {
    if (open) {
      reset({ ...EMPTY_VALUES, name: initialName });
      setImages([]);
      setUploadStates([]);
    }
  }, [open, initialName, reset]);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => apiFetch<{ data: Category[] }>("/categories?per_page=100"),
    enabled: open,
  });
  const { data: brandsData } = useQuery({
    queryKey: ["brands", "all"],
    queryFn: () => apiFetch<{ data: Category[] }>("/brands?per_page=100"),
    enabled: open,
  });

  const categories = categoriesData?.data ?? [];
  const brands = brandsData?.data ?? [];

  async function uploadPendingPhotos(productUlid: string, filesToUpload: File[]) {
    if (filesToUpload.length === 0) return;
    setIsUploading(true);
    setUploadStates([]);
    try {
      const uploaded = await uploadImages(filesToUpload, "products", setUploadStates);

      const group = await apiFetch<{ data: { ulid: string } }>("/image-groups", {
        method: "POST",
        body: JSON.stringify({
          imageable_type: "product",
          imageable_ulid: productUlid,
          slug: "product-image",
          name: "product image",
        }),
      });

      await apiFetch(`/image-groups/${group.data.ulid}/items`, {
        method: "POST",
        body: JSON.stringify({
          items: uploaded.map((img, i) => ({ url: img.url, path: img.path, sort_order: i })),
        }),
      });
    } catch {
      toast.warning("Product saved", "But the photos could not be uploaded.");
    } finally {
      setIsUploading(false);
    }
  }

  async function onSubmit(data: FormValues) {
    try {
      const res = await apiFetch<{ data: ProductOption }>("/products", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          sku: data.sku || null,
          category_ulid: data.category || null,
          brand_ulid: data.brand || null,
          cost_price: Number(data.cost_price),
          sales_price: Number(data.sales_price),
          stock: Number(data.stock || 0),
          low_stock_quantity: Number(data.low_stock_quantity || 0),
        }),
      });

      if (images.length > 0) await uploadPendingPhotos(res.data.ulid, images);

      toast.success("Product created", `"${data.name}" has been added.`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onCreated(res.data);
      onClose();
    } catch (err: any) {
      if (err?.errors) {
        Object.entries(err.errors).forEach(([field, message]) => {
          setError(field as keyof FormValues, { message: message as string });
        });
        toast.warning("Please fix the errors", "Check the highlighted fields.");
      } else {
        toast.error("Failed to create product", err?.message ?? "Something went wrong.");
      }
    }
  }

  return (
    <>
      <SlidePanel
        open={open}
        onClose={onClose}
        title="Add Product"
        description="Quickly add a product with the essentials."
        submitLabel={isSubmitting ? "Saving..." : "Save Product"}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Link
          href="/admin/products/create"
          className="block text-right text-xs font-semibold text-blue-800 underline hover:text-blue-900 transition-colors -mt-2 -mb-2"
        >
          Need more fields? Add full details →
        </Link>
        <InputField
          label="Name"
          required
          placeholder="e.g. Exide Battery 60Ah"
          {...register("name", { required: "Name is required." })}
          error={errors.name?.message}
        />
        <InputField
          label="SKU / Part No."
          placeholder="e.g. BSH-OF-3312"
          mono
          {...register("sku")}
        />
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <ComboboxField
              label="Category"
              placeholder="Select a category"
              options={categories.map((c) => ({ label: c.name, value: c.ulid }))}
              value={field.value}
              onChange={field.onChange}
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
              onChange={field.onChange}
              onAddNew={(query) => { setNewBrandName(query); setBrandModalOpen(true); }}
            />
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Cost Price"
            required
            placeholder="0.00"
            allowDecimal
            {...register("cost_price", { required: "Cost price is required." })}
            error={errors.cost_price?.message}
          />
          <NumberField
            label="Sales Price"
            required
            placeholder="0.00"
            allowDecimal
            {...register("sales_price", { required: "Sales price is required." })}
            error={errors.sales_price?.message}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Opening Stock"
            placeholder="0"
            error={errors.stock?.message}
            {...register("stock", {
              min: { value: 0, message: "Stock cannot be negative." },
            })}
          />
          <NumberField
            label="Low Stock Quantity"
            placeholder="e.g. 5"
            error={errors.low_stock_quantity?.message}
            {...register("low_stock_quantity", {
              min: { value: 0, message: "Low stock quantity cannot be negative." },
            })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-text-default">Product Images</label>
            {isUploading && (
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-200 animate-pulse font-medium">
                Uploading...
              </span>
            )}
          </div>
          <MultiImageUpload
            value={images}
            onChange={setImages}
            uploadStates={uploadStates}
            max={5}
          />
        </div>
      </SlidePanel>

      <CreateCategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        initialName={newCategoryName}
        onCreated={(category) => { setValue("category", category.ulid); queryClient.invalidateQueries({ queryKey: ["categories", "all"] }); }}
      />
      <CreateBrandModal
        open={brandModalOpen}
        onClose={() => setBrandModalOpen(false)}
        initialName={newBrandName}
        onCreated={(brand) => { setValue("brand", brand.ulid); queryClient.invalidateQueries({ queryKey: ["brands", "all"] }); }}
      />
    </>
  );
}
