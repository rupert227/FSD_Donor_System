"use client";

import React from "react";

const GRID_CLS =
  "grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5 w-full min-w-0";

function FieldSkeletons({ count }: { count: number }) {
  return (
    <div className={GRID_CLS}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="min-w-0">
          <div className="h-2.5 w-28 bg-gray-200/80 rounded mb-1 animate-pulse" />
          <div className="h-[30px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function SectionSkeleton({
  titleWidth,
  fields,
  divider = true,
}: {
  titleWidth: string;
  fields: number;
  divider?: boolean;
}) {
  return (
    <div className={`w-full min-w-0 ${divider ? "border-t border-[#e3dfdf] pt-3" : ""}`}>
      <div className={`h-3 ${titleWidth} bg-gray-300/80 rounded mb-2.5 animate-pulse`} />
      <FieldSkeletons count={fields} />
    </div>
  );
}

// Mirrors the TransactionForm layout so the page doesn't jump when it loads
export function TransactionFormSkeleton({
  mode,
  canWrite = true,
}: {
  mode: "add" | "edit";
  canWrite?: boolean;
}) {
  const isEdit = mode === "edit";

  return (
    <div
      className="mx-auto w-[75%] max-w-full min-w-0 space-y-2.5 overflow-hidden pb-12"
      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
    >
      {/* Back link */}
      <div className="flex items-center gap-1.5 py-0.5">
        <div className="h-3 w-3 bg-gray-200/80 rounded animate-pulse" />
        <div className="h-3.5 w-32 bg-gray-200/80 rounded animate-pulse" />
      </div>

      {/* Summary card with stage bar (edit only) */}
      {isEdit && (
        <div className="w-full min-w-0 space-y-2.5 rounded-lg border border-[#e3dfdf] bg-white p-3.5 shadow-xs">
          <div className="flex flex-col gap-2.5 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between">
            <div className="space-y-1">
              <div className="h-2.5 w-16 bg-gray-200/80 rounded animate-pulse" />
              <div className="h-5 w-56 bg-gray-300/80 rounded animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-[30px] w-40 bg-gray-200/80 rounded-md animate-pulse" />
              <div className="h-[30px] w-32 bg-gray-200/80 rounded-md animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 border-t border-[#f0eeee] pt-2 min-[1100px]:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-2.5 w-16 bg-gray-200/80 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200/80 rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="space-y-1.5 border-t border-[#f0eeee] pt-2">
            <div className="grid grid-cols-1 gap-1.5 min-[1100px]:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[28px] bg-gray-100 rounded-md animate-pulse" />
              ))}
            </div>
            <div className="h-2.5 w-72 bg-gray-200/80 rounded animate-pulse" />
          </div>
        </div>
      )}

      <div className="w-full min-w-0 rounded-lg border border-[#e3dfdf] bg-white shadow-xs">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3dfdf] px-5 py-2.5 sm:px-6">
          <div className="h-4 w-40 bg-gray-200/80 rounded animate-pulse" />
          <div className="flex flex-col items-end gap-1">
            <div className="h-2.5 w-44 bg-gray-200/80 rounded animate-pulse" />
            {!isEdit && <div className="h-2.5 w-52 bg-gray-200/80 rounded animate-pulse" />}
          </div>
        </div>

        <div className="w-full min-w-0 space-y-4 p-5 sm:p-6">
          {/* Donor Basic Information */}
          <SectionSkeleton titleWidth="w-40" fields={3} divider={false} />
          {/* Primary Contact & Address Details */}
          <SectionSkeleton titleWidth="w-48" fields={6} />
          {/* Contribution Details */}
          <SectionSkeleton titleWidth="w-36" fields={3} />
          {/* Payment Received and Receipt, Certificate and Completion (edit only) */}
          {isEdit && <SectionSkeleton titleWidth="w-32" fields={3} />}
          {isEdit && <SectionSkeleton titleWidth="w-56" fields={6} />}

          {/* Notes */}
          <div className="w-full min-w-0">
            <div className="h-2.5 w-12 bg-gray-200/80 rounded mb-1 animate-pulse" />
            <div className="h-[64px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#e3dfdf] px-5 py-2.5 sm:px-6">
          <div className="h-[30px] w-16 bg-gray-200/80 rounded-md animate-pulse" />
          <div
            className={`h-[30px] ${canWrite ? "w-32 bg-gray-300/80" : "w-20 bg-gray-200/80"} rounded-md animate-pulse`}
          />
        </div>
      </div>
    </div>
  );
}
