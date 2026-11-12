"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isUserRole, type UserRole, type ModuleKey, canWrite } from "@/lib/access";

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [officerName, setOfficerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function fetchRole() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user || cancelled) {
          setIsLoading(false);
          return;
        }

        const { data: account } = await supabase
          .from("user_accounts")
          .select("user_role, officer_profiles(full_name)")
          .eq("auth_user_id", userData.user.id)
          .maybeSingle();

        if (account && !cancelled && isUserRole(account.user_role)) {
          setRole(account.user_role);
          const profile = Array.isArray(account.officer_profiles)
            ? account.officer_profiles[0]
            : account.officer_profiles;
          setOfficerName(profile?.full_name?.trim() || null);
        }
      } catch {
        // Dev fallback
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchRole();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    role,
    officerName,
    isLoading,
    canWriteModule: (module: ModuleKey) => canWrite(role, module),
  };
}
