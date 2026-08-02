"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { NumberField } from "@/components/ui/form/FormField";
import { NepaliDateField } from "@/components/ui/form/NepaliDateField";
import { apiFetch } from "@/lib/api";
import { toast } from "@/lib/toast";

type FormValues = {
  percentage: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
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
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    defaultValues: { percentage: "", starts_at: null, ends_at: null, is_active: true },
  });

  useEffect(() => {
    if (open) {
      reset({
        percentage: discount ? String(discount.percentage) : "",
        starts_at:  discount?.starts_at ?? null,
        ends_at:    discount?.ends_at ?? null,
        is_active:  discount ? discount.is_active : true,
      });
    }
  }, [open, discount, reset]);

  async function onSubmit(data: FormValues) {
    try {
      const payload = {
        percentage: Number(data.percentage),
        starts_at:  data.starts_at || null,
        ends_at:    data.ends_at || null,
        is_active:  data.is_active,
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
      initialHeight={400}
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
          <Controller
            name="starts_at"
            control={control}
            render={({ field }) => (
              <NepaliDateField
                label="Start Date (BS)"
                value={field.value}
                onChange={field.onChange}
                placeholder="Select start date"
                error={errors.starts_at?.message}
              />
            )}
          />
          <Controller
            name="ends_at"
            control={control}
            render={({ field }) => (
              <NepaliDateField
                label="End Date (BS)"
                value={field.value}
                onChange={field.onChange}
                placeholder="Select end date"
                error={errors.ends_at?.message}
              />
            )}
          />
        </div>
        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-text-default">Active</p>
                <p className="text-xs text-text-muted">Enable this discount immediately</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={field.value}
                onClick={() => field.onChange(!field.value)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  field.value ? "bg-slate-900" : "bg-slate-300"
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                  field.value ? "translate-x-4" : "translate-x-0.5"
                }`} />
              </button>
            </div>
          )}
        />
      </div>
    </Modal>
  );
}
