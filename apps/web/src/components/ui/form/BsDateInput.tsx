"use client";

import "@zener/nepali-datepicker-react/index.css";
import { useRef, useState } from "react";
import NepaliDatePicker, { NepaliDate, toBS } from "@zener/nepali-datepicker-react";

// Approximate rendered height of the calendar popover, used to decide whether
// it should flip upward when there isn't enough room below the input.
const CALENDAR_HEIGHT_PX = 360;

export function isValidBsDate(str: string): boolean {
  if (!str || str.length !== 10) return false;
  const parts = str.split("-");
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 32) return false;
  try {
    new NepaliDate(str);
    return true;
  } catch {
    return false;
  }
}

export function getTodayBs(): string {
  const now = new Date();
  const adStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const bs = toBS(adStr);
  return `${bs.year}-${String(bs.month + 1).padStart(2, "0")}-${String(bs.date).padStart(2, "0")}`;
}

type Props = {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Remounts the internal text state when this changes (e.g. switching rows/records). */
  resetKey?: string | number;
};

/**
 * Compact BS date input: typed "YYYY-MM-DD" text field that also opens a
 * Nepali calendar popover on focus. Used anywhere a dense, label-less date
 * cell is needed (transaction tables, bill headers, etc).
 */
export function BsDateInput({ value, onChange, onBlur, placeholder = "YYYY-MM-DD", className, disabled, resetKey }: Props) {
  const [text, setText] = useState(value);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = raw;
    if (raw.length > 4) formatted = `${raw.slice(0, 4)}-${raw.slice(4)}`;
    if (raw.length > 6) formatted = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6)}`;
    setText(formatted);
    onChange(formatted);
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        key={resetKey}
        type="text"
        value={text}
        onChange={handleChange}
        onFocus={() => {
          if (disabled) return;
          const spaceBelow = window.innerHeight - (inputRef.current?.getBoundingClientRect().bottom ?? 0);
          setOpenUpward(spaceBelow < CALENDAR_HEIGHT_PX);
          setCalendarOpen(true);
        }}
        onBlur={() => { setTimeout(() => { setCalendarOpen(false); onBlur?.(); }, 200); }}
        placeholder={placeholder}
        disabled={disabled}
        className={className ?? "w-full h-8 px-2 text-sm font-medium text-black border border-slate-300 focus:outline-none focus:border-slate-500 bg-white disabled:bg-slate-100 disabled:text-text-muted"}
      />
      {calendarOpen && !disabled && (
        // The library positions its calendar portal at trigger.top + trigger.height (in
        // viewport coords) — this element has zero rendered height, so a CSS bottom-full/
        // top-full toggle has no effect on that math. Shift the trigger's own top instead.
        <div
          className="absolute left-0 z-50"
          style={openUpward ? { top: -CALENDAR_HEIGHT_PX } : { top: "100%" }}
        >
          <NepaliDatePicker
            open={true}
            showclear={false}
            className="draft-date-picker"
            value={isValidBsDate(text) ? text : undefined}
            onChange={(d) => {
              if (d instanceof NepaliDate) {
                const val = `${d.getFullYear()}-${String((d.getMonth() as number) + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                setText(val);
                onChange(val);
              }
              setCalendarOpen(false);
            }}
            lang="en"
          />
        </div>
      )}
    </div>
  );
}
