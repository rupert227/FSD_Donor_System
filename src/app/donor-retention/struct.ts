import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Donor Retention";
export const moduleRoute = "/donor-retention"

export const navbarPreset: NavbarPreset = {
  selectedModuleIndex: 2,

  tabs: [
    {
      label: "Donors",
      href: `${moduleRoute}/donors`
    },
    {
      label: "Renewals",
      href: `${moduleRoute}/renewals`
    },
    {
      label: "Reports",
      href: `${moduleRoute}/reports`
    }
  ]
}
