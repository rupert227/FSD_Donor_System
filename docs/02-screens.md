# FSD Donor System - Screen Specifications

## Folder Structure Overview

Screens are organized into 5 functional parent folders:
- **`auth_user`**: Direct route for authentication and access portal
- **`dashboard`**: Direct route for division-level executive dashboard
- **`conv_unit`**: Conversion Division operations and lead management
- **`retn_unit`**: Retention Division operations and donor management
- **`care_unit`**: Donor Care Division operations and remittance management

Reports and previews are organized hierarchically, with `report_preview` nested directly under the corresponding unit's `analytics_report` folder.

---

## 1. `auth_user`
- **Authentication Portal**: [`src/app/auth_user/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/auth_user/page.tsx) (`/auth_user`)

---

## 2. `dashboard`
- **Division Dashboard**: [`src/app/dashboard/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/dashboard/page.tsx) (`/dashboard`)

---

## 3. `conv_unit` (Conversion Division)
- **Lead Prospects List**: [`src/app/conv_unit/lead_prospects_list/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv_unit/lead_prospects_list/page.tsx) (`/conv_unit/lead_prospects_list`)
- **Create Lead Profile**: [`src/app/conv_unit/create_lead_profile/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv_unit/create_lead_profile/page.tsx) (`/conv_unit/create_lead_profile`)
- **Update Lead Profile**: [`src/app/conv_unit/update_lead_profile/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv_unit/update_lead_profile/page.tsx) (`/conv_unit/update_lead_profile`)
- **Generate Proposals**: [`src/app/conv_unit/generate_proposals/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv_unit/generate_proposals/page.tsx) (`/conv_unit/generate_proposals`)
- **Analytics Report**: [`src/app/conv_unit/analytics_report/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv_unit/analytics_report/page.tsx) (`/conv_unit/analytics_report`)
- **Report Preview**: [`src/app/conv_unit/analytics_report/report_preview/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv_unit/analytics_report/report_preview/page.tsx) (`/conv_unit/analytics_report/report_preview`)

---

## 4. `retn_unit` (Retention Division)
- **Donor Profiles List**: [`src/app/retn_unit/donor_profiles_list/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn_unit/donor_profiles_list/page.tsx) (`/retn_unit/donor_profiles_list`)
- **View Donor Profile**: [`src/app/retn_unit/view_donor_profile/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn_unit/view_donor_profile/page.tsx) (`/retn_unit/view_donor_profile`)
- **Update Donor Profile**: [`src/app/retn_unit/update_donor_profile/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn_unit/update_donor_profile/page.tsx) (`/retn_unit/update_donor_profile`)
- **Generate Renewals**: [`src/app/retn_unit/generate_renewals/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn_unit/generate_renewals/page.tsx) (`/retn_unit/generate_renewals`)
- **Analytics Report**: [`src/app/retn_unit/analytics_report/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn_unit/analytics_report/page.tsx) (`/retn_unit/analytics_report`)
- **Report Preview**: [`src/app/retn_unit/analytics_report/report_preview/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn_unit/analytics_report/report_preview/page.tsx) (`/retn_unit/analytics_report/report_preview`)

---

## 5. `care_unit` (Donor Care Division)
- **Transactions List**: [`src/app/care_unit/transactions_list/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care_unit/transactions_list/page.tsx) (`/care_unit/transactions_list`)
- **Add New Transaction**: [`src/app/care_unit/add_new_transaction/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care_unit/add_new_transaction/page.tsx) (`/care_unit/add_new_transaction`)
- **Clean Dupe Records**: [`src/app/care_unit/clean_dupe_records/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care_unit/clean_dupe_records/page.tsx) (`/care_unit/clean_dupe_records`)
- **Dispatch Receipts**: [`src/app/care_unit/dispatch_receipts/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care_unit/dispatch_receipts/page.tsx) (`/care_unit/dispatch_receipts`)
- **Analytics Report**: [`src/app/care_unit/analytics_report/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care_unit/analytics_report/page.tsx) (`/care_unit/analytics_report`)
- **Report Preview**: [`src/app/care_unit/analytics_report/report_preview/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care_unit/analytics_report/report_preview/page.tsx) (`/care_unit/analytics_report/report_preview`)
