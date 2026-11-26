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
  type SummaryRow,
  generateSummaryRows,
  renderSummaryValue,
} from "@/app/donor-conv/reports/utils";

const pageName = "Reports";
const reportContentStorageKey = "donor-conv-report-content";

export default function ReportsPageContent() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(2);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const appliedFilters = useRef<Leads.ReportFilters>({});
  const selectedFilters = useRef<Leads.ReportFilters>({});

  const [year, setYear] = useState<DropdownOption>();
  const [donorType, setDonorType] = useState<DropdownOption>();
  const [targetCampaign, setTargetCampaign] = useState<DropdownOption>();

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

  const [reportContent, setReportContent] = useState<Leads.Report>();

  useEffect(() => {
    const controller = new AbortController();

    const fetchReport = async () => {
      setReportIsReady(false);

      try {
        const response = await fetch(
          `/api/conversion-report?${searchParams.toString()}`,
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

  const report = reportContent ?? Leads.emptyReport;

  const summaryRows = generateSummaryRows(report);

  useEffect(() => {
    window.sessionStorage.setItem(
      reportContentStorageKey,
      JSON.stringify(report),
    );

    const yearFilter =
      report.yearOptions?.find((option) => option.key === report.year) ??
      undefined;

    const donorTypeFilter =
      report.donorTypeOptions?.find(
        (option) => option.key === report.donorType,
      ) ?? undefined;

    const targetCampaignFilter =
      report.targetCampaignOptions?.find(
        (option) => option.key === report.targetCampaign,
      ) ?? undefined;

    setYear(yearFilter);
    setDonorType(donorTypeFilter);
    setTargetCampaign(targetCampaignFilter);

    appliedFilters.current.year = report.year;
    appliedFilters.current.donorType = report.donorType;
    appliedFilters.current.targetCampaign = report.targetCampaign;

    selectedFilters.current.year = report.year;
    selectedFilters.current.donorType = report.donorType;
    selectedFilters.current.targetCampaign = report.targetCampaign;

    const columnCount = report.quarterlySummary?.headers?.length ?? 0;
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
      appliedFilters.current.year != selectedFilters.current.year ||
      appliedFilters.current.donorType != selectedFilters.current.donorType ||
      appliedFilters.current.targetCampaign !=
        selectedFilters.current.targetCampaign
    );
  };

  const applyFiltersAction = async () => {
    setIsApplyingFilters(true);
    setReportIsReady(false);

    const params = new URLSearchParams(searchParams);

    const yearPK = "year";
    const donorTypePK = "donorType";
    const targetCampaignPK = "targetCampaign";

    if (year?.key) params.set(yearPK, year.key);
    else params.delete(yearPK);

    if (donorType?.key) params.set(donorTypePK, donorType.key);
    else params.delete(donorTypePK);

    if (targetCampaign?.key) params.set(targetCampaignPK, targetCampaign.key);
    else params.delete(targetCampaignPK);

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
    setYear(undefined);
    setDonorType(undefined);
    setTargetCampaign(undefined);

    selectedFilters.current.donorType = undefined;
    selectedFilters.current.year = undefined;
    selectedFilters.current.targetCampaign = undefined;

    setApplyIsEnabled(hasFilterChanges());
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
                  className="text-surface-white bg-brand-primary rounded-button disabled:opacity-button-disabled flex h-9 cursor-pointer items-center gap-1 px-3 py-2 text-[0.75rem] font-medium enabled:hover:opacity-75 disabled:cursor-not-allowed"
                >
                  <Eye className="text-surface-white h-4 w-4 shrink-0" />
                  Generate PDF
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center items-end gap-3">
            <div>
              <label className="text-text-secondary text-[0.75rem] font-medium">
                Year
              </label>
              {appliedFilters.current.year != selectedFilters.current.year && (
                <label className="text-brand-danger pl-1 text-[0.6rem] font-medium">
                  (Unapplied)
                </label>
              )}
              <DropdownList
                label="Select year"
                selectedKey={year?.key}
                deselectOption={{ key: undefined, label: "- Deselect -" }}
                options={report.yearOptions}
                onChange={(option) => {
                  selectedFilters.current.year = option.key;
                  setApplyIsEnabled(hasFilterChanges());
                }}
              />
            </div>
            <div>
              <label className="text-text-secondary text-[0.75rem] font-medium">
                Donor Type
              </label>
              {appliedFilters.current.donorType !=
                selectedFilters.current.donorType && (
                <label className="text-brand-danger pl-1 text-[0.6rem] font-medium">
                  (Unapplied)
                </label>
              )}
              <DropdownList
                label="Select donor type"
                selectedKey={donorType?.key}
                deselectOption={{ key: undefined, label: "- Deselect -" }}
                options={report.donorTypeOptions}
                onChange={(option) => {
                  selectedFilters.current.donorType = option.key;
                  setApplyIsEnabled(hasFilterChanges());
                }}
              />
            </div>
            <div>
              <label className="text-text-secondary text-[0.75rem] font-medium">
                Target Campaign
              </label>
              {appliedFilters.current.targetCampaign !=
                selectedFilters.current.targetCampaign && (
                <label className="text-brand-danger pl-1 text-[0.6rem] font-medium">
                  (Unapplied)
                </label>
              )}
              <DropdownList
                label="Select target campaign"
                selectedKey={targetCampaign?.key}
                deselectOption={{ key: undefined, label: "- Deselect -" }}
                options={report.targetCampaignOptions}
                width={14}
                onChange={(option) => {
                  selectedFilters.current.targetCampaign = option.key;
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
                className="text-surface-white bg-brand-primary rounded-button disabled:opacity-button-disabled flex h-9 font-medium cursor-pointer items-center gap-1 px-3 py-2 text-[0.75rem] enabled:hover:opacity-75 disabled:cursor-not-allowed"
              >
                <Check className="text-surface-white h-4 w-4 shrink-0" />
                Apply
              </button>
              <button
                type="button"
                onClick={resetFiltersAction}
                className="border-border-soft bg-surface-white text-text-primary hover:bg-surface-soft-hover rounded-button flex h-9 cursor-pointer items-center gap-1 border px-3 py-2 text-[0.75rem]"
              >
                <RotateCcw className="text-text-secondary h-4 w-4 shrink-0" />
                Reset
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
                                    : renderSummaryValue(row, value)}
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
