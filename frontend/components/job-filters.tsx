"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { JobFilters } from "@/lib/api";

const VISA_OPTIONS = [
  { value: "", label: "Any" },
  { value: "H1B", label: "H1B" },
  { value: "OPT", label: "OPT" },
  { value: "Green Card", label: "Green Card" },
  { value: "Citizen", label: "Citizen" },
  { value: "TN", label: "TN" },
  { value: "O1", label: "O1" },
];

const EMPTY_FILTERS: JobFilters = {};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-[9rem] flex-1 flex-col gap-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function JobFilters({
  initialFilters,
  onApply,
}: {
  initialFilters: JobFilters;
  onApply: (filters: JobFilters) => void;
}) {
  const [draft, setDraft] = useState<JobFilters>(initialFilters);

  const set = (key: keyof JobFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDraft((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
    onApply(EMPTY_FILTERS);
  };

  return (
    <Card className="flex flex-wrap items-end gap-3">
      <Field label="Title">
        <Input value={draft.title ?? ""} onChange={set("title")} placeholder="e.g. Engineer" />
      </Field>
      <Field label="Company">
        <Input value={draft.company ?? ""} onChange={set("company")} placeholder="e.g. Airbnb" />
      </Field>
      <Field label="Location">
        <Input value={draft.location ?? ""} onChange={set("location")} placeholder="e.g. Remote" />
      </Field>
      <Field label="Level">
        <Input value={draft.level ?? ""} onChange={set("level")} placeholder="e.g. Senior" />
      </Field>
      <Field label="Education">
        <Input value={draft.education ?? ""} onChange={set("education")} placeholder="e.g. Bachelor's" />
      </Field>
      <Field label="Min. years exp.">
        <Input type="number" min={0} value={draft.minYears ?? ""} onChange={set("minYears")} />
      </Field>
      <Field label="Min. salary (USD)">
        <Input type="number" min={0} step={1000} value={draft.minSalary ?? ""} onChange={set("minSalary")} />
      </Field>
      <Field label="Visa type">
        <Select value={draft.visaType ?? ""} onChange={set("visaType")}>
          {VISA_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Posted after">
        <Input type="date" value={draft.postedAfter ?? ""} onChange={set("postedAfter")} />
      </Field>

      <div className="flex shrink-0 gap-2">
        <Button type="button" className="w-auto whitespace-nowrap" onClick={() => onApply(draft)}>
          Apply filters
        </Button>
        <Button type="button" variant="outline" className="w-auto whitespace-nowrap" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </Card>
  );
}
