"use client";

import { useEffect, useState } from "react";
import { apiFetch, clearToken } from "@/lib/api";

interface User {
  id: number;
  name: string;
  email: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<User>("/auth/me")
      .then(setUser)
      .catch(() => {
        // Token invalid or expired — clear it
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
