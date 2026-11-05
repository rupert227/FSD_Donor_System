import { AppShell } from "@/components/AppShell";
import type { Metadata } from "next";
import { moduleName, navbarPreset } from "@/app/donor-conv/struct";

const pageName = "Preview Report";

export const metadata: Metadata = {
  title: `${moduleName} - ${pageName}`,
};

export default function PreviewReportPage() {
  navbarPreset.selectedTabIndex = 2;

  return (
    <AppShell navbarPreset={navbarPreset}>
      {/* DELETE FROM HERE */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">{pageName}</h2>
        <p className="mt-2 text-sm text-gray-600">
          WIP - Content belongs here.
          <br />
          Replace entire &lt;div&gt; inside &lt;AppShell&gt; with content.
          <br />
          Page padding is implemented in AppShell.tsx.
          <br />
          Do not specify page padding here.
        </p>
      </div>
      {/* DELETE TO HERE */}
    </AppShell>
  );
}
