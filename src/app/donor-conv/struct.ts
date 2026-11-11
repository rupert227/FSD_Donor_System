import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Donor Conversion";
export const moduleRoute = "/donor-conv";

export function getNavbarPreset(selectedTabIndex: number = 0): NavbarPreset {
  return {
    selectedModuleIndex: 1,
    selectedTabIndex,
    tabs: [
      {
        label: "Prospects",
        href: `${moduleRoute}/prospects`,
      },
      {
        label: "Proposals",
        href: `${moduleRoute}/proposals`,
      },
      {
        label: "Reports",
        href: `${moduleRoute}/reports`,
      },
    ],
  };
}

export const navbarPreset = getNavbarPreset(0);
