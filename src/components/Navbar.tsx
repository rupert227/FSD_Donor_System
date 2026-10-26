"use client";

import React from "react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabItem {
  label: string;
  href: string;
  isActive?: boolean;
}

export interface ActionButton {
  label: string;
  icon?: LucideIcon;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  href?: string;
}

interface ModuleHeaderProps {
  title: string;
  subtitle: string;
  tabs?: TabItem[];
  actions?: ActionButton[];
}

export function Navbar({
  title,
  subtitle,
  tabs = [],
  actions = [],
}: ModuleHeaderProps) {
  return (
    // Changed pt-6 pb-0 to py-5 (or pt-6 pb-4) with md:items-center for uniform scaling
    <header className="w-full bg-white border-b border-gray-200 px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      
      {/* Left Section: Title, Subtitle & Inline Tabs */}
      <div className="flex flex-col md:flex-row md:items-center gap-8">
        
        {/* Title & Description */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">
            {title}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {subtitle}
          </p>
        </div>

        {/* Dynamic Navigation Tabs */}
        {tabs.length > 0 && (
          <nav className="flex items-center space-x-6 overflow-x-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "py-2 text-sm font-medium transition-colors relative whitespace-nowrap",
                  tab.isActive
                    ? "text-[#801313] font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {tab.label}
                {tab.isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#801313]" />
                )}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Right Section: Action Buttons (Removed manual pb offsets so it scales cleanly with the header) */}
      {actions.length > 0 && (
        <div className="flex items-center gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            const isPrimary = action.variant === "primary";

            const buttonClasses = cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all duration-150",
              isPrimary
                ? "bg-[#801313] text-white hover:bg-[#6b0f0f]"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            );

            if (action.href) {
              return (
                <Link key={index} href={action.href} className={buttonClasses}>
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{action.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={index}
                onClick={action.onClick}
                className={buttonClasses}
                type="button"
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

    </header>
  );
}