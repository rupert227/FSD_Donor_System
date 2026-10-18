import { DollarSign, Users, Flag, TrendingUp } from "lucide-react"
import { StatCard } from "@/components/dashboard/StatCard"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DashboardOverviewPage() {
  const metrics = {
    totalDonationsYtd: "$124,500",
    activeDonorsCount: 342,
    activeCampaignsCount: 4,
    averageGiftAmount: "$364",
  }

  const recentDonations = [
    {
      id: "don-1",
      donorName: "Eleanor Vance",
      amount: "$1,500.00",
      campaign: "Annual Scholarship Fund",
      date: "Today, 10:14 AM",
      status: "completed",
    },
    {
      id: "don-2",
      donorName: "Acme Foundation",
      amount: "$10,000.00",
      campaign: "Community Food Pantry",
      date: "Yesterday",
      status: "completed",
    },
    {
      id: "don-3",
      donorName: "Marcus Sterling",
      amount: "$250.00",
      campaign: "Emergency Relief Appeal",
      date: "Oct 12, 2026",
      status: "completed",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Executive Overview</h2>
        <p className="text-sm text-muted-foreground">
          Real-time summary of donor engagement and campaign fundraising metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Raised (YTD)"
          value={metrics.totalDonationsYtd}
          description="+18.2% compared to last year"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <StatCard
          title="Active Donors"
          value={metrics.activeDonorsCount}
          description="48 new donors this quarter"
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          title="Active Campaigns"
          value={metrics.activeCampaignsCount}
          description="2 ending within 30 days"
          icon={<Flag className="w-4 h-4" />}
        />
        <StatCard
          title="Average Gift Size"
          value={metrics.averageGiftAmount}
          description="+5.4% average increase"
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Contributions</CardTitle>
          <CardDescription>
            Latest donations processed across all active campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {recentDonations.map((donation) => (
              <div
                key={donation.id}
                className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium leading-none">{donation.donorName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {donation.campaign} • {donation.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{donation.amount}</span>
                  <Badge variant="outline" className="capitalize text-xs">
                    {donation.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
