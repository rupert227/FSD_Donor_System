import type { UserRow, DonorRow, DonationRow } from "./database"

export * from "./database"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRow["role"]
}

export interface ActionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface DashboardMetrics {
  totalDonationsYtd: number
  activeDonorsCount: number
  activeCampaignsCount: number
  averageGiftAmount: number
}

export interface RecentDonationItem extends DonationRow {
  donor: Pick<DonorRow, "first_name" | "last_name" | "organization_name" | "email">
  campaignTitle?: string
}
