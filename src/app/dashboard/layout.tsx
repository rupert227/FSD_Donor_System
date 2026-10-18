import type { Metadata } from "next"
import { Sidebar } from "@/components/common/Sidebar"
import { Header } from "@/components/common/Header"

export const metadata: Metadata = {
  title: "Dashboard | FSD Donor System",
  description: "Manage donors, track contributions, and oversee fundraising campaigns.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
