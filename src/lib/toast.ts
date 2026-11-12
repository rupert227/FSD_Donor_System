"use client";

export interface ToastPayload {
  title: string;
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const STORAGE_KEY = "fsd_pending_toast";
export const TOAST_EVENT_NAME = "fsd-toast-event";

/**
 * Trigger an immediate floating toast notification across the app
 */
export function showToast(toast: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(TOAST_EVENT_NAME, { detail: toast })
  );
}

/**
 * Queue a toast to be displayed upon the next page navigation (e.g., after router.push)
 */
export function setPendingToast(toast: ToastPayload) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toast));
  } catch (err) {
    console.error("Failed to set pending toast in sessionStorage:", err);
  }
}

/**
 * Read and clear any pending toast in sessionStorage
 */
export function consumePendingToast(): ToastPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    return JSON.parse(raw) as ToastPayload;
  } catch (err) {
    console.error("Failed to consume pending toast from sessionStorage:", err);
    return null;
  }
}
