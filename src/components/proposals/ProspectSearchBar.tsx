"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, Check } from "lucide-react";
import { cn } from "cn";
import type { BuilderProspect } from "@/types/proposal";

interface ProspectSearchBarProps {
  prospects: BuilderProspect[];
  selectedProspectId: number | null;
  onSelect: (prospectId: number) => void;
  onClear?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function ProspectSearchBar({
  prospects,
  selectedProspectId,
  onSelect,
  onClear,
  autoFocus = false,
  placeholder = "Search prospect by name or campaign...",
  className = "",
  inputClassName = "",
}: ProspectSearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedProspect = prospects.find((p) => p.id === selectedProspectId);

  // Filter prospects based on typed query
  const filtered = prospects.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const matchesName = p.prospect_name.toLowerCase().includes(q);
    const matchesCampaign = p.target_campaign
      ? p.target_campaign.toLowerCase().includes(q)
      : false;
    const matchesContact = p.primary_contact_person
      ? p.primary_contact_person.toLowerCase().includes(q)
      : false;
    return matchesName || matchesCampaign || matchesContact;
  });

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (id: number) => {
    onSelect(id);
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    setQuery("");
    if (onClear) onClear();
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const displayValue = query !== "" ? query : selectedProspect?.prospect_name || "";

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
    >
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[#757070] absolute left-3 pointer-events-none shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "w-full h-10 pl-9.5 pr-8 text-xs font-medium rounded-md border border-[#e3dfdf] bg-white text-[#1c1a1a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-[#6b0f0f]/20 focus:border-[#6b0f0f] shadow-2xs transition",
            inputClassName
          )}
        />
        {(query || selectedProspect) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-1 text-[#757070] hover:text-[#1c1a1a] rounded cursor-pointer transition"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 rounded-md border border-[#e3dfdf] bg-white shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="max-h-[215px] overflow-y-auto p-1 space-y-0.5">
            {filtered.length > 0 ? (
              filtered.map((p) => {
                const isSelected = p.id === selectedProspectId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={cn(
                      "w-full py-2 px-2.5 rounded-[4px] flex items-center justify-between text-left transition-colors cursor-pointer group",
                      isSelected
                        ? "bg-[#fbf1f1] text-[#6b0f0f]"
                        : "text-[#1c1a1a] hover:bg-[#fbf1f1] hover:text-[#6b0f0f]"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-xs truncate font-medium",
                          isSelected
                            ? "font-semibold text-[#6b0f0f]"
                            : "group-hover:text-[#6b0f0f]"
                        )}
                      >
                        {p.prospect_name}
                      </div>
                      {p.target_campaign && (
                        <div
                          className={cn(
                            "text-[11px] truncate mt-0.5 font-normal",
                            isSelected
                              ? "text-[#8a2c2c]"
                              : "text-[#757070] group-hover:text-[#8a2c2c]"
                          )}
                        >
                          {p.target_campaign}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#6b0f0f] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-4 px-3 text-center text-xs text-[#757070]">
                No prospects found matching &quot;{query}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
