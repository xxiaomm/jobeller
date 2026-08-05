import type { Job } from "@/lib/api";

export function formatExperience(job: Job): string | null {
  const { min_years_experience: min, max_years_experience: max } = job;
  if (min != null && max != null) return `${min}–${max} yrs`;
  if (min != null) return `${min}+ yrs`;
  if (max != null) return `Up to ${max} yrs`;
  return null;
}

export function formatPostedAt(postedAt: string | null): string | null {
  if (!postedAt) return null;
  return new Date(postedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatSalary(job: Job): string | null {
  const { salary_min: min, salary_max: max } = job;
  const fmt = (value: number) => `$${Math.round(value / 1000)}k`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `${fmt(min)}+`;
  if (max != null) return `Up to ${fmt(max)}`;
  return null;
}
