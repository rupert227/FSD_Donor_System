"use client";

import { Suspense, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProposalBuilder } from "@/components/proposals/ProposalBuilder";
import { getNavbarPreset, moduleName } from "@/app/donor-conv/struct";
import { useDocumentTitle } from "@/components/Navbar";
import ProposalsSkeleton from "./skeleton";

const pageName = "Proposals";

export default function ProposalsPage() {
  useDocumentTitle(`${moduleName} - ${pageName}`);
  const navbarPreset = getNavbarPreset(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 280);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppShell navbarPreset={navbarPreset}>
      {isLoading ? (
        <ProposalsSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Page header (not printed): the page title. */}
          <div className="no-print flex items-center gap-3">
            <div className="bg-surface-soft flex size-10 shrink-0 items-center justify-center rounded-lg">
              <FileText className="size-5" aria-hidden="true" />
            </div>
            <h1 className="text-[1.375rem] leading-7 font-semibold">New proposal</h1>
          </div>

          <Suspense fallback={<ProposalsSkeleton />}>
            <ProposalBuilder />
          </Suspense>
        </div>
      )}
    </AppShell>
  );
}
