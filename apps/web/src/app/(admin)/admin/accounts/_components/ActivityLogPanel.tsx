"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";

type ActivityLog = {
  ulid: string;
  event: "created" | "updated" | "deleted" | string;
  description: string | null;
  changes: Record<string, unknown> | null;
  user: string | null;
  created_at: string;
};

const EVENT_STYLES: Record<string, string> = {
  created: "bg-emerald-50 text-emerald-700",
  updated: "bg-amber-50 text-amber-700",
  deleted: "bg-red-50 text-red-700",
};

export function ActivityLogPanel({
  open,
  onClose,
  subjectType,
  subjectUlid,
  title = "Activity Log",
}: {
  open: boolean;
  onClose: () => void;
  subjectType: string;
  subjectUlid: string | null;
  title?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["activity-logs", subjectType, subjectUlid],
    queryFn: () =>
      apiFetch<{ data: ActivityLog[] }>(
        `/activity-logs?subject_type=${subjectType}&subject_ulid=${subjectUlid}`
      ),
    enabled: open && !!subjectUlid,
  });

  const logs = data?.data ?? [];

  return (
    <SlidePanel open={open} onClose={onClose} title={title}>
      {isLoading && <p className="text-sm text-text-muted">Loading...</p>}

      {!isLoading && logs.length === 0 && (
        <p className="text-sm text-text-muted">No activity recorded yet.</p>
      )}

      <div className="space-y-4">
        {logs.map((log) => (
          <div key={log.ulid} className="border-l-2 border-slate-200 pl-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-1.5 py-0.5 text-xs font-semibold uppercase rounded ${
                  EVENT_STYLES[log.event] ?? "bg-slate-100 text-text-muted"
                }`}
              >
                {log.event}
              </span>
              <span className="text-xs text-text-muted">{log.created_at}</span>
            </div>
            <p className="text-sm text-text-default mt-1">{log.description}</p>
            {log.user && (
              <p className="text-xs text-text-muted mt-0.5">by {log.user}</p>
            )}
          </div>
        ))}
      </div>
    </SlidePanel>
  );
}
