"use client";

import { cn } from "cn";

import { ProspectSelectMenu } from "./ProspectSelectMenu";
import { QUARTER_OPTIONS, type Period } from "@/lib/period";

/**
 * Year dropdown plus a quarter segmented control. Rendered inside the filter popup
 * of the prospects table, pipeline board and donors table.
 */
export function PeriodFilter({
  value,
  years,
  onChange,
  dateLabel = "date added",
}: {
  value: Period;
  years: string[];
  onChange: (next: Period) => void;
  dateLabel?: string;
}) {
  const yearOptions = [
    { label: "All years", value: "all" },
    ...years.map((y) => ({ label: y, value: y })),
  ];

  return (
    <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-x-5">
      <div>
        <label className="mb-1.5 block text-[0.6875rem] font-medium text-[#5c5757]">
          Year ({dateLabel})
        </label>
        <ProspectSelectMenu
          value={value.year}
          onChange={(year) => onChange({ ...value, year })}
          options={yearOptions}
        />
      </div>

      <div>
        <span
          id="period-quarter-label"
          className="mb-1.5 block text-[0.6875rem] font-medium text-[#5c5757]"
        >
          Quarter
        </span>
        <div
          role="radiogroup"
          aria-labelledby="period-quarter-label"
          className="flex h-9 rounded-button border border-border-strong bg-white p-0.5"
        >
          {QUARTER_OPTIONS.map((option) => {
            const active = value.quarter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                title={"hint" in option ? option.hint : "All quarters"}
                onClick={() => onChange({ ...value, quarter: option.value })}
                className={cn(
                  "flex-1 rounded-[4px] text-[0.75rem] font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-text-primary text-white"
                    : "text-text-secondary hover:bg-surface-soft-hover",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
