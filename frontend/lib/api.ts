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
  url: string;
  description: string | null;
  posted_at: string | null;
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

export async function fetchJobs(params: { page: number; pageSize: number }): Promise<JobList> {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  const response = await apiFetch(`/api/jobs?${query}`);
  return response.json();
}
