"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ToastPayload,
  TOAST_EVENT_NAME,
  consumePendingToast,
} from "@/lib/toast";

export function ToastContainer() {
  const pathname = usePathname();
  const [activeToast, setActiveToast] = useState<ToastPayload | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  // Check for any queued toast on route navigation
  useEffect(() => {
    const pending = consumePendingToast();
    if (pending) {
      setIsExiting(false);
      setActiveToast(pending);
    }
  }, [pathname]);

  // Listen for direct showToast() calls anywhere in the app
  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastPayload>;
      if (customEvent.detail) {
        setIsExiting(false);
        setActiveToast(customEvent.detail);
      }
    };

    window.addEventListener(TOAST_EVENT_NAME, handleToastEvent);
    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, handleToastEvent);
    };
  }, []);

  // Automatic timer: triggers fade-out (toast-out), then completely unmounts
  useEffect(() => {
    if (!activeToast) return;

    let exitTimer: NodeJS.Timeout | null = null;
    const duration = activeToast.duration ?? 2200;

    const mainTimer = setTimeout(() => {
      setIsExiting(true);
      exitTimer = setTimeout(() => {
        setActiveToast(null);
        setIsExiting(false);
      }, 220);
    }, duration);

    return () => {
      clearTimeout(mainTimer);
      if (exitTimer) clearTimeout(exitTimer);
    };
  }, [activeToast]);

  const handleManualClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setActiveToast(null);
      setIsExiting(false);
    }, 220);
  };

  if (!activeToast) return null;

  const isError = activeToast.type === "error";
  const isInfo = activeToast.type === "info";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-start gap-3 rounded-xl border border-[#ded5d5] bg-white p-3.5 xl:p-4.5 shadow-2xl max-w-[calc(100vw-2.5rem)] sm:max-w-md xl:max-w-lg select-none",
        isExiting ? "toast-out" : "toast-in"
      )}
      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
    >
      <div
        className={cn(
          "flex h-7.5 w-7.5 xl:h-8.5 xl:w-8.5 shrink-0 items-center justify-center rounded-lg border",
          isError
            ? "bg-[#fdf1f1] border-[#f5c2c2] text-[#6b0f0f]"
            : isInfo
            ? "bg-[#f0f9ff] border-[#bae6fd] text-[#0369a1]"
            : "bg-[#ede7e7] border-[#ded5d5] text-[#6e5856]"
        )}
      >
        {isError ? (
          <AlertCircle className="h-4 w-4 xl:h-4.5 xl:w-4.5 text-[#6b0f0f]" />
        ) : isInfo ? (
          <Info className="h-4 w-4 xl:h-4.5 xl:w-4.5 text-[#0369a1]" />
        ) : (
          <CheckCircle2 className="h-4 w-4 xl:h-4.5 xl:w-4.5 text-[#6e5856]" />
        )}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs xl:text-sm font-semibold text-[#1c1a1a] whitespace-nowrap">
            {activeToast.title}
          </p>
          <button
            type="button"
            onClick={handleManualClose}
            className="rounded-full p-0.5 text-[#8a8484] hover:bg-[#ede7e7] hover:text-[#1c1a1a] transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
          </button>
        </div>
        <p className="text-[11.5px] xl:text-[13px] text-[#57423f] leading-snug mt-0.5">
          {activeToast.message}
        </p>
        {activeToast.action && (
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => {
                handleManualClose();
                activeToast.action?.onClick();
              }}
              className="inline-flex items-center justify-center rounded-button bg-[#6b0f0f] px-3.5 py-1.5 text-[11px] xl:text-[12px] font-semibold text-white shadow-xs hover:bg-[#520b0b] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              {activeToast.action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
