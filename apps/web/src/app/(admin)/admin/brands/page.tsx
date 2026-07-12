"use client";

import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, MoreVertical } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { InputField, TextAreaField, SelectField } from "@/components/ui/form/FormField";
import { MultiImageUpload } from "@/components/ui/form/MultiImageUpload";
import { uploadImages, type FileUploadState } from "@/lib/upload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Brand = {
  ulid: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  is_active: boolean;
  sort_order: number;
};

type Meta = {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number;
  to: number;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  status: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  name: "",
  slug: "",
  description: "",
  status: "active",
};

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function AdminBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [images, setImages] = useState<File[]>([]);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);

  const fetchBrands = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: Brand[]; meta: Meta }>(`/brands?page=${p}&per_page=15`);
      setBrands(res.data);
      setMeta(res.meta);
    } catch {
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands(page);
  }, [page, fetchBrands]);

  function openCreate() {
    setEditingBrand(null);
    setForm(INITIAL_FORM);
    setErrors({});
    setImages([]);
    setExistingImageUrl(null);
    setUploadStates([]);
    setDrawerOpen(true);
  }

  function openEdit(brand: Brand) {
    setEditingBrand(brand);
    setForm({
      name: brand.name,
      slug: brand.slug,
      description: brand.description ?? "",
      status: brand.is_active ? "active" : "inactive",
    });
    setErrors({});
    setImages([]);
    setExistingImageUrl(brand.image);
    setUploadStates([]);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingBrand(null);
    setForm(INITIAL_FORM);
    setErrors({});
    setImages([]);
    setExistingImageUrl(null);
    setUploadStates([]);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, slug: toSlug(name) }));
    setErrors((prev) => ({ ...prev, name: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.slug.trim()) errs.slug = "Slug is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);

    try {
      let imageUrl = existingImageUrl ?? null;

      if (images.length > 0) {
        setUploadStates([]);
        const uploaded = await uploadImages(images, "brands", setUploadStates);
        imageUrl = uploaded[0]?.url ?? imageUrl;
      }

      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        image: imageUrl,
        is_active: form.status === "active",
      };

      if (editingBrand) {
        await apiFetch(`/brands/${editingBrand.ulid}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Brand updated", `"${form.name}" has been updated.`);
      } else {
        await apiFetch("/brands", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Brand created", `"${form.name}" has been added.`);
      }

      closeDrawer();
      fetchBrands(page);
    } catch (err: any) {
      if (err?.errors) {
        setErrors(err.errors);
        toast.warning("Please fix the errors", "Check the highlighted fields.");
      } else {
        toast.error(
          editingBrand ? "Failed to update brand" : "Failed to create brand",
          err?.message ?? "Something went wrong."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const columns: ColumnDef<Brand, unknown>[] = [
    {
      accessorKey: "image",
      header: "Logo",
      enableSorting: false,
      size: 60,
      cell: ({ row }) =>
        row.original.image ? (
          <img
            src={row.original.image}
            alt={row.original.name}
            className="h-10 w-10 rounded object-contain border border-slate-200 bg-white p-1"
          />
        ) : (
          <div className="h-10 w-10 rounded border border-slate-200 bg-slate-100" />
        ),
    },
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "slug",
      header: "Slug",
      cell: ({ row }) => <span>{row.original.slug}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span>{row.original.description || "—"}</span>,
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={
            row.original.is_active
              ? "inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700"
              : "inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-600"
          }
        >
          {row.original.is_active ? "Active" : "Inactive"}
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
            <DropdownMenuItem className="cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none">
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none"
              onClick={() => openEdit(row.original)}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-sm py-2 px-3 rounded-none focus:rounded-none text-red-500 focus:text-red-500">
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
          <span className="text-text-default font-medium">Brands</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">Brands</h2>
            <p className="text-sm text-text-muted mt-0.5">Manage product brands for your store.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-black px-4 py-2 text-h4 font-semibold text-white hover:bg-black/80 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Brand
          </button>
        </div>

        <DataTable
          columns={columns}
          data={brands}
          loading={loading}
          meta={meta}
          onPageChange={setPage}
          searchColumn="name"
          searchPlaceholder="Search brands..."
        />
      </div>

      <SlidePanel
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingBrand ? "Edit Brand" : "Add Brand"}
        description={editingBrand ? "Update the brand details." : "Fill in the details to create a new brand."}
        submitLabel={submitting ? "Saving..." : editingBrand ? "Update Brand" : "Save Brand"}
        onSubmit={handleSubmit}
      >
        <InputField
          label="Name"
          required
          placeholder="e.g. Toyota"
          value={form.name}
          onChange={handleNameChange}
          error={errors.name}
        />
        <InputField
          label="Slug"
          required
          placeholder="e.g. toyota"
          mono
          hint="Auto-generated from name."
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          error={errors.slug}
        />
        <TextAreaField
          label="Description"
          placeholder="Short description of this brand..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
        <SelectField
          label="Status"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
        />
        <MultiImageUpload
          label="Brand Logo"
          value={images}
          onChange={setImages}
          savedImages={existingImageUrl ? [{ ulid: "existing", url: existingImageUrl, path: "" }] : []}
          onRemoveSaved={() => setExistingImageUrl(null)}
          uploadStates={uploadStates}
          max={1}
        />
      </SlidePanel>
    </div>
  );
}
