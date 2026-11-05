import { cn } from "cn";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type DropdownOption = {
  value: string;
  label: string;
};

export function DropdownList({
  label,
  value,
  onChange,
  options,
  width = 12,
  height = 24,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  width?: number;
  height?: number;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  const selectedOption = options.find(
    (o) => o.value === value || o.label === value,
  );

  const isSelectedOption = (option: DropdownOption) =>
    option.value === value || option.label === value;

  return (
    <div ref={dropdownRef} className="relative flex">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        style={{
          width: `${width}rem`,
        }}
        className="border-dropdown-stroke text-text-primary hover:bg-surface-soft-hover rounded-button flex h-9 items-center justify-between gap-1 border-[1px] bg-white px-3 text-left text-[0.8rem]"
      >
        <span className="truncate">{selectedOption?.label ?? label}</span>
        <ChevronDown
          className={cn(
            "text-text-secondary ml-5 h-4 w-4 shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && options.length > 0 && (
        <div
          style={{
            maxHeight: `${height}rem`,
          }}
          className="bg-surface-white border-border-soft scrollbar-primary absolute top-[calc(100%+1px)] left-0 z-20 w-full overflow-auto rounded-[6px] border p-1 shadow-lg"
        >
          <div className="w-max min-w-full">
            {options.map((option, index) => {
              const isSelected = isSelectedOption(option);
              return (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "text-text-primary flex h-7.5 w-full cursor-pointer items-center gap-2 px-3 first:rounded-t-[6px] last:rounded-b-[6px]",
                    isSelected
                      ? "bg-brand-100 text-brand-primary"
                      : "hover:bg-surface-soft-hover",
                  )}
                >
                  <span className="text-[0.8rem] whitespace-nowrap">
                    {option.label ?? label}
                  </span>
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
