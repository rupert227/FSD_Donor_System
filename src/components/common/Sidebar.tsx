"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, HeartHandshake, Flag, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navigationLinks = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Donors", href: "/dashboard/donors", icon: Users },
  { name: "Donations", href: "/dashboard/donations", icon: HeartHandshake },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Flag },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 min-h-screen">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            F
          </div>
          <span className="font-semibold text-lg tracking-tight">FSD Donor</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigationLinks.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
          <Settings className="w-4 h-4" />
          <span>v0.1.0</span>
        </div>
      </div>
    </aside>
  )
}
