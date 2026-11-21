"use client";

import ReportsSkeleton from "@/app/donor-care/reports/skeleton";

import { AppShell } from "@/components/AppShell";
import { BarChart3, Check, Eye, Info, Loader, RotateCcw } from "lucide-react";
import { Care } from "@/lib/types";
import { DropdownList, type DropdownOption } from "@/components/prefabs";
import { cn } from "cn";
import { formatReportDate } from "@/lib/utils";
import { getNavbarPreset, moduleName } from "@/app/donor-care/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  type SummaryRow,
  generateSummaryRows,
  renderSummaryValue,
} from "@/app/donor-care/reports/utils";

const pageName = "Reports";
const reportContentStorageKey = "donor-care-report-content";

export default function ReportsPageContent() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(3);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const appliedFilters = useRef<Care.ReportFilters>({});
  const selectedFilters = useRef<Care.ReportFilters>({});

  const [baseYear, setBaseYear] = useState<DropdownOption>();
  const [compareYear, setCompareYear] = useState<DropdownOption>();
  const [sourceOfFunds, setSourceOfFunds] = useState<DropdownOption>();

  const [applyIsEnabled, setApplyIsEnabled] = useState(true);
  const [canGeneratePDF, setCanGeneratePDF] = useState(true);
  const [enableReportAnimation, setEnableReportAnimation] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [pageIsReady, setPageIsReady] = useState(false);
  const [reportAnimationTrigger, setReportAnimationTrigger] = useState(0);
  const [reportIsReady, setReportIsReady] = useState(false);

  const [lastSummaryRows, setLastSummaryRows] = useState<SummaryRow[]>();
  const [updatedReportsSet, setUpdatedReportsSet] = useState<Set<string>>(
    new Set(),
  );

  const [reportContent, setReportContent] = useState<Care.Report>();

  useEffect(() => {
    const controller = new AbortController();

    const fetchReport = async () => {
      setReportIsReady(false);

      try {
        const response = await fetch(
          `/api/care-report?${searchParams.toString()}`,
          { signal: controller.signal },
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const content = (await response.json()) as Care.Report;
        setReportContent(content);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;

        setReportContent(Care.emptyReport);
      } finally {
        if (!controller.signal.aborted) {
          setApplyIsEnabled(false);
          setPageIsReady(true);
          setReportIsReady(true);
          setIsApplyingFilters(false);
        }
      }
    };

    fetchReport();

    return () => controller.abort();
  }, [searchParams.toString()]);

  useEffect(() => {
    setCanGeneratePDF(true);
  }, [searchParams.toString()]);

  const report = reportContent ?? Care.emptyReport;

  const summaryRows = generateSummaryRows(report);

  useEffect(() => {
    window.sessionStorage.setItem(
      reportContentStorageKey,
      JSON.stringify(report),
    );

    const baseYearFilter =
      report.baseYearOptions?.find(
        (option) => option.key === report.baseYear,
      ) ?? undefined;

    const compareYearFilter =
      report.compareYearOptions?.find(
        (option) => option.key === report.compareYear,
      ) ?? undefined;

    const sourceOfFundsFilter =
      report.sourceOfFundsOptions?.find(
        (option) => option.key === report.sourceOfFunds,
      ) ?? undefined;

    setBaseYear(baseYearFilter);
    setCompareYear(compareYearFilter);
    setSourceOfFunds(sourceOfFundsFilter);

    appliedFilters.current.baseYear = report.baseYear;
    appliedFilters.current.compareYear = report.compareYear;
    appliedFilters.current.sourceOfFunds = report.sourceOfFunds;

    selectedFilters.current.baseYear = report.baseYear;
    selectedFilters.current.compareYear = report.compareYear;
    selectedFilters.current.sourceOfFunds = report.sourceOfFunds;

    const columnCount = report.donationVariance?.headers?.length ?? 0;
    const reportsSet = new Set<string>();

    for (let rowIndex = 0; rowIndex < summaryRows.length; rowIndex++) {
      for (let colIndex = 0; colIndex < columnCount; colIndex++) {
        const key = `${summaryRows[rowIndex].label}-${colIndex}`;

        if (
          lastSummaryRows?.[rowIndex].values?.[colIndex] !=
          summaryRows?.[rowIndex].values?.[colIndex]
        )
          reportsSet.add(key);
      }
    }

    setLastSummaryRows(
      summaryRows.map((row) => ({
        type: row.type,
        label: row.label,
        values: row.values ? [...row.values] : row.values,
      })),
    );

    setUpdatedReportsSet(reportsSet);
    setEnableReportAnimation(reportAnimationTrigger >= 1);
    setReportAnimationTrigger((n) => n + 1);
  }, [report]);

  const hasFilterChanges = () => {
    return (
      appliedFilters.current.baseYear != selectedFilters.current.baseYear ||
      appliedFilters.current.compareYear !=
        selectedFilters.current.compareYear ||
      appliedFilters.current.sourceOfFunds !=
        selectedFilters.current.sourceOfFunds
    );
  };

  const applyFiltersAction = async () => {
    setIsApplyingFilters(true);
    setReportIsReady(false);

    const params = new URLSearchParams(searchParams);

    const baseYearPK = "baseYear";
    const compareYearPK = "compareYear";
    const sourceOfFundsPK = "sourceOfFunds";

    if (baseYear?.key) params.set(baseYearPK, baseYear.key);
    else params.delete(baseYearPK);

    if (compareYear?.key) params.set(compareYearPK, compareYear.key);
    else params.delete(compareYearPK);

    if (sourceOfFunds?.key) params.set(sourceOfFundsPK, sourceOfFunds.key);
    else params.delete(sourceOfFundsPK);

    router.replace(`${pathname}?${params.toString()}`);
  };

  const generatePDFAction = () => {
    setCanGeneratePDF(false);
    const params = searchParams.toString();
    router.push(
      `/donor-care/reports/preview-report${params ? `?${params}` : ""}`,
    );
  };

  const resetFiltersAction = () => {
    setBaseYear(undefined);
    setCompareYear(undefined);
    setSourceOfFunds(undefined);

    selectedFilters.current.baseYear = undefined;
    selectedFilters.current.compareYear = undefined;
    selectedFilters.current.sourceOfFunds = undefined;

    setApplyIsEnabled(
      appliedFilters.current.baseYear != selectedFilters.current.baseYear ||
        appliedFilters.current.compareYear !=
          selectedFilters.current.compareYear ||
        appliedFilters.current.sourceOfFunds !=
          selectedFilters.current.sourceOfFunds,
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
                  Multi-Year Donation Comparison
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
                Base Year
              </label>
              <DropdownList
                label="Select base year"
                selectedKey={baseYear?.key}
                deselectOption={{ key: undefined, label: "- Deselect -" }}
                options={report.baseYearOptions}
                onChange={(option) => {
                  selectedFilters.current.baseYear = option.key;
                  setBaseYear(option);
                  setApplyIsEnabled(hasFilterChanges());
                }}
              />
            </div>
            <div>
              <label className="text-text-secondary text-[0.75rem] font-medium">
                Compare Year
              </label>
              <DropdownList
                label="Select compare year"
                selectedKey={compareYear?.key}
                deselectOption={{ key: undefined, label: "- Deselect -" }}
                options={report.compareYearOptions}
                onChange={(option) => {
                  selectedFilters.current.compareYear = option.key;
                  setCompareYear(option);
                  setApplyIsEnabled(hasFilterChanges());
                }}
              />
            </div>
            <div>
              <label className="text-text-secondary text-[0.75rem] font-medium">
                Source of Funds
              </label>
              <DropdownList
                label="Select source of funds"
                selectedKey={sourceOfFunds?.key}
                deselectOption={{ key: undefined, label: "- Deselect -" }}
                options={report.sourceOfFundsOptions}
                width={14}
                onChange={(option) => {
                  selectedFilters.current.sourceOfFunds = option.key;
                  setSourceOfFunds(option);
                  setApplyIsEnabled(hasFilterChanges());
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={
                  !applyIsEnabled || isApplyingFilters || !reportIsReady
                }
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

              {isApplyingFilters && (
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
              <p className="text-text-primary text-[1.0rem] font-semibold tracking-[0.075em]">
                DONATION VARIANCE REPORT
              </p>
            </div>
            {report.donationVariance ? (
              <table className="w-full table-fixed text-left text-[0.8rem]">
                <thead>
                  <tr className="text-text-primary bg-report-header-background">
                    <th className="text-surface-white w-1/3 px-3 py-3 font-medium tracking-[0.1em]">
                      METRIC
                    </th>
                    {report.donationVariance.headers?.map((header, index) => (
                      <th
                        key={`${header}-${index}`}
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
                      report.donationVariance?.headers?.length ?? 0;
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
                              <div className="border-border-soft rounded-button bg-surface-white text-text-primary invisible absolute bottom-full left-1/2 mb-2 w-max max-w-60 -translate-x-1/2 border px-3 py-1.5 text-[0.75rem] font-normal break-normal whitespace-normal opacity-0 shadow-lg transition-opacity duration-300 group-hover:visible group-hover:opacity-100">
                                {row.tooltip}
                              </div>
                            </div>
                          )}
                        </td>
                        {Array.from({ length: columnCount }).map(
                          (_, colIndex) => {
                            const updated =
                              enableReportAnimation &&
                              updatedReportsSet.has(`${row.label}-${colIndex}`);
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
                                <span
                                  key={
                                    updated
                                      ? `${row.label}-${colIndex}-${reportAnimationTrigger}`
                                      : `${row.label}-${colIndex}`
                                  }
                                  className={cn(updated && "report-bg-out")}
                                >
                                  {isSection
                                    ? ""
                                    : renderSummaryValue(row, value, colIndex)}
                                </span>
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
