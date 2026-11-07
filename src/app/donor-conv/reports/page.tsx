"use client";

import { AppShell } from "@/components/AppShell";
import { BarChart3, Check, Download, Eye, RotateCcw } from "lucide-react";
import { DropdownList, type DropdownOption } from "@/components/prefabs";
import { Leads } from "@/lib/types";

import { cn } from "cn";
import { useEffect, useMemo, useState } from "react";
import { moduleName, navbarPreset } from "@/app/donor-conv/struct";

import {
  formatCurrency,
  formatNumber,
  formatPercent,
  generateDropdownOptionValue,
  generateDropdownOptions,
} from "@/lib/utils";

const pageName = "Reports";

type SummaryRow = {
  type: "header" | "row" | "section";
  label: string;
  values: number[];
};

export default function ReportsPage() {
  const useDocumentTitle = (title: string) => {
    useEffect(() => {
      document.title = title;
    }, [title]);
  };

  useDocumentTitle(`${moduleName} - ${pageName}`);
  navbarPreset.selectedTabIndex = 2;

  const [reportContent, setReportContent] = useState<Leads.Report | null>(null);

  const [donorType, setDonorType] = useState<string>("");
  const [fiscalYear, setFiscalYear] = useState<string>("");
  const [pipelineStage, setPipelineStage] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);

  // Loading screen test
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/lead-pipeline-report", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const content = (await response.json()) as Leads.Report;
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
        setReportContent(Leads.emptyReport);
      });

    return () => controller.abort();
  }, []);

  const report = reportContent ?? Leads.emptyReport;

  const donorTypeOptions = useMemo<DropdownOption[]>(
    () => generateDropdownOptions(report.donorTypeOptions),
    [report.donorTypeOptions],
  );

  const fiscalYearOptions = useMemo<DropdownOption[]>(
    () => generateDropdownOptions(report.fiscalYearOptions),
    [report.fiscalYearOptions],
  );

  const pipelineStageOptions = useMemo<DropdownOption[]>(
    () => generateDropdownOptions(report.pipelineStageOptions),
    [report.pipelineStageOptions],
  );

  const quarterLeadsCounts = useMemo(() => {
    const pairs = report.quarterNewLeads.flatMap((entry) =>
      Object.entries(entry),
    );
    return pairs;
  }, [report.quarterNewLeads]);

  const leadSourceCounts = useMemo(() => {
    const pairs = report.leadOrigins.flatMap((entry) => Object.entries(entry));
    return pairs;
  }, [report.leadOrigins]);

  const pipelineStageCounts = useMemo(() => {
    const pairs = report.pipelineStages.flatMap((entry) =>
      Object.entries(entry),
    );
    return pairs;
  }, [report.pipelineStages]);

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

  const applyFiltersAction = () => {
    const filterOptions: Leads.ReportFilters = {
      fiscalYear: generateDropdownOptionValue(fiscalYear),
      donorType: generateDropdownOptionValue(donorType),
      pipelineStage: generateDropdownOptionValue(pipelineStage),
    };

    console.log(`Filters: ${JSON.stringify(filterOptions)}`);
  };

  const previewPDFAction = () => {
    console.log("preview");
  };

  const downloadPDFAction = () => {
    console.log("download");
  };

  const resetFiltersAction = () => {
    setFiscalYear(fiscalYearOptions[0].value);
    setDonorType(donorTypeOptions[0].value);
    setPipelineStage(pipelineStageOptions[0].value);
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

  if (isLoading) {
    return (
      <AppShell navbarPreset={navbarPreset}>
        <div>Placeholder loading screen</div>
      </AppShell>
    );
  } else
    return (
      <AppShell navbarPreset={navbarPreset}>
        <div className="space-y-5">
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-brand-primary h-10 w-10" />
              <div>
                <div className="text-text-primary text-[2rem] leading-none font-bold tracking-tight">
                  Lead Pipeline Report
                </div>
                <div className="text-text-secondary text-[1rem] tracking-tight">
                  Placeholder text for description
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={previewPDFAction}
                className="border-border-soft bg-surface-soft text-text-primary hover:bg-surface-soft-hover bg-surface-white inline-flex items-center gap-2 rounded-[6px] border px-3 py-2 text-[0.75rem] font-medium"
              >
                <Eye className="h-5 w-5" />
                Preview PDF
              </button>
              <button
                type="button"
                onClick={downloadPDFAction}
                className="border-brand-primary bg-brand-primary text-surface-white inline-flex items-center gap-2 rounded-[6px] border px-3 py-2 text-[0.75rem] font-medium hover:opacity-80"
              >
                <Download className="h-5 w-5" />
                Download PDF
              </button>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="text-text-secondary text-[0.75rem] font-medium">
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
              <label className="text-text-secondary text-[0.75rem] font-medium">
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
              <label className="text-text-secondary text-[0.75rem] font-medium">
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
              onClick={applyFiltersAction}
              className="border-border-soft text-text-primary hover:bg-surface-soft-hover bg-surface-white flex h-9 items-center gap-1 rounded-[6px] border px-3 py-2 text-[0.75rem]"
            >
              <Check className="text-text-secondary h-4 w-4 shrink-0" />
              Apply
            </button>
            <button
              type="button"
              onClick={resetFiltersAction}
              className="border-border-soft text-text-primary hover:bg-surface-soft-hover flex h-9 items-center gap-1 rounded-[6px] border px-3 py-2 text-[0.75rem]"
            >
              <RotateCcw className="text-text-secondary h-4 w-4 shrink-0" />
              Reset Filters
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 text-wrap break-all">
            <div className="border-border-soft bg-surface-white rounded-[10px] border p-4 shadow-sm">
              <div className="text-text-secondary text-[0.9rem] font-medium">
                Weighted forecast
              </div>
              <div className="text-text-primary mt-1 text-[1.75rem] font-semibold">
                {formatCurrency(report.weightedForecast)}
              </div>
              <div className="text-text-secondary text-[0.8rem]">
                Probability-adjusted pipeline
              </div>
            </div>
            <div className="border-border-soft bg-surface-white rounded-[10px] border p-4 shadow-sm">
              <div className="text-text-secondary text-[0.9rem] font-medium">
                Lead conversion rate
              </div>
              <div className="text-text-primary mt-1 text-[1.75rem] font-semibold">
                {formatPercent(report.leadConversionRate)}
              </div>
              <div className="text-text-secondary text-[0.8rem]">
                Secured leads + all leads
              </div>
            </div>
            <div className="border-border-soft bg-surface-white rounded-[10px] border p-4 shadow-sm">
              <div className="text-text-secondary text-[0.9rem] font-medium">
                Total pipeline value
              </div>
              <div className="text-text-primary mt-1 text-[1.75rem] font-semibold">
                {formatCurrency(report.totalPipelineValue)}
              </div>
              <div className="text-text-secondary text-[0.8rem]">
                {report.totalNewLeads.reduce((accum, curr) => accum + curr, 0)}{" "}
                leads, all stages
              </div>
            </div>
            <div className="border-border-soft bg-surface-white rounded-[10px] border p-4 shadow-sm">
              <div className="text-text-secondary text-[0.9rem] font-medium">
                Average probability
              </div>
              <div className="text-text-primary mt-1 text-[1.75rem] font-semibold">
                {formatPercent(report.averageProbability)}
              </div>
              <div className="text-text-secondary text-[0.8rem]">
                Weighted forecast + pipeline value
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="border-border-soft bg-surface-white flex max-h-100 min-h-50 flex-col rounded-[10px] border p-4 shadow-sm">
              <div className="text-text-primary mb-1 text-[1rem] font-semibold">
                Where leads come from
              </div>
              <p className="text-text-secondary text-[0.75rem]">
                New leads by origin, FY 2026
              </p>
              {!report.leadOrigins?.length ? (
                <div className="text-text-secondary flex flex-1 items-center justify-center text-[0.8rem]">
                  No Data
                </div>
              ) : (
                <div className="scrollbar-primary mt-5 space-y-3 overflow-auto">
                  {leadSourceCounts.map(([source, count]) => {
                    const barMax = Math.max(
                      ...leadSourceCounts.map(
                        ([, count]) => Number(count) || 0,
                      ),
                    );

                    const numericCount = Number(count);

                    return (
                      <div key={source} className="flex">
                        <span className="text-text-primary mr-1 w-35 shrink-0 truncate text-[0.75rem] font-medium">
                          {source}
                        </span>
                        <div className="flex flex-1 items-center">
                          <div
                            style={{
                              width: `${(numericCount / barMax) * 80}%`,
                            }}
                            className={cn(
                              "bg-graph-bar-primary h-4 shrink-0 rounded-[4px]",
                              numericCount > 0 && "mr-2 min-w-[1%]",
                            )}
                          />
                          <span className="text-text-primary shrink-0 text-[0.7rem] font-medium">
                            {formatNumber(numericCount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-border-soft bg-surface-white flex max-h-100 min-h-50 flex-col rounded-[10px] border p-4 shadow-sm">
              <div className="text-text-primary mb-1 text-[1rem] font-semibold">
                Leads by pipeline stage
              </div>
              <p className="text-text-secondary text-[0.75rem]">
                Count of open and secured leads
              </p>
              {!report.pipelineStages?.length ? (
                <div className="text-text-secondary flex flex-1 items-center justify-center text-[0.8rem]">
                  No Data
                </div>
              ) : (
                <div className="scrollbar-primary mt-5 space-y-3 overflow-auto">
                  {pipelineStageCounts.map(([source, count]) => {
                    const barMax = Math.max(
                      ...pipelineStageCounts.map(
                        ([, count]) => Number(count) || 0,
                      ),
                    );

                    const numericCount = Number(count);

                    return (
                      <div key={source} className="flex">
                        <span className="text-text-primary mr-1 w-35 shrink-0 truncate text-[0.75rem] font-medium">
                          {source}
                        </span>
                        <div className="flex flex-1 items-center">
                          <div
                            style={{
                              width: `${(numericCount / barMax) * 80}%`,
                            }}
                            className={cn(
                              "bg-graph-bar-primary h-4 shrink-0 rounded-[4px]",
                              numericCount > 0 && "mr-2 min-w-[1%]",
                            )}
                          />
                          <span className="text-text-primary shrink-0 text-[0.7rem] font-medium">
                            {formatNumber(numericCount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-border-soft bg-surface-white flex max-h-100 min-h-50 flex-col rounded-[10px] border p-4 shadow-sm">
              <div className="text-text-primary mb-1 text-[1rem] font-semibold">
                New lead intake
              </div>
              <p className="text-text-secondary text-[0.75rem]">
                New leads per quarter
              </p>
              {!report.quarterNewLeads?.length ? (
                <div className="text-text-secondary flex flex-1 items-center justify-center text-[0.8rem]">
                  No Data
                </div>
              ) : (
                <div className="mt-5 flex max-h-100 flex-1 gap-3 overflow-hidden">
                  {quarterLeadsCounts.map(([source, count]) => {
                    const barMax = Math.max(
                      ...quarterLeadsCounts.map(
                        ([, count]) => Number(count) || 0,
                      ),
                    );

                    const numericCount = Number(count);

                    return (
                      <div
                        key={source}
                        className="flex h-full min-w-0 flex-1 flex-col-reverse items-center"
                      >
                        <span className="text-text-primary mt-1 w-full truncate pb-1 text-center text-[0.7rem] font-medium">
                          {source}
                        </span>
                        <div className="flex h-full w-full flex-col items-center justify-end">
                          <span className="text-text-primary w-full truncate text-center text-[0.7rem] font-medium">
                            {formatNumber(numericCount)}
                          </span>
                          <div
                            style={{
                              height: `${(numericCount / barMax) * 100}%`,
                            }}

                            className={cn(
                              "bg-graph-bar-primary w-full rounded-t-[4px]",
                              numericCount > 0 && "mt-1 min-h-[1%]",
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="border-border-soft bg-surface-white rounded-[10px] border shadow-sm">
            <div className="border-border-soft border-b px-4 py-3">
              <div className="text-text-primary text-[1.0rem] font-semibold">
                Quarterly Summary
              </div>
            </div>
            <table className="w-full text-left text-[0.8rem]">
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
