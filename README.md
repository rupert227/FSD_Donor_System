# FSD Donor System

A Next.js App Router application built with React 19, TypeScript, Tailwind CSS, and shadcn/ui.

---

## Tech Stack

- **Framework**: Next.js (App Router, Turbopack)
- **Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui primitives
- **Icons**: Lucide React

---

## Project Structure

```text
FSD_Donor_System/
├── docs/                        # Architecture and system specifications
│   ├── 00-overview.md           # Architecture rules and system conventions
│   ├── 01-schema.md             # Database schema design and entity models
│   └── 02-screens.md            # Route specifications and screen contracts
│
├── public/                      # Static web assets and brand SVG icons
│
├── src/                         # Application source code
│   ├── middleware.ts            # Route guards and authentication redirects
│   │
│   ├── actions/                 # Server Actions for business logic mutations
│   │
│   ├── app/                     # Next.js App Router (pages and layouts)
│   │   ├── layout.tsx           # Root HTML shell and global font provider
│   │   ├── globals.css          # Tailwind CSS tokens and utility layers
│   │   ├── page.tsx             # Public landing page and marketing hero
│   │   │
│   │   ├── authentication/      # Authentication portal
│   │   │   ├── layout.tsx       # Centered layout container for auth views
│   │   │   └── page.tsx         # Sign-in and account access interface
│   │   │
│   │   ├── dashboard/           # Authenticated management workspace
│   │   │   ├── layout.tsx       # Shell with responsive header and sidebar
│   │   │   └── page.tsx         # Analytics overview and metrics dashboard
│   │   │
│   │   └── api/                 # API Route Handlers
│   │       └── health/          # Health check endpoint
│   │           └── route.ts     # Health status endpoint handler
│   │
│   ├── components/              # Modular React UI components
│   │   ├── authentication/      # Authentication widgets and login forms
│   │   │   └── AuthForm.tsx     # Sign-in form with client-side validation
│   │   │
│   │   ├── common/              # Shared application chrome components
│   │   │   ├── Header.tsx       # Top navigation bar and user profile menu
│   │   │   └── Sidebar.tsx      # Navigation sidebar with route indicators
│   │   │
│   │   ├── dashboard/           # Dashboard data displays and widgets
│   │   │   └── StatCard.tsx     # KPI summary card with trend indicators
│   │   │
│   │   └── ui/                  # Reusable atomic shadcn/ui primitives
│   │       ├── badge.tsx        # Status pill and categorical badge tag
│   │       ├── button.tsx       # Interactive button with variant styles
│   │       ├── card.tsx         # Container panel with header and content
│   │       └── input.tsx        # Text input field with focus state styles
│   │
│   ├── lib/                     # Utilities and backend client connections
│   │   ├── db/                  # Database configuration and initializers
│   │   │   └── index.ts         # Connection pool settings and client export
│   │   └── utils.ts             # Class name merger helper (`cn = clsx + twMerge`)
│   │
│   └── types/                   # TypeScript interfaces and entity types
│       ├── database.ts          # Core database tables and status enum types
│       └── index.ts             # Shared application contracts and DTO types
│
├── .env.example                 # Environment variables template
├── .env.local                   # Local configuration secrets (gitignored)
├── .gitignore                   # Git version control exclusions
├── components.json              # shadcn/ui component configuration
├── eslint.config.mjs            # ESLint static analysis configuration
├── next.config.ts               # Next.js framework configuration
├── package.json                 # Project manifest and package dependencies
└── tsconfig.json                # TypeScript compiler rules and path aliases
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

```bash
cp .env.example .env.local
```

Required keys in `.env.local`:

```ini
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=your_auth_secret_here
DATABASE_URL=postgresql://user:password@localhost:5432/fsd_donor_db
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Scripts

- `npm run dev` - Starts the local development server with Turbopack
- `npm run build` - Compiles the production application bundle
- `npm run start` - Runs the compiled production build locally
- `npm run lint` - Runs ESLint to check for code issues
