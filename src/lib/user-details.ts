"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { isUserRole, type UserRole } from "@/lib/access";
import { createClient } from "@/lib/supabase/client";

/**
 * The signed-in user's details (role, email, officer name), cached in the
 * browser so the navbar and the pages have them on the first render after a
 * refresh instead of waiting for the database each time.
 *
 * The cache is keyed to the signed-in account and re-read from the database
 * only when it is missing, belongs to a different account, or is older than
 * MAX_AGE_MS. Cosmetic only: the proxy and row-level security still enforce
 * access on the server.
 */
export type UserDetails = {
  userId: string;
  email: string;
  role: UserRole;
  officerName: string | null;
  savedAt: number;
};

const STORAGE_KEY = "fsd.user-details.v1";
const MAX_AGE_MS = 30 * 60 * 1000;

let current: UserDetails | null = null;
let loaded = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function read(): UserDetails | null {
  if (!loaded) {
    loaded = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as UserDetails) : null;
      current = parsed && isUserRole(parsed.role) ? parsed : null;
    } catch {
      current = null;
    }
  }
  return current;
}

function write(next: UserDetails | null) {
  current = next;
  loaded = true;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private windows or blocked storage: keep the in-memory copy only.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab signed in, out or refreshed the details.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    loaded = false;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Forget the cached details. Call this when signing out. */
export function clearUserDetails() {
  write(null);
}

/** Loads the details from the database unless a fresh copy for this account is cached. */
export function refreshUserDetails(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId) {
        write(null);
        return;
      }

      const cached = read();
      if (
        cached &&
        cached.userId === userId &&
        Date.now() - cached.savedAt < MAX_AGE_MS
      ) {
        return;
      }

      const { data: account } = await supabase
        .from("user_accounts")
        .select("email_address, user_role, officer_profiles(full_name)")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (!account || !isUserRole(account.user_role)) return;

      // officer_profiles is one-to-one with user_accounts, but guard against an array.
      const profile = Array.isArray(account.officer_profiles)
        ? account.officer_profiles[0]
        : account.officer_profiles;

      write({
        userId,
        email: account.email_address,
        role: account.user_role,
        officerName: profile?.full_name?.trim() || null,
        savedAt: Date.now(),
      });
    } catch {
      // Keep whatever is cached; the next page load tries again.
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** The cached details (null until known) and whether the first check is still running. */
export function useUserDetails() {
  const details = useSyncExternalStore(subscribe, read, () => null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    refreshUserDetails().finally(() => {
      if (!cancelled) setChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { details, isLoading: details === null && !checked };
}
