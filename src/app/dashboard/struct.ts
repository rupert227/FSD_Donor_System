import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Dashboard";
export const moduleRoute = "/dashboard";

export const navbarPreset: NavbarPreset = {
  selectedModuleIndex: 0,

  tabs: [
    {
      label: "Dashboard",
      href: `${moduleRoute}`,
    },
  ],
};
