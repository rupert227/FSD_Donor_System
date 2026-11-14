"use client";

import Image from "next/image";

import { AppShell } from "@/components/AppShell";
import { ChevronLeft, Download, Loader } from "lucide-react";
import { Leads } from "@/lib/types";
import { LoadingScreen } from "@/components/prefabs";
import { cn } from "cn";
import { formatReportDate } from "@/lib/utils";
import { getNavbarPreset, moduleName } from "@/app/donor-conv/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  generateSummaryRows,
  renderSummaryValue,
} from "@/app/donor-conv/reports/utils";

const pageName = "Report Preview";
const previewStorageKey = "donor-conv-lead-pipeline-report-content";

export default function PreviewReportPageContent() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(2);

  const router = useRouter();
  const searchParams = useSearchParams();

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
      ?.label ?? "All";

  const fiscalYearLabel =
    report.fiscalYearOptions?.find((option) => option.key == report.fiscalYear)
      ?.label ?? "All";

  const pipelineStageLabel =
    report.pipelineStageOptions?.find(
      (option) => option.key == report.pipelineStage,
    )?.label ?? "All";

  const summaryRows = generateSummaryRows(report);

  const backToReportsAction = () => {
    setCanReturnToReports(false);
    const params = searchParams.toString();
    router.push(`/donor-conv/reports${params ? `?${params}` : ""}`);
  };

  const downloadPDFAction = () => {
    window.print();
  };

  return (
    <AppShell navbarPreset={navbarPreset}>
      <div className="animate-in fade-in flex w-full flex-1 flex-col duration-300">
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

        {!reportIsReady ? (
          <div className="flex flex-1">
            <LoadingScreen label="Generating PDF Report" />
          </div>
        ) : (
          <div className="mt-6">
            <div className="mx-auto max-w-275 break-all">
              <div className="pdf-sheet bg-surface-white mx-auto p-10 shadow-lg">
                <div className="mb-5">
                  <div className="border-brand-primary mb-5 flex items-center gap-4 border-b-[2.5px] pb-5">
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
                      <p className="text-brand-primary text-[24pt] font-bold">
                        CARITAS MANILA
                      </p>
                      <p className="text-text-secondary text-[12pt] font-medium">
                        FINANCIAL STEWARDSHIP DIVISION &nbsp; • &nbsp; DONOR
                        CONVERSION UNIT
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex text-[12pt]">
                      <div className="flex gap-4">
                        <div className="flex gap-2">
                          <p className="text-brand-primary font-bold">
                            FISCAL YEAR:
                          </p>
                          <p className="text-text-primary font-medium">
                            {fiscalYearLabel}
                          </p>
                        </div>
                        <p className="text-text-secondary">•</p>
                        <div className="flex gap-2">
                          <p className="text-brand-primary font-bold">
                            DONOR TYPE:
                          </p>
                          <p className="text-text-primary font-medium">
                            {donorTypeLabel}
                          </p>
                        </div>
                        <p className="text-text-secondary">•</p>
                        <div className="flex gap-2">
                          <p className="text-brand-primary font-bold">
                            PIPELINE STAGE:
                          </p>
                          <p className="text-text-primary font-medium">
                            {pipelineStageLabel}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-text-secondary italic">
                      Generated at: {formatReportDate(report.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="border-border-soft bg-surface-white rounded-panel flex flex-col overflow-hidden border break-all shadow-sm">
                  <div className="border-border-soft bg-surface-white border-b px-4 py-3">
                    <p className="text-text-primary text-[1.0rem] font-semibold tracking-[0.1em]">
                      QUARTERLY SUMMARY
                    </p>
                  </div>
                  {report.quarterlySummary ? (
                    <table className="w-full table-fixed text-left text-[0.8rem]">
                      <thead>
                        <tr className="text-text-primary bg-report-header-background">
                          <th className="text-surface-white w-1/3 px-3 py-2 font-medium tracking-[0.1em]">
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
                                  "px-3 py-1.5",
                                  !isTotal
                                    ? ""
                                    : "bg-report-footer-background font-medium",
                                )}
                              >
                                {row.label}
                              </td>
                              {Array.from({ length: columnCount }).map(
                                (_, colIndex) => {
                                  const value =
                                    row.values?.[colIndex] ?? undefined;
                                  return (
                                    <td
                                      key={`${row.label}-${colIndex}`}
                                      className={cn(
                                        "px-3 py-1.5 text-right",
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
                      <p className="text-text-secondary text-[0.8rem]">
                        No Data
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-10 w-[35%]">
                  <p className="text-brand-primary mb-2 text-[10pt] font-bold">
                    PREPARED BY:
                  </p>
                  <p className="text-text-primary border-text-primary border-b-[1.5px] pb-2 text-[12pt] font-semibold">
                    User Profile
                  </p>
                  <p className="text-text-secondary pt-1 text-[10pt]">
                    User role and description
                  </p>
                </div>
                <p className="text-text-secondary border-text-muted mt-8 border-t-[1.75px] pt-2 text-right text-[11pt]">
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
