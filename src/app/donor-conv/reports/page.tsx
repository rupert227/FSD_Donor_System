import ReportsPageContent from "./content";

import { AppShell } from "@/components/AppShell";
import { LoadingScreen } from "@/components/prefabs";
import { Suspense } from "react";
import { navbarPreset } from "@/app/donor-conv/struct";

export default function ReportsPage() {
  navbarPreset.selectedTabIndex = 2;

  return (
    <Suspense
      fallback={
        <AppShell navbarPreset={navbarPreset}>
          <LoadingScreen label={"Loading Reports Page"} />
        </AppShell>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
