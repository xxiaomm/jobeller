"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { FavoriteButton } from "@/components/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ApiError, fetchJob, type Job } from "@/lib/api";
import { formatExperience, formatPostedAt, formatSalary } from "@/lib/job-format";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchJob(id)
      .then((data) => {
        if (!cancelled) setJob(data);
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
  }, [id]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline">
        ← Back to jobs
      </Link>

      {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoading && !error && job && <JobDetail job={job} />}
    </main>
  );
}

function JobDetail({ job }: { job: Job }) {
  const postedAt = formatPostedAt(job.posted_at);
  const experience = formatExperience(job);
  const salary = formatSalary(job);

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{job.title}</h1>
          <p className="text-sm text-neutral-500">{job.company}</p>
        </div>
        {postedAt && <span className="shrink-0 text-xs text-neutral-400">Posted {postedAt}</span>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge>{job.location ?? "Location N/A"}</Badge>
        {job.level && <Badge>{job.level}</Badge>}
        {experience && <Badge>{experience}</Badge>}
        {job.education && <Badge>{job.education}</Badge>}
        {job.employment_type && <Badge>{job.employment_type}</Badge>}
        {job.visa_type && <Badge>{job.visa_type}</Badge>}
        {salary && <Badge>{salary}</Badge>}
      </div>

      <p className="whitespace-pre-line text-sm text-neutral-600">
        {job.description ?? "No description provided."}
      </p>

      <div className="flex items-center gap-2 sm:self-start">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 sm:flex-none"
        >
          Apply on company site
        </a>
        <FavoriteButton jobId={job.id} />
      </div>
    </Card>
  );
}
