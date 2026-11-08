"use client";

import { AppShell } from "@/components/AppShell";
import { BarChart3, Check, Eye, RotateCcw } from "lucide-react";
import { DropdownList, type DropdownOption } from "@/components/prefabs";
import { Leads } from "@/lib/types";
import { cn } from "cn";
import { moduleName, navbarPreset } from "@/app/donor-conv/struct";
import { useEffect, useState } from "react";
import { useDocumentTitle } from "@/components/Navbar";
import { useRouter } from "next/navigation";

import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatReportDate,
} from "@/lib/utils";

import {
  generateSummaryRows,
  renderSummaryValue,
} from "@/app/donor-conv/reports/utils";

const pageName = "Reports";
const reportContentStorageKey = "donor-conv-lead-pipeline-report-content";

export default function ReportsPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  navbarPreset.selectedTabIndex = 2;

  const router = useRouter();

  const [donorType, setDonorType] = useState<DropdownOption | null>(null);
  const [fiscalYear, setFiscalYear] = useState<DropdownOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pipelineStage, setPipelineStage] = useState<DropdownOption | null>(
    null,
  );
  const [reportContent, setReportContent] = useState<Leads.Report | null>(null);

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
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setReportContent(Leads.emptyReport);
      });

    return () => controller.abort();
  }, []);

  const report = reportContent ?? Leads.emptyReport;

  const leadOriginMax =
    report.leadOrigins?.reduce((m, s) => Math.max(m, s.value ?? 0), 0) ?? 0;
  const pipelineStagesMax =
    report.pipelineStages?.reduce((m, s) => Math.max(m, s.value ?? 0), 0) ?? 0;
  const quarterNewLeadsMax =
    report.quarterNewLeads?.reduce((m, s) => Math.max(m, s.value ?? 0), 0) ?? 0;

  useEffect(() => {
    window.sessionStorage.setItem(
      reportContentStorageKey,
      JSON.stringify(report),
    );
  }, [reportContent, fiscalYear, donorType, pipelineStage, report]);

  const applyFiltersAction = () => {
    const filterOptions: Leads.ReportFilters = {
      donorType: donorType?.key,
      fiscalYear: fiscalYear?.key,
      pipelineStage: pipelineStage?.key,
    };

    console.log(`Filters: ${JSON.stringify(filterOptions)}`);
  };

  const previewPDFAction = () => {
    router.push("/donor-conv/reports/preview-report");
  };

  const resetFiltersAction = () => {
    setDonorType(null);
    setFiscalYear(null);
    setPipelineStage(null);
  };

  const quarterHeaders = ["Q1", "Q2", "Q3", "Q4"];
  const summaryRows = generateSummaryRows(report);

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
                <div className="text-text-primary text-[2rem] leading-[1.25] font-bold">
                  Lead Pipeline Report
                </div>
                <div className="text-text-secondary text-[1rem] tracking-tight">
                  {formatReportDate(report.timestamp)}
                </div>
              </div>
            </div>
            <div className="flex items-start">
              <button
                type="button"
                onClick={previewPDFAction}
                className="border-border-soft bg-surface-soft text-text-primary hover:bg-surface-soft-hover bg-surface-white rounded-button inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-[0.75rem] font-medium"
              >
                <Eye className="h-5 w-5" />
                Preview PDF Summary
              </button>
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="text-text-secondary text-[0.75rem] font-medium">
                Fiscal Year
              </label>
              <DropdownList
                label={"Select fiscal year"}
                selectedKey={fiscalYear?.key}
                options={report.fiscalYearOptions}
                onChange={setFiscalYear}
              />
            </div>
            <div>
              <label className="text-text-secondary text-[0.75rem] font-medium">
                Donor Type
              </label>
              <DropdownList
                label={"Select donor type"}
                selectedKey={donorType?.key}
                options={report.donorTypeOptions}
                onChange={setDonorType}
              />
            </div>
            <div>
              <label className="text-text-secondary text-[0.75rem] font-medium">
                Pipeline Stage
              </label>
              <DropdownList
                label={"Select pipeline stage"}
                selectedKey={pipelineStage?.key}
                options={report.pipelineStageOptions}
                onChange={setPipelineStage}
              />
            </div>
            <button
              type="button"
              onClick={applyFiltersAction}
              className="border-border-soft text-text-primary hover:bg-surface-soft-hover bg-surface-white rounded-button flex h-9 cursor-pointer items-center gap-1 border px-3 py-2 text-[0.75rem]"
            >
              <Check className="text-text-secondary h-4 w-4 shrink-0" />
              Apply
            </button>
            <button
              type="button"
              onClick={resetFiltersAction}
              className="border-border-soft text-text-primary hover:bg-surface-soft-hover rounded-button flex h-9 cursor-pointer items-center gap-1 border px-3 py-2 text-[0.75rem]"
            >
              <RotateCcw className="text-text-secondary h-4 w-4 shrink-0" />
              Reset Filters
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4 text-wrap break-all">
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
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
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
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
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
              <div className="text-text-secondary text-[0.9rem] font-medium">
                Total pipeline value
              </div>
              <div className="text-text-primary mt-1 text-[1.75rem] font-semibold">
                {formatCurrency(report.totalPipelineValue)}
              </div>
              <div className="text-text-secondary text-[0.8rem]">
                {report.totalNewLeads
                  ? report.totalNewLeads
                      .slice(0, -1)
                      .reduce((accum, curr) => accum + curr, 0)
                  : formatNumber(undefined)}{" "}
                leads, all stages
              </div>
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
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
            <div className="border-border-soft bg-surface-white rounded-panel flex max-h-100 min-h-50 flex-col border p-4 shadow-sm">
              <div className="text-text-primary mb-1 text-[1rem] font-semibold">
                Where leads come from
              </div>
              <p className="text-text-secondary text-[0.75rem]">
                New leads by origin
              </p>
              {!report.leadOrigins?.length ? (
                <div className="text-text-secondary flex flex-1 items-center justify-center text-[0.8rem]">
                  No Data
                </div>
              ) : (
                <div className="scrollbar-primary mt-5 space-y-3 overflow-auto">
                  {report.leadOrigins?.map((entry) => {
                    return (
                      <div key={entry.key} className="flex">
                        <span className="text-text-primary mr-1 w-35 shrink-0 truncate text-[0.75rem] font-medium">
                          {entry.label}
                        </span>
                        <div className="flex flex-1 items-center">
                          <div
                            style={{
                              width: `${((entry.value ?? 0) / leadOriginMax) * 80}%`,
                            }}
                            className={cn(
                              "bg-graph-bar-primary h-4 shrink-0 rounded-r-[4px]",
                              (entry.value ?? 0) > 0 && "mr-2 min-w-[1%]",
                            )}
                          />
                          <span className="text-text-primary shrink-0 text-[0.7rem] font-medium">
                            {formatNumber(entry.value)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel flex max-h-100 min-h-50 flex-col border p-4 shadow-sm">
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
                  {report.pipelineStages?.map((entry) => {
                    return (
                      <div key={entry.key} className="flex">
                        <span className="text-text-primary mr-1 w-35 shrink-0 truncate text-[0.75rem] font-medium">
                          {entry.label}
                        </span>
                        <div className="flex flex-1 items-center">
                          <div
                            style={{
                              width: `${((entry.value ?? 0) / pipelineStagesMax) * 80}%`,
                            }}
                            className={cn(
                              "bg-graph-bar-primary h-4 shrink-0 rounded-r-[4px]",
                              (entry.value ?? 0) > 0 && "mr-2 min-w-[1%]",
                            )}
                          />
                          <span className="text-text-primary shrink-0 text-[0.7rem] font-medium">
                            {formatNumber(entry.value)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel flex max-h-100 min-h-50 flex-col border p-4 shadow-sm">
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
                  {report.quarterNewLeads?.map((entry) => {
                    return (
                      <div
                        key={entry.key}
                        className="flex h-full min-w-0 flex-1 flex-col-reverse items-center"
                      >
                        <span className="text-text-primary mt-1 mb-1 w-full truncate text-center text-[0.7rem] font-medium">
                          {entry.label}
                        </span>
                        <div className="flex h-full w-full flex-col items-center justify-end">
                          <span className="text-text-primary w-full truncate text-center text-[0.7rem] font-medium">
                            {formatNumber(entry.value)}
                          </span>
                          <div
                            style={{
                              height: `${((entry.value ?? 0) / quarterNewLeadsMax) * 100}%`,
                            }}
                            className={cn(
                              "bg-graph-bar-primary w-full rounded-t-[4px]",
                              (entry.value ?? 0) > 0 && "mt-1 min-h-[1%]",
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
          <div className="border-border-soft bg-surface-white rounded-panel border shadow-sm">
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
                    {fiscalYear?.label ?? "Year"}
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
                      className={cn(
                        "border-border-soft text-text-primary border-t",
                        isSection ? "bg-surface-soft font-semibold" : "",
                      )}
                    >
                      <td
                        className={cn(
                          "text-text-primary px-3 py-3",
                          !isLastRow ? "" : "font-semibold",
                        )}
                      >
                        {row.label}
                      </td>
                      {row.values?.map((value, valueIndex) => (
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
