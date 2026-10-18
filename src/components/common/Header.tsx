"use client"

import { useTransition } from "react"
import { LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOutAction } from "@/actions/authentication"

export function Header() {
  const [isPending, startTransition] = useTransition()

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction()
    })
  }

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-semibold text-foreground">Donor Management Portal</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>Admin User</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={isPending}
          className="gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isPending ? "Signing out..." : "Sign Out"}</span>
        </Button>
      </div>
    </header>
  )
}
