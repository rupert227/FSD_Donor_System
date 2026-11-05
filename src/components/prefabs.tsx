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
  width = 50,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  width?: number;
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
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="border-dropdown-stroke text-text-primary hover:bg-surface-soft-hover rounded-button flex h-9 w-50 items-center justify-between gap-1 border-[1px] bg-white px-3 text-left text-[13px]"
      >
        <span className="truncate">{selectedOption?.label ?? label}</span>

        <ChevronDown className="text-text-secondary h-4 w-4 shrink-0" />
      </button>

      {/* TODO: Fix dropdown label overflow where ellipses do not get applied when it label overflows a bit. */}

      {isOpen && options.length > 0 && (
        <div className="border-border-soft rounded-dropdown absolute top-[calc(100%+1px)] z-20 max-w-75 w-50 overflow-auto border bg-white shadow-lg p-1">
          <div className="dropdown-scrollbar max-h-52 overflow-auto ">
            {options.map((option, index) => {
              const isSelected = isSelectedOption(option);
              const isFirst = index === 0;
              const isLast = index === options.length - 1;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "text-text-primary flex items-center gap-3 px-3 py-3",
                    "first:hover:rounded-t-dropdown last:hover:rounded-b-dropdown",
                    isSelected
                      ? "bg-brand-100 text-brand-primary"
                      : "text-text-primary hover:bg-surface-soft",
                    {
                      "rounded-t-dropdown": isSelected && isFirst,
                      "rounded-b-dropdown": isSelected && isLast,
                    },
                  )}
                >
                  <span className="truncate">{option.label ?? label}</span>

                  {isSelected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
