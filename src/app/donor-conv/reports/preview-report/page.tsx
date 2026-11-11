"use client";

import Image from "next/image";

import { AppShell } from "@/components/AppShell";
import { ChevronLeft, Download, Loader } from "lucide-react";
import { Leads } from "@/lib/types";
import { LoadingScreen } from "@/components/prefabs";
import { cn } from "cn";
import { getNavbarPreset, moduleName } from "@/app/donor-conv/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { useEffect, useState } from "react";
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

const pageName = "Reports Preview";
const previewStorageKey = "donor-conv-lead-pipeline-report-content";

export default function PreviewReportPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(2);

  const router = useRouter();

  const [canReturnToReports, setCanReturnToReports] = useState(true);
  const [reportContent, setReportContent] = useState<Leads.Report>();
  const [reportIsReady, setReportIsReady] = useState(false);

  useEffect(() => {
    const content = window.sessionStorage.getItem(previewStorageKey);

    if (!content) return;

    setReportContent(JSON.parse(content) as Leads.Report);
    setCanReturnToReports(true);
    setReportIsReady(true);
  }, []);
  
  const report = reportContent ?? Leads.emptyReport;

  const donorTypeLabel =
    report.donorTypeOptions?.find((option) => option.key == report.donorType)
      ?.label ?? "—";

  const fiscalYearLabel =
    report.fiscalYearOptions?.find((option) => option.key == report.fiscalYear)
      ?.label ?? "—";

  const pipelineStageLabel =
    report.pipelineStageOptions?.find(
      (option) => option.key == report.pipelineStage,
    )?.label ?? "—";

  const summaryRows = generateSummaryRows(report);

  const backToReportsAction = () => {
    setCanReturnToReports(false);
    router.push("/donor-conv/reports");
  };

  const downloadPDFAction = () => {
    window.print();
  };

  return (
    <AppShell navbarPreset={navbarPreset}>
      <div className="flex w-full flex-1 flex-col">
        <div className="no-print flex justify-end">
          <div className="align-end flex items-center gap-3">
            {!canReturnToReports && (
              <div className="flex items-center justify-center gap-1 overflow-hidden">
                <Loader className="text-brand-primary h-4 w-4 shrink-0 animate-spin" />
                <p className="text-text-secondary text-[0.9rem]">
                  Returning to Reports
                </p>
              </div>
            )}
            <button
              type="button"
              disabled={!canReturnToReports}
              onClick={backToReportsAction}
              className="border-border-soft text-text-primary enabled:hover:bg-surface-soft-hover bg-surface-white rounded-button disabled:opacity-button-disabled flex h-9 cursor-pointer items-center gap-1 border px-3 py-2 text-[0.75rem] font-medium disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to Reports
            </button>
            <button
              type="button"
              disabled={!reportIsReady}
              onClick={downloadPDFAction}
              className="border-brand-primary bg-brand-primary text-surface-white rounded-button disabled:opacity-button-disabled inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-[0.75rem] font-medium enabled:hover:opacity-80 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5" />
              Download PDF
            </button>
          </div>
        </div>
<<<<<<< HEAD
=======
        <div className="mx-auto max-w-275 break-all">
          <div className="pdf-sheet bg-surface-white mx-auto p-10 shadow-lg">
            <div className="mb-12 flex items-start justify-between">
              <div className="flex-col">
                <div className="mb-8 flex items-center gap-4">
                  <div className="relative min-h-16 min-w-16 overflow-hidden">
                    <Image
                      src="/caritas_icon.png"
                      alt="Caritas Manila Logo"
                      sizes="128px"
                      fill
                      className="shrink-0 object-cover"
                      priority
                    />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[24pt] font-bold">Caritas Manila</p>
                    <p className="text-text-secondary text-[18pt]">
                      FSD Donor System
                    </p>
                  </div>
                </div>
                <div className="flex w-full max-w-180 items-center">
                  <div className="text-text-muted min-w-0 flex-1 pr-5 break-normal">
                    <p className="text-text-secondary text-[16pt] font-semibold tracking-[0.2em] uppercase">
                      Donor Conversion
                    </p>
                    <h1 className="text-text-primary text-[26pt] font-bold">
                      Lead Pipeline Report
                    </h1>
                  </div>
                  <div className="text-text-muted max-w-[40%] flex-shrink-0 border-l pl-5 break-all">
                    <p className="text-text-muted mb-1 text-[10pt]">
                      Prepared by
                    </p>
                    <p className="text-text-primary text-[14pt] font-semibold">
                      User Profile
                    </p>
                    <p className="text-text-secondary text-[12pt]">
                      User role and description
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-text-primary max-w-75 text-[12pt]">
                <p className="mb-[10pt] text-right">
                  {formatReportDate(report.timestamp)}
                </p>
                <div className="flex justify-between gap-3">
                  <p className="font-medium underline">Fiscal Year</p>
                  <p className="text-right">{fiscalYearLabel}</p>
                </div>
                <div className="flex justify-between gap-3">
                  <p className="font-medium underline">Donor Type</p>
                  <p className="text-right">{donorTypeLabel}</p>
                </div>
                <div className="flex justify-between gap-3">
                  <p className="font-medium underline">Pipeline Stage</p>
                  <p className="text-right">{pipelineStageLabel}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-text-secondary text-[10pt] font-medium underline">
                  Weighted forecast
                </p>
                <p className="text-text-primary mt-1 text-[15pt] font-semibold">
                  {formatCurrency(report.weightedForecast)}
                </p>
                <p className="text-text-secondary text-[9pt]">
                  Probability-adjusted pipeline
                </p>
              </div>
              <div>
                <p className="text-text-secondary text-[10pt] font-medium underline">
                  Lead conversion rate
                </p>
                <p className="text-text-primary mt-1 text-[15pt] font-semibold">
                  {formatPercent(report.leadConversionRate)}
                </p>
                <p className="text-text-secondary text-[9pt]">
                  Secured leads + all leads
                </p>
              </div>
              <div>
                <p className="text-text-secondary text-[10pt] font-medium underline">
                  Total pipeline value
                </p>
                <p className="text-text-primary mt-1 text-[15pt] font-semibold">
                  {formatCurrency(report.totalPipelineValue)}
                </p>
                <p className="text-text-secondary text-[9pt]">
                  {report.quarterlySummary?.totalNewLeads
                    ? report.quarterlySummary.totalNewLeads
                        .slice(0, -1)
                        .reduce((accum, curr) => (accum ?? 0) + (curr ?? 0), 0)
                    : formatNumber(undefined)}{" "}
                  leads, all stages
                </p>
              </div>
              <div>
                <p className="text-text-secondary text-[10pt] font-medium underline">
                  Average probability
                </p>
                <p className="text-text-primary mt-1 text-[15pt] font-semibold">
                  {formatPercent(report.averageProbability)}
                </p>
                <p className="text-text-secondary text-[9pt]">
                  Weighted forecast + pipeline value
                </p>
              </div>
            </div>
            <div className="border-border-soft bg-surface-white rounded-panel m-[4px] mt-8 flex flex-col border break-all shadow-sm">
              <div className="border-border-soft border-b px-4 py-3">
                <p className="text-text-primary text-[16px] font-semibold">
                  Quarterly Summary
                </p>
              </div>
              {report.quarterlySummary && report.quarterNewLeads?.length! ? (
                <table className="w-full table-fixed text-left text-[14px]">
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
>>>>>>> refs/remotes/origin/main

        {!reportIsReady ? (
          <div className="flex flex-1">
            <LoadingScreen label="Generating PDF Report" />
          </div>
        ) : (
          <div className="mt-6">
            <div className="mx-auto max-w-275 break-all">
              <div className="pdf-sheet bg-surface-white mx-auto p-10 shadow-lg">
                <div className="mb-12 flex items-start justify-between">
                  <div className="flex-col">
                    <div className="mb-8 flex items-center gap-4">
                      <div className="relative min-h-16 min-w-16 overflow-hidden">
                        <Image
                          src="/caritas_logo.png"
                          alt="Caritas Manila Logo"
                          sizes="128px"
                          fill
                          className="shrink-0 object-cover"
                          priority
                        />
                      </div>
                      <div className="leading-tight">
                        <p className="text-[24pt] font-bold">Caritas Manila</p>
                        <p className="text-text-secondary text-[18pt]">
                          FSD Donor System
                        </p>
                      </div>
                    </div>
                    <div className="flex w-full max-w-180 items-center">
                      <div className="text-text-muted min-w-0 flex-1 pr-5 break-normal">
                        <p className="text-text-secondary text-[16pt] font-semibold tracking-[0.2em] uppercase">
                          Donor Conversion
                        </p>
                        <h1 className="text-text-primary text-[26pt] font-bold">
                          Lead Pipeline Report
                        </h1>
                      </div>
                      <div className="text-text-muted max-w-[40%] flex-shrink-0 border-l pl-5 break-all">
                        <p className="text-text-muted mb-1 text-[10pt]">
                          Prepared by
                        </p>
                        <p className="text-text-primary text-[14pt] font-semibold">
                          User Profile
                        </p>
                        <p className="text-text-secondary text-[12pt]">
                          User role and description
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-text-primary max-w-75 text-[12pt]">
                    <p className="mb-[10pt] text-right">
                      {formatReportDate(report.timestamp)}
                    </p>
                    <div className="flex justify-between gap-3">
                      <p className="font-medium underline">Fiscal Year</p>
                      <p className="text-right">{fiscalYearLabel}</p>
                    </div>
                    <div className="flex justify-between gap-3">
                      <p className="font-medium underline">Donor Type</p>
                      <p className="text-right">{donorTypeLabel}</p>
                    </div>
                    <div className="flex justify-between gap-3">
                      <p className="font-medium underline">Pipeline Stage</p>
                      <p className="text-right">{pipelineStageLabel}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-text-secondary text-[10pt] font-medium underline">
                      Weighted forecast
                    </p>
                    <p className="text-text-primary mt-1 text-[15pt] font-semibold">
                      {formatCurrency(report.weightedForecast)}
                    </p>
                    <p className="text-text-secondary text-[9pt]">
                      Probability-adjusted pipeline
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-[10pt] font-medium underline">
                      Lead conversion rate
                    </p>
                    <p className="text-text-primary mt-1 text-[15pt] font-semibold">
                      {formatPercent(report.leadConversionRate)}
                    </p>
                    <p className="text-text-secondary text-[9pt]">
                      Secured leads + all leads
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-[10pt] font-medium underline">
                      Total pipeline value
                    </p>
                    <p className="text-text-primary mt-1 text-[15pt] font-semibold">
                      {formatCurrency(report.totalPipelineValue)}
                    </p>
                    <p className="text-text-secondary text-[9pt]">
                      {report.quarterlySummary?.totalNewLeads
                        ? report.quarterlySummary.totalNewLeads
                            .slice(0, -1)
                            .reduce(
                              (accum, curr) => (accum ?? 0) + (curr ?? 0),
                              0,
                            )
                        : formatNumber(undefined)}{" "}
                      leads, all stages
                    </p>
                  </div>
                  <div>
                    <p className="text-text-secondary text-[10pt] font-medium underline">
                      Average probability
                    </p>
                    <p className="text-text-primary mt-1 text-[15pt] font-semibold">
                      {formatPercent(report.averageProbability)}
                    </p>
                    <p className="text-text-secondary text-[9pt]">
                      Weighted forecast + pipeline value
                    </p>
                  </div>
                </div>
                <div className="border-border-soft bg-surface-white rounded-panel m-[4px] mt-8 flex flex-col border break-all shadow-sm">
                  <div className="border-border-soft border-b px-4 py-3">
                    <p className="text-text-primary text-[16px] font-semibold">
                      Quarterly Summary
                    </p>
                  </div>
                  {report.quarterlySummary &&
                  report.quarterNewLeads?.length! ? (
                    <table className="w-full table-fixed text-left text-[14px]">
                      <thead>
                        <tr className="bg-surface-soft text-text-secondary">
                          <th className="w-1/3 px-3 py-3 font-medium">
                            Metric
                          </th>
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
                          const columnCount =
                            report.quarterNewLeads!.length + 1;

                          return (
                            <tr
                              key={`${row.label}-${rowIndex}`}
                              className={cn(
                                "border-border-soft text-text-primary border-t",
                                isSection
                                  ? "bg-surface-soft font-semibold"
                                  : "",
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
                                  const value = row.values?.[colIndex] ?? null;
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
                      <p className="text-text-secondary text-[0.8rem]">
                        No Data
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-text-secondary mt-4 text-right text-[11pt]">
                  2002 Jesus Street, Pandacan, Manila · (02) 8562-0020 ·
                  www.caritasmanila.org.ph
                </p>
              </div>
            </div>
            <p className="text-text-muted no-print mt-8 text-center">
              Vertical and horizontal spacing may vary when exported.
              <br />
              Set paper size and custom scale to match content during export.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
