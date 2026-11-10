import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProposalBuilder } from "@/components/proposals/ProposalBuilder";
import { navbarPreset } from "@/app/donor-conv/struct";

export default function NewProposalPage() {
  return (
    // Copy the shared preset and highlight the "Proposals" tab (index 1).
    <AppShell navbarPreset={{ ...navbarPreset, selectedTabIndex: 1 }}>
      {/* Page header (not printed): the way back first, then the page title. */}
      <div className="no-print flex items-center gap-3">
        {/* A back link, not a breadcrumb: the title already names this page. */}
        <Link
          href="/donor-conv/proposals"
          className="text-text-secondary hover:text-text-primary focus-visible:outline-brand-primary inline-flex h-8 shrink-0 items-center gap-1 rounded-sm text-[13px] font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Proposals
        </Link>
        <span aria-hidden="true" className="bg-border-soft h-6 w-px shrink-0" />
        <div className="bg-surface-soft flex size-10 shrink-0 items-center justify-center rounded-lg">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-[22px] leading-7 font-semibold">New proposal</h1>
      </div>

      <ProposalBuilder />
    </AppShell>
  );
}
