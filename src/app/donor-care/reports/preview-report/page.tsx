import PreviewReportPageContent from "./content";

import { AppShell } from "@/components/AppShell";
import { LoadingScreen } from "@/components/prefabs";
import { Suspense } from "react";
import { getNavbarPreset } from "@/app/donor-care/struct";

export default function PreviewReportPage() {
  const navbarPreset = getNavbarPreset(3);

  return (
    <Suspense
      fallback={
        <AppShell navbarPreset={navbarPreset}>
          <LoadingScreen label="Loading Report PDF Preview" />
        </AppShell>
      }
    >
      <PreviewReportPageContent />
    </Suspense>
  );
}
