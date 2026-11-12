"use client";

import React from "react";

interface ProspectUpdateSkeletonProps {
  canWrite?: boolean;
}

export function ProspectUpdateSkeleton({
  canWrite = true,
}: ProspectUpdateSkeletonProps) {
  return (
    <div
      className="w-[75%] max-w-full min-w-0 mx-auto space-y-2.5 pb-8 overflow-hidden"
      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
    >
      {/* Back Link Skeleton */}
      <div className="flex items-center gap-1.5 py-0.5">
        <div className="h-3 w-3 bg-gray-200/80 rounded animate-pulse" />
        <div className="h-3.5 w-28 bg-gray-200/80 rounded animate-pulse" />
      </div>

      {/* TOP RECORD SUMMARY CARD */}
      <div className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs p-3.5 space-y-2.5 w-full min-w-0">
        {/* Title row */}
        <div className="flex flex-col min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between gap-2.5">
          <div className="min-w-0 space-y-1">
            <div className="h-2.5 w-12 bg-gray-200/80 rounded animate-pulse" />
            <div className="h-6 sm:h-7 w-56 sm:w-72 bg-gray-200/80 rounded mt-1 animate-pulse" />
          </div>

          {/* Action buttons (when canWrite) or View only indicator (when read-only) */}
          {canWrite ? (
            <div className="flex flex-row items-center gap-1.5 sm:gap-2 flex-nowrap w-full min-[1100px]:w-auto">
              <div className="flex-1 min-[1100px]:w-28 h-[26px] sm:h-[30px] bg-gray-200/80 rounded-md animate-pulse" />
              <div className="flex-1 min-[1100px]:w-28 h-[26px] sm:h-[30px] bg-gray-200/80 rounded-md animate-pulse" />
              <div className="flex-1 min-[1100px]:w-32 h-[26px] sm:h-[30px] bg-gray-200/80 rounded-md animate-pulse" />
            </div>
          ) : (
            <div className="h-[26px] sm:h-[30px] w-20 bg-gray-200/80 rounded-md animate-pulse self-start min-[1100px]:self-auto" />
          )}
        </div>

        {/* Highlights Row (Summary Metrics - 5 cols) */}
        <div className="grid grid-cols-1 min-[1100px]:grid-cols-5 gap-2.5 pt-2 border-t border-[#f0eeee]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 w-20 bg-gray-200/80 rounded animate-pulse" />
              <div className="h-3.5 w-28 bg-gray-200/80 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Pipeline Path Bar - 5 stage indicator boxes */}
        <div className="pt-2 border-t border-[#f0eeee]">
          <div className="grid grid-cols-1 min-[1100px]:grid-cols-5 gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[28px] rounded-md bg-gray-200/70 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* RECORD CARD WITH TABS */}
      <div className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs overflow-visible w-full min-w-0">
        {/* Card Tabs Header */}
        <div className="flex items-center justify-between border-b border-[#e3dfdf] px-5 bg-white min-w-0">
          <div className="flex gap-6 py-2.5">
            <div className="h-4 w-12 bg-gray-200/80 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200/80 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200/80 rounded animate-pulse" />
          </div>
        </div>

        {/* Form Body - Details Tab */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* SECTION 1: PROSPECT BASIC INFORMATION */}
          <div>
            <div className="h-3 w-44 bg-gray-300/80 rounded mb-2.5 animate-pulse" />
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="h-2.5 w-28 bg-gray-200/80 rounded mb-1 animate-pulse" />
                  <div className="h-[30px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: PRIMARY CONTACT DETAILS */}
          <div className="pt-3 border-t border-[#f0eeee]">
            <div className="h-3 w-40 bg-gray-300/80 rounded mb-2.5 animate-pulse" />
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="h-2.5 w-24 bg-gray-200/80 rounded mb-1 animate-pulse" />
                  <div className="h-[30px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: PIPELINE & ENGAGEMENT DETAILS */}
          <div className="pt-3 border-t border-[#f0eeee]">
            <div className="h-3 w-48 bg-gray-300/80 rounded mb-2.5 animate-pulse" />
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="h-2.5 w-24 bg-gray-200/80 rounded mb-1 animate-pulse" />
                  <div className="h-[30px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: TOUCHPOINTS & OUTREACH NOTES */}
          <div className="pt-3 border-t border-[#f0eeee]">
            <div className="h-3 w-48 bg-gray-300/80 rounded mb-2.5 animate-pulse" />
            <div>
              <div className="h-2.5 w-32 bg-gray-200/80 rounded mb-1 animate-pulse" />
              <div className="h-[76px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
            </div>
          </div>

          {/* Card Footer Actions (only rendered when canWrite is true) */}
          {canWrite && (
            <div className="pt-3 border-t border-[#e3dfdf] flex items-center justify-end gap-2">
              <div className="h-[30px] w-16 bg-gray-200/80 rounded-md animate-pulse" />
              <div className="h-[30px] w-28 bg-gray-300/80 rounded-md animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
