"use client";

import { type ModuleKey, canWrite } from "@/lib/access";
import { useUserDetails } from "@/lib/user-details";

export function useUserRole() {
  const { details, isLoading } = useUserDetails();
  const role = details?.role ?? null;

  return {
    role,
    officerName: details?.officerName ?? null,
    isLoading,
    canWriteModule: (module: ModuleKey) => canWrite(role, module),
  };
}
