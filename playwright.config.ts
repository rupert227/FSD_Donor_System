import { defineConfig } from "@playwright/test";

// End-to-end tests run against an already running app (npm run dev or docker compose up).
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  timeout: 45000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    headless: true,
  },
});
