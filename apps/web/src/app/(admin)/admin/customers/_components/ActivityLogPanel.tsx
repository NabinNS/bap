"use client";

import { useQuery } from "@tanstack/react-query";
import { toBS } from "@zener/nepali-datepicker-react";
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

const DOT_STYLES: Record<string, string> = {
  created: "bg-emerald-500",
  updated: "bg-amber-500",
  deleted: "bg-red-500",
};

const EVENT_LABELS: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
};

/** "2083-07-18, 5:26 PM" from an ISO (AD) timestamp */
function formatBsDateTime(iso: string): string {
  const d = new Date(iso);
  const adStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const bs = toBS(adStr);
  const bsDate = `${bs.year}-${String(bs.month + 1).padStart(2, "0")}-${String(bs.date).padStart(2, "0")}`;
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${bsDate}, ${time}`;
}

/** Renders a diff-format changes object (field => { old, new }) as small readable rows. */
function ChangeList({ changes }: { changes: Record<string, unknown> }) {
  const entries = Object.entries(changes).filter(
    (entry): entry is [string, { old: unknown; new: unknown }] => {
      const v = entry[1];
      return !!v && typeof v === "object" && "old" in v && "new" in v;
    }
  );

  if (entries.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {entries.map(([field, { old, new: next }]) => (
        <div key={field} className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-medium text-text-default capitalize">{field.replace(/_/g, " ")}</span>
          <span className="px-1.5 py-0.5 bg-slate-100 text-text-muted line-through">{old === null ? "—" : String(old)}</span>
          <span className="text-text-muted">→</span>
          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700">{next === null ? "—" : String(next)}</span>
        </div>
      ))}
    </div>
  );
}

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

      <div>
        {logs.map((log, i) => (
          <div key={log.ulid} className="relative pl-6 pb-5 last:pb-0">
            {/* Connecting line down to the next entry's dot */}
            {i !== logs.length - 1 && (
              <span className="absolute left-[5px] top-3 bottom-0 w-px bg-slate-200" />
            )}
            {/* Graph dot */}
            <span
              className={`absolute left-0 top-1 h-[11px] w-[11px] rounded-full ring-2 ring-white ${
                DOT_STYLES[log.event] ?? "bg-slate-400"
              }`}
            />

            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide rounded ${
                  EVENT_STYLES[log.event] ?? "bg-slate-100 text-text-muted"
                }`}
              >
                {EVENT_LABELS[log.event] ?? log.event}
              </span>
              <span className="text-xs text-text-muted">{formatBsDateTime(log.created_at)}</span>
            </div>

            {log.event === "updated" && log.changes ? (
              <>
                <p className="text-xs text-text-muted mt-2">Fields changed:</p>
                <ChangeList changes={log.changes} />
              </>
            ) : (
              <p className="text-sm text-text-default mt-2 leading-relaxed">{log.description}</p>
            )}

            {log.user && (
              <p className="text-xs text-text-muted mt-2">by {log.user}</p>
            )}
          </div>
        ))}
      </div>
    </SlidePanel>
  );
}
