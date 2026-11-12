"use client";

import React from "react";

export default function ReportPreviewSkeleton() {
  return (
    <div className="flex w-full flex-1 flex-col animate-in fade-in duration-300">
      {/* Top action buttons bar */}
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-32 bg-gray-200/80 rounded-button animate-pulse" />
          <div className="h-9 w-32 bg-[#6b0f0f]/20 rounded-button animate-pulse" />
        </div>
      </div>

      {/* PDF Sheet Preview Skeleton */}
      <div className="mx-auto w-full max-w-275">
        <div className="pdf-sheet bg-white mx-auto p-10 shadow-lg border border-border-soft/60 space-y-10">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-border-soft/60 pb-8">
            <div className="flex-col space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded bg-gray-200/80 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-6 w-44 bg-gray-300/80 rounded animate-pulse" />
                  <div className="h-4 w-36 bg-gray-200/80 rounded animate-pulse" />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-gray-200/80 rounded animate-pulse" />
                  <div className="h-7 w-64 bg-gray-300/80 rounded animate-pulse" />
                </div>
                <div className="border-l border-border-soft pl-6 space-y-1.5">
                  <div className="h-3 w-20 bg-gray-200/80 rounded animate-pulse" />
                  <div className="h-4 w-28 bg-gray-300/80 rounded animate-pulse" />
                  <div className="h-3 w-36 bg-gray-200/80 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Right metadata */}
            <div className="space-y-2.5 w-48 text-right">
              <div className="h-3.5 w-28 bg-gray-200/80 rounded ml-auto animate-pulse" />
              <div className="h-3 w-36 bg-gray-200/80 rounded ml-auto animate-pulse" />
              <div className="h-3 w-32 bg-gray-200/80 rounded ml-auto animate-pulse" />
              <div className="h-3 w-40 bg-gray-200/80 rounded ml-auto animate-pulse" />
            </div>
          </div>

          {/* KPI 4-grid */}
          <div className="grid grid-cols-4 gap-4 text-center py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-28 bg-gray-200/80 rounded mx-auto animate-pulse" />
                <div className="h-6 w-32 bg-gray-300/80 rounded mx-auto animate-pulse" />
                <div className="h-2.5 w-36 bg-gray-200/80 rounded mx-auto animate-pulse" />
              </div>
            ))}
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border-soft/60">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-border-soft rounded-lg p-4 space-y-3 bg-surface-soft/40">
                <div className="h-4 w-36 bg-gray-300/80 rounded animate-pulse" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((__, j) => (
                    <div key={j} className="flex justify-between items-center">
                      <div className="h-3 w-24 bg-gray-200/80 rounded animate-pulse" />
                      <div className="h-3 w-12 bg-gray-200/80 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Data Table */}
          <div className="pt-4 border-t border-border-soft/60 space-y-3">
            <div className="h-4 w-44 bg-gray-300/80 rounded animate-pulse" />
            <div className="border border-border-soft rounded-md overflow-hidden">
              <div className="h-8 bg-surface-soft border-b border-border-soft flex items-center px-4 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-3 w-20 bg-gray-200/80 rounded animate-pulse" />
                ))}
              </div>
              <div className="divide-y divide-border-soft/60 bg-white">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 flex items-center px-4 gap-4">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <div key={j} className="h-2.5 w-16 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
