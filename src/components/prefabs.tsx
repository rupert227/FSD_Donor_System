"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Primitives } from "@/lib/types";
import { cn } from "cn";
import { useEffect, useRef, useState } from "react";

interface LoadingScreenProps {
  label?: string;
  className?: string;
}

export type DropdownOption = Primitives.DropdownOption;

export function DropdownList({
  label,
  selectedKey,
  options,
  onChange,
  width = 12,
  height = 24,
}: {
  label?: string | null | undefined;
  selectedKey?: string | null | undefined;
  options?: DropdownOption[] | null | undefined;
  onChange?: (option: DropdownOption) => void | null | undefined;
  width?: number;
  height?: number;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  const selectedOption =
    options?.find((option) => option.key === selectedKey) ?? null;

  return (
    <div ref={dropdownRef} className="relative flex">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        style={{
          width: `${width}rem`,
          minWidth: `${width}rem`,
          maxWidth: `${width}rem`,
        }}
        className={cn(
          "border-dropdown-stroke bg-surface-white text-text-primary hover:bg-surface-soft-hover rounded-button flex h-9 cursor-pointer items-center justify-between border-[1px] px-3 text-left text-[0.8rem]",
          !selectedOption && "text-text-muted",
        )}
      >
        <p className="truncate">{selectedOption?.label ?? label}</p>
        <ChevronDown
          className={cn(
            "text-text-secondary ml-5 h-4 w-4 shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (options?.length ?? 0) > 0 && (
        <div
          style={{
            width: `${width}rem`,
            minWidth: `${width}rem`,
            maxWidth: `${width}rem`,
            maxHeight: `${height}rem`,
          }}
          className="bg-surface-white border-border-soft scrollbar-primary rounded-dropdown absolute top-[calc(100%+1px)] left-0 z-20 w-full overflow-auto border p-1 shadow-lg"
        >
          <div className="w-max min-w-full">
            {options?.map((option) => {
              const isSelected = option.key === selectedOption?.key;
              return (
                <div
                  key={option.key}
                  onClick={() => {
                    onChange?.(option);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "text-text-primary first:rounded-t-dropdown last:rounded-b-dropdown flex h-7.5 w-full cursor-pointer items-center gap-2 px-3",
                    isSelected
                      ? "bg-brand-100 text-brand-primary"
                      : "hover:bg-surface-soft-hover",
                  )}
                >
                  <p className="text-[0.8rem] whitespace-nowrap">
                    {option.label}
                  </p>
                  {isSelected && <Check className="ml-auto h-4 w-4 shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function LoadingScreen({ label = "Loading", className }: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 overflow-hidden",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="text-brand-primary h-8 w-8 animate-spin" />
      <p className="text-text-primary text-[1.5rem] font-medium">{label}</p>
      <p className="sr-only">{label}</p>
    </div>
  );
}