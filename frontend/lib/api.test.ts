import { describe, expect, it } from "vitest";

import {
  filtersFromSearchParams,
  filtersToSearchParams,
  pageFromSearchParams,
  type JobFilters,
} from "./api";

describe("job list URL state", () => {
  it("round-trips all supported filters through the query string", () => {
    const filters: JobFilters = {
      title: "Backend Engineer",
      company: "Acme",
      location: "Remote",
      level: "Senior",
      education: "Bachelor's",
      minYears: "5",
      minSalary: "180000",
      visaType: "H1B",
      postedAfter: "2026-09-01",
    };

    const query = filtersToSearchParams(filters);

    expect(filtersFromSearchParams(query)).toEqual(filters);
  });

  it("restores filters and page as browser history changes the URL", () => {
    const historyEntries = [
      new URLSearchParams("title=engineer&company=Acme&page=3"),
      new URLSearchParams("location=Remote"),
      new URLSearchParams("title=engineer&company=Acme&page=3"),
    ];

    expect(historyEntries.map(filtersFromSearchParams)).toEqual([
      { title: "engineer", company: "Acme", location: undefined, level: undefined, education: undefined, minYears: undefined, minSalary: undefined, visaType: undefined, postedAfter: undefined },
      { title: undefined, company: undefined, location: "Remote", level: undefined, education: undefined, minYears: undefined, minSalary: undefined, visaType: undefined, postedAfter: undefined },
      { title: "engineer", company: "Acme", location: undefined, level: undefined, education: undefined, minYears: undefined, minSalary: undefined, visaType: undefined, postedAfter: undefined },
    ]);
    expect(historyEntries.map(pageFromSearchParams)).toEqual([3, 1, 3]);
  });

  it("uses the first page for missing or invalid page values", () => {
    expect(pageFromSearchParams(new URLSearchParams())).toBe(1);
    expect(pageFromSearchParams(new URLSearchParams("page=0"))).toBe(1);
    expect(pageFromSearchParams(new URLSearchParams("page=invalid"))).toBe(1);
  });
});
