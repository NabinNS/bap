"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { NumberField, InputField } from "@/components/ui/form/FormField";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";

type FormValues = {
  percentage: string;
  starts_at: string;
  ends_at: string;
};

export type ProductDiscount = {
  ulid: string;
  percentage: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  productUlid: string;
  discount?: ProductDiscount | null;
};

export function ProductDiscountModal({ open, onClose, productUlid, discount }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!discount;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    defaultValues: { percentage: "", starts_at: "", ends_at: "" },
  });

  useEffect(() => {
    if (open) {
      reset({
        percentage: discount ? String(discount.percentage) : "",
        starts_at:  discount?.starts_at?.slice(0, 10) ?? "",
        ends_at:    discount?.ends_at?.slice(0, 10) ?? "",
      });
    }
  }, [open, discount, reset]);

  async function onSubmit(data: FormValues) {
    try {
      const payload = {
        percentage: Number(data.percentage),
        starts_at:  data.starts_at || null,
        ends_at:    data.ends_at || null,
      };

      if (isEdit) {
        await apiFetch(`/products/${productUlid}/discounts/${discount!.ulid}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Discount updated", "The discount has been updated.");
      } else {
        await apiFetch(`/products/${productUlid}/discounts`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Discount added", "The discount has been saved.");
      }

      queryClient.invalidateQueries({ queryKey: ["product-discounts", productUlid] });
      onClose();
    } catch (err: any) {
      toast.error(
        isEdit ? "Failed to update discount" : "Failed to add discount",
        err?.message ?? "Something went wrong."
      );
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Discount" : "Add Discount"}
      description="Set a percentage discount with optional start and end dates."
      onSubmit={handleSubmit(onSubmit)}
      submitLabel={isSubmitting ? "Saving..." : isEdit ? "Update Discount" : "Add Discount"}
      initialWidth={560}
      initialHeight={350}
    >
      <div className="space-y-4">
        <NumberField
          label="Discount %"
          required
          placeholder="e.g. 15"
          error={errors.percentage?.message}
          {...register("percentage", {
            required: "Percentage is required.",
            min: { value: 1, message: "Must be at least 1%." },
            max: { value: 100, message: "Cannot exceed 100%." },
          })}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Start Date"
            type="date"
            error={errors.starts_at?.message}
            {...register("starts_at")}
          />
          <InputField
            label="End Date"
            type="date"
            error={errors.ends_at?.message}
            {...register("ends_at")}
          />
        </div>
      </div>
    </Modal>
  );
}
