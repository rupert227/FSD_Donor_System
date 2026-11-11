import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Donor Retention";
export const moduleRoute = "/donor-retn";

export function getNavbarPreset(selectedTabIndex: number = 0): NavbarPreset {
  return {
    selectedModuleIndex: 2,
    selectedTabIndex,
    tabs: [
      {
        label: "Donors",
        href: `${moduleRoute}/donors`,
      },
      {
        label: "Renewals",
        href: `${moduleRoute}/renewals`,
      },
      {
        label: "Reports",
        href: `${moduleRoute}/reports`,
      },
    ],
  };
}
