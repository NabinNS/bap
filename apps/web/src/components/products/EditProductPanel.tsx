"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { InputField, NumberField, ComboboxField } from "@/components/ui/form/FormField";
import { MultiImageUpload } from "@/components/ui/form/MultiImageUpload";
import { CreateCategoryModal } from "@/components/categories/CreateCategoryModal";
import { CreateBrandModal } from "@/components/brands/CreateBrandModal";
import { useImageGroup } from "@/hooks/useImageGroup";

type Category = { ulid: string; name: string };

export type EditableProduct = {
  ulid: string;
  name: string;
  sku: string | null;
  category: { ulid: string; name: string } | null;
  brand: { ulid: string; name: string } | null;
  cost_price: number | null;
  sales_price: number | null;
  stock: number;
  low_stock_quantity: number | null;
};

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

type Props = {
  open: boolean;
  onClose: () => void;
  product: EditableProduct | null;
  onUpdated: (product: EditableProduct) => void;
};

/** Quick "essential fields only" product edit, mirroring CreateProductPanel. */
export function EditProductPanel({ open, onClose, product, onUpdated }: Props) {
  const queryClient = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
  } = useForm<FormValues>();

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  const productImage = useImageGroup("product", "products", "product image");

  useEffect(() => {
    if (open && product) {
      reset({
        name: product.name,
        sku: product.sku ?? "",
        category: product.category?.ulid ?? "",
        brand: product.brand?.ulid ?? "",
        cost_price: product.cost_price != null ? String(product.cost_price) : "",
        sales_price: product.sales_price != null ? String(product.sales_price) : "",
        stock: String(product.stock),
        low_stock_quantity: product.low_stock_quantity != null ? String(product.low_stock_quantity) : "0",
      });
      productImage.load(product.ulid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- productImage is a stable-shaped hook result, not a dep
  }, [open, product, reset]);

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

  async function onSubmit(data: FormValues) {
    if (!product) return;
    try {
      const res = await apiFetch<{ data: EditableProduct }>(`/products/${product.ulid}`, {
        method: "PUT",
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

      toast.success("Product updated", `"${data.name}" has been saved.`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products-sidebar"] });
      onUpdated(res.data);
      onClose();
    } catch (err: any) {
      if (err?.errors) {
        Object.entries(err.errors).forEach(([field, message]) => {
          setError(field as keyof FormValues, { message: message as string });
        });
        toast.warning("Please fix the errors", "Check the highlighted fields.");
      } else {
        toast.error("Failed to update product", err?.message ?? "Something went wrong.");
      }
    }
  }

  return (
    <>
      <SlidePanel
        open={open}
        onClose={onClose}
        title="Edit Product"
        description="Quickly update a product's essentials."
        submitLabel={isSubmitting ? "Saving..." : "Save Changes"}
        onSubmit={handleSubmit(onSubmit)}
      >
        {product && (
          <Link
            href={`/admin/products/${product.ulid}/edit`}
            className="block text-right text-xs font-semibold text-blue-800 underline hover:text-blue-900 transition-colors -mt-2 -mb-2"
          >
            Need more fields? Edit full details →
          </Link>
        )}
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
            label="Stock"
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
            {productImage.saving && (
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-200 animate-pulse font-medium">
                Uploading...
              </span>
            )}
          </div>
          <MultiImageUpload
            value={productImage.images}
            onChange={productImage.setImages}
            savedImages={productImage.savedImages}
            onSave={async () => { if (product) await productImage.save(product.ulid); }}
            onRemoveSaved={productImage.removeSaved}
            uploadStates={productImage.uploadStates}
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
