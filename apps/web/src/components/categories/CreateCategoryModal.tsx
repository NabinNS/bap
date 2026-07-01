"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/Modal";
import { InputField, TextAreaField } from "@/components/ui/form/FormField";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";

type FormValues = {
  name: string;
  description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  onCreated: (category: { ulid: string; name: string }) => void;
};

export function CreateCategoryModal({ open, onClose, initialName = "", onCreated }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<FormValues>({ defaultValues: { name: initialName, description: "" } });

  // When the modal opens with a pre-filled name, reset the form to that name
  useEffect(() => {
    if (open) reset({ name: initialName, description: "" });
  }, [open, initialName, reset]);

  async function onSubmit(data: FormValues) {
    try {
      const res = await apiFetch<{ data: { ulid: string; name: string } }>("/categories", {
        method: "POST",
        body: JSON.stringify({ name: data.name, description: data.description }),
      });
      toast.success("Category created", `"${data.name}" has been added.`);
      onCreated(res.data);
      onClose();
    } catch (err: any) {
      if (err?.errors?.slug) {
        setError("name", { message: "A category with this name or slug already exists." });
      } else {
        toast.error("Failed to create category", err?.message ?? "Something went wrong.");
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Category"
      description="Add a new category to your catalogue."
      onSubmit={handleSubmit(onSubmit)}
      submitLabel={isSubmitting ? "Creating..." : "Create Category"}
      initialWidth={520}
      initialHeight={380}
    >
      <InputField
        label="Name"
        required
        placeholder="e.g. Engine Parts"
        error={errors.name?.message}
        {...register("name", { required: "Name is required." })}
      />
      <TextAreaField
        label="Description"
        placeholder="Short description (optional)"
        {...register("description")}
      />
    </Modal>
  );
}
