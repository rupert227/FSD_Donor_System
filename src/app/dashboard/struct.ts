import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Dashboard";
export const moduleRoute = "/dashboard";

export function getNavbarPreset(selectedTabIndex: number = 0): NavbarPreset {
  return {
    selectedModuleIndex: 0,
    selectedTabIndex,
    tabs: [
      {
        label: "Dashboard",
        href: `${moduleRoute}`,
      },
    ],
  };
}