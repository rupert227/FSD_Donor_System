import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Preferences";
export const moduleRoute = "/preferences";

export function getNavbarPreset(): NavbarPreset {
  return {
    tabs: [
      {
        label: "Preferences",
        href: `${moduleRoute}`,
      },
    ],
  };
}
