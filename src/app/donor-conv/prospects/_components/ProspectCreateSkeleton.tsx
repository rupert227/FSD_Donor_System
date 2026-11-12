"use client";

import React from "react";

export function ProspectCreateSkeleton() {
  return (
    <div
      className="w-[75%] max-w-full min-w-0 mx-auto space-y-2.5 pb-8 overflow-hidden"
      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
    >
      {/* Back Link skeleton */}
      <div className="flex items-center gap-1.5 py-0.5">
        <div className="h-3 w-3 bg-gray-200/80 rounded animate-pulse" />
        <div className="h-3.5 w-28 bg-gray-200/80 rounded animate-pulse" />
      </div>

      {/* Form card */}
      <div className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs overflow-visible w-full min-w-0 max-w-full">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e3dfdf] px-5 sm:px-6 py-2.5 bg-white">
          <div className="h-4 w-52 bg-gray-200/80 rounded animate-pulse" />
          <div className="h-3 w-40 bg-gray-200/80 rounded animate-pulse" />
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4 w-full min-w-0">
          {/* Section 1: Basic Information (3 fields) */}
          <div>
            <div className="h-3 w-44 bg-gray-300/80 rounded mb-1.5 animate-pulse" />
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5 w-full min-w-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="h-2.5 w-28 bg-gray-200/80 rounded mb-1 animate-pulse" />
                  <div className="h-[30px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Contact & Address Details (6 fields) */}
          <div className="pt-3 border-t border-[#e3dfdf] w-full min-w-0">
            <div className="h-3 w-52 bg-gray-300/80 rounded mb-1.5 animate-pulse" />
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5 w-full min-w-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="h-2.5 w-24 bg-gray-200/80 rounded mb-1 animate-pulse" />
                  <div className="h-[30px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Pipeline & Feasibility Details (6 fields) */}
          <div className="pt-3 border-t border-[#e3dfdf] w-full min-w-0">
            <div className="h-3 w-48 bg-gray-300/80 rounded mb-1.5 animate-pulse" />
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5 w-full min-w-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="h-2.5 w-24 bg-gray-200/80 rounded mb-1 animate-pulse" />
                  <div className="h-[30px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Touchpoints & Outreach Notes */}
          <div className="pt-3 border-t border-[#e3dfdf] w-full min-w-0">
            <div className="h-3 w-48 bg-gray-300/80 rounded mb-1.5 animate-pulse" />
            <div>
              <div className="h-2.5 w-32 bg-gray-200/80 rounded mb-1 animate-pulse" />
              <div className="h-[76px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="pt-3 border-t border-[#e3dfdf] flex items-center justify-end gap-2">
            <div className="h-[30px] w-16 bg-gray-200/80 rounded-md animate-pulse" />
            <div className="h-[30px] w-28 bg-gray-300/80 rounded-md animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
