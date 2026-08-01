"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user, isLoading, logout } = useAuth();

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="max-w-sm text-center">
        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : user ? (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-lg font-semibold text-neutral-900">
                Hello, {user.full_name ?? user.email}
              </p>
              <p className="text-sm text-neutral-500">{user.email}</p>
            </div>
            <Button variant="outline" onClick={logout}>
              Log out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-lg font-semibold text-neutral-900">Welcome to Jobeller</p>
            <Link href="/login">
              <Button>Log in</Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline">Sign up</Button>
            </Link>
          </div>
        )}
      </Card>
    </main>
  );
}
