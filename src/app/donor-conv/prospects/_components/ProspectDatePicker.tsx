"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "cn";

interface ProspectDatePickerProps {
  value: string; // "YYYY-MM-DD" or empty
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  direction?: "up" | "down" | "auto";
  align?: "left" | "right";
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
  const shortMonth = MONTH_NAMES[month]?.slice(0, 3) || "";
  return `${shortMonth} ${day}, ${year}`;
}

function toIsoString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function ProspectDatePicker({
  value,
  onChange,
  placeholder = "Select follow-up date",
  disabled = false,
  className = "",
  triggerClassName = "",
  direction = "up",
  align = "left",
}: ProspectDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [autoUpwards, setAutoUpwards] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with stable default to avoid hydration / prerender date mismatch
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(7); // August 2026
  const [todayIso, setTodayIso] = useState("");

  useEffect(() => {
    const now = new Date();
    setTodayIso(toIsoString(now.getFullYear(), now.getMonth(), now.getDate()));

    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
          return;
        }
      }
    } else {
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
  }, [value]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current && direction === "auto") {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setAutoUpwards(spaceBelow < 280 && rect.top > spaceBelow);
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Quick picks
  const setQuickPick = (daysFromToday: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    const iso = toIsoString(d.getFullYear(), d.getMonth(), d.getDate());
    onChange(iso);
    setIsOpen(false);
  };

  // Generate calendar days
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: {
    day: number;
    monthOffset: -1 | 0 | 1;
    iso: string;
  }[] = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = viewMonth === 0 ? 11 : viewMonth - 1;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    calendarDays.push({
      day,
      monthOffset: -1,
      iso: toIsoString(y, m, day),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      monthOffset: 0,
      iso: toIsoString(viewYear, viewMonth, day),
    });
  }

  // Next month leading days to complete full grid (multiple of 7)
  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const m = viewMonth === 11 ? 0 : viewMonth + 1;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    calendarDays.push({
      day,
      monthOffset: 1,
      iso: toIsoString(y, m, day),
    });
  }

  const isUpwards =
    direction === "up" ? true : direction === "down" ? false : autoUpwards;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "w-full h-[30px] px-2.5 flex items-center justify-between text-[0.6875rem] font-medium rounded-md border border-[#e3dfdf] bg-white transition cursor-pointer text-left",
          disabled
            ? "bg-[#f7f6f6] text-[#757070] cursor-not-allowed border-[#cfcaca]"
            : "text-[#1c1a1a] hover:border-[#8a8484] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f]",
          triggerClassName
        )}
        aria-expanded={isOpen}
      >
        <span className={value ? "text-[#1c1a1a]" : "text-[#9ca3af]"}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 text-[#5c5757]">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 hover:text-[#b42318] transition-colors rounded cursor-pointer"
              title="Clear date"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <CalendarIcon className="w-3.5 h-3.5 text-[#5c5757]" />
        </div>
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute ${
            isUpwards ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]"
          } ${align === "right" ? "right-0" : "left-0"} z-50 w-[256px] rounded-md border border-[#e3dfdf] bg-white shadow-xl p-2.5 space-y-1.5`}
        >
          {/* Month & Year header */}
          <div className="flex items-center justify-between px-0.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-6 h-6 flex items-center justify-center rounded-[4px] text-[#5c5757] hover:text-[#1c1a1a] hover:bg-[#f0eeee] transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[0.75rem] font-semibold text-[#1c1a1a]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-6 h-6 flex items-center justify-center rounded-[4px] text-[#5c5757] hover:text-[#1c1a1a] hover:bg-[#f0eeee] transition cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick picks (Tomorrow, 1 week, 2 weeks) */}
          <div className="flex items-center justify-between text-[0.625rem] pt-0.5 pb-1 border-b border-[#f0eeee] px-0.5">
            <span className="text-[0.59375rem] uppercase font-semibold text-[#8a8484] tracking-wide">
              Quick:
            </span>
            <button
              type="button"
              onClick={() => setQuickPick(1)}
              className="px-1.5 py-0.5 rounded text-[#6b0f0f] hover:bg-[#fbf1f1] transition font-medium cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setQuickPick(7)}
              className="px-1.5 py-0.5 rounded text-[#6b0f0f] hover:bg-[#fbf1f1] transition font-medium cursor-pointer"
            >
              1 week
            </button>
            <button
              type="button"
              onClick={() => setQuickPick(14)}
              className="px-1.5 py-0.5 rounded text-[#6b0f0f] hover:bg-[#fbf1f1] transition font-medium cursor-pointer"
            >
              2 weeks
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((w) => (
              <span
                key={w}
                className="text-[0.625rem] font-semibold text-[#757070] h-5 flex items-center justify-center"
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((item, idx) => {
              const isSelected = item.iso === value;
              const isToday = item.iso === todayIso;
              const isCurrentMonth = item.monthOffset === 0;

              return (
                <button
                  key={`${item.iso}-${idx}`}
                  type="button"
                  onClick={() => {
                    onChange(item.iso);
                    setIsOpen(false);
                  }}
                  className={`w-[28px] h-[28px] rounded-[4px] text-[0.6875rem] flex items-center justify-center transition cursor-pointer ${
                    isSelected
                      ? "bg-[#6b0f0f] text-white font-medium"
                      : isToday
                      ? "border border-[#6b0f0f] text-[#6b0f0f] font-semibold hover:bg-[#fbf1f1]"
                      : !isCurrentMonth
                      ? "text-[#cfcaca] hover:bg-[#f7f6f6]"
                      : "text-[#1c1a1a] hover:bg-[#f0eeee]"
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
