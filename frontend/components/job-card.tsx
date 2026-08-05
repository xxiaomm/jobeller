"use client";

import Link from "next/link";

import { FavoriteButton } from "@/components/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Job } from "@/lib/api";
import { formatExperience, formatPostedAt } from "@/lib/job-format";

export function JobCard({ job }: { job: Job }) {
  const postedAt = formatPostedAt(job.posted_at);
  const experience = formatExperience(job);

  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/jobs/${job.id}`} className="group">
            <h2 className="text-base font-semibold text-neutral-900 group-hover:underline">
              {job.company}
            </h2>
            <p className="text-sm text-neutral-500">{job.title}</p>
          </Link>
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
          <Link
            href={`/jobs/${job.id}`}
            className="self-start text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:underline"
          >
            More
          </Link>
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
        <FavoriteButton jobId={job.id} />
      </div>
    </Card>
  );
}
