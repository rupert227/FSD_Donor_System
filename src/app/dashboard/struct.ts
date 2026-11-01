import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Dashboard";
export const moduleRoute = "/dashboard";

export const navbarPreset: NavbarPreset = {
  selectedModuleIndex: 0,

  tabs: [
    {
      label: "Overview",
      href: `${moduleRoute}`
    },
    {
      label: "Prospects",
      href: `${moduleRoute}/prospects`
    },
    {
      label: "Donors",
      href: `${moduleRoute}/donors`
    },
    {
      label: "Transactions",
      href: `${moduleRoute}/transactions`
    },
    {
      label: "Reports",
      href: `${moduleRoute}/reports`
    }
  ]
}
