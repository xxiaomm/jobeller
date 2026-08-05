"use client";

import Link from "next/link";

import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
      <Link href="/" className="text-sm font-semibold text-neutral-900">
        Jobell
      </Link>

      {!isLoading && (
        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/favorites" className="text-neutral-500 hover:text-neutral-900">
                Favorites
              </Link>
              <span className="text-neutral-500">{user.full_name ?? user.email}</span>
              <button
                type="button"
                onClick={logout}
                className="font-medium text-neutral-900 hover:underline"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-500 hover:text-neutral-900">
                Log in
              </Link>
              <Link href="/signup" className="font-medium text-neutral-900 hover:underline">
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
