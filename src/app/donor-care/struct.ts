import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Donor Care";
export const moduleRoute = "/donor-care";

export function getNavbarPreset(selectedTabIndex: number = 0): NavbarPreset {
  return {
    selectedModuleIndex: 3,
    selectedTabIndex,
    tabs: [
      {
        label: "Transactions",
        href: `${moduleRoute}/transactions`,
      },
      {
        label: "Receipts",
        href: `${moduleRoute}/receipts`,
      },
      {
        label: "Duplicates",
        href: `${moduleRoute}/duplicates`,
      },
      {
        label: "Reports",
        href: `${moduleRoute}/reports`,
      },
    ],
  };
}
