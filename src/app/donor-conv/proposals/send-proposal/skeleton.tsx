"use client";

import React from "react";

export default function SendProposalSkeleton() {
  return (
    <div className="space-y-4">
      {/* Back Link Skeleton */}
      <div className="h-3.5 w-32 bg-gray-200/80 rounded animate-pulse" />

      {/* Main Card Skeleton */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200/80 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gray-200/80 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <div className="h-3.5 w-24 bg-gray-200/80 rounded animate-pulse" />
            <div className="h-9 w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-28 bg-gray-200/80 rounded animate-pulse" />
            <div className="h-9 w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="h-3.5 w-32 bg-gray-200/80 rounded animate-pulse" />
            <div className="h-24 w-full bg-gray-100 rounded-md border border-gray-200/80 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <div className="h-9 w-20 bg-gray-200/80 rounded-button animate-pulse" />
          <div className="h-9 w-32 bg-[#6b0f0f]/20 rounded-button animate-pulse" />
        </div>
      </div>
    </div>
  );
}
