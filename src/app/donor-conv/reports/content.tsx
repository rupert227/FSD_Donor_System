"use client";

import ReportsSkeleton from "@/app/donor-conv/reports/skeleton";

import { AppShell } from "@/components/AppShell";
import { BarChart3, Check, Eye, Loader, RotateCcw } from "lucide-react";
import { DropdownList, type DropdownOption } from "@/components/prefabs";
import { Leads } from "@/lib/types";
import { cn } from "cn";
import { getNavbarPreset, moduleName } from "@/app/donor-conv/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

export default function ReportsPageContent() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(2);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const appliedFilters = useRef<Leads.ReportFilters>({});
  const selectedFilters = useRef<Leads.ReportFilters>({});

  const [donorType, setDonorType] = useState<DropdownOption>();
  const [fiscalYear, setFiscalYear] = useState<DropdownOption>();
  const [pipelineStage, setPipelineStage] = useState<DropdownOption>();

  const [applyIsEnabled, setApplyIsEnabled] = useState(true);
  const [canGeneratePDF, setCanGeneratePDF] = useState(true);
  const [pageIsReady, setPageIsReady] = useState(false);
  const [reportIsReady, setReportIsReady] = useState(false);

  const [reportContent, setReportContent] = useState<Leads.Report>();

  useEffect(() => {
    const controller = new AbortController();

    const fetchReport = async () => {
      setReportIsReady(false);

      try {
        const response = await fetch(
          `/api/lead-pipeline-report?${searchParams.toString()}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const content = (await response.json()) as Leads.Report;
        setReportContent(content);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setReportContent(Leads.emptyReport);
      } finally {
        if (!controller.signal.aborted) {
          setApplyIsEnabled(false);
          setPageIsReady(true);
          setReportIsReady(true);
        }
      }
    };

    fetchReport();

    return () => controller.abort();
  }, [searchParams.toString()]);

  useEffect(() => {
    setCanGeneratePDF(true);
  }, [searchParams.toString()]);

  const report = reportContent ?? Leads.emptyReport;

  const summaryRows = generateSummaryRows(report);

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

    const donorTypeFilter =
      report.donorTypeOptions?.find(
        (option) => option.key === report.donorType,
      ) ?? undefined;

    const fiscalYearFilter =
      report.fiscalYearOptions?.find(
        (option) => option.key === report.fiscalYear,
      ) ?? undefined;

    const pipelineStageFilter =
      report.pipelineStageOptions?.find(
        (option) => option.key === report.pipelineStage,
      ) ?? undefined;

    setDonorType(donorTypeFilter);
    setFiscalYear(fiscalYearFilter);
    setPipelineStage(pipelineStageFilter);

    appliedFilters.current.donorType = report.donorType;
    appliedFilters.current.fiscalYear = report.fiscalYear;
    appliedFilters.current.pipelineStage = report.pipelineStage;

    selectedFilters.current.donorType = report.donorType;
    selectedFilters.current.fiscalYear = report.fiscalYear;
    selectedFilters.current.pipelineStage = report.pipelineStage;
  }, [report]);

  const hasFilterChanges = () => {
    return (
      appliedFilters.current.donorType != selectedFilters.current.donorType ||
      appliedFilters.current.fiscalYear != selectedFilters.current.fiscalYear ||
      appliedFilters.current.pipelineStage !=
        selectedFilters.current.pipelineStage
    );
  };

  const applyFiltersAction = async () => {
    setReportIsReady(false);

    const params = new URLSearchParams(searchParams);

    const donorTypePK = "donorType";
    const fiscalYearPK = "fiscalYear";
    const pipelineStagePK = "pipelineStage";

    if (fiscalYear?.key) params.set(fiscalYearPK, fiscalYear.key);
    else params.delete(fiscalYearPK);

    if (donorType?.key) params.set(donorTypePK, donorType.key);
    else params.delete(donorTypePK);

    if (pipelineStage?.key) params.set(pipelineStagePK, pipelineStage.key);
    else params.delete(pipelineStagePK);

    router.replace(`${pathname}?${params.toString()}`);
  };

  const generatePDFAction = () => {
    setCanGeneratePDF(false);
    router.push("/donor-conv/reports/preview-report");
  };

  const resetFiltersAction = () => {
    setDonorType(undefined);
    setFiscalYear(undefined);
    setPipelineStage(undefined);

    selectedFilters.current.donorType = undefined;
    selectedFilters.current.fiscalYear = undefined;
    selectedFilters.current.pipelineStage = undefined;

    setApplyIsEnabled(
      appliedFilters.current.donorType != selectedFilters.current.donorType ||
        appliedFilters.current.fiscalYear !=
          selectedFilters.current.fiscalYear ||
        appliedFilters.current.pipelineStage !=
          selectedFilters.current.pipelineStage,
    );
  };

  if (!pageIsReady) {
    return (
      <AppShell navbarPreset={navbarPreset}>
        <ReportsSkeleton />
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
                <p className="text-text-primary text-[2rem] leading-[1.25] font-bold">
                  Lead Pipeline Report
                </p>
                <p className="text-text-secondary tracking-tight">
                  {formatReportDate(report.timestamp)}
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center gap-3">
                {!canGeneratePDF && (
                  <div className="flex items-center justify-center gap-1 overflow-hidden">
                    <Loader className="text-brand-primary h-4 w-4 shrink-0 animate-spin" />
                    <p className="text-text-secondary text-[0.9rem]">
                      Generating PDF
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  disabled={!canGeneratePDF || !reportIsReady}
                  onClick={generatePDFAction}
                  className="border-border-soft text-text-primary enabled:hover:bg-surface-soft-hover bg-surface-white rounded-button disabled:opacity-button-disabled flex h-9 cursor-pointer items-center gap-1 border px-3 py-2 text-[0.75rem] font-medium disabled:cursor-not-allowed"
                >
                  <Eye className="h-5 w-5" />
                  Generate PDF
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center items-end gap-3">
            <div>
              <label className="text-text-secondary text-[0.75rem] font-medium">
                Fiscal Year
              </label>
              <DropdownList
                label={"Select fiscal year"}
                selectedKey={fiscalYear?.key}
                options={report.fiscalYearOptions}
                onChange={(option) => {
                  selectedFilters.current.fiscalYear = option.key;
                  setFiscalYear(option);
                  setApplyIsEnabled(hasFilterChanges());
                }}
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
                onChange={(option) => {
                  selectedFilters.current.donorType = option.key;
                  setDonorType(option);
                  setApplyIsEnabled(hasFilterChanges());
                }}
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
                onChange={(option) => {
                  selectedFilters.current.pipelineStage = option.key;
                  setPipelineStage(option);
                  setApplyIsEnabled(hasFilterChanges());
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={!applyIsEnabled || !reportIsReady}
                onClick={applyFiltersAction}
                className="border-border-soft text-text-primary enabled:hover:bg-surface-soft-hover bg-surface-white rounded-button disabled:opacity-button-disabled flex h-9 cursor-pointer items-center gap-1 border px-3 py-2 text-[0.75rem] disabled:cursor-not-allowed"
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

              {!reportIsReady && (
                <div className="flex items-center justify-center gap-1 overflow-hidden">
                  <Loader className="text-brand-primary h-4 w-4 shrink-0 animate-spin" />
                  <p className="text-text-secondary text-[0.9rem]">
                    Applying Filters
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-wrap">
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
              <p className="text-text-secondary text-[0.9rem] font-medium">
                Weighted forecast
              </p>
              <p className="text-text-primary mt-1 text-[1.75rem] font-semibold break-all">
                {formatCurrency(report.weightedForecast)}
              </p>
              <p className="text-text-secondary text-[0.8rem]">
                Probability-adjusted pipeline
              </p>
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
              <p className="text-text-secondary text-[0.9rem] font-medium">
                Lead conversion rate
              </p>
              <p className="text-text-primary mt-1 text-[1.75rem] font-semibold break-all">
                {formatPercent(report.leadConversionRate)}
              </p>
              <p className="text-text-secondary text-[0.8rem]">
                Secured leads + all leads
              </p>
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
              <p className="text-text-secondary text-[0.9rem] font-medium">
                Total pipeline value
              </p>
              <p className="text-text-primary mt-1 text-[1.75rem] font-semibold break-all">
                {formatCurrency(report.totalPipelineValue)}
              </p>
              <p className="text-text-secondary text-[0.8rem]">
                {report.quarterlySummary?.totalNewLeads
                  ? report.quarterlySummary.totalNewLeads
                      .slice(0, -1)
                      .reduce((accum, curr) => (accum ?? 0) + (curr ?? 0), 0)
                  : formatNumber(undefined)}{" "}
                leads, all stages
              </p>
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel border p-4 shadow-sm">
              <p className="text-text-secondary text-[0.9rem] font-medium">
                Average probability
              </p>
              <p className="text-text-primary mt-1 text-[1.75rem] font-semibold break-all">
                {formatPercent(report.averageProbability)}
              </p>
              <p className="text-text-secondary text-[0.8rem]">
                Weighted forecast + pipeline value
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="border-border-soft bg-surface-white rounded-panel flex max-h-100 min-h-50 flex-col border p-4 shadow-sm">
              <p className="text-text-primary mb-1 font-semibold">
                Where leads come from
              </p>
              <p className="text-text-secondary text-[0.75rem]">
                New leads by origin
              </p>
              {report.leadOrigins?.length ? (
                <div className="scrollbar-primary mt-5 space-y-3 overflow-auto">
                  {report.leadOrigins?.map((entry) => {
                    return (
                      <div key={entry.key} className="flex">
                        <p className="text-text-primary mr-1 w-35 shrink-0 truncate text-[0.75rem] font-medium">
                          {entry.label}
                        </p>
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
                          <p className="text-text-primary shrink-0 text-[0.7rem] font-medium">
                            {formatNumber(entry.value)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-secondary flex flex-1 items-center justify-center text-[0.8rem]">
                  No Data
                </p>
              )}
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel flex max-h-100 min-h-50 flex-col border p-4 shadow-sm">
              <p className="text-text-primary mb-1 font-semibold">
                Leads by pipeline stage
              </p>
              <p className="text-text-secondary text-[0.75rem]">
                Count of open and secured leads
              </p>
              {report.pipelineStages?.length ? (
                <div className="scrollbar-primary mt-5 space-y-3 overflow-auto">
                  {report.pipelineStages?.map((entry) => {
                    return (
                      <div key={entry.key} className="flex">
                        <p className="text-text-primary mr-1 w-35 shrink-0 truncate text-[0.75rem] font-medium">
                          {entry.label}
                        </p>
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
                          <p className="text-text-primary shrink-0 text-[0.7rem] font-medium">
                            {formatNumber(entry.value)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-secondary flex flex-1 items-center justify-center text-[0.8rem]">
                  No Data
                </p>
              )}
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel flex max-h-100 min-h-50 flex-col border p-4 shadow-sm">
              <p className="text-text-primary mb-1 font-semibold">
                New lead intake
              </p>
              <p className="text-text-secondary text-[0.75rem]">
                New leads per quarter
              </p>
              {report.quarterNewLeads?.length ? (
                <div className="mt-5 flex max-h-100 flex-1 gap-3 overflow-hidden">
                  {report.quarterNewLeads?.map((entry) => {
                    return (
                      <div
                        key={entry.key}
                        className="flex h-full min-w-0 flex-1 flex-col-reverse items-center"
                      >
                        <p className="text-text-primary mt-1 mb-1 w-full truncate text-center text-[0.7rem] font-medium">
                          {entry.label}
                        </p>
                        <div className="flex h-full w-full flex-col items-center justify-end">
                          <p className="text-text-primary w-full truncate text-center text-[0.7rem] font-medium">
                            {formatNumber(entry.value)}
                          </p>
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
              ) : (
                <p className="text-text-secondary flex flex-1 items-center justify-center text-[0.8rem]">
                  No Data
                </p>
              )}
            </div>
          </div>
          <div className="border-border-soft bg-surface-white rounded-panel flex flex-col border break-all shadow-sm">
            <div className="border-border-soft border-b px-4 py-3">
              <p className="text-text-primary text-[1.0rem] font-semibold">
                Quarterly Summary
              </p>
            </div>
            {report.quarterlySummary && report.quarterNewLeads?.length! ? (
              <table className="w-full table-fixed text-left text-[0.8rem]">
                <thead>
                  <tr className="bg-surface-soft text-text-secondary">
                    <th className="w-1/3 px-3 py-3 font-medium">Metric</th>
                    {report.quarterNewLeads?.map((option) => (
                      <th
                        key={option.key}
                        className="w-[15%] px-3 py-3 text-right font-medium"
                      >
                        {option.label}
                      </th>
                    ))}
                    <th className="w-[15%] px-3 py-3 text-right font-medium">
                      {report.fiscalYearOptions?.find(
                        (option) => option.key === report.fiscalYear,
                      )?.label ?? "—"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row, rowIndex) => {
                    const isLastRow = rowIndex === summaryRows.length - 1;
                    const isSection = row.type === "section";
                    const columnCount = report.quarterNewLeads!.length + 1;

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
                            "px-3 py-3",
                            !isLastRow ? "" : "font-semibold",
                          )}
                        >
                          {row.label}
                        </td>
                        {Array.from({ length: columnCount }).map(
                          (_, colIndex) => {
                            const value = row.values?.[colIndex] ?? undefined;
                            return (
                              <td
                                key={`${row.label}-${colIndex}`}
                                className={cn(
                                  "px-3 py-3 text-right",
                                  !isLastRow ? "" : "font-semibold",
                                )}
                              >
                                {isSection
                                  ? ""
                                  : renderSummaryValue(row, value)}
                              </td>
                            );
                          },
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex min-h-50 flex-1 items-center justify-center">
                <p className="text-text-secondary text-[0.8rem]">No Data</p>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
}
