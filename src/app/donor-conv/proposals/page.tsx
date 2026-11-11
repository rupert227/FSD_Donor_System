import { FileText } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ProposalBuilder } from "@/components/proposals/ProposalBuilder";
import { navbarPreset } from "@/app/donor-conv/struct";

export default function ProposalsPage() {
  return (
    // Copy the shared preset and highlight the "Proposals" tab (index 1).
    <AppShell navbarPreset={{ ...navbarPreset, selectedTabIndex: 1 }}>
      {/* Page header (not printed): the page title. */}
      <div className="no-print flex items-center gap-3">
        <div className="bg-surface-soft flex size-10 shrink-0 items-center justify-center rounded-lg">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-[1.375rem] leading-7 font-semibold">New proposal</h1>
      </div>

      <ProposalBuilder />
    </AppShell>
  );
}
