import { NavbarPreset } from "@/components/Navbar";

export const moduleName = "Donor Care";
export const moduleRoute = "/donor-care"

export const navbarPreset: NavbarPreset = {
  selectedModuleIndex: 3,

  tabs: [
    {
      label: "Transactions",
      href: `${moduleRoute}/transactions`
    },
    {
      label: "Receipts",
      href: `${moduleRoute}/receipts`
    },
    {
      label: "Data Quality",
      href: `${moduleRoute}/data-quality`
    },
    {
      label: "Reports",
      href: `${moduleRoute}/reports`
    },
  ]
}
