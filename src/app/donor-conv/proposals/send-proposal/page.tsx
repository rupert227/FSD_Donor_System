"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getNavbarPreset, moduleName } from "@/app/donor-conv/struct";
import { useDocumentTitle } from "@/components/Navbar";
import SendProposalSkeleton from "./skeleton";

const pageName = "Send Proposal";

export default function SendProposalPage() {
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
        <SendProposalSkeleton />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center text-[11px] text-[#5c5757]">
            <Link
              href="/donor-conv/proposals"
              className="flex items-center gap-1 text-[#5c5757] hover:text-[#6b0f0f] transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Proposals</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">{pageName}</h2>
            <p className="mt-2 text-sm text-gray-600">
              Proposal commitment document generator and transmission workflow.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
