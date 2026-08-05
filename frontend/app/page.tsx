"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { JobCard } from "@/components/job-card";
import { JobFilters } from "@/components/job-filters";
import { Pagination } from "@/components/pagination";
import {
  ApiError,
  fetchJobs,
  filtersToSearchParams,
  JobFilters as JobFiltersType,
  JobList,
} from "@/lib/api";

const PAGE_SIZE = 20;

function filtersFromSearchParams(searchParams: URLSearchParams): JobFiltersType {
  return {
    title: searchParams.get("title") ?? undefined,
    company: searchParams.get("company") ?? undefined,
    location: searchParams.get("location") ?? undefined,
    level: searchParams.get("level") ?? undefined,
    education: searchParams.get("education") ?? undefined,
    minYears: searchParams.get("min_years") ?? undefined,
    minSalary: searchParams.get("min_salary") ?? undefined,
    visaType: searchParams.get("visa_type") ?? undefined,
    postedAfter: searchParams.get("posted_after") ?? undefined,
  };
}

function HomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(1);
  const [appliedFilters, setAppliedFilters] = useState<JobFiltersType>(() =>
    filtersFromSearchParams(searchParams),
  );
  const [jobList, setJobList] = useState<JobList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchJobs({ page, pageSize: PAGE_SIZE, filters: appliedFilters })
      .then((data) => {
        if (!cancelled) setJobList(data);
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
  }, [page, appliedFilters]);

  const handleApply = (filters: JobFiltersType) => {
    setAppliedFilters(filters);
    setPage(1);
    router.push(`${pathname}?${filtersToSearchParams(filters)}`);
  };

  const totalPages = jobList ? Math.max(1, Math.ceil(jobList.total / jobList.page_size)) : 1;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-lg font-semibold text-neutral-900">Job openings</h1>

      <div className="sticky top-0 z-10 bg-white pb-2">
        <JobFilters initialFilters={appliedFilters} onApply={handleApply} />
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
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
