"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { InputField } from "@/components/ui/form/FormField";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";

type FormValues = { name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  onCreated: (brand: { ulid: string; name: string }) => void;
};

export function CreateBrandModal({ open, onClose, initialName = "", onCreated }: Props) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<FormValues>({ defaultValues: { name: initialName } });

  useEffect(() => {
    if (open) reset({ name: initialName });
  }, [open, initialName, reset]);

  async function onSubmit(data: FormValues) {
    try {
      const res = await apiFetch<{ data: { ulid: string; name: string } }>("/brands", {
        method: "POST",
        body: JSON.stringify({ name: data.name }),
      });
      toast.success("Brand created", `"${data.name}" has been added.`);
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      onCreated(res.data);
      onClose();
    } catch (err: any) {
      if (err?.errors?.slug) {
        setError("name", { message: "A brand with this name already exists." });
      } else {
        toast.error("Failed to create brand", err?.message ?? "Something went wrong.");
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Brand"
      description="Add a new brand to your catalogue."
      onSubmit={handleSubmit(onSubmit)}
      submitLabel={isSubmitting ? "Creating..." : "Create Brand"}
      initialWidth={480}
      initialHeight={280}
    >
      <InputField
        label="Brand Name"
        required
        placeholder="e.g. Bosch"
        error={errors.name?.message}
        {...register("name", { required: "Brand name is required." })}
      />
    </Modal>
  );
}
