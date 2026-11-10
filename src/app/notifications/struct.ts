import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Notifications";
export const moduleRoute = "/notifications";

export function getNavbarPreset(): NavbarPreset {
  return {
    tabs: [
      {
        label: "Notifications",
        href: `${moduleRoute}`,
      },
    ],
  };
}
