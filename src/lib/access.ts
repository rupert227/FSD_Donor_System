// Who can open what. The only place the role-to-module rules live (decision D-8).
// No imports on purpose: the proxy, the login action and the navbar all use it.

export type UserRole =
  | "Conversion Officer"
  | "Retention Officer"
  | "Donor Care Officer"
  | "Division Head"
  | "System Administrator";

export type ModuleKey = "dashboard" | "donor-conv" | "donor-retn" | "donor-care";

// The URL prefix of each module.
const MODULE_PATH: Record<ModuleKey, string> = {
  dashboard: "/dashboard",
  "donor-conv": "/donor-conv",
  "donor-retn": "/donor-retn",
  "donor-care": "/donor-care",
};

// The first page of each module. Matches the module switcher in the navbar.
const MODULE_HOME: Record<ModuleKey, string> = {
  dashboard: "/dashboard",
  "donor-conv": "/donor-conv/prospects",
  "donor-retn": "/donor-retn/donors",
  "donor-care": "/donor-care/transactions",
};

const ALL_MODULES: ModuleKey[] = ["dashboard", "donor-conv", "donor-retn", "donor-care"];

// Which modules each role can open, and which one it lands on after signing in.
const ROLE_ACCESS: Record<UserRole, { modules: ModuleKey[]; home: ModuleKey }> = {
  "Conversion Officer": { modules: ["donor-conv"], home: "donor-conv" },
  "Retention Officer": { modules: ["donor-retn"], home: "donor-retn" },
  "Donor Care Officer": { modules: ["donor-care"], home: "donor-care" },
  "Division Head": { modules: ALL_MODULES, home: "dashboard" },
  "System Administrator": { modules: ALL_MODULES, home: "dashboard" },
};

// Pages anyone can open without signing in.
const PUBLIC_PATHS = ["/login", "/forgot-password", "/auth/callback", "/api/health"];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && value in ROLE_ACCESS;
}

export function allowedModules(role: UserRole): ModuleKey[] {
  return ROLE_ACCESS[role].modules;
}

export function canAccess(role: UserRole, module: ModuleKey): boolean {
  return ROLE_ACCESS[role].modules.includes(module);
}

export function homePathFor(role: UserRole): string {
  return MODULE_HOME[ROLE_ACCESS[role].home];
}

// API routes that belong to a module, so another role cannot call them directly.
// /api/health is not listed: it stays public.
const MODULE_API_PATH: Partial<Record<ModuleKey, string[]>> = {
  "donor-conv": ["/api/lead-pipeline-report"],
};

function isUnder(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

// Which module a URL belongs to. Shared pages (notifications, preferences) belong to none.
export function moduleForPath(pathname: string): ModuleKey | undefined {
  return ALL_MODULES.find(
    (key) =>
      isUnder(pathname, MODULE_PATH[key]) ||
      (MODULE_API_PATH[key] ?? []).some((path) => isUnder(pathname, path)),
  );
}

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
