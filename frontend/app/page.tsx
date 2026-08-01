"use client";

import { useEffect, useState } from "react";

import { JobCard } from "@/components/job-card";
import { Pagination } from "@/components/pagination";
import { ApiError, fetchJobs, JobList } from "@/lib/api";

const PAGE_SIZE = 20;

export default function Home() {
  const [page, setPage] = useState(1);
  const [jobList, setJobList] = useState<JobList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchJobs({ page, pageSize: PAGE_SIZE })
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
  }, [page]);

  const totalPages = jobList ? Math.max(1, Math.ceil(jobList.total / jobList.page_size)) : 1;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-lg font-semibold text-neutral-900">Job openings</h1>

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
