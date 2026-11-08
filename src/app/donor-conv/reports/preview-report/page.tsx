"use client";

import Image from "next/image";

import { AppShell } from "@/components/AppShell";
import { ChevronLeft, Download } from "lucide-react";
import { Leads } from "@/lib/types";
import { cn } from "cn";
import { formatReportDate } from "@/lib/utils";
import { moduleName, navbarPreset } from "@/app/donor-conv/struct";
import { useDocumentTitle } from "@/components/Navbar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  generateSummaryRows,
  renderSummaryValue,
} from "@/app/donor-conv/reports/utils";

const pageName = "Reports Preview";
const previewStorageKey = "donor-conv-lead-pipeline-report-content";

export default function PreviewReportPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  navbarPreset.selectedTabIndex = 2;

  const router = useRouter();

  const [reportContent, setReportContent] = useState<Leads.Report | null>(null);

  useEffect(() => {
    const content = window.sessionStorage.getItem(previewStorageKey);

    if (!content) return;

    setReportContent(JSON.parse(content) as Leads.Report);
  }, []);

  const report = reportContent ?? Leads.emptyReport;

  const donorTypeLabel =
    report.donorTypeOptions?.find((option) => option.key == report.donorType)
      ?.label ?? "Unknown";

  const fiscalYearLabel =
    report.fiscalYearOptions?.find((option) => option.key == report.fiscalYear)
      ?.label ?? "Unknown";

  const pipelineStageLabel =
    report.pipelineStageOptions?.find(
      (option) => option.key == report.pipelineStage,
    )?.label ?? "Unknown";

  const quarterHeaders = ["Q1", "Q2", "Q3", "Q4"];
  const summaryRows = generateSummaryRows(report);

  return (
    <AppShell navbarPreset={navbarPreset}>
      <div className="w-full flex-col">
        <div className="no-print flex justify-end">
          <div className="align-end mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/donor-conv/reports")}
              className="border-border-soft bg-surface-soft text-text-primary hover:bg-surface-soft-hover bg-surface-white rounded-button inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-[0.75rem] font-medium"
            >
              <ChevronLeft className="h-5 w-5" />
              Back to Reports
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="border-brand-primary bg-brand-primary text-surface-white rounded-button inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-[0.75rem] font-medium hover:opacity-80"
            >
              <Download className="h-5 w-5" />
              Download PDF
            </button>
          </div>
        </div>
        <div className="pdf-sheet bg-surface-white mx-auto max-w-[60rem] p-10 shadow-lg">
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-col">
                <div className="mb-10 flex cursor-pointer items-center gap-4">
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
                    <div className="text-[24pt] font-bold whitespace-nowrap">
                      Caritas Manila
                    </div>
                    <div className="text-text-secondary text-[18pt] whitespace-nowrap">
                      FSD Donor System
                    </div>
                  </div>
                </div>
                <p className="text-text-secondary text-[16pt] font-semibold tracking-[0.2em] uppercase">
                  Donor Conversion
                </p>
                <h1 className="mb-4 text-[26pt] font-bold text-slate-900">
                  Lead Pipeline Report
                </h1>
                <p className="text-text-muted mb-2 text-[12pt]">Prepared by</p>
                <p className="text-text-primary text-[16pt] font-semibold">
                  User Profile
                </p>{" "}
                <p className="text-text-secondary text-[12pt]">
                  User role and description
                </p>
              </div>
              <div className="text-slate-secondary text-right text-[12pt]">
                <div>{formatReportDate(report.timestamp)}</div>
                <div className="mt-[10pt]">Fiscal Year: {fiscalYearLabel}</div>
                <div>Donor Type: {donorTypeLabel}</div>
                <div>Stage: {pipelineStageLabel}</div>
              </div>
            </div>
          </div>
          <div className="border-border-soft bg-surface-white rounded-[4px] border shadow-sm">
            <div className="border-border-soft border-b px-4 py-3">
              <div className="text-text-primary text-[14pt] font-semibold">
                Quarterly Summary
              </div>
            </div>
            <table className="w-full text-left text-[12pt]">
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
                    {"Year"}
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
          <div className="text-text-muted mt-4 text-right">
            2002 Jesus Street, Pandacan, Manila · (02) 8562-0020 ·
            www.caritasmanila.org.ph
          </div>
        </div>
      </div>
    </AppShell>
  );
}
