import { toast as sonner } from "sonner";

const DURATION = 4000;

export const toast = {
  success: (message: string, description?: string) =>
    sonner.success(message, { description, duration: DURATION }),

  error: (message: string, description?: string) =>
    sonner.error(message, { description, duration: DURATION }),

  warning: (message: string, description?: string) =>
    sonner.warning(message, { description, duration: DURATION }),

  info: (message: string, description?: string) =>
    sonner.info(message, { description, duration: DURATION }),

  loading: (message: string) =>
    sonner.loading(message),

  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) =>
    sonner.promise(promise, messages),

  dismiss: (id?: string | number) => sonner.dismiss(id),
};
