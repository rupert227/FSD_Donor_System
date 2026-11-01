"use client";

import { AppShell } from "@/components/AppShell";
import { SAMPLE_LEADS } from "@/lib/mock-data/leads";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { navbarPreset } from "../struct";

const pageName = "Reports";
const BAR_BLUE = "#2d5f8f";

type SelectOption = {
  value: string;
  label: string;
};

function formatCurrency(value: number | null | undefined): string {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
    return "—";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatPercent(value: number | null | undefined): string {
  if (!Number.isFinite(Number(value))) {
    return "—";
  }

  return `${Number(value).toFixed(1)}%`;
}

function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getQuarterFromDate(dateValue: string | null | undefined): number {
  if (!dateValue) return 0;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 0;

  return Math.floor(parsed.getMonth() / 3);
}

function getFiscalYearFromDate(dateValue: string | null | undefined): number {
  if (!dateValue) return 0;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 0;

  return parsed.getFullYear();
}

function Dropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-w-[180px] items-center justify-between gap-3 rounded-[6px] border border-[var(--border-soft)] bg-white px-3 py-2 text-left text-[13px] text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)]"
      >
        <span className="truncate">{value || label}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-20 min-w-[180px] overflow-hidden rounded-[6px] border border-[var(--border-soft)] bg-white shadow-lg">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={[
                  "flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left text-sm",
                  isSelected
                    ? "bg-[var(--brand-100)] text-[var(--brand-primary)]"
                    : "text-[var(--text-primary)] hover:bg-[var(--surface-soft)]",
                ].join(" ")}>
                <span className="max-w-[150px] truncate">{option.label}</span>
                {isSelected && <Check className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  navbarPreset.selectedTabIndex = 2;

  const allLeads = useMemo(
    () =>
      Array.isArray(SAMPLE_LEADS)
        ? SAMPLE_LEADS.filter(
            (lead) => lead && typeof lead === "object" && lead.prospect_name,
          )
        : [],
    [],
  );

  const [fiscalYear, setFiscalYear] = useState("FY 2026");
  const [donorType, setDonorType] = useState("All types");
  const [pipelineStage, setPipelineStage] = useState("All stages");

  const fiscalYearOptions = useMemo<SelectOption[]>(() => {
    const years = Array.from(
      new Set(
        allLeads
          .map((lead) => getFiscalYearFromDate(lead.target_followup_date))
          .filter((year) => year > 0),
      ),
    ).sort((a, b) => b - a);

    return [
      { value: "FY 2026", label: "FY 2026" },
      ...years
        .filter((year) => year !== 2026)
        .map((year) => ({ value: `FY ${year}`, label: `FY ${year}` })),
    ].filter(
      (option, index, list) =>
        list.findIndex((item) => item.value === option.value) === index,
    );
  }, [allLeads]);

  const donorTypeOptions = useMemo<SelectOption[]>(() => {
    const unique = Array.from(new Set(allLeads.map((lead) => lead.donor_type)));

    return [
      { value: "All types", label: "All types" },
      ...unique.map((item) => ({ value: item, label: item })),
    ];
  }, [allLeads]);

  const stageOptions = useMemo<SelectOption[]>(() => {
    const unique = Array.from(
      new Set(allLeads.map((lead) => lead.pipeline_status)),
    );

    return [
      { value: "All stages", label: "All stages" },
      ...unique.map((item) => ({ value: item, label: item })),
    ];
  }, [allLeads]);

  const selectedFiscalYear = Number((fiscalYear || "FY 2026").replace(/[^0-9]/g, "")) || 2026;

  const filteredLeads = useMemo(() => {
    return allLeads.filter((lead) => {
      const yearMatch =
        !fiscalYear ||
        fiscalYear === "All years" ||
        getFiscalYearFromDate(lead.target_followup_date) === selectedFiscalYear;
      const donorTypeMatch =
        donorType === "All types" || lead.donor_type === donorType;
      const stageMatch =
        pipelineStage === "All stages" || lead.pipeline_status === pipelineStage;
      return yearMatch && donorTypeMatch && stageMatch;
    });
  }, [allLeads, donorType, fiscalYear, pipelineStage, selectedFiscalYear]);

  const totalPipelineValue = filteredLeads.reduce(
    (sum, lead) => sum + toSafeNumber(lead.target_amount),
    0,
  );

  const weightedForecast = filteredLeads.reduce((sum, lead) => {
    const amount = toSafeNumber(lead.target_amount);
    const probability = Number(lead.probability) || 0;
    return sum + amount * (probability / 100);
  }, 0);

  const averageProbability = filteredLeads.length
    ? filteredLeads.reduce((sum, lead) => {
        const probability = Number(lead.probability) || 0;
        return sum + probability;
      }, 0) / filteredLeads.length
    : 0;

  const leadConversionRate = filteredLeads.length
    ? (filteredLeads.filter((lead) => {
        const status = String(lead.pipeline_status || "").trim().toLowerCase();
        return status === "proposal sent" || status === "secured donor";
      }).length /
        filteredLeads.length) *
      100
    : 0;

  const leadSourceCounts = useMemo(() => {
    const map = new Map<string, number>();

    filteredLeads.forEach((lead) => {
      const source = String(lead.lead_source || "Unknown").trim();
      if (!source) return;
      map.set(source, (map.get(source) ?? 0) + 1);
    });

    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return entries.length ? entries : [["No data", 0]];
  }, [filteredLeads]);

  const pipelineStageCounts = useMemo(() => {
    const map = new Map<string, number>();

    filteredLeads.forEach((lead) => {
      const stage = String(lead.pipeline_status || "Unknown").trim();
      if (!stage) return;
      map.set(stage, (map.get(stage) ?? 0) + 1);
    });

    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return entries.length ? entries : [["No data", 0]];
  }, [filteredLeads]);

  const newLeadIntake = useMemo(() => {
    const defaultQuarterValues = [0, 0, 0, 0];

    if (!filteredLeads.length) {
      return defaultQuarterValues;
    }

    const quarterValues = [...defaultQuarterValues];

    filteredLeads.forEach((lead, index) => {
      const targetYear = getFiscalYearFromDate(lead.target_followup_date);
      const inSelectedYear =
        selectedFiscalYear === 0 || targetYear === selectedFiscalYear;

      if (!inSelectedYear) return;

      const dateQuarter = getQuarterFromDate(lead.target_followup_date);
      const bucket = dateQuarter >= 0 && dateQuarter <= 3 ? dateQuarter : index % 4;
      quarterValues[bucket] += 1;
    });

    return quarterValues;
  }, [filteredLeads, selectedFiscalYear]);

  const barMaxSource = Math.max(
    ...leadSourceCounts.map(([, count]) => Number(count) || 0),
    1,
  );
  const barMaxStage = Math.max(
    ...pipelineStageCounts.map(([, count]) => Number(count) || 0),
    1,
  );

  const intakeMax = Math.max(...newLeadIntake, 1);

  return (
    <AppShell navbarPreset={navbarPreset}>
      <div className="min-w-[1100px] pb-4">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-[var(--border-soft)] bg-[var(--surface-soft)] text-[var(--brand-primary)]">
                <span className="text-[11px] font-semibold">RP</span>
              </div>
              <div className="leading-tight">
                <div className="text-[12px] text-[var(--text-secondary)]">
                  Reports / Lead pipeline report
                </div>
                <div className="text-[32px] font-bold tracking-tight text-[var(--text-primary)]">
                  Lead pipeline report
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[6px] border border-[var(--border-soft)] bg-[var(--surface-soft)] px-3 py-2 text-[12px] font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-soft-hover)]"
              >
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-[var(--text-secondary)] bg-white" />
                Preview PDF
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-[6px] border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-3 py-2 text-[12px] font-medium text-white transition hover:opacity-90"
              >
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-white bg-[var(--brand-primary)]" />
                Download PDF
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 px-1">
            <div className="min-w-[170px]">
              <label className="mb-1 block text-[12px] font-medium text-[var(--text-secondary)]">
                Fiscal year
              </label>
              <Dropdown
                label="Fiscal year"
                value={fiscalYear}
                onChange={setFiscalYear}
                options={fiscalYearOptions}
              />
            </div>

            <div className="min-w-[170px]">
              <label className="mb-1 block text-[12px] font-medium text-[var(--text-secondary)]">
                Donor type
              </label>
              <Dropdown
                label="Donor type"
                value={donorType}
                onChange={setDonorType}
                options={donorTypeOptions}
              />
            </div>

            <div className="min-w-[170px]">
              <label className="mb-1 block text-[12px] font-medium text-[var(--text-secondary)]">
                Pipeline stage
              </label>
              <Dropdown
                label="Pipeline stage"
                value={pipelineStage}
                onChange={setPipelineStage}
                options={stageOptions}
              />
            </div>

            <div className="ml-auto flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFiscalYear("FY 2026");
                  setDonorType("All types");
                  setPipelineStage("All stages");
                }}
                className="rounded-[6px] border border-[var(--border-soft)] bg-white px-3 py-2 text-[12px] font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)]"
              >
                Reset filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-white)] p-4 shadow-[var(--shadow-soft)]">
              <div className="text-[12px] text-[var(--text-secondary)]">Weighted forecast</div>
              <div className="mt-2 text-[24px] font-semibold leading-tight text-[var(--text-primary)]">
                {formatCurrency(weightedForecast)}
              </div>
              <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                {filteredLeads.length ? "Probability-adjusted pipeline" : "No viable data"}
              </div>
            </div>

            <div className="rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-white)] p-4 shadow-[var(--shadow-soft)]">
              <div className="text-[12px] text-[var(--text-secondary)]">Lead conversion rate</div>
              <div className="mt-2 text-[24px] font-semibold leading-tight text-[var(--text-primary)]">
                {formatPercent(leadConversionRate)}
              </div>
              <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                {filteredLeads.length ? "Proposal sent + secured" : "Awaiting lead data"}
              </div>
            </div>

            <div className="rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-white)] p-4 shadow-[var(--shadow-soft)]">
              <div className="text-[12px] text-[var(--text-secondary)]">Total pipeline value</div>
              <div className="mt-2 text-[24px] font-semibold leading-tight text-[var(--text-primary)]">
                {formatCurrency(totalPipelineValue)}
              </div>
              <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                {filteredLeads.length ? `${filteredLeads.length} active leads` : "No leads found"}
              </div>
            </div>

            <div className="rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-white)] p-4 shadow-[var(--shadow-soft)]">
              <div className="text-[12px] text-[var(--text-secondary)]">Average probability</div>
              <div className="mt-2 text-[24px] font-semibold leading-tight text-[var(--text-primary)]">
                {formatPercent(averageProbability)}
              </div>
              <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                {filteredLeads.length ? "Average of all valid leads" : "No probability data"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-white)] p-4 shadow-[var(--shadow-soft)]">
              <div className="mb-3 text-[14px] font-semibold text-[var(--text-primary)]">
                Where leads come from
              </div>
              <div className="space-y-3">
                {leadSourceCounts.map(([source, count]) => {
                  const numericCount = Number(count) || 0;
                  const barWidth = (numericCount / barMaxSource) * 100;

                  return (
                    <div key={source} className="flex items-center gap-3 text-[12px] text-[var(--text-secondary)]">
                      <span className="w-20 min-w-[80px] truncate">{source}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${barWidth}%`, backgroundColor: BAR_BLUE }}
                        />
                      </div>
                      <span className="w-6 text-right text-[var(--text-primary)]">{numericCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-white)] p-4 shadow-[var(--shadow-soft)]">
              <div className="mb-3 text-[14px] font-semibold text-[var(--text-primary)]">
                Leads by pipeline stage
              </div>
              <div className="space-y-3">
                {pipelineStageCounts.map(([stage, count]) => {
                  const numericCount = Number(count) || 0;
                  const barWidth = (numericCount / barMaxStage) * 100;

                  return (
                    <div key={stage} className="flex items-center gap-3 text-[12px] text-[var(--text-secondary)]">
                      <span className="w-24 min-w-[90px] truncate">{stage}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${barWidth}%`, backgroundColor: BAR_BLUE }}
                        />
                      </div>
                      <span className="w-6 text-right text-[var(--text-primary)]">{numericCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-white)] p-4 shadow-[var(--shadow-soft)]">
              <div className="mb-3 text-[14px] font-semibold text-[var(--text-primary)]">
                New-lead intake
              </div>
              <div className="flex h-[190px] items-end gap-3 pt-4">
                {newLeadIntake.map((count, index) => {
                  const barHeight = count > 0 ? (count / intakeMax) * 100 : 0;
                  return (
                    <div key={`${index}-bar`} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <span className="text-[11px] font-medium text-[var(--text-primary)]">{count}</span>
                      <div
                        className="w-full rounded-t-[8px]"
                        style={{
                          backgroundColor: BAR_BLUE,
                          height: `${Math.max(barHeight, count > 0 ? 18 : 0)}%`,
                          minHeight: count > 0 ? 18 : 0,
                        }}
                      />
                      <span className="text-[11px] text-[var(--text-secondary)]">Q{index + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface-white)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-4 py-3">
              <div className="text-[14px] font-semibold text-[var(--text-primary)]">
                Quarterly summary
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">Same layout as the PDF report</div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse text-left text-[12px]">
                <thead>
                  <tr className="bg-[var(--surface-soft)] text-[var(--text-secondary)]">
                    <th className="px-3 py-3 font-medium">Metric</th>
                    {Array.from({ length: 4 }, (_, index) => (
                      <th key={`q-${index}`} className="px-3 py-3 font-medium text-center">
                        Q{index + 1}
                      </th>
                    ))}
                    <th className="px-3 py-3 font-medium text-center">FY {selectedFiscalYear || 2026}</th>
                  </tr>
                </thead>

                <tbody>
                  {([
                    { label: "Pipeline value (₱)", values: [0,0,0,0], type: "currency" },
                    { label: "Total estimated value", values: [0,0,0,0], type: "currency" },
                    { label: "Probabilistic-adjusted value", values: [0,0,0,0], type: "currency" },
                    { label: "Secured value", values: [0,0,0,0], type: "currency" },
                    { label: "Unsecured balance", values: [0,0,0,0], type: "currency" },
                    { label: "Lead conversion rate", values: [0,0,0,0], type: "percent" },
                    { label: "Value realization rate", values: [0,0,0,0], type: "percent" },
                    { label: "Lead origin", values: [0,0,0,0], type: "count" },
                    { label: "Total leads", values: [0,0,0,0], type: "count" },
                  ]).map((row) => (
                    <tr key={row.label} className="border-t border-[var(--border-soft)] text-[var(--text-primary)]">
                      <td className="px-3 py-3 font-medium text-[var(--text-primary)]">{row.label}</td>
                      {row.values.map((value, index) => (
                        <td key={`${row.label}-${index}`} className="px-3 py-3 text-center text-[var(--text-primary)]">
                          {row.type === "currency"
                            ? formatCurrency(value)
                            : row.type === "percent"
                              ? formatPercent(value)
                              : value}
                        </td>
                      ))}
                      <td className="px-3 py-3 text-center text-[var(--text-primary)]">
                        {row.type === "currency"
                          ? formatCurrency(row.values.reduce((sum, current) => sum + current, 0))
                          : row.type === "percent"
                            ? formatPercent(
                                row.values.reduce((sum, current) => sum + current, 0) /
                                  Math.max(row.values.length, 1),
                              )
                            : row.values.reduce((sum, current) => sum + current, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
