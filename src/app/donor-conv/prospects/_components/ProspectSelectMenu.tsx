"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";
import { cn } from "cn";

export interface Option {
  label: string;
  value: string;
  sublabel?: string;
}

interface ProspectSelectMenuProps {
  value: string;
  onChange: (value: string) => void;
  options: (Option | string)[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  direction?: "up" | "down" | "auto";
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function ProspectSelectMenu({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  triggerClassName = "",
  direction = "auto",
  searchable,
  searchPlaceholder = "Search...",
}: ProspectSelectMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [autoUpwards, setAutoUpwards] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedOptions: Option[] = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );

  const isSearchable = Boolean(searchable);

  const selectedOption = normalizedOptions.find(
    (opt) =>
      (opt.value !== "" && opt.value === value) ||
      (opt.label !== "" && opt.label === value)
  );

  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesLabel = opt.label.toLowerCase().includes(q);
    const matchesSublabel = opt.sublabel
      ? opt.sublabel.toLowerCase().includes(q)
      : false;
    return matchesLabel || matchesSublabel;
  });

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      setSearchQuery("");
      if (containerRef.current && direction === "auto") {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setAutoUpwards(spaceBelow < 240 && rect.top > spaceBelow);
      }
    }
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    if (isOpen && isSearchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSearchable]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const isUpwards =
    direction === "up" ? true : direction === "down" ? false : autoUpwards;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          "w-full h-[30px] px-2.5 flex items-center justify-between text-[0.75rem] font-medium rounded-md border border-[#e3dfdf] bg-white transition cursor-pointer text-left",
          disabled
            ? "bg-[#f7f6f6] text-[#757070] cursor-not-allowed border-[#cfcaca]"
            : "text-[#1c1a1a] hover:border-[#8a8484] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f]",
          triggerClassName
        )}
        aria-expanded={isOpen}
      >
        <span
          className={`truncate ${
            selectedOption ? "text-[#1c1a1a]" : "text-[#9ca3af]"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#5c5757] shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute ${
            isUpwards ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]"
          } left-0 w-full z-50 rounded-md border border-[#e3dfdf] bg-white shadow-xl overflow-hidden flex flex-col`}
          style={{ fontFamily: "var(--font-poppins), sans-serif" }}
        >
          {isSearchable && (
            <div className="p-1.5 border-b border-[#f0eeee] bg-[#faf9f9] sticky top-0 z-10">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-[#757070] absolute left-2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-[26px] pl-7 pr-6 text-[0.6875rem] font-medium rounded border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#6b0f0f] transition"
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-1.5 p-0.5 text-[#757070] hover:text-[#1c1a1a] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected =
                  (opt.value !== "" && opt.value === value) ||
                  (opt.label !== "" && opt.label === value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full min-h-[28px] py-1 px-2 rounded-[4px] flex items-center justify-between text-[0.75rem] text-left transition-colors cursor-pointer font-medium ${
                      isSelected
                        ? "bg-[#fbf1f1] text-[#6b0f0f]"
                        : "text-[#1c1a1a] hover:bg-[#f0eeee]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div
                          className={`text-[0.625rem] font-normal truncate ${
                            isSelected ? "text-[#8a2c2c]" : "text-[#757070]"
                          }`}
                        >
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#6b0f0f] shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-3 px-2 text-center text-[0.6875rem] text-[#757070]">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
