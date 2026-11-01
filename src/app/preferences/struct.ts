import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Preferences";
export const moduleRoute = "/preferences";

export const navbarPreset: NavbarPreset = {
  selectedModuleIndex: 5,

  tabs: [
    {
      label: "Preferences",
      href: `${moduleRoute}`
    },
  ]
}
