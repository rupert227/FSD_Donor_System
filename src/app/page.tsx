import Link from "next/link"
import { ArrowRight, HeartHandshake, ShieldCheck, BarChart3 } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            F
          </div>
          <span className="font-semibold text-lg tracking-tight">FSD Donor System</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/authentication" className={buttonVariants({ variant: "ghost" })}>
            Sign In
          </Link>
          <Link href="/dashboard" className={buttonVariants()}>
            Access Portal
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground mb-6">
          <span>Nonprofit & Donor Management Platform</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-balance mb-6">
          Empowering mission-driven organizations to scale donor engagement
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8 text-balance">
          Centralize donor relationships, track campaign gifts in real time, and gain actionable
          insights with the modern FSD Donor System.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/dashboard" className={buttonVariants({ size: "lg", className: "gap-2" })}>
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/authentication" className={buttonVariants({ size: "lg", variant: "outline" })}>
            Staff Login
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="p-6 rounded-xl border border-border bg-card">
            <HeartHandshake className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-base mb-1">Donor Relations</h3>
            <p className="text-sm text-muted-foreground">
              Maintain unified profiles, contact histories, and lifetime giving records for all donors.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card">
            <BarChart3 className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-base mb-1">Campaign Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track targets, gift sizes, and progress meters across all fundraising initiatives.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card">
            <ShieldCheck className="w-8 h-8 text-primary mb-3" />
            <h3 className="font-semibold text-base mb-1">Secure & Compliant</h3>
            <p className="text-sm text-muted-foreground">
              Role-based access control, server action mutations, and audit trails.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 px-6 text-center text-xs text-muted-foreground">
        © 2026 FSD Donor System. Built with Next.js App Router, Tailwind CSS & shadcn/ui.
      </footer>
    </div>
  )
}
