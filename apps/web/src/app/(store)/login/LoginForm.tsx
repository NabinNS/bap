"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { apiFetch, saveToken } from "@/lib/api";
import PasswordInput from "./PasswordInput";

interface LoginResponse {
  token: string;
  user: { id: number; name: string; email: string };
}

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);

    try {
      const data = await apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: (form.get("email") as string).trim(),
          password: form.get("password"),
        }),
      });

      saveToken(data.token);
      const next = new URLSearchParams(window.location.search).get("next") ?? "/";
      router.push(next);
    } catch (err: unknown) {
      const e = err as Record<string, any>;
      const msg =
        e?.errors?.email?.[0] ??
        e?.message ??
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col mt-10" onSubmit={handleSubmit} noValidate>
      {/* Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-bold text-slate-700 tracking-wide">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={1.8} />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-bold text-slate-700 tracking-wide">
            Password
          </label>
          <PasswordInput />
        </div>

        <div className="flex items-center justify-between pt-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 accent-primary cursor-pointer" />
            <span>Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 cursor-pointer mt-8 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      {/* Error — shown below button per standard UX */}
      {error && (
        <p className="mt-3 text-sm text-red-500 font-medium">{error}</p>
      )}
    </form>
  );
}
