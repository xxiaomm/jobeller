"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { JobCard } from "@/components/job-card";
import { JobFilters } from "@/components/job-filters";
import { Pagination } from "@/components/pagination";
import {
  ApiError,
  fetchJobs,
  filtersFromSearchParams,
  filtersToSearchParams,
  JobFilters as JobFiltersType,
  JobList,
  pageFromSearchParams,
} from "@/lib/api";

const PAGE_SIZE = 20;

function HomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.toString();
  const appliedFilters = useMemo(
    () => filtersFromSearchParams(new URLSearchParams(urlQuery)),
    [urlQuery],
  );
  const page = useMemo(
    () => pageFromSearchParams(new URLSearchParams(urlQuery)),
    [urlQuery],
  );
  const requestKey = `${page}:${filtersToSearchParams(appliedFilters).toString()}`;
  const [result, setResult] = useState<{
    key: string;
    data?: JobList;
    error?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchJobs({ page, pageSize: PAGE_SIZE, filters: appliedFilters })
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, data });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            error: err instanceof ApiError ? err.message : "Something went wrong",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, requestKey, appliedFilters]);

  const handleApply = (filters: JobFiltersType) => {
    const query = filtersToSearchParams(filters).toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handlePageChange = (nextPage: number) => {
    const query = filtersToSearchParams(appliedFilters);
    if (nextPage > 1) query.set("page", String(nextPage));
    const queryString = query.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const currentResult = result?.key === requestKey ? result : null;
  const jobList = currentResult?.data ?? null;
  const error = currentResult?.error ?? null;
  const isLoading = currentResult === null;

  const totalPages = jobList ? Math.max(1, Math.ceil(jobList.total / jobList.page_size)) : 1;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-lg font-semibold text-neutral-900">Job openings</h1>

      <div className="sticky top-0 z-10 bg-white pb-2">
        <JobFilters
          key={filtersToSearchParams(appliedFilters).toString()}
          initialFilters={appliedFilters}
          onApply={handleApply}
        />
      </div>

      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoading && !error && jobList?.items.length === 0 && (
        <p className="text-sm text-neutral-500">No jobs match right now.</p>
      )}

      {!isLoading && !error && jobList && jobList.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobList.items.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {jobList && (
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
