"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

interface ProspectScoreFieldProps {
  value: string | number;
  rawProbability?: number;
  tierLabel?: string;
  direction?: "up" | "down";
}

export function ProspectScoreField({
  value,
  rawProbability,
  tierLabel,
  direction = "up",
}: ProspectScoreFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpen = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  // Close on outside click if opened or locked via click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const numVal = typeof value === "number" ? value : parseInt(String(value), 10) || 0;

  // Tier color style for form input badge
  const getBadgeStyle = (val: number) => {
    if (val >= 80) return "text-[#15803d] bg-[#f0fdf4] border-[#bbf7d0]"; // green
    if (val >= 60) return "text-[#1d4ed8] bg-[#eff6ff] border-[#bfdbfe]"; // blue
    if (val >= 40) return "text-[#b45309] bg-[#fffbeb] border-[#fde68a]"; // amber
    if (val > 0) return "text-[#6b7280] bg-[#f9fafb] border-[#e5e7eb]"; // neutral
    return "text-[#4b5563] bg-[#f3f4f6] border-[#e5e7eb]"; // 0 / deferred
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Read-Only Field Matching Standard 30px Input Tokens */}
      <div className="w-full h-[30px] px-2.5 rounded-md border border-[#e3dfdf] bg-[#faf9f9] flex items-center justify-between text-[11px] select-none">
        <div className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium border shrink-0 ${getBadgeStyle(
              numVal
            )}`}
          >
            {numVal}%
          </span>
          {tierLabel && (
            <span className="text-[11px] font-normal text-[#5c5757] whitespace-nowrap">
              {tierLabel}
            </span>
          )}
          {rawProbability !== undefined && numVal > 0 && numVal < 100 && (
            <span className="text-[10px] text-[#8a8484] shrink-0 hidden sm:inline">
              (raw: {rawProbability}%)
            </span>
          )}
        </div>

        {/* Info Icon Button Trigger */}
        <button
          type="button"
          aria-label="View probability calculation formula"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          onFocus={handleOpen}
          onBlur={handleClose}
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-1 text-[#8a8484] hover:text-[#6b0f0f] focus:outline-none focus:text-[#6b0f0f] transition-colors cursor-pointer rounded shrink-0"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info Tooltip Popup */}
      {isOpen && (
        <div
          role="tooltip"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          className={`absolute ${
            direction === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } right-0 z-50 w-max max-w-[min(340px,85vw)] rounded-md bg-[#262626] px-3.5 py-2.5 text-[11px] text-white shadow-xl select-text leading-relaxed animate-in fade-in zoom-in-95 duration-100 ${
            direction === "up"
              ? "before:content-[''] before:absolute before:inset-x-0 before:top-full before:h-2 before:bg-transparent"
              : "before:content-[''] before:absolute before:inset-x-0 before:bottom-full before:h-2 before:bg-transparent"
          }`}
          style={{ fontFamily: "var(--font-poppins), sans-serif" }}
        >
          <div className="font-semibold text-white tracking-wide mb-1 font-mono text-[11.5px]">
            P = 100 × (A / 55) × ((F + 45) / 90)
          </div>
          <div className="text-[10.5px] text-white/90 space-y-0.5 font-normal">
            <div>A (Affinity): lead source + initiative + donor type</div>
            <div>F (Feasibility): details + pipeline status + amount</div>
          </div>
        </div>
      )}
    </div>
  );
}
