"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.push("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  const memberSince = new Date(user.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-lg font-semibold text-neutral-900">Profile</h1>

      <Card className="flex flex-col gap-4">
        <Field label="Name" value={user.full_name ?? "—"} />
        <Field label="Email" value={user.email} />
        <Field label="Sign-in method" value={user.auth_provider === "google" ? "Google" : "Email & password"} />
        <Field label="Member since" value={memberSince} />

        <button
          type="button"
          onClick={logout}
          className="mt-2 self-start rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
        >
          Log out
        </button>
      </Card>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-neutral-400">{label}</span>
      <span className="text-sm text-neutral-900">{value}</span>
    </div>
  );
}
