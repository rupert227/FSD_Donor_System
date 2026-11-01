import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Notifications";
export const moduleRoute = "/notifications";

export const navbarPreset: NavbarPreset = {
  selectedModuleIndex: 4,

  tabs: [
    {
      label: "Notifications",
      href: `${moduleRoute}`
    },
  ]
}
