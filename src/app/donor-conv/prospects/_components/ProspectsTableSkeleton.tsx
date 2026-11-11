"use client";

import React from "react";

export function ProspectsTableSkeleton() {
  return (
    <div className="w-[90%] max-w-full min-w-0 mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Title row skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="h-3 w-16 bg-gray-200/80 rounded animate-pulse" />
            <div className="h-7 w-48 bg-gray-200/80 rounded mt-1.5 animate-pulse" />
          </div>
          <div className="ml-2 self-end pb-1 h-3.5 w-44 bg-gray-200/80 rounded animate-pulse" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-9 w-32 bg-gray-200/80 rounded-button animate-pulse" />
          <div className="h-9 w-24 bg-gray-200/80 rounded-button animate-pulse" />
          <div className="h-9 w-28 bg-gray-300/80 rounded-button animate-pulse" />
        </div>
      </div>

      {/* Quick views chips */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-9 bg-gray-200/80 rounded-full animate-pulse"
            style={{ width: `${64 + (i % 3) * 20}px` }}
          />
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-[10px] border border-border-soft bg-white shadow-soft">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-3">
          <div className="h-9 w-64 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
          <div className="h-9 w-20 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
          <div className="ml-auto h-9 w-9 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto min-h-[440px]">
          <table className="w-full text-center text-[0.75rem]">
            <thead className="bg-surface-soft text-text-secondary">
              <tr className="border-y border-border-soft">
                {["Prospect", "Primary Contact", "Contact Info", "Campaign", "Target Amount", "Probability", "Follow-up", "Officer", "Actions"].map((col, idx) => (
                  <th key={idx} className="px-3 py-2.5 text-center font-medium">
                    <div className="h-3 w-16 bg-gray-200/80 rounded mx-auto animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, r) => (
                <tr key={r} className="border-b border-border-soft/60">
                  <td className="px-3 py-3">
                    <div className="h-3.5 w-32 bg-gray-200/80 rounded mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-24 bg-gray-200/80 rounded mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-28 bg-gray-200/80 rounded mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-24 bg-gray-200/80 rounded mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3.5 w-20 bg-gray-200/80 rounded mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-5 w-12 bg-gray-200/80 rounded-full mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-3 w-20 bg-gray-200/80 rounded mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-5 w-24 bg-gray-200/80 rounded-full mx-auto animate-pulse" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="h-7 w-14 bg-gray-200/80 rounded mx-auto animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
