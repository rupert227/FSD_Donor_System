import { AppShell } from "@/components/AppShell";

export default function Page() {
  return (
    <AppShell
      title="Donor Conversion"
      subtitle="Donor Conversion Workspace"
      tabs={[
      { label: "Leads", href: "/conv-unit/lead-prospects-list" },
      { label: "Proposals", href: "/conv-unit/generate-proposals"},
      { label: "Reports", href: "/conv-unit/analytics-report/report-preview", isActive: true },
      ]}
      actions={[
        { label: "Action 1", variant: "primary", href: "/null" },
        { label: "Action 2", variant: "secondary", href: "/null" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">For Development</h2>
        <p className="mt-2 text-sm text-gray-600">
          Mirror header tabs and actions to figma layouts for each module page.
        </p>
      </div>
    </AppShell>
  );
}
