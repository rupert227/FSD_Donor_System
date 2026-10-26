# FSD Donor System - Screen Specifications

## Folder Structure Overview

Screens are organized into 5 functional parent folders using kebab-case (`-`) for clean URL routing:
- **`auth-user`**: Direct route for authentication and access portal
- **`dashboard`**: Direct route for division-level executive dashboard
- **`conv-unit`**: Conversion Division operations and lead management
- **`retn-unit`**: Retention Division operations and donor management
- **`care-unit`**: Donor Care Division operations and remittance management

Reports and previews are organized hierarchically, with `report-preview` nested directly under the corresponding unit's `analytics-report` folder.

---

## 1. `auth-user`
- **Authentication Portal**: [`src/app/auth-user/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/auth-user/page.tsx) (`/auth-user`)

---

## 2. `dashboard`
- **Division Dashboard**: [`src/app/dashboard/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/dashboard/page.tsx) (`/dashboard`)

---

## 3. `conv-unit` (Conversion Division)
- **Lead Prospects List**: [`src/app/conv-unit/lead-prospects-list/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv-unit/lead-prospects-list/page.tsx) (`/conv-unit/lead-prospects-list`)
- **Create Lead Profile**: [`src/app/conv-unit/create-lead-profile/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv-unit/create-lead-profile/page.tsx) (`/conv-unit/create-lead-profile`)
- **Update Lead Profile**: [`src/app/conv-unit/update-lead-profile/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv-unit/update-lead-profile/page.tsx) (`/conv-unit/update-lead-profile`)
- **Generate Proposals**: [`src/app/conv-unit/generate-proposals/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv-unit/generate-proposals/page.tsx) (`/conv-unit/generate-proposals`)
- **Analytics Report**: [`src/app/conv-unit/analytics-report/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv-unit/analytics-report/page.tsx) (`/conv-unit/analytics-report`)
- **Report Preview**: [`src/app/conv-unit/analytics-report/report-preview/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/conv-unit/analytics-report/report-preview/page.tsx) (`/conv-unit/analytics-report/report-preview`)

---

## 4. `retn-unit` (Retention Division)
- **Donor Profiles List**: [`src/app/retn-unit/donor-profiles-list/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn-unit/donor-profiles-list/page.tsx) (`/retn-unit/donor-profiles-list`)
- **View Donor Profile**: [`src/app/retn-unit/view-donor-profile/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn-unit/view-donor-profile/page.tsx) (`/retn-unit/view-donor-profile`)
- **Update Donor Profile**: [`src/app/retn-unit/update-donor-profile/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn-unit/update-donor-profile/page.tsx) (`/retn-unit/update-donor-profile`)
- **Generate Renewals**: [`src/app/retn-unit/generate-renewals/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn-unit/generate-renewals/page.tsx) (`/retn-unit/generate-renewals`)
- **Analytics Report**: [`src/app/retn-unit/analytics-report/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn-unit/analytics-report/page.tsx) (`/retn-unit/analytics-report`)
- **Report Preview**: [`src/app/retn-unit/analytics-report/report-preview/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/retn-unit/analytics-report/report-preview/page.tsx) (`/retn-unit/analytics-report/report-preview`)

---

## 5. `care-unit` (Donor Care Division)
- **Transactions List**: [`src/app/care-unit/transactions-list/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care-unit/transactions-list/page.tsx) (`/care-unit/transactions-list`)
- **Add New Transaction**: [`src/app/care-unit/add-new-transaction/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care-unit/add-new-transaction/page.tsx) (`/care-unit/add-new-transaction`)
- **Clean Dupe Records**: [`src/app/care-unit/clean-dupe-records/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care-unit/clean-dupe-records/page.tsx) (`/care-unit/clean-dupe-records`)
- **Dispatch Receipts**: [`src/app/care-unit/dispatch-receipts/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care-unit/dispatch-receipts/page.tsx) (`/care-unit/dispatch-receipts`)
- **Analytics Report**: [`src/app/care-unit/analytics-report/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care-unit/analytics-report/page.tsx) (`/care-unit/analytics-report`)
- **Report Preview**: [`src/app/care-unit/analytics-report/report-preview/page.tsx`](file:///C:/Users/rupert/local/.open-source-repo/FSD_Donor_System/src/app/care-unit/analytics-report/report-preview/page.tsx) (`/care-unit/analytics-report/report-preview`)
