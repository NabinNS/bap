"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Plus, MoreVertical } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";
import { InputField, SelectField } from "@/components/ui/form/FormField";
import { MultiImageUpload, type SavedImage } from "@/components/ui/form/MultiImageUpload";
import { uploadImages, type FileUploadState } from "@/lib/upload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Offer = {
  ulid: string;
  title: string;
  sub_title: string | null;
  is_active: boolean;
  sort_order: number;
  thumbnail: string | null;
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
  title: string;
  sub_title: string;
  status: string;
};

type OfferPayload = {
  title: string;
  sub_title: string | null;
  is_active: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  title: "",
  sub_title: "",
  status: "active",
};

export default function AdminOffers() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const [images, setImages] = useState<File[]>([]);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [savedGroupUlid, setSavedGroupUlid] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("offer image");
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["offers", page],
    queryFn: () => apiFetch<{ data: Offer[]; meta: Meta }>(`/offers?page=${page}&per_page=15`),
  });

  const offers = data?.data ?? [];
  const meta = data?.meta ?? null;

  const autoSaveMutation = useMutation({
    mutationFn: ({ ulid, payload }: { ulid?: string; payload: OfferPayload }) =>
      ulid
        ? apiFetch(`/offers/${ulid}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch<{ data: Offer }>("/offers", { method: "POST", body: JSON.stringify(payload) }),

    onSuccess: (data, variables) => {
      if (!variables.ulid) {
        setEditingOffer((data as { data: Offer }).data);
        queryClient.invalidateQueries({ queryKey: ["offers"] });
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ ulid, payload }: { ulid?: string; payload: OfferPayload }) =>
      ulid
        ? apiFetch(`/offers/${ulid}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch<{ data: Offer }>("/offers", { method: "POST", body: JSON.stringify(payload) }),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      if (!variables.ulid) {
        setEditingOffer((data as { data: Offer }).data);
        toast.success("Offer created", `"${form.title}" has been added.`);
      } else {
        toast.success("Offer updated", `"${form.title}" has been updated.`);
        closeDrawer();
      }
    },

    onError: (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
        toast.warning("Please fix the errors", "Check the highlighted fields.");
      } else {
        toast.error(
          editingOffer ? "Failed to update offer" : "Failed to create offer",
          err?.message ?? "Something went wrong."
        );
      }
    },
  });

  function openCreate() {
    setEditingOffer(null);
    setIsEditMode(false);
    setForm(INITIAL_FORM);
    setErrors({});
    setImages([]);
    setSavedImages([]);
    setSavedGroupUlid(null);
    setGroupName("offer image");
    setUploadStates([]);
    setDrawerOpen(true);
  }

  async function openEdit(offer: Offer) {
    setEditingOffer(offer);
    setIsEditMode(true);
    setForm({
      title: offer.title,
      sub_title: offer.sub_title ?? "",
      status: offer.is_active ? "active" : "inactive",
    });
    setErrors({});
    setImages([]);
    setSavedImages([]);
    setSavedGroupUlid(null);
    setUploadStates([]);
    try {
      const res = await apiFetch<{ data: { ulid: string; name: string; items: SavedImage[] }[] }>(
        `/image-groups?imageable_type=offer&imageable_ulid=${offer.ulid}`
      );
      const items = res.data.flatMap((g) => g.items);
      setSavedImages(items);
      if (res.data[0]) {
        setSavedGroupUlid(res.data[0].ulid);
        setGroupName(res.data[0].name);
      }
    } catch {
      // non-critical
    }
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingOffer(null);
    setIsEditMode(false);
    setForm(INITIAL_FORM);
    setErrors({});
    setImages([]);
    setSavedImages([]);
    setSavedGroupUlid(null);
    setGroupName("offer image");
    setUploadStates([]);
  }

  function buildPayload(f: FormState): OfferPayload {
    return {
      title: f.title,
      sub_title: f.sub_title || null,
      is_active: f.status === "active",
    };
  }

  function autoSave(currentForm: FormState = form) {
    if (!currentForm.title.trim()) return;
    autoSaveMutation.mutate({ ulid: editingOffer?.ulid, payload: buildPayload(currentForm) });
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = "Title is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
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

  async function savePhotos() {
    if (!form.title.trim()) {
      toast.error("Offer title required", "Fill in the offer title before adding an image.");
      return;
    }
    if (images.length === 0) {
      toast.error("No image selected", "Pick an image first.");
      return;
    }

    let offer = editingOffer;
    if (!offer) {
      const res = await autoSaveMutation.mutateAsync({
        ulid: undefined,
        payload: buildPayload(form),
      }) as { data: Offer };
      offer = res.data;
    }
    if (!offer) return;

    setSavingPhotos(true);
    setUploadStates([]);
    try {
      const uploaded = await uploadImages(images, "offers", setUploadStates);
      const group = await apiFetch<{ data: { ulid: string } }>("/image-groups", {
        method: "POST",
        body: JSON.stringify({
          imageable_type: "offer",
          imageable_ulid:  offer.ulid,
          slug:            "offer-image",
          name:            groupName || "offer image",
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
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      toast.success("Image saved", "Offer image has been uploaded.");
    } catch (err: any) {
      toast.error("Upload failed", err?.message ?? "Something went wrong.");
    } finally {
      setSavingPhotos(false);
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

  function handleSubmit() {
    if (!validate()) return;
    saveMutation.mutate({ ulid: editingOffer?.ulid, payload: buildPayload(form) });
  }

  const columns: ColumnDef<Offer, unknown>[] = [
    {
      accessorKey: "thumbnail",
      header: "Image",
      enableSorting: false,
      size: 60,
      cell: ({ row }) =>
        row.original.thumbnail ? (
          <img
            src={row.original.thumbnail}
            alt={row.original.title}
            className="h-14 w-14 rounded-lg object-cover border border-slate-200"
          />
        ) : (
          <div className="h-14 w-14 rounded-lg border border-slate-200 bg-slate-100" />
        ),
    },
    { accessorKey: "title", header: "Title" },
    {
      accessorKey: "sub_title",
      header: "Sub Title",
      cell: ({ row }) => <span>{row.original.sub_title || "—"}</span>,
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
          <span className="text-text-default font-medium">Offers</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">Offers</h2>
            <p className="text-sm text-text-muted mt-0.5">Manage offers for your store.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-black px-4 py-2 text-h4 font-semibold text-white hover:bg-black/80 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Offer
          </button>
        </div>

        <DataTable
          columns={columns}
          data={offers}
          loading={isLoading}
          meta={meta}
          onPageChange={setPage}
          searchColumn="title"
          searchPlaceholder="Search offers..."
        />
      </div>

      <SlidePanel
        open={drawerOpen}
        onClose={closeDrawer}
        title={isEditMode ? "Edit Offer" : "Add Offer"}
        description={isEditMode ? "Update the offer details." : "Fill in the details to create a new offer."}
        submitLabel={saveMutation.isPending ? "Saving..." : isEditMode ? "Update Offer" : "Save Offer"}
        onSubmit={handleSubmit}
      >
        <InputField
          label="Title"
          required
          placeholder="e.g. Summer Sale"
          value={form.title}
          onChange={(e) => {
            setForm((f) => ({ ...f, title: e.target.value }));
            setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          onBlur={() => autoSave()}
          error={errors.title}
        />
        <InputField
          label="Sub Title"
          placeholder="e.g. Up to 50% off"
          value={form.sub_title}
          onChange={(e) => setForm((f) => ({ ...f, sub_title: e.target.value }))}
          onBlur={() => autoSave()}
        />
        <SelectField
          label="Status"
          value={form.status}
          onChange={(e) => {
            const status = e.target.value;
            setForm((f) => ({ ...f, status }));
            autoSave({ ...form, status });
          }}
          options={[
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ]}
        />
        <MultiImageUpload
          label="Offer Image"
          value={images}
          onChange={setImages}
          savedImages={savedImages}
          groupName={groupName}
          onGroupNameChange={setGroupName}
          onGroupNameBlur={updateGroupName}
          onSave={savePhotos}
          onRemoveSaved={removeSavedImage}
          saving={savingPhotos}
          uploadStates={uploadStates}
          max={1}
        />
      </SlidePanel>
    </div>
  );
}
