export type UserRole = "admin" | "staff" | "viewer"

export type DonorType = "individual" | "corporate" | "foundation"
export type DonorStatus = "active" | "lapsed" | "prospective"

export type CampaignStatus = "draft" | "active" | "completed" | "paused"

export type PaymentMethod = "credit_card" | "bank_transfer" | "check" | "cash" | "other"
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

export interface UserRow {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface DonorRow {
  id: string
  first_name: string
  last_name: string
  organization_name: string | null
  email: string
  phone: string | null
  type: DonorType
  status: DonorStatus
  address: string | null
  total_contributions: number
  created_at: string
  updated_at: string
}

export interface CampaignRow {
  id: string
  title: string
  description: string | null
  target_amount: number
  raised_amount: number
  start_date: string
  end_date: string | null
  status: CampaignStatus
  created_at: string
  updated_at: string
}

export interface DonationRow {
  id: string
  donor_id: string
  campaign_id: string | null
  amount: number
  currency: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  transaction_reference: string | null
  donated_at: string
  notes: string | null
  created_at: string
  updated_at: string
}
