import ReportsPageContent from "./content";
import ReportsSkeleton from "@/app/donor-conv/reports/skeleton";

import { AppShell } from "@/components/AppShell";
import { Suspense } from "react";
import { getNavbarPreset } from "@/app/donor-conv/struct";

export default function ReportsPage() {
  const navbarPreset = getNavbarPreset(2);

  return (
    <Suspense
      fallback={
        <AppShell navbarPreset={navbarPreset}>
          <ReportsSkeleton />
        </AppShell>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
