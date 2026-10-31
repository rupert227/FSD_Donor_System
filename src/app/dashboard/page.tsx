import { AppShell } from "@/components/AppShell";

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="Page Description"
      tabs={[
        { label: "Prospects", href: "/null", isActive: true },
        { label: "Proposals", href: "/null" },
        { label: "Reports", href: "/null" },
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