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

type Slider = {
  ulid: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  deadline_date: string | null;
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
  name: string;
  deadline_date: string;
  status: string;
};

type SliderPayload = {
  name: string;
  deadline_date: string | null;
  is_active: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM: FormState = {
  name: "",
  deadline_date: "",
  status: "active",
};

export default function AdminSliders() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const [images, setImages] = useState<File[]>([]);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [savedGroupUlid, setSavedGroupUlid] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("slider image");
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["sliders", page],
    queryFn: () => apiFetch<{ data: Slider[]; meta: Meta }>(`/sliders?page=${page}&per_page=15`),
  });

  const sliders = data?.data ?? [];
  const meta = data?.meta ?? null;

  const autoSaveMutation = useMutation({
    mutationFn: ({ ulid, payload }: { ulid?: string; payload: SliderPayload }) =>
      ulid
        ? apiFetch(`/sliders/${ulid}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch<{ data: Slider }>("/sliders", { method: "POST", body: JSON.stringify(payload) }),

    onSuccess: (data, variables) => {
      if (!variables.ulid) {
        setEditingSlider((data as { data: Slider }).data);
        queryClient.invalidateQueries({ queryKey: ["sliders"] });
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ ulid, payload }: { ulid?: string; payload: SliderPayload }) =>
      ulid
        ? apiFetch(`/sliders/${ulid}`, { method: "PUT", body: JSON.stringify(payload) })
        : apiFetch<{ data: Slider }>("/sliders", { method: "POST", body: JSON.stringify(payload) }),

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sliders"] });
      if (!variables.ulid) {
        setEditingSlider((data as { data: Slider }).data);
        toast.success("Slider created", `"${form.name}" has been added.`);
      } else {
        toast.success("Slider updated", `"${form.name}" has been updated.`);
        closeDrawer();
      }
    },

    onError: (err: any) => {
      if (err?.errors) {
        setErrors(err.errors);
        toast.warning("Please fix the errors", "Check the highlighted fields.");
      } else {
        toast.error(
          editingSlider ? "Failed to update slider" : "Failed to create slider",
          err?.message ?? "Something went wrong."
        );
      }
    },
  });

  function openCreate() {
    setEditingSlider(null);
    setIsEditMode(false);
    setForm(INITIAL_FORM);
    setErrors({});
    setImages([]);
    setSavedImages([]);
    setSavedGroupUlid(null);
    setGroupName("slider image");
    setUploadStates([]);
    setDrawerOpen(true);
  }

  async function openEdit(slider: Slider) {
    setEditingSlider(slider);
    setIsEditMode(true);
    setForm({
      name: slider.name,
      deadline_date: slider.deadline_date ?? "",
      status: slider.is_active ? "active" : "inactive",
    });
    setErrors({});
    setImages([]);
    setSavedImages([]);
    setSavedGroupUlid(null);
    setUploadStates([]);
    try {
      const res = await apiFetch<{ data: { ulid: string; name: string; items: SavedImage[] }[] }>(
        `/image-groups?imageable_type=slider&imageable_ulid=${slider.ulid}`
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
    setEditingSlider(null);
    setIsEditMode(false);
    setForm(INITIAL_FORM);
    setErrors({});
    setImages([]);
    setSavedImages([]);
    setSavedGroupUlid(null);
    setGroupName("slider image");
    setUploadStates([]);
  }

  function buildPayload(f: FormState): SliderPayload {
    return {
      name: f.name,
      deadline_date: f.deadline_date || null,
      is_active: f.status === "active",
    };
  }

  function autoSave(currentForm: FormState = form) {
    if (!currentForm.name.trim()) return;
    autoSaveMutation.mutate({ ulid: editingSlider?.ulid, payload: buildPayload(currentForm) });
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Name is required.";
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
    if (!form.name.trim()) {
      toast.error("Slider name required", "Fill in the slider name before adding an image.");
      return;
    }
    if (images.length === 0) {
      toast.error("No image selected", "Pick an image first.");
      return;
    }

    let slider = editingSlider;
    if (!slider) {
      const res = await autoSaveMutation.mutateAsync({
        ulid: undefined,
        payload: buildPayload(form),
      }) as { data: Slider };
      slider = res.data;
    }
    if (!slider) return;

    setSavingPhotos(true);
    setUploadStates([]);
    try {
      const uploaded = await uploadImages(images, "sliders", setUploadStates);
      const group = await apiFetch<{ data: { ulid: string } }>("/image-groups", {
        method: "POST",
        body: JSON.stringify({
          imageable_type: "slider",
          imageable_ulid:  slider.ulid,
          slug:            "slider-image",
          name:            groupName || "slider image",
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
      queryClient.invalidateQueries({ queryKey: ["sliders"] });
      toast.success("Image saved", "Slider image has been uploaded.");
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
    saveMutation.mutate({ ulid: editingSlider?.ulid, payload: buildPayload(form) });
  }

  const columns: ColumnDef<Slider, unknown>[] = [
    {
      accessorKey: "thumbnail",
      header: "Image",
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
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "deadline_date",
      header: "Deadline Date",
      cell: ({ row }) => <span>{row.original.deadline_date || "—"}</span>,
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
          <span className="text-text-default font-medium">Sliders</span>
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-text-default">Sliders</h2>
            <p className="text-sm text-text-muted mt-0.5">Manage sliders for your store.</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-black px-4 py-2 text-h4 font-semibold text-white hover:bg-black/80 cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Slider
          </button>
        </div>

        <DataTable
          columns={columns}
          data={sliders}
          loading={isLoading}
          meta={meta}
          onPageChange={setPage}
          searchColumn="name"
          searchPlaceholder="Search sliders..."
        />
      </div>

      <SlidePanel
        open={drawerOpen}
        onClose={closeDrawer}
        title={isEditMode ? "Edit Slider" : "Add Slider"}
        description={isEditMode ? "Update the slider details." : "Fill in the details to create a new slider."}
        submitLabel={saveMutation.isPending ? "Saving..." : isEditMode ? "Update Slider" : "Save Slider"}
        onSubmit={handleSubmit}
      >
        <InputField
          label="Name"
          required
          placeholder="e.g. Summer Sale"
          value={form.name}
          onChange={(e) => {
            setForm((f) => ({ ...f, name: e.target.value }));
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          onBlur={() => autoSave()}
          error={errors.name}
        />
        <InputField
          label="Deadline Date (BS)"
          placeholder="e.g. 2081-09-15"
          value={form.deadline_date}
          onChange={(e) => setForm((f) => ({ ...f, deadline_date: e.target.value }))}
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
          label="Slider Image"
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
