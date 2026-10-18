import { test, expect } from "@playwright/test";
import { en } from "../lib/i18n/en";
import { drawScenarios } from "../lib/orgs";
import { completeAnswers } from "./helpers";

// Brief v2, section 8: many people consenting and submitting at once.
// 60 concurrent /api/assign calls, then 60 concurrent test-mode submissions
// (is_test = true, so supabase/delete-test-data.sql removes them).
//
//   Locally (part of npm run test:e2e): against :3102 and its fake database.
//   Against a deployed site:  LOAD_BASE=https://<preview-url> npx playwright test --project=load
// Note: the assign calls DO move the real counter; reset it before launch
// (last statement in supabase/delete-test-data.sql).

const BASE = process.env.LOAD_BASE ?? "http://localhost:3102";
const N = 60;

test("60 concurrent assignments and 60 concurrent submissions", async ({ request }) => {
  const t0 = Date.now();
  const assigned = await Promise.all(
    Array.from({ length: N }, () => request.post(`${BASE}/api/assign`).then(async (r) => ({ status: r.status(), body: await r.json().catch(() => null) }))),
  );
  const assignMs = Date.now() - t0;
  const ok = assigned.filter((a) => a.status === 200);
  const n = (c: string) => ok.filter((a) => a.body?.condition === c).length;
  console.log(`assign: ${ok.length}/${N} ok in ${assignMs} ms; control ${n("control")}, treatment ${n("treatment")}; errors: ${JSON.stringify(assigned.filter((a) => a.status !== 200).map((a) => a.status))}`);

  const now = new Date().toISOString();
  const payload = () => {
    const draw = drawScenarios();
    return {
      id: crypto.randomUUID(), condition: Math.random() < 0.5 ? "control" : "treatment", assignmentMethod: "test", isTest: true,
      startedAt: now, locale: "en", ...draw, expandedOrgIds: [draw.shownOrgIds[0]], viewportBucket: "mobile",
      consent: { age: "yes", jain: "yes", us: "yes", consentedAt: now, locale: "en" },
      email: "load-test@example.com", baseline: completeAnswers(en.survey.sections),
      video: { watchedFraction: 0.95, secondsOnPage: 300 }, videoId: "LOADTEST001",
      allocation: { [draw.shownOrgIds[0]]: 1001 }, allocationConfirmedAt: now, secondsOnAllocation: 60,
      post: { ...completeAnswers(en.post.sections), F2: draw.shownOrgIds[0] },
    };
  };
  const t1 = Date.now();
  const submitted = await Promise.all(Array.from({ length: N }, () => request.post(`${BASE}/api/submit`, { data: payload() }).then((r) => r.status())));
  const submitMs = Date.now() - t1;
  console.log(`submit: ${submitted.filter((s) => s === 200).length}/${N} ok in ${submitMs} ms; errors: ${JSON.stringify(submitted.filter((s) => s !== 200))}`);

  expect(ok).toHaveLength(N);
  expect(Math.abs(n("control") - n("treatment"))).toBeLessThanOrEqual(1);
  expect(submitted.every((s) => s === 200)).toBe(true);
});
