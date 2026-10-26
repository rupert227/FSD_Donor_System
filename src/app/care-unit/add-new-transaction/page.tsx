import { AppShell } from "@/components/AppShell";

export default function Page() {
  return (
    <AppShell
      title="Add New Transaction"
      subtitle="Page Description"
      tabs={[
        { label: "Tab 1", href: "/null", isActive: true },
        { label: "Tab 2", href: "/null" },
        { label: "Tab 3", href: "/null" },
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
