"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { JobCard } from "@/components/job-card";
import { ApiError, fetchFavoriteJobs, type Job } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useFavorites } from "@/lib/favorites-context";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const { isFavorited } = useFavorites();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) {
      router.push("/login");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchFavoriteJobs(token)
      .then((data) => {
        if (!cancelled) setJobs(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Something went wrong");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, token, router]);

  const visibleJobs = jobs.filter((job) => isFavorited(job.id));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-lg font-semibold text-neutral-900">Favorites</h1>

      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoading && !error && visibleJobs.length === 0 && (
        <p className="text-sm text-neutral-500">No favorites yet.</p>
      )}

      {!isLoading && !error && visibleJobs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </main>
  );
}
