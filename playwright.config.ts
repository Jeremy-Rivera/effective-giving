import { defineConfig } from "@playwright/test";

// Run with `npm run test:e2e`, which builds first. Five servers:
//   :54321  fake Supabase (supabase/schema.sql in PGlite) for the acceptance tests
//   :3100   production build wired to it; logs to .playwright/app.log
//   :3101   production build with NO Supabase env (must refuse to "succeed")
//   :54322  a second fake Supabase, for the phone matrix
//   :3102   production build wired to it
// The acceptance tests count rows in their database, so they run one at a
// time; the phone matrix has its own database and runs in parallel.
const KEY = "test-service-role-key";

export default defineConfig({
  testDir: "tests",
  workers: 4,
  timeout: 90_000,
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    { name: "rules", testMatch: /rules\.spec\.ts/ },
    { name: "acceptance", testMatch: /acceptance\.spec\.ts/, use: { browserName: "chromium" } },
    { name: "mobile-chromium", testMatch: /mobile\.spec\.ts/, use: { browserName: "chromium" } },
    { name: "mobile-webkit", testMatch: /mobile\.spec\.ts/, use: { browserName: "webkit" } },
    { name: "load", testMatch: /load\.spec\.ts/ },
  ],
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
    {
      command: "node tests/fake-supabase.mjs",
      url: "http://localhost:54322/__test/rows",
      env: { SUPABASE_SERVICE_ROLE_KEY: KEY, FAKE_SUPABASE_PORT: "54322" },
      reuseExistingServer: false,
    },
    {
      command: "npx next start -p 3102",
      url: "http://localhost:3102",
      env: { SUPABASE_URL: "http://localhost:54322", SUPABASE_SERVICE_ROLE_KEY: KEY },
      reuseExistingServer: false,
    },
  ],
});
