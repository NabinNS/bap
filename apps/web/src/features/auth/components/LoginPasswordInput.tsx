"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function PasswordInput() {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock
        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-[#94A3B8]"
        strokeWidth={1.8}
      />
      <input
        id="password"
        name="password"
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        required
        placeholder="Enter your password"
        className="w-full rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E293B] transition-colors"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4.5 w-4.5" strokeWidth={1.8} /> : <Eye className="h-4.5 w-4.5" strokeWidth={1.8} />}
      </button>
    </div>
  );
}
