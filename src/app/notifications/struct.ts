import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Notifications";
export const moduleRoute = "/notifications";

export const navbarPreset: NavbarPreset = {
  tabs: [
    {
      label: "Notifications",
      href: `${moduleRoute}`,
    },
  ],
};
