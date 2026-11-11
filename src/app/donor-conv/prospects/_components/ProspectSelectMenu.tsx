"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface Option {
  label: string;
  value: string;
}

interface ProspectSelectMenuProps {
  value: string;
  onChange: (value: string) => void;
  options: (Option | string)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  direction?: "up" | "down" | "auto";
}

export function ProspectSelectMenu({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  direction = "auto",
}: ProspectSelectMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [autoUpwards, setAutoUpwards] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: Option[] = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );

  const selectedOption = normalizedOptions.find(
    (opt) => (opt.value !== "" && opt.value === value) || (opt.label !== "" && opt.label === value)
  );

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current && direction === "auto") {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setAutoUpwards(spaceBelow < 220 && rect.top > spaceBelow);
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

  const isUpwards =
    direction === "up" ? true : direction === "down" ? false : autoUpwards;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full h-[30px] px-2.5 flex items-center justify-between text-[0.75rem] font-medium rounded-md border border-[#e3dfdf] bg-white transition cursor-pointer text-left ${
          disabled
            ? "bg-[#f7f6f6] text-[#757070] cursor-not-allowed border-[#cfcaca]"
            : "text-[#1c1a1a] hover:border-[#8a8484] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f]"
        }`}
        aria-expanded={isOpen}
      >
        <span className={`truncate ${selectedOption ? "text-[#1c1a1a]" : "text-[#9ca3af]"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-[#5c5757] shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute ${
            isUpwards ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]"
          } left-0 w-full z-50 rounded-md border border-[#e3dfdf] bg-white shadow-lg p-1 space-y-0.5 max-h-52 overflow-y-auto`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value || opt.label === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full h-[28px] px-2 rounded-[4px] flex items-center text-[0.75rem] text-left transition-colors cursor-pointer font-medium ${
                  isSelected
                    ? "bg-[#fbf1f1] text-[#6b0f0f]"
                    : "text-[#1c1a1a] hover:bg-[#f0eeee]"
                }`}
              >
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
