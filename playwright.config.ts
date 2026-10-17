import { defineConfig } from "@playwright/test";

// Acceptance tests (feedback brief, section 9). Run with `npm run test:e2e`,
// which builds first. Three servers:
//   :54321  fake Supabase (supabase/schema.sql in PGlite)
//   :3100   production build wired to the fake Supabase; logs to .playwright/app.log
//   :3101   production build with NO Supabase env (must refuse to "succeed")
const KEY = "test-service-role-key";

export default defineConfig({
  testDir: "tests",
  workers: 1,
  timeout: 60_000,
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  webServer: [
    {
      command: "node tests/fake-supabase.mjs",
      url: "http://localhost:54321/__test/rows",
      env: { SUPABASE_SERVICE_ROLE_KEY: KEY },
      reuseExistingServer: false,
    },
    {
      command: "mkdir -p .playwright && npx next start -p 3100 > .playwright/app.log 2>&1",
      url: "http://localhost:3100",
      env: { SUPABASE_URL: "http://localhost:54321", SUPABASE_SERVICE_ROLE_KEY: KEY },
      reuseExistingServer: false,
    },
    {
      command: "npx next start -p 3101",
      url: "http://localhost:3101",
      env: { SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "" },
      reuseExistingServer: false,
    },
  ],
});
