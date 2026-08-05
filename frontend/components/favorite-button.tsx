"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5-6 3.5V4.5Z"
      />
    </svg>
  );
}

export function FavoriteButton({ jobId, className }: { jobId: number; className?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorited, toggle } = useFavorites();
  const saved = isFavorited(jobId);

  function handleClick() {
    if (!user) {
      router.push("/login");
      return;
    }
    void toggle(jobId);
  }

  return (
    <button
      type="button"
      aria-label={saved ? "Unsave job" : "Save job"}
      aria-pressed={saved}
      onClick={handleClick}
      className={
        className ??
        "inline-flex shrink-0 items-center justify-center rounded-md border border-neutral-300 p-2 text-neutral-500 transition-colors hover:bg-neutral-50"
      }
    >
      <span className={saved ? "text-neutral-900" : undefined}>
        <BookmarkIcon filled={saved} />
      </span>
    </button>
  );
}
