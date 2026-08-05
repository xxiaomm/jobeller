const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

export class ApiError extends Error {}

export type Job = {
  id: number;
  company: string;
  title: string;
  level: string | null;
  location: string | null;
  min_years_experience: number | null;
  max_years_experience: number | null;
  education: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  visa_type: string | null;
  url: string;
  description: string | null;
  posted_at: string | null;
};

export type JobFilters = {
  title?: string;
  company?: string;
  location?: string;
  level?: string;
  education?: string;
  minYears?: string;
  minSalary?: string;
  visaType?: string;
  postedAfter?: string;
};

export type JobList = {
  total: number;
  page: number;
  page_size: number;
  items: Job[];
};

export async function apiFetch(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<Response> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.detail ?? `Request failed with status ${response.status}`);
  }

  return response;
}

export function googleLoginUrl(): string {
  return `${API_URL}/api/auth/google/login`;
}

const FILTER_PARAM_NAMES: Record<keyof JobFilters, string> = {
  title: "title",
  company: "company",
  location: "location",
  level: "level",
  education: "education",
  minYears: "min_years",
  minSalary: "min_salary",
  visaType: "visa_type",
  postedAfter: "posted_after",
};

export function filtersToSearchParams(filters: JobFilters): URLSearchParams {
  const query = new URLSearchParams();
  for (const key of Object.keys(FILTER_PARAM_NAMES) as (keyof JobFilters)[]) {
    const value = filters[key];
    if (value) query.set(FILTER_PARAM_NAMES[key], value);
  }
  return query;
}

export async function fetchJobs(params: {
  page: number;
  pageSize: number;
  filters?: JobFilters;
}): Promise<JobList> {
  const query = filtersToSearchParams(params.filters ?? {});
  query.set("page", String(params.page));
  query.set("page_size", String(params.pageSize));
  const response = await apiFetch(`/api/jobs?${query}`);
  return response.json();
}

export async function fetchJob(id: string | number): Promise<Job> {
  const response = await apiFetch(`/api/jobs/${id}`);
  return response.json();
}
