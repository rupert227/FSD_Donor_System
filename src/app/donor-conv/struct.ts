import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Donor Conversion";
export const moduleRoute = "/donor-conv";

export const navbarPreset: NavbarPreset = {
  selectedModuleIndex: 1,

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
