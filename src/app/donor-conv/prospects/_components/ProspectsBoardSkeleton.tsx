"use client";

import React from "react";

export function ProspectsBoardSkeleton() {
  return (
    <div className="w-[90%] max-w-full min-w-0 mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Title row matching prospects board */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="h-3 w-16 bg-gray-200/80 rounded animate-pulse" />
            <div className="h-7 w-52 bg-gray-200/80 rounded mt-1.5 animate-pulse" />
          </div>
          <div className="ml-2 self-end pb-1 h-3.5 w-48 bg-gray-200/80 rounded animate-pulse" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-9 w-32 bg-gray-200/80 rounded-button animate-pulse" />
          <div className="h-9 w-24 bg-gray-200/80 rounded-button animate-pulse" />
          <div className="h-9 w-28 bg-gray-300/80 rounded-button animate-pulse" />
        </div>
      </div>

      {/* Search + Filter row */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-64 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
        <div className="h-9 w-20 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
        <div className="ml-auto h-9 w-9 bg-gray-100 rounded-button border border-gray-200/80 animate-pulse" />
      </div>

      {/* 5 Equal Kanban Columns Grid */}
      <div className="grid grid-cols-5 items-start gap-3 w-full min-w-0">
        {Array.from({ length: 5 }).map((_, c) => (
          <section
            key={c}
            className="flex flex-col rounded-[8px] p-2.5 bg-surface-soft/80 w-full min-w-0 min-h-[480px] space-y-2.5"
          >
            {/* Column Header */}
            <header className="mb-2 flex items-center justify-between gap-1 px-0.5">
              <div className="flex items-center gap-1">
                <div className="h-4 w-20 bg-gray-200/80 rounded-[3px] animate-pulse" />
                <div className="h-3.5 w-4 bg-gray-200/80 rounded-full animate-pulse" />
              </div>
              <div className="h-3.5 w-14 bg-gray-200/80 rounded animate-pulse" />
            </header>

            {/* Card skeletons */}
            {Array.from({ length: c === 0 ? 3 : c === 1 ? 4 : c === 2 ? 3 : 2 }).map(
              (__, i) => (
                <div
                  key={i}
                  className="rounded-[6px] border border-border-strong/40 bg-white p-2.5 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="h-3.5 w-28 bg-gray-200/80 rounded animate-pulse" />
                    <div className="h-3.5 w-8 bg-gray-200/80 rounded animate-pulse" />
                  </div>
                  <div className="h-2.5 w-20 bg-gray-200/80 rounded animate-pulse" />
                  <div className="flex items-center justify-between pt-0.5">
                    <div className="h-3.5 w-16 bg-gray-200/80 rounded animate-pulse" />
                    <div className="h-2.5 w-12 bg-gray-200/80 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-1.5">
                    <div className="h-3 w-16 bg-gray-200/80 rounded animate-pulse" />
                    <div className="h-4 w-4 bg-gray-200/80 rounded-full animate-pulse" />
                  </div>
                </div>
              ),
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
