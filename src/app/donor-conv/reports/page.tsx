"use client";

import { AppShell } from "@/components/AppShell";
import { DropdownList, type DropdownOption } from "@/components/prefabs";
import { LeadReport, emptyLeadReport } from "@/lib/types";

import { BarChart3, Download, Eye, RotateCcw } from "lucide-react";

import { cn } from "cn";
import { useEffect, useMemo, useState } from "react";
import { navbarPreset } from "@/app/donor-conv/struct";

import {
  formatCurrency,
  formatNumber,
  formatPercent,
  generateDropdownOptionValue,
  generateDropdownOptions,
} from "@/lib/utils";

type SummaryRow = {
  type: "header" | "row" | "section";
  label: string;
  values: number[];
};

export default function ReportsPage() {
  navbarPreset.selectedTabIndex = 2;

  const [reportContent, setReportContent] = useState<LeadReport | null>(null);

  const [fiscalYear, setFiscalYear] = useState<string>("");
  const [donorType, setDonorType] = useState<string>("");
  const [pipelineStage, setPipelineStage] = useState<string>("");

  const [graphBarColor, setGraphBarColor] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/lead-pipeline-report", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const content = (await response.json()) as LeadReport;
        setReportContent(content);

        setFiscalYear(
          generateDropdownOptionValue(content.fiscalYearOptions[0] ?? ""),
        );
        setDonorType(
          generateDropdownOptionValue(content.donorTypeOptions[0] ?? ""),
        );
        setPipelineStage(
          generateDropdownOptionValue(content.pipelineStageOptions[0] ?? ""),
        );
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setReportContent(emptyLeadReport);
      });

    return () => controller.abort();
  }, []);

  // doing this for now cuz it might be dynamic
  useEffect(() => {
    const graphBarColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--graph-bar-primary")
      .trim();

    setGraphBarColor(graphBarColor);
  }, []);

  const report = reportContent ?? emptyLeadReport;

  const fiscalYearOptions = useMemo<DropdownOption[]>(
    () => generateDropdownOptions(report.fiscalYearOptions),
    [report.fiscalYearOptions],
  );

  const donorTypeOptions = useMemo<DropdownOption[]>(
    () => generateDropdownOptions(report.donorTypeOptions),
    [report.donorTypeOptions],
  );

  const pipelineStageOptions = useMemo<DropdownOption[]>(
    () => generateDropdownOptions(report.pipelineStageOptions),
    [report.pipelineStageOptions],
  );

  const leadSourceCounts = useMemo(() => {
    const pairs = report.leadOrigins.flatMap((entry) => Object.entries(entry));
    return pairs.length ? pairs : [["No data", 0]];
  }, [report.leadOrigins]);

  const pipelineStageCounts = useMemo(() => {
    const pairs = report.pipelineStages.flatMap((entry) =>
      Object.entries(entry),
    );
    return pairs.length ? pairs : [["No data", 0]];
  }, [report.pipelineStages]);

  const newLeadIntake = report.quarterNewLeads.length
    ? report.quarterNewLeads
    : [0, 0, 0, 0];
  const intakeMax = Math.max(...newLeadIntake, 1);

  const barMaxSource = Math.max(
    ...leadSourceCounts.map(([, count]) => Number(count) || 0),
    1,
  );
  const barMaxStage = Math.max(
    ...pipelineStageCounts.map(([, count]) => Number(count) || 0),
    1,
  );

  const horizontalBarStyle = (count: number, max: number) => {
    const percentage = Math.max((count / max) * 100, count > 0 ? 8 : 0);
    return {
      width: `${Math.min(percentage, 100)}%`,
      maxWidth: "calc(100% - 38px)",
    };
  };

  const horizontalValueStyle = (count: number, max: number) => {
    const percentage = Math.max((count / max) * 100, count > 0 ? 8 : 0);

    if (percentage > 72) {
      return {
        left: `${Math.max(percentage - 18, 15)}%`,
      };
    }

    return {
      left: `${Math.min(percentage + 6, 94)}%`,
    };
  };

  const summaryRows: SummaryRow[] = [
    {
      type: "section",
      label: "Pipeline value (₱)",
      values: [0, 0, 0, 0, 0],
    },
    {
      type: "row",
      label: "Total estimated value",
      values: report.quarterlySummary.totalEstimatedValue,
    },
    {
      type: "row",
      label: "Probability-adjusted value",
      values: report.quarterlySummary.probabilityAdjustedValue,
    },
    {
      type: "row",
      label: "Secured value",
      values: report.quarterlySummary.securedValue,
    },
    {
      type: "row",
      label: "Unsecured balance",
      values: report.quarterlySummary.unsecuredBalance,
    },
    { type: "section", label: "Conversion", values: [0, 0, 0, 0, 0] },
    {
      type: "row",
      label: "Lead conversion rate",
      values: report.conversion.leadConversionRate,
    },
    {
      type: "row",
      label: "Value realization rate",
      values: report.conversion.valueRealizationRate,
    },
    { type: "section", label: "Leads Origin", values: [0, 0, 0, 0, 0] },
    {
      type: "row",
      label: "Referral",
      values: report.leadsOrigin.referral,
    },
    {
      type: "row",
      label: "Research",
      values: report.leadsOrigin.research,
    },
    {
      type: "row",
      label: "Booths",
      values: report.leadsOrigin.booths,
    },
    {
      type: "row",
      label: "Direct Call",
      values: report.leadsOrigin.directCall,
    },
    {
      type: "row",
      label: "Walk-in",
      values: report.leadsOrigin.walkIn,
    },
    {
      type: "row",
      label: "Total new leads",
      values: report.totalNewLeads,
    },
  ];

  const quarterHeaders = ["Q1", "Q2", "Q3", "Q4"];

  const renderSummaryValue = (row: SummaryRow, value: number): string => {
    if (row.type === "section") return "";

    if (
      row.label === "Lead conversion rate" ||
      row.label === "Value realization rate"
    ) {
      return formatPercent(value);
    }

    return formatNumber(value);
  };

  return (
    <AppShell navbarPreset={navbarPreset}>
      <div className="space-y-5">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-brand-primary h-10 w-10" />
            <div>
              <div className="text-text-primary text-[32px] leading-none font-bold tracking-tight">
                Lead Pipeline Report
              </div>
              <div className="text-text-secondary text-[14px] tracking-tight">
                Placeholder text for sum bullshi
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="border-border-soft bg-surface-soft text-text-primary hover:bg-surface-soft-hover inline-flex items-center gap-2 rounded-[6px] border bg-white px-3 py-2 text-[12px] font-medium"
            >
              <Eye className="h-5 w-5" />
              Preview PDF
            </button>
            <button
              type="button"
              className="border-brand-primary bg-brand-primary inline-flex items-center gap-2 rounded-[6px] border px-3 py-2 text-[12px] font-medium text-white hover:opacity-90"
            >
              <Download className="h-5 w-5" />
              Download PDF
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-text-secondary text-[12px] font-medium">
              Fiscal Year
            </label>
            <DropdownList
              label={fiscalYear}
              value={fiscalYear}
              onChange={setFiscalYear}
              options={fiscalYearOptions}
            />
          </div>

          <div>
            <label className="text-text-secondary text-[12px] font-medium">
              Donor Type
            </label>
            <DropdownList
              label={donorType}
              value={donorType}
              onChange={setDonorType}
              options={donorTypeOptions}
            />
          </div>

          <div>
            <label className="text-text-secondary text-[12px] font-medium">
              Pipeline Stage
            </label>
            <DropdownList
              label={pipelineStage}
              value={pipelineStage}
              onChange={setPipelineStage}
              options={pipelineStageOptions}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setFiscalYear(fiscalYearOptions[0].value);
              setDonorType(donorTypeOptions[0].value);
              setPipelineStage(pipelineStageOptions[0].value);
            }}
            className="border-border-soft text-text-primary hover:bg-surface-soft flex h-9 items-center gap-1 rounded-[6px] border px-3 py-2 text-[13px]"
          >
            <RotateCcw className="text-text-secondary h-4 w-4 shrink-0" />
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="border-border-soft bg-surface-white rounded-[10px] border p-4 shadow-sm">
            <div className="text-text-secondary text-[14px] font-medium">
              Weighted forecast
            </div>
            <div className="text-text-primary mt-1 text-[26px] font-semibold">
              {formatCurrency(report.weightedForecast)}
            </div>
            <div className="text-text-secondary text-[11px]">
              Probability-adjusted pipeline
            </div>
          </div>

          <div className="border-border-soft bg-surface-white rounded-[10px] border p-4 shadow-sm">
            <div className="text-text-secondary text-[14px] font-medium">
              Lead conversion rate
            </div>
            <div className="text-text-primary mt-1 text-[26px] font-semibold">
              {formatPercent(report.leadConversionRate)}
            </div>
            <div className="text-text-secondary text-[11px]">
              Secured leads + all leads
            </div>
          </div>

          <div className="border-border-soft bg-surface-white rounded-[10px] border p-4 shadow-sm">
            <div className="text-text-secondary text-[14px] font-medium">
              Total pipeline value
            </div>
            <div className="text-text-primary mt-1 text-[26px] font-semibold">
              {formatCurrency(report.totalPipelineValue)}
            </div>
            <div className="text-text-secondary text-[11px]">
              {report.totalNewLeads} leads, all stages
            </div>
          </div>

          <div className="border-border-soft bg-surface-white rounded-[10px] border p-4 shadow-sm">
            <div className="text-text-secondary text-[14px] font-medium">
              Average probability
            </div>
            <div className="text-text-primary mt-1 text-[26px] font-semibold">
              {formatPercent(report.averageProbability)}
            </div>
            <div className="text-text-secondary text-[11px]">
              Weighted forecast + pipeline value
            </div>
          </div>
        </div>

        {/* TODO: Fix broken number spacing */}

        <div className="grid grid-cols-3 gap-4">
          <div className="border-border-soft bg-surface-white rounded-[10px] border p-4 shadow-sm">
            <div className="text-text-primary mb-2 text-[17px] font-semibold">
              Where leads come from
            </div>
            <div className="text-text-secondary text-[12px]">
              <p className="text-text-secondary mb-3 text-[12px]">
                New leads by origin, FY 2026
              </p>
              <div className="space-y-3">
                {leadSourceCounts.map(([source, count]) => {
                  const numericCount = Number(count) || 0;
                  const barStyle = horizontalBarStyle(
                    numericCount,
                    barMaxSource,
                  );
                  const valueStyle = horizontalValueStyle(
                    numericCount,
                    barMaxSource,
                  );

                  return (
                    <div key={source} className="flex items-center gap-3">
                      <span className="text-text-primary w-20 min-w-[80px] truncate">
                        {source}
                      </span>
                      <div className="relative h-3.5 flex-1 overflow-hidden">
                        <div
                          className="bg-graph-bar-primary h-full rounded-[4px]"
                          style={barStyle} // leave for now
                        />
                        <span
                          className="text-text-primary absolute top-1/2 -translate-y-1/2 text-[12px] font-medium"
                          style={valueStyle}
                        >
                          {numericCount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TODO: Fix broken number spacing */}

          <div className="border-border-soft bg-surface-white rounded-[10px] border p-4 shadow-sm">
            <div className="text-text-primary mb-3 text-[14px] font-semibold">
              Leads by pipeline stage
            </div>
            <div className="text-text-secondary text-[12px]">
              <p className="text-text-secondary mb-3 text-[12px]">
                Count of open and secured leads
              </p>
              <div className="space-y-3">
                {pipelineStageCounts.map(([stage, count]) => {
                  const numericCount = Number(count) || 0;
                  const barStyle = horizontalBarStyle(
                    numericCount,
                    barMaxStage,
                  );
                  const valueStyle = horizontalValueStyle(
                    numericCount,
                    barMaxStage,
                  );

                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <span className="text-text-primary w-24 min-w-[90px] truncate">
                        {stage}
                      </span>
                      <div className="relative h-3.5 flex-1 overflow-hidden">
                        <div
                          className="bg-graph-bar-secondary h-full rounded-[4px]"
                          style={barStyle} // leave for now
                        />
                        <span
                          className="text-text-primary absolute top-1/2 -translate-y-1/2 text-[12px] font-medium"
                          style={valueStyle}
                        >
                          {numericCount}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* TODO: Fix broken number spacing and make the bars actually work */}

          <div className="border-border-soft bg-surface-white rounded-[10px] border p-4 shadow-sm">
            <div className="text-text-primary mb-3 text-[14px] font-semibold">
              New-lead intake
            </div>
            <div className="text-text-secondary text-[12px]">
              <p className="text-text-secondary mb-3 text-[12px]">
                New leads per quarter
              </p>
              <div className="flex h-[180px] items-end gap-3 pt-4">
                {newLeadIntake.map((count, index) => {
                  const barHeight = count > 0 ? (count / intakeMax) * 100 : 0;

                  return (
                    <div
                      key={`${index}-bar`}
                      className="flex flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-text-primary text-[11px] font-medium">
                        {count}
                      </span>
                      <div
                        className="bg-graph-bar-primary w-full rounded-t-[8px]"
                        style={{
                          height: `${Math.max(barHeight, count > 0 ? 18 : 0)}%`,
                          minHeight: count > 0 ? 18 : 0,
                        }}
                      />
                      <span className="text-text-secondary text-[11px]">
                        Q{index + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="border-border-soft bg-surface-white rounded-[10px] border shadow-sm">
          <div className="border-border-soft border-b px-4 py-3">
            <div className="text-text-primary text-[14px] font-semibold">
              Quarterly Summary
            </div>
          </div>
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="bg-surface-soft text-text-secondary">
                <th className="px-3 py-3 font-medium">Metric</th>
                {quarterHeaders.map((header) => (
                  <th
                    key={header}
                    className="px-3 py-3 text-center font-medium"
                  >
                    {header}
                  </th>
                ))}
                <th className="px-3 py-3 text-center font-medium">
                  {
                    fiscalYearOptions.find(
                      (option) => option.value === fiscalYear,
                    )?.label
                  }
                </th>
              </tr>
            </thead>

            <tbody>
              {summaryRows.map((row, rowIndex) => {
                const isSection = row.type === "section";
                const isLastRow = rowIndex === summaryRows.length - 1;

                return (
                  <tr
                    key={`${row.label}-${rowIndex}`}
                    className={[
                      "border-border-soft text-text-primary border-t",
                      isSection ? "bg-surface-soft font-semibold" : "",
                    ].join(" ")}
                  >
                    <td
                      className={cn(
                        "text-text-primary px-3 py-3",
                        !isLastRow ? "" : "font-semibold",
                      )}
                    >
                      {row.label}
                    </td>
                    {row.values.map((value, valueIndex) => (
                      <td
                        key={`${row.label}-${valueIndex}`}
                        className={cn(
                          "text-text-primary px-3 py-3 text-center",
                          !isLastRow ? "" : "font-semibold",
                        )}
                      >
                        {isSection ? "" : renderSummaryValue(row, value)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
