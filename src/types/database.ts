/**
 * Database TypeScript definitions for FSD Donor System (Caritas Manila)
 * Derived strictly from docs/01-schema.md
 */

export type MonthEnum =
  | 'JAN'
  | 'FEB'
  | 'MAR'
  | 'APR'
  | 'MAY'
  | 'JUN'
  | 'JUL'
  | 'AUG'
  | 'SEP'
  | 'OCT'
  | 'NOV'
  | 'DEC'

export type RecordStatusEnum = 'Active' | 'Inactive' | 'Archived'

export type DonorTypeEnum = 'individual' | 'corporate' | 'community' | 'international'

export type LeadSourceOriginEnum =
  | 'Referral'
  | 'Research'
  | 'Booths'
  | 'Direct Call'
  | 'Walk-in'

export type TargetCampaignEnum =
  | 'Youth Servant Leadership'
  | 'Health and Disaster Relief'
  | 'In-Kind Social Enterprise'
  | 'At-Risk Restorative Justice'
  | 'Institute for Stewardship'

export type PipelineStatusEnum =
  | 'New Lead'
  | 'Under Research'
  | 'Outreach Started'
  | 'Proposal Sent'
  | 'Secured Donor'

export type EngagementStatusEnum =
  | 'Uncontacted'
  | 'Followed-up'
  | 'Renewal Started'
  | 'Recommitted'
  | 'Lapsed Donor'

export type DonorTenureEnum =
  | '3+ Years Loyal'
  | '2 Years Retained'
  | '1 Year Retained'
  | 'New Renewal'

export type SourceOfFundsEnum =
  | 'Corporate Partners'
  | 'Direct (Individual)'
  | 'Church Institutions'
  | 'Community/Association'
  | 'Social Enterprise'

export type PaymentMethodEnum =
  | 'Bank Transfer'
  | 'Check Payment'
  | 'Direct Deposit'
  | 'Cash'

export type TreasuryClearanceStatusEnum =
  | 'Receipt Verification'
  | 'Certificate Creation'
  | 'Dispatch Prepared'
  | 'Transaction Finalized'

export type DeliveryPreferenceEnum =
  | 'Email PDF (Softcopy)'
  | 'Postal Mail'
  | 'Hand Delivered'

export type UserRoleEnum =
  | 'Conversion Officer'
  | 'Retention Officer'
  | 'Donor Care Officer'
  | 'Division Head'
  | 'System Administrator'

export type AccountStatusEnum = 'Active' | 'Suspended'

// 1. lead_prospects
export interface LeadProspect {
  id: number
  month: MonthEnum | null
  status: RecordStatusEnum | null
  prospect_name: string
  donor_type: DonorTypeEnum
  lead_source_origin: LeadSourceOriginEnum
  primary_contact_person: string
  title_designation: string | null
  email_address: string | null
  phone_number: string
  street_address: string | null
  city_province: string | null
  target_campaign: TargetCampaignEnum
  target_amount: number
  pipeline_status: PipelineStatusEnum
  probability_score: number
  assigned_officer: string
  target_followup_date: string | null
  next_step_action_plan: string | null
  created_at: string
  updated_at: string
}

// 2. donor_profiles
export interface DonorProfile {
  id: number
  donor_name: string
  donor_type: DonorTypeEnum
  primary_contact_person: string
  title_designation: string | null
  email_address: string
  mobile_number: string
  tax_id: string | null
  delivery_address: string
  target_campaign: TargetCampaignEnum
  engagement_status: EngagementStatusEnum
  donor_tenure: DonorTenureEnum
  assigned_officer: string
  last_contact_date: string | null
  target_followup_date: string | null
  created_at: string
  updated_at: string
}

// 3. transactions
export interface Transaction {
  id: number
  donor_id: number
  source_of_funds: SourceOfFundsEnum
  campaign_name: TargetCampaignEnum
  amount_pledge: number
  amount_collected: number
  transaction_date: string
  payment_method: PaymentMethodEnum
  deposit_bank: string
  bank_reference_no: string
  official_receipt_no: string
  tax_certificate_no: string | null
  cod_requested: boolean
  treasury_clearance_status: TreasuryClearanceStatusEnum
  deposit_clearance_date: string | null
  fulfillment_date: string | null
  created_at: string
  updated_at: string
}

// 4. certificate_of_donation
export interface CertificateOfDonation {
  id: number
  certificate_no: string
  transaction_id: number
  donor_id: number
  certified_amount: number
  issuance_date: string
  delivery_preference: DeliveryPreferenceEnum
  dispatch_date: string | null
  created_at: string
  updated_at: string
}

// 5. user_accounts
export interface UserAccount {
  id: number
  email_address: string
  password_hash: string
  user_role: UserRoleEnum
  account_status: AccountStatusEnum
  created_at: string
  updated_at: string
}
