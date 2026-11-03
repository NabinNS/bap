"use client";

import { useQuery } from "@tanstack/react-query";
import { toBS } from "@zener/nepali-datepicker-react";
import { apiFetch } from "@/lib/api";
import { SlidePanel } from "@/components/ui/form/SlidePanelForm";

type ActivityLog = {
  ulid: string;
  subject_type: string;
  subject_ulid: string | null;
  session_id: string | null;
  label: string | null;
  event: "created" | "updated" | "deleted" | string;
  description: string | null;
  changes: Record<string, unknown> | null;
  user: string | null;
  created_at: string;
};

/** True for the "parent" record of a bill/quotation — its transaction/quotation header, as
 *  opposed to one of its line items. */
function isParentSubject(subjectType: string): boolean {
  return subjectType.endsWith("_transaction") || subjectType === "acc_quotation";
}

/** Groups line-item log entries under their bill/quotation's own entry when both were written
 *  in the same editing session (same `X-Activity-Session`) — so adding a bill with 3 items in
 *  one Save reads as one action with 3 nested items, not 4 separate timeline entries. Entries
 *  stay flat (ungrouped) when their session has no matching header entry on this page. */
function groupLogs(logs: ActivityLog[]): { log: ActivityLog; children: ActivityLog[] }[] {
  const bySession = new Map<string, ActivityLog[]>();
  for (const log of logs) {
    if (!log.session_id) continue;
    const arr = bySession.get(log.session_id) ?? [];
    arr.push(log);
    bySession.set(log.session_id, arr);
  }

  // Two passes: items are written a beat after their transaction, so sorted latest-first the
  // item entry appears BEFORE its parent. A single forward pass would already have rendered
  // it as standalone by the time the parent (further down the list) tried to claim it — so
  // first determine every session's parent + its children, then build the display list.
  const parentBySession = new Map<string, ActivityLog>();
  for (const log of logs) {
    if (log.session_id && isParentSubject(log.subject_type) && !parentBySession.has(log.session_id)) {
      parentBySession.set(log.session_id, log);
    }
  }

  const childUlids = new Set<string>();
  for (const [sessionId, parent] of parentBySession) {
    for (const sibling of bySession.get(sessionId) ?? []) {
      if (sibling.ulid !== parent.ulid && !isParentSubject(sibling.subject_type)) {
        childUlids.add(sibling.ulid);
      }
    }
  }

  const result: { log: ActivityLog; children: ActivityLog[] }[] = [];
  for (const log of logs) {
    if (childUlids.has(log.ulid)) continue;

    const parent = log.session_id ? parentBySession.get(log.session_id) : undefined;
    if (parent?.ulid === log.ulid) {
      const children = (bySession.get(log.session_id!) ?? []).filter((s) => childUlids.has(s.ulid));
      result.push({ log, children });
    } else {
      result.push({ log, children: [] });
    }
  }

  return result;
}

/** "qty 2, rate 1000, discount 0, total 2000" — a compact one-line summary for a nested child
 *  row, where the full chip-grid ChangeList would be too heavy. */
function summarizeChanges(log: ActivityLog): string {
  if (log.event === "updated" && log.changes) {
    return Object.entries(log.changes)
      .filter((e): e is [string, { old: unknown; new: unknown }] => {
        const v = e[1];
        return !!v && typeof v === "object" && "old" in v && "new" in v;
      })
      .map(([field, { old, new: next }]) => `${field.replace(/_/g, " ")} ${old ?? "—"} → ${next ?? "—"}`)
      .join(", ");
  }
  return log.description ?? "";
}

const SUBJECT_TYPE_LABELS: Record<string, string> = {
  acc_vendor: "Vendor",
  acc_customer: "Customer",
  acc_vendor_transaction: "Transaction",
  acc_customer_transaction: "Transaction",
  acc_vendor_transaction_item: "Item",
  acc_customer_transaction_item: "Item",
  acc_quotation: "Quotation",
  acc_quotation_item: "Item",
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
  onSelectEntry,
}: {
  open: boolean;
  onClose: () => void;
  subjectType: string;
  subjectUlid: string | null;
  title?: string;
  /** Called when the user clicks an entry whose subject differs from the one this panel was
   *  opened for (e.g. a transaction row inside a vendor's aggregated log) — lets the caller
   *  jump to / select that row elsewhere in the page. */
  onSelectEntry?: (subjectType: string, subjectUlid: string) => void;
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
  const grouped = groupLogs(logs);

  return (
    <SlidePanel open={open} onClose={onClose} title={title}>
      {isLoading && <p className="text-sm text-text-muted">Loading...</p>}

      {!isLoading && logs.length === 0 && (
        <p className="text-sm text-text-muted">No activity recorded yet.</p>
      )}

      <div>
        {grouped.map(({ log, children }, i) => {
          const clickable = !!(onSelectEntry && log.subject_ulid && log.subject_type.endsWith("_transaction"));
          return (
          <div key={log.ulid} className="relative pl-6 pb-5 last:pb-0">
            {/* Connecting line down to the next entry's dot */}
            {i !== grouped.length - 1 && (
              <span className="absolute left-[5px] top-3 bottom-0 w-px bg-slate-200" />
            )}
            {/* Graph dot */}
            <span
              className={`absolute left-0 top-1 h-[11px] w-[11px] rounded-full ring-2 ring-white ${
                DOT_STYLES[log.event] ?? "bg-slate-400"
              }`}
            />

            <div
              onClick={clickable ? () => onSelectEntry!(log.subject_type, log.subject_ulid!) : undefined}
              className={clickable ? "-mx-2 px-2 py-1 rounded cursor-pointer hover:bg-slate-50 transition-colors" : undefined}
              title={clickable ? "Jump to this row" : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide rounded ${
                      EVENT_STYLES[log.event] ?? "bg-slate-100 text-text-muted"
                    }`}
                  >
                    {EVENT_LABELS[log.event] ?? log.event}
                  </span>
                  <span className="px-1.5 py-0.5 text-xs font-medium bg-slate-100 text-text-muted rounded">
                    {SUBJECT_TYPE_LABELS[log.subject_type] ?? log.subject_type}
                  </span>
                </div>
                <span className="text-xs text-text-muted">{formatBsDateTime(log.created_at)}</span>
              </div>

              {log.label && (
                <p className={`text-sm font-semibold text-text-default mt-2 capitalize ${clickable ? "hover:underline" : ""}`}>
                  {log.label}
                </p>
              )}

              {log.event === "updated" && log.changes ? (
                <>
                  <p className="text-xs text-text-muted mt-2">Fields changed:</p>
                  <ChangeList changes={log.changes} />
                </>
              ) : (
                <p className="text-sm text-text-muted mt-1 leading-relaxed">{log.description}</p>
              )}

              {log.user && (
                <p className="text-xs text-text-muted mt-2">by {log.user}</p>
              )}
            </div>

            {children.length > 0 && (
              <div className="mt-2 ml-1 pl-3 border-l-2 border-slate-100 space-y-1.5">
                {children.map((child) => (
                  <div key={child.ulid} className="text-xs">
                    <span className="font-medium text-text-default capitalize">{child.label ?? SUBJECT_TYPE_LABELS[child.subject_type]}</span>
                    <span className="text-text-muted"> — {summarizeChanges(child)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })}
      </div>
    </SlidePanel>
  );
}
