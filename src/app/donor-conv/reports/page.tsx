import ReportsPageContent from "./content";

import { AppShell } from "@/components/AppShell";
import { LoadingScreen } from "@/components/prefabs";
import { Suspense } from "react";
import { getNavbarPreset } from "@/app/donor-conv/struct";

export default function ReportsPage() {
  const navbarPreset = getNavbarPreset(2);

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
