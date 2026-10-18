import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication | FSD Donor System",
  description: "Sign in to access the FSD Donor Management portal.",
}

export default function AuthenticationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
