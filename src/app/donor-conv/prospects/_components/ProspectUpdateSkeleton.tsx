"use client";

import React from "react";

export function ProspectUpdateSkeleton() {
  return (
    <div
      className="w-[75%] max-w-full min-w-0 mx-auto space-y-2.5 animate-in fade-in duration-300"
      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-28 bg-gray-200/80 rounded animate-pulse" />
        <div className="h-6 w-36 bg-gray-200/80 rounded-full animate-pulse" />
      </div>

      {/* Progress Stepper Skeleton */}
      <div className="rounded-lg border border-[#e3dfdf] bg-white p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1 flex items-center gap-2">
              <div className="h-6 w-6 bg-gray-200/80 rounded-full shrink-0 animate-pulse" />
              <div className="h-3 flex-1 bg-gray-200/80 rounded hidden sm:block animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-lg border border-[#e3dfdf] bg-white shadow-xs overflow-hidden w-full">
        <div className="flex items-center justify-between border-b border-[#e3dfdf] px-6 py-3 bg-white">
          <div className="h-4 w-52 bg-gray-200/80 rounded animate-pulse" />
          <div className="h-3 w-32 bg-gray-200/80 rounded animate-pulse" />
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="h-3 w-44 bg-gray-300/80 rounded mb-2 animate-pulse" />
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="h-2.5 w-28 bg-gray-200/80 rounded mb-1 animate-pulse" />
                  <div className="h-[30px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#e3dfdf]">
            <div className="h-3 w-52 bg-gray-300/80 rounded mb-2 animate-pulse" />
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-x-4 gap-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <div className="h-2.5 w-24 bg-gray-200/80 rounded mb-1 animate-pulse" />
                  <div className="h-[30px] w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#e3dfdf]">
            <div className="h-3 w-48 bg-gray-300/80 rounded mb-2 animate-pulse" />
            <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-4">
              <div className="h-20 bg-gray-100 rounded-lg border border-gray-200/80 animate-pulse" />
              <div className="h-20 bg-gray-100 rounded-lg border border-gray-200/80 animate-pulse" />
              <div className="h-20 bg-gray-100 rounded-lg border border-gray-200/80 animate-pulse" />
            </div>
          </div>

          <div className="pt-4 border-t border-[#e3dfdf] flex items-center justify-end gap-2.5">
            <div className="h-8 w-20 bg-gray-200/80 rounded-button animate-pulse" />
            <div className="h-8 w-28 bg-gray-300/80 rounded-button animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
