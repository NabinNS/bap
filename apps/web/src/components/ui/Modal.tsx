"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
};

type Rect = { x: number; y: number; width: number; height: number };

// Which edge/corner is being resized
type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLE_SIZE = 6; // px — invisible hit area on each edge

const cursorMap: Record<ResizeDir, string> = {
  n:  "ns-resize",
  s:  "ns-resize",
  e:  "ew-resize",
  w:  "ew-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  onSubmit,
  submitLabel = "Save",
  initialWidth  = 448,
  initialHeight = 360,
  minWidth  = 280,
  minHeight = 180,
}: ModalProps) {
  const [rect, setRect] = useState<Rect | null>(null);

  // Center on open
  const initRect = useCallback(() => {
    setRect({
      x:      Math.round((window.innerWidth  - initialWidth)  / 2),
      y:      Math.round((window.innerHeight - initialHeight) / 2),
      width:  initialWidth,
      height: initialHeight,
    });
  }, [initialWidth, initialHeight]);

  useEffect(() => { if (open) initRect(); }, [open, initRect]);

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ── Drag ──────────────────────────────────────────────────────────────────

  function onHeaderMouseDown(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const start = { mx: e.clientX, my: e.clientY, ...rect! };

    function onMove(ev: MouseEvent) {
      setRect((r) => r && ({
        ...r,
        x: start.x + (ev.clientX - start.mx),
        y: start.y + (ev.clientY - start.my),
      }));
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // ── Resize ────────────────────────────────────────────────────────────────

  function onResizeMouseDown(e: React.MouseEvent, dir: ResizeDir) {
    e.preventDefault();
    e.stopPropagation();
    const start = { mx: e.clientX, my: e.clientY, ...rect! };

    // Apply cursor globally during drag so it doesn't flicker when mouse moves fast
    document.body.style.cursor = cursorMap[dir];
    document.body.style.userSelect = "none";

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - start.mx;
      const dy = ev.clientY - start.my;

      setRect((r) => {
        if (!r) return r;
        let { x, y, width, height } = start;

        // Horizontal
        if (dir.includes("e")) width  = Math.max(minWidth,  width  + dx);
        if (dir.includes("w")) { const w = Math.max(minWidth,  width  - dx); x += width  - w; width  = w; }

        // Vertical
        if (dir.includes("s")) height = Math.max(minHeight, height + dy);
        if (dir.includes("n")) { const h = Math.max(minHeight, height - dy); y += height - h; height = h; }

        return { x, y, width, height };
      });
    }

    function onUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  if (!open || !rect) return null;

  // ── Resize handle helper ───────────────────────────────────────────────────
  // Each handle is an absolutely-positioned invisible strip on an edge/corner.
  function Handle({ dir }: { dir: ResizeDir }) {
    const s = HANDLE_SIZE;
    const style: React.CSSProperties = { position: "absolute", cursor: cursorMap[dir], zIndex: 10 };

    if (dir === "n")  Object.assign(style, { top: 0, left: s, right: s, height: s });
    if (dir === "s")  Object.assign(style, { bottom: 0, left: s, right: s, height: s });
    if (dir === "e")  Object.assign(style, { right: 0, top: s, bottom: s, width: s });
    if (dir === "w")  Object.assign(style, { left: 0, top: s, bottom: s, width: s });
    if (dir === "ne") Object.assign(style, { top: 0, right: 0, width: s, height: s });
    if (dir === "nw") Object.assign(style, { top: 0, left: 0, width: s, height: s });
    if (dir === "se") Object.assign(style, { bottom: 0, right: 0, width: s, height: s });
    if (dir === "sw") Object.assign(style, { bottom: 0, left: 0, width: s, height: s });

    return <div style={style} onMouseDown={(e) => onResizeMouseDown(e, dir)} />;
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        className="pointer-events-auto absolute bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      >
        {/* Resize handles — all 8 edges/corners */}
        {(["n","s","e","w","ne","nw","se","sw"] as ResizeDir[]).map((d) => (
          <Handle key={d} dir={d} />
        ))}

        {/* Header — drag handle */}
        <div
          onMouseDown={onHeaderMouseDown}
          className="flex items-start justify-between px-6 py-4 bg-black cursor-grab active:cursor-grabbing select-none shrink-0"
        >
          <div>
            <h3 className="text-h4 font-bold text-white">{title}</h3>
            {description && <p className="text-sm text-white/80 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center hover:bg-white/10 transition-colors mt-0.5 cursor-pointer"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-5 space-y-5">
          {children}
        </div>

        {/* Footer */}
        {onSubmit && (
          <div className="flex items-center border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 border-r border-slate-200 text-sm font-semibold text-text-default hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="flex-1 h-12 bg-black text-white text-sm font-semibold hover:bg-black/80 transition-colors cursor-pointer"
            >
              {submitLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
