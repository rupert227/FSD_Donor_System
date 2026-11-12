"use client";

import React from "react";

export default function ProposalsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Title Header Skeleton */}
      <div className="flex items-center gap-3">
        <div className="bg-gray-200/80 size-10 rounded-lg animate-pulse shrink-0" />
        <div className="h-7 w-44 bg-gray-200/80 rounded animate-pulse" />
      </div>

      {/* Two-column layout matching ProposalBuilder */}
      <div className="flex flex-col gap-6 xl:flex-row">
        {/* Left Column (Controls & Prospect Info) */}
        <div className="w-full xl:w-[26rem] shrink-0 space-y-4">
          <div className="rounded-panel border border-border-soft bg-white p-4 space-y-4 shadow-xs">
            {/* Template field */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-20 bg-gray-200/80 rounded animate-pulse" />
              <div className="h-9 w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
            </div>

            {/* Date field */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-16 bg-gray-200/80 rounded animate-pulse" />
              <div className="h-9 w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
            </div>

            {/* From the prospect record */}
            <div className="space-y-3 pt-2 border-t border-border-soft">
              <div className="flex items-center justify-between">
                <div className="h-4 w-36 bg-gray-200/80 rounded animate-pulse" />
                <div className="h-3.5 w-24 bg-gray-200/80 rounded animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-2.5 w-16 bg-gray-200/80 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-gray-200/80 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Signatory field */}
            <div className="space-y-1.5 pt-2 border-t border-border-soft">
              <div className="h-3.5 w-20 bg-gray-200/80 rounded animate-pulse" />
              <div className="h-9 w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
            </div>

            {/* Checklist */}
            <div className="rounded-[6px] border border-border-soft bg-surface-soft p-3 space-y-2.5">
              <div className="h-3 w-32 bg-gray-200/80 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200/80 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-gray-200/80 rounded animate-pulse" />
              </div>
            </div>

            {/* Action Button */}
            <div className="h-10 w-full bg-[#6b0f0f]/20 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Right Column (Letter Sheet Preview) */}
        <div className="flex-1 space-y-2">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-border-soft pb-2">
            <div className="h-5 w-24 bg-gray-200/80 rounded animate-pulse" />
            <div className="h-5 w-20 bg-gray-200/80 rounded animate-pulse" />
          </div>

          {/* Letter sheet toolbar */}
          <div className="rounded-t-panel border border-border-soft bg-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-4 bg-gray-200/80 rounded animate-pulse" />
              <div className="h-4 w-40 bg-gray-200/80 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200/80 rounded animate-pulse" />
            </div>
            <div className="h-8 w-28 bg-gray-200/80 rounded animate-pulse" />
          </div>

          {/* Paper sheet representation */}
          <div className="border-x border-b border-border-soft bg-gray-50/50 p-8 flex justify-center min-h-[500px]">
            <div className="w-full max-w-[580px] bg-white rounded shadow-sm border border-border-soft/60 p-8 space-y-4">
              {/* Letterhead */}
              <div className="flex items-center gap-3 border-b border-border-soft/60 pb-4">
                <div className="size-12 rounded bg-gray-200/80 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 bg-gray-300/80 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-gray-200/80 rounded animate-pulse" />
                </div>
              </div>

              {/* Date & Addressee */}
              <div className="space-y-2 pt-2">
                <div className="h-3 w-24 bg-gray-200/80 rounded animate-pulse" />
                <div className="h-3.5 w-40 bg-gray-300/80 rounded animate-pulse" />
                <div className="h-3 w-56 bg-gray-200/80 rounded animate-pulse" />
              </div>

              {/* Salutation */}
              <div className="h-3.5 w-32 bg-gray-300/80 rounded animate-pulse pt-2" />

              {/* Letter Paragraphs */}
              <div className="space-y-2.5 pt-2">
                <div className="h-3 w-full bg-gray-200/80 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-200/80 rounded animate-pulse" />
                <div className="h-3 w-4/5 bg-gray-200/80 rounded animate-pulse" />
              </div>
              <div className="space-y-2.5 pt-2">
                <div className="h-3 w-full bg-gray-200/80 rounded animate-pulse" />
                <div className="h-3 w-full bg-gray-200/80 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-gray-200/80 rounded animate-pulse" />
              </div>

              {/* Closing & Signature */}
              <div className="pt-6 space-y-2">
                <div className="h-3 w-20 bg-gray-200/80 rounded animate-pulse" />
                <div className="h-8 w-32 bg-gray-200/80 rounded animate-pulse" />
                <div className="h-3.5 w-36 bg-gray-300/80 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
