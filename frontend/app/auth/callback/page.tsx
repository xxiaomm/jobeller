"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth-context";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("access_token");

    if (accessToken) {
      login(accessToken);
    }
    router.replace("/");
  }, [login, router]);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <p className="text-sm text-neutral-500">Signing you in…</p>
    </main>
  );
}
