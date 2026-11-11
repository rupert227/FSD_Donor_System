# FSD Donor System

The Fundraising and Stewardship Division (FSD) Donor System for Caritas Manila — built with Next.js App Router, React 19, TypeScript, Tailwind CSS, and Supabase.

---

## Tech Stack

- **Framework**: Next.js (App Router, Turbopack)
- **Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase / PostgreSQL
- **Icons**: Lucide React
- **Fonts**: IBM Plex Sans (system base)

---

## Project Structure

```text
FSD_Donor_System/
├── docs/                                  # System specifications and documentation
│   ├── 00-overview.md                     # System conventions and architecture guidelines
│   └── 01-schema.md                       # Database schema and entity models
│
├── public/                                # Static web assets and brand icons
│
├── src/                                   # Application source code
│   ├── app/                               # Next.js App Router
│   │   ├── layout.tsx                     # Root shell, metadata & typography provider
│   │   ├── globals.css                    # Tailwind CSS tokens and global base styles
│   │   ├── page.tsx                       # Root route redirect
│   │   │
│   │   ├── dashboard/                     # Executive division overview
│   │   │   ├── page.tsx                   # Division-wide KPI summary metrics
│   │   │   └── struct.ts                  # Preset navigation configuration
│   │   │
│   │   ├── donor-conv/                    # Donor Conversion Division (Module 1)
│   │   │   ├── prospects/                 # Lead directory and intake
│   │   │   │   ├── _components/           # Prospect-specific form controls & dropdowns
│   │   │   │   ├── utils/                 # Feasibility & probability scoring helpers
│   │   │   │   ├── page.tsx               # Prospects directory list with 6-facet filter
│   │   │   │   ├── add-prospect/          # Lead intake registration form
│   │   │   │   ├── edit-prospect/         # Record view, inline editor & call tracking
│   │   │   │   └── pipeline-board/        # Visual conversion pipeline board
│   │   │   ├── proposals/                 # Proposal builder and tracking
│   │   │   │   ├── page.tsx               # Proposals registry
│   │   │   │   └── send-proposal/         # Proposal commitment document generator
│   │   │   ├── reports/                   # Conversion reporting
│   │   │   │   ├── page.tsx               # Lead pipeline analytics report
│   │   │   │   └── preview-report/        # PDF/print report preview
│   │   │   └── struct.ts                  # Unit navigation and tab configuration
│   │   │
│   │   ├── donor-retn/                    # Donor Retention Division (Module 2)
│   │   │   ├── donors/                    # Active donor stewardship
│   │   │   │   ├── page.tsx               # Active donors registry
│   │   │   │   ├── add-donor/             # Register active donor profile
│   │   │   │   └── edit-donor/            # Update donor record and preferences
│   │   │   ├── renewals/                  # Donor recommitment appeals
│   │   │   │   ├── page.tsx               # Renewals tracking list
│   │   │   │   └── send-renewal/          # Recommitment package generator
│   │   │   ├── reports/                   # Retention reporting
│   │   │   │   ├── page.tsx               # Retention analytics and tenure report
│   │   │   │   └── preview-report/        # PDF/print report preview
│   │   │   └── struct.ts                  # Unit navigation and tab configuration
│   │   │
│   │   ├── donor-care/                    # Donor Care Division (Module 3)
│   │   │   ├── transactions/              # Remittance ledgers and bank deposits
│   │   │   │   ├── page.tsx               # Remittance transaction history
│   │   │   │   ├── add-transaction/       # Record new donation remittance
│   │   │   │   └── edit-transaction/      # Adjust remittance details
│   │   │   ├── duplicates/                # Data hygiene and reconciliation
│   │   │   │   └── page.tsx               # Duplicate records resolution workspace
│   │   │   ├── receipts/                  # Official receipts and tax certificates
│   │   │   │   ├── page.tsx               # Receipt dispatch log
│   │   │   │   └── send-receipt/          # Tax certificate generation
│   │   │   ├── reports/                   # Donor care reporting
│   │   │   │   ├── page.tsx               # Care operations summary report
│   │   │   │   └── preview-report/        # PDF/print report preview
│   │   │   └── struct.ts                  # Unit navigation and tab configuration
│   │   │
│   │   ├── notifications/                 # User alerts and system updates
│   │   │   ├── page.tsx                   # Notification inbox
│   │   │   └── struct.ts                  # Preset navigation configuration
│   │   │
│   │   ├── preferences/                   # User and application settings
│   │   │   ├── page.tsx                   # Account preferences interface
│   │   │   └── struct.ts                  # Preset navigation configuration
│   │   │
│   │   └── api/                           # API Route Handlers
│   │       ├── health/                    # Health check endpoint
│   │       └── lead-pipeline-report/      # Lead pipeline data endpoint
│   │
│   ├── components/                        # Shared UI components
│   │   ├── AppShell.tsx                   # Standard application layout wrapper
│   │   ├── Navbar.tsx                     # Global navigation bar, module switcher & user menu
│   │   └── prefabs.tsx                    # Shared card and layout container primitives
│   │
│   ├── lib/                               # Data adapters and utilities
│   │   ├── database/                      # Database client instances and helpers
│   │   ├── supabase/                      # Supabase browser and server client instances
│   │   ├── types.ts                       # Module configuration types
│   │   └── utils.ts                       # Class name merger helper (`cn`)
│   │
│   └── types/                             # TypeScript definitions
│       ├── database.ts                    # Supabase database table definitions
│       └── index.ts                       # Application domain interfaces and DTOs
│
├── supabase/                              # Database migrations & seed data
│   ├── schema.sql                         # PostgreSQL schema and enum definitions
│   └── seeds/                             # Canonical seed records replacing legacy mocks
│       ├── prospects-seed.sql             # SQL seed statements
│       └── prospects-seed.ts              # Typed seed fixtures and helpers
│
├── .env.example                           # Environment variables template
├── .env.local                             # Local environment secrets (gitignored)
├── .gitignore                             # Git exclusions
├── components.json                        # UI components configuration
├── eslint.config.mjs                      # ESLint static analysis configuration
├── next.config.ts                         # Next.js framework configuration
├── package.json                           # Project dependencies and npm scripts
├── prettier.config.js                     # Prettier formatting rules
└── tsconfig.json                          # TypeScript compiler rules
```

---

## Getting Started

### 1. Installation

```bash
git clone <repository-url>
cd FSD_Donor_System
npm install
```

### 2. Environment Setup

Create `.env.local` based on `.env.example`:

```bash
cp .env.example .env.local
```

Required keys:

```ini
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://user:password@localhost:5432/fsd_donor_db
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Scripts

- `npm run dev` - Starts the development server with Turbopack
- `npm run build` - Builds the application for production
- `npm run start` - Runs the compiled production build locally
- `npm run lint` - Runs ESLint to check for code quality issues
