import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-shimmer bg-slate-200/50 dark:bg-slate-800/50", className)} />
  );
}

