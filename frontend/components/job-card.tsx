"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Job } from "@/lib/api";

function formatExperience(job: Job): string | null {
  const { min_years_experience: min, max_years_experience: max } = job;
  if (min != null && max != null) return `${min}–${max} yrs`;
  if (min != null) return `${min}+ yrs`;
  if (max != null) return `Up to ${max} yrs`;
  return null;
}

function formatPostedAt(postedAt: string | null): string | null {
  if (!postedAt) return null;
  return new Date(postedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

export function JobCard({ job }: { job: Job }) {
  const [isSaved, setIsSaved] = useState(false);

  const postedAt = formatPostedAt(job.posted_at);
  const experience = formatExperience(job);

  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">{job.company}</h2>
            <p className="text-sm text-neutral-500">{job.title}</p>
          </div>
          {postedAt && (
            <span className="shrink-0 text-xs text-neutral-400">{postedAt}</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge>{job.location ?? "Location N/A"}</Badge>
          {job.level && <Badge>{job.level}</Badge>}
          {experience && <Badge>{experience}</Badge>}
          {job.education && <Badge>{job.education}</Badge>}
          {job.employment_type && <Badge>{job.employment_type}</Badge>}
        </div>

        <div className="flex flex-col gap-1">
          <p className="line-clamp-5 whitespace-pre-line text-sm text-neutral-600">
            {job.description ?? "No description provided."}
          </p>
          <button
            type="button"
            className="self-start text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:underline"
          >
            更多
          </button>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
        >
          Apply
        </a>
        <button
          type="button"
          aria-label={isSaved ? "Unsave job" : "Save job"}
          aria-pressed={isSaved}
          onClick={() => setIsSaved((prev) => !prev)}
          className="inline-flex shrink-0 items-center justify-center rounded-md border border-neutral-300 p-2 text-neutral-500 transition-colors hover:bg-neutral-50"
        >
          <span className={isSaved ? "text-neutral-900" : undefined}>
            <BookmarkIcon filled={isSaved} />
          </span>
        </button>
      </div>
    </Card>
  );
}
