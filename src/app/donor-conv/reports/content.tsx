"use client";

import ReportsSkeleton from "@/app/donor-conv/reports/skeleton";

import { AppShell } from "@/components/AppShell";
import { BarChart3, Check, Eye, Info, Loader, RotateCcw } from "lucide-react";
import { DropdownList, type DropdownOption } from "@/components/prefabs";
import { Leads } from "@/lib/types";
import { cn } from "cn";
import { formatReportDate } from "@/lib/utils";
import { getNavbarPreset, moduleName } from "@/app/donor-conv/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
    const params = searchParams.toString();
    router.push(
      `/donor-conv/reports/preview-report${params ? `?${params}` : ""}`,
    );
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
                label="Select fiscal year"
                selectedKey={fiscalYear?.key}
                deselectOption={{ key: undefined, label: "- Deselect -" }}
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
                label="Select donor type"
                selectedKey={donorType?.key}
                deselectOption={{ key: undefined, label: "- Deselect -" }}
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
                label="Select pipeline stage"
                selectedKey={pipelineStage?.key}
                deselectOption={{ key: undefined, label: "- Deselect -" }}
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
          <div className="border-border-soft bg-surface-white rounded-panel flex flex-col border break-all shadow-sm">
            <div className="border-border-soft bg-surface-white rounded-t-panel border-b px-4 py-3">
              <p className="text-text-primary text-[1.0rem] font-semibold tracking-[0.1em]">
                QUARTERLY SUMMARY
              </p>
            </div>
            {report.quarterlySummary ? (
              <table className="w-full table-fixed text-left text-[0.8rem]">
                <thead>
                  <tr className="text-text-primary bg-report-header-background">
                    <th className="text-surface-white w-1/3 px-3 py-3 font-medium tracking-[0.1em]">
                      METRIC
                    </th>
                    {report.quarterlySummary.headers?.map((header) => (
                      <th
                        key={header}
                        className="text-surface-white w-[15%] px-3 py-3 text-right font-medium"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summaryRows.map((row, rowIndex) => {
                    const columnCount =
                      report.quarterlySummary?.headers?.length ?? 0;
                    const isSection = row.type === "section";
                    const isTotal = row.type === "total";

                    return (
                      <tr
                        key={`${row.label}-${rowIndex}`}
                        className={cn(
                          "border-border-soft text-text-primary border-t-[1.5px]",
                          isSection
                            ? "bg-report-section-background font-semibold text-nowrap"
                            : "",
                        )}
                      >
                        <td
                          className={cn(
                            "flex items-center gap-1.25 px-3 py-3",
                            !isTotal
                              ? ""
                              : "bg-report-footer-background font-medium",
                          )}
                        >
                          {row.label}
                          {row.tooltip && (
                            <div className="group relative inline-block">
                              <Info className="text-text-muted h-3 w-3 shrink-0" />
                              <p className="border-border-soft rounded-button bg-surface-white text-text-primary invisible absolute bottom-full left-1/2 mb-2 w-max max-w-60 -translate-x-1/2 border px-3 py-1.5 text-[0.75rem] font-normal break-normal whitespace-normal opacity-0 shadow-lg transition-opacity duration-300 group-hover:visible group-hover:opacity-100">
                                {row.tooltip}
                              </p>
                            </div>
                          )}
                        </td>
                        {Array.from({ length: columnCount }).map(
                          (_, colIndex) => {
                            const value = row.values?.[colIndex] ?? undefined;
                            return (
                              <td
                                key={`${row.label}-${colIndex}`}
                                className={cn(
                                  "px-3 py-3 text-right",
                                  !isTotal
                                    ? ""
                                    : "bg-report-footer-background font-medium",
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
