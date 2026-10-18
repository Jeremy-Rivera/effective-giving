import { test, expect, type Request } from "@playwright/test";
import { readFileSync } from "node:fs";
import { ORGS } from "../lib/orgs";
import { en } from "../lib/i18n/en";
import {
  FAKE, answerEverything, completeAnswers, card, consent, continueButton, counter, expand, fakeYouTube, fullRun, give, giveAndFinish,
  reset, rows, session, setCondition, survey, useTap, watch,
} from "./helpers";

// Acceptance tests for brief v2 (section 9), plus the earlier ones that still
// apply. They share one fake database; tests in one file run one at a time
// in a single worker (Playwright's default without fullyParallel).
test.beforeEach(async () => { useTap(false); await reset(); });

const EA = new Set<string>(ORGS.filter((o) => o.ea).map((o) => o.id));
const name = (id: string) => ORGS.find((o) => o.id === id)!.name;

const SHOWN = { shownScenarios: [1, 2, 3, 4], shownOrgIds: ["org01", "org02", "org04", "org03", "org05", "org06", "org08", "org07"] };

function validPayload(id = crypto.randomUUID(), extra: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  return {
    id, condition: "control", assignmentMethod: "server_balanced", isTest: false,
    startedAt: now, locale: "en", ...SHOWN, expandedOrgIds: ["org01"], viewportBucket: "desktop",
    consent: { age: "yes", jain: "yes", us: "yes", consentedAt: now, locale: "en" },
    email: "dup@example.com", baseline: completeAnswers(en.survey.sections),
    video: { watchedFraction: 0.95, secondsOnPage: 300 }, videoId: "TESTVIDEO01",
    allocation: { org01: 1001 }, allocationConfirmedAt: now, secondsOnAllocation: 60,
    post: { ...completeAnswers(en.post.sections), F2: "org01" },
    ...extra,
  };
}

test("1. control and treatment runs each write one response and one unlinked email", async ({ browser }) => {
  for (const [condition, email] of [["control", "control@example.com"], ["treatment", "treatment@example.com"]] as const) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await fullRun(page, condition, email);
    await ctx.close();
  }
  const { responses, emails, exported } = await rows();
  expect(responses).toHaveLength(2);
  expect(emails.map((e) => e.email).sort()).toEqual(["control@example.com", "treatment@example.com"]);
  expect(Object.keys(emails[0]).sort()).toEqual(["created_at", "email", "is_test"]); // no id, no join key
  expect(JSON.stringify(responses)).not.toContain("@example.com");
  for (const r of responses) expect(JSON.stringify(emails)).not.toContain(r.id);
  // Day-level timestamp only, so emails cannot be matched to responses by time.
  for (const e of emails) expect(new Date(e.created_at).toISOString()).toMatch(/T00:00:00\.000Z$|T\d\d:00:00\.000Z$/);

  const byCond = Object.fromEntries(responses.map((r) => [r.condition, r]));
  expect(Object.keys(byCond).sort()).toEqual(["control", "treatment"]);
  for (const r of responses) {
    expect(r.design_version).toBe("v2-14orgs-4scenarios");
    expect(r.is_test).toBe(false);
    expect(r.assignment_method).toBe("server_balanced");
    expect(r.shown_scenarios).toHaveLength(4);
    expect(r.shown_org_ids).toHaveLength(8);
    const [first, , third] = r.shown_org_ids;
    expect(r.allocation).toEqual({ [first]: 751, [third]: 251 });
    expect(r.allocation_total).toBe(1002);
    expect(r.n_orgs_funded).toBe(2);
    expect(r.max_single_gift).toBe(751);
    expect(r.ea_dollars + r.non_ea_dollars).toBe(1002);
    expect(r.ea_dollars).toBe((EA.has(first) ? 751 : 0) + (EA.has(third) ? 251 : 0));
    expect(Number(r.ea_share)).toBeCloseTo(r.ea_dollars / 1002);
    expect(r.top_choice_org_id).toBe(first);
    expect(r.funded_orgs).toBe(`${name(first)}: $751; ${name(third)}: $251`);
    expect(r[`${first}_dollars`]).toBe(751);
    expect(ORGS.reduce((a, o) => a + r[`${o.id}_dollars`], 0)).toBe(1002);
    expect(r.expanded_org_ids).toEqual([first, third]);
    expect(Number(r.video_watched_fraction)).toBeGreaterThanOrEqual(0.9);
    expect(r.locale).toBe("en");
    expect(r.baseline.email).toBeUndefined();
  }
  // `npm run test:e2e` builds with these ids.
  expect(byCond.control.video_id).toBe("TESTCONTRL1");
  expect(byCond.treatment.video_id).toBe("TESTTREATM1");
  expect(exported).toHaveLength(2);
  for (const col of ["org14_climate_solutions_initiative_dollars", "org04_global_malaria_initiative_dollars", "allocation_total", "shown_scenarios", "expanded_org_ids", "assignment_method", "is_test", "design_version", "f2_gave_most_to_org_id"])
    expect(exported[0]).toHaveProperty(col);
});

test("2. abandoning at /give stores nothing; the only request is the anonymous assignment", async ({ page }) => {
  const posts: Request[] = [];
  page.on("request", (r) => { if (r.method() !== "GET" && r.url().startsWith("http://localhost:3100")) posts.push(r); });
  await fakeYouTube(page);
  await consent(page);
  await survey(page, "abandon@example.com");
  await watch(page);
  await give(page, 0, 501);
  await page.close();
  const { responses, emails } = await rows();
  expect(responses).toHaveLength(0);
  expect(emails).toHaveLength(0);
  const sent = posts.filter((r) => !r.url().includes("_rsc"));
  expect(sent.map((r) => new URL(r.url()).pathname)).toEqual(["/api/assign"]);
  expect(sent[0].postData() ?? "").toBe("");
});

test("3. amount buttons: limits, reasons, the four valid totals, and going back", async ({ page }) => {
  await consent(page);
  await page.goto("/give");
  const cont = continueButton(page);
  const reason = page.locator("#continue-reason");
  const total = page.locator(".basket .status");

  // Researchers' instruction sentence, verbatim.
  await expect(page.locator(".portal-hero .lede")).toHaveText(
    "You may allocate up to $1003 dollars to up to three organizations (you may choose to allocate $1001 to a single organization or to distribute up to $1003 to up to three organizations).",
  );
  // Collapsed: title and summary, no full description or buttons yet.
  await expect(card(page, 0).locator(".org-panel")).toBeHidden();
  await expect(cont).toBeDisabled();
  await expect(reason).toHaveText("Choose amounts that total at least $1,001 (up to $1,003). You have chosen $0.");

  // Each valid combination enables Continue.
  const combos: [number, number][][] = [
    [[0, 1001]],
    [[0, 751], [1, 251]],
    [[0, 501], [1, 501]],
    [[0, 501], [1, 251], [2, 251]],
  ];
  for (const combo of combos) {
    for (let i = 0; i < 4; i++) if ((await card(page, i).locator(".org-gift").count()) > 0) await give(page, i, 0);
    for (const [i, n] of combo) await give(page, i, n);
    await expect(cont, JSON.stringify(combo)).toBeEnabled();
    await expect(reason).toHaveCount(0);
    await expect(total).toHaveText(`Allocated: $${combo.reduce((a, [, n]) => a + n, 0).toLocaleString("en-US")} of $1,003`);
  }
  // Collapsed headers show the gift; open cards stay open after a choice.
  await expect(card(page, 0).locator(".org-gift")).toHaveText("Your gift: $501");
  await expect(card(page, 0).locator("button.org-head")).toHaveAttribute("aria-expanded", "true");

  // A fourth gift is blocked, with the reason shown.
  await expand(page, 3);
  for (const n of ["$251", "$501", "$751", "$1,001"]) await expect(card(page, 3).locator("label.amount", { hasText: n }).locator("input")).toBeDisabled();
  await expect(card(page, 3).locator(".amount-reason")).toHaveText("You have chosen three organizations. Choose No thanks on one to pick a different one.");
  await card(page, 3).locator("label.amount", { hasText: "$251" }).click({ force: true });
  await expect(page.locator("article.org-card.given")).toHaveCount(3);

  // No thanks removes a gift; the total repopulates and Continue explains itself.
  await give(page, 2, 0);
  await expect(total).toHaveText("Allocated: $752 of $1,003");
  await expect(cont).toBeDisabled();
  await expect(reason).toHaveText("Choose amounts that total at least $1,001 (up to $1,003). You have chosen $752.");
  await expect(card(page, 3).locator(".amount-reason")).toHaveText("You have $251 left to give, so larger amounts are not available.");
  for (const n of ["$501", "$751", "$1,001"]) await expect(card(page, 3).locator("label.amount", { hasText: n }).locator("input")).toBeDisabled();

  // Invalid totals never enable Continue: 751 + 501 is impossible (over budget), 251 x 2 too low.
  await give(page, 0, 751);
  await expect(card(page, 1).locator("label.amount", { hasText: "$501" }).locator("input")).toBeDisabled();
  await give(page, 0, 251);
  await give(page, 1, 251);
  await expect(cont).toBeDisabled();

  // Valid again, review, go back: the choices and total come back.
  await give(page, 0, 751);
  await expect(cont).toBeEnabled();
  await cont.click();
  await expect(page).toHaveURL(/\/give\/review$/);
  await expect(page.locator(".receipt .line.total")).toHaveText("Total$1,002");
  await page.getByRole("button", { name: "Back to giving portal" }).click();
  await expect(page).toHaveURL(/\/give$/);
  await expect(total).toHaveText("Allocated: $1,002 of $1,003");
  await expect(card(page, 0).locator(".org-gift")).toHaveText("Your gift: $751");
  await expect(cont).toBeEnabled();

  // No scenario numbers, A/B labels or grouping are shown.
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/scenario|option a|option b/i);
});

test("4. server rejects invalid allocations and draws", async ({ request }) => {
  const bad: [string, Record<string, unknown>][] = [
    ["amount 250", { allocation: { org01: 250, org02: 751 } }],
    ["amount 500", { allocation: { org01: 500, org02: 501 } }],
    ["total 1000", { allocation: { org01: 1000 } }],
    // No valid amounts can make exactly 1,004; 1,253 checks the upper bound.
    ["total over 1003", { allocation: { org01: 751, org02: 251, org04: 251 } }],
    ["four funded", { allocation: { org01: 251, org02: 251, org03: 251, org04: 251 } }],
    ["key not shown", { allocation: { org09: 1001 }, post: { ...validPayload().post, F2: "org09" } }],
    ["zero amount", { allocation: { org01: 1001, org02: 0 } }],
    ["3 scenarios", { shownScenarios: [1, 2, 3] }],
    ["repeated scenario", { shownScenarios: [1, 1, 2, 3] }],
    ["split pairs", { shownOrgIds: ["org01", "org03", "org02", "org04", "org05", "org06", "org08", "org07"] }],
    ["6 orgs", { shownOrgIds: SHOWN.shownOrgIds.slice(0, 6) }],
    ["expanded not shown", { expandedOrgIds: ["org09"] }],
    ["bad method", { assignmentMethod: "guess" }],
  ];
  for (const [label, extra] of bad) {
    const r = await request.post("/api/submit", { data: validPayload(undefined, extra) });
    expect(r.status(), label).toBe(400);
  }
  // The four valid combinations are accepted.
  for (const allocation of [{ org01: 1001 }, { org01: 751, org02: 251 }, { org01: 501, org02: 501 }, { org01: 501, org02: 251, org04: 251 }]) {
    const r = await request.post("/api/submit", { data: validPayload(undefined, { allocation }) });
    expect(r.status(), JSON.stringify(allocation)).toBe(200);
  }
  expect((await rows()).responses.map((r) => r.allocation_total).sort()).toEqual([1001, 1002, 1002, 1003]);
});

test("5. submitting the same session id twice stores one row", async ({ request }) => {
  const payload = validPayload();
  const a = await request.post("/api/submit", { data: payload });
  const b = await request.post("/api/submit", { data: payload });
  expect(a.status()).toBe(200);
  expect(await b.json()).toMatchObject({ ok: true, duplicate: true });
  const { responses, emails } = await rows();
  expect(responses).toHaveLength(1);
  expect(emails).toHaveLength(1);
});

test("6. the draw is stored at consent and never reshuffled", async ({ browser }) => {
  for (let i = 0; i < 5; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await consent(page);
    const s = await session(page);
    expect(s.shownScenarios).toHaveLength(4);
    expect(s.shownOrgIds).toHaveLength(8);
    await page.goto("/give");
    const shown = () => page.locator("article.org-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-org")));
    expect(await shown()).toEqual(s.shownOrgIds);
    await page.goBack();
    await page.goForward();
    expect(await shown()).toEqual(s.shownOrgIds);
    await page.reload();
    expect(await shown()).toEqual(s.shownOrgIds);
    await page.goto("/survey");
    await page.goto("/give");
    expect(await shown()).toEqual(s.shownOrgIds);
    await ctx.close();
  }
});

test("7. production server without Supabase env: submit returns 500, assign 503", async ({ request }) => {
  expect((await request.post("http://localhost:3101/api/submit", { data: validPayload() })).status()).toBe(500);
  expect((await request.post("http://localhost:3101/api/assign")).status()).toBe(503);
});

test("8. no IP, forwarded-for, or user agent in stored rows or app logs", async ({ browser }) => {
  const ctx = await browser.newContext({
    userAgent: "UA-CANARY-7f3a",
    extraHTTPHeaders: { "X-Forwarded-For": "203.0.113.77", "X-Real-IP": "203.0.113.78" },
  });
  const page = await ctx.newPage();
  await fullRun(page, "control", "privacy@example.com");
  await page.request.post("/api/submit", { data: { id: "not-a-uuid" } });
  await page.request.post("/api/assign");
  await ctx.close();

  const stored = JSON.stringify(await rows());
  const log = readFileSync(".playwright/app.log", "utf8");
  for (const needle of ["UA-CANARY-7f3a", "203.0.113.77", "203.0.113.78", "127.0.0.1", "::1"]) {
    expect(stored).not.toContain(needle);
    expect(log).not.toContain(needle);
  }
  expect(log).not.toContain("privacy@example.com");
});

test("9. landing page: IRB line in en/hi/gu, English copy verbatim", async ({ page }) => {
  await page.goto("/");
  const irb = page.locator("header .protocol .irb");
  await expect(irb).toHaveText("USF IRB Study No. 010845");
  await expect(page.locator("h1")).toHaveText("Welcome to our survey!");
  const norm = (s: string) => s.replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
  const paras = (await page.locator("main > p").allTextContents()).map(norm);
  expect(paras[0]).toContain("The only identifying personal information you will be asked to provide is your email address.");
  expect(paras[2]).toBe("You are free to stop taking the online survey at any time, in which case none of the data you have entered to that point will be used or electronically stored. Publication of data from this study will be purely anonymous in aggregate form. No identifying information will be made public from this study. For more information on the digital security of data collected from this study, see below.");
  for (const lang of ["हिन्दी", "ગુજરાતી"]) {
    await page.getByRole("button", { name: lang }).click();
    await expect(irb).toHaveText("USF IRB Study No. 010845");
  }
});

test("10. balanced assignment: 100 concurrent calls split within one", async ({ request }) => {
  const arms = await Promise.all(Array.from({ length: 100 }, () => request.post("/api/assign").then((r) => r.json())));
  const n = (c: string) => arms.filter((a) => a.condition === c).length;
  expect(n("control") + n("treatment")).toBe(100);
  expect(Math.abs(n("control") - n("treatment"))).toBeLessThanOrEqual(1);
  expect(await counter()).toEqual({ n_control: n("control"), n_treatment: n("treatment") });
  // An odd number of further calls still stays within one.
  await Promise.all(Array.from({ length: 7 }, () => request.post("/api/assign")));
  const c = await counter();
  expect(c.n_control + c.n_treatment).toBe(107);
  expect(Math.abs(c.n_control - c.n_treatment)).toBe(1);
});

test("11. assignment falls back to a coin flip when the server is down; test mode never counts", async ({ page }) => {
  await fetch(`${FAKE}/__test/assign-down?down=1`, { method: "POST" });
  const started = Date.now();
  await consent(page);
  expect(Date.now() - started).toBeLessThan(8000);
  expect((await session(page)).assignmentMethod).toBe("client_fallback");
  await fetch(`${FAKE}/__test/assign-down?down=0`, { method: "POST" });

  // A hung server: the 3 second timeout still lets the participant through.
  await page.evaluate(() => sessionStorage.clear());
  await page.route("**/api/assign", () => { /* never answers */ });
  const t0 = Date.now();
  await consent(page);
  expect(Date.now() - t0).toBeGreaterThanOrEqual(2900);
  expect((await session(page)).assignmentMethod).toBe("client_fallback");
  await page.unroute("**/api/assign");

  const before = await counter();
  const assigns: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/api/assign")) assigns.push(r.url()); });
  for (const c of ["control", "treatment"] as const) {
    await page.evaluate(() => sessionStorage.clear());
    await consent(page, `?test=1&condition=${c}`);
    const s = await session(page);
    expect(s).toMatchObject({ isTest: true, condition: c, assignmentMethod: "test" });
  }
  expect(assigns).toEqual([]);
  expect(await counter()).toEqual(before);
});

test("12. test mode: badge on every page, rows marked, delete-test-data.sql removes only those", async ({ browser }) => {
  // One real participant and one test participant.
  const real = await browser.newPage();
  await fullRun(real, "control", "real@example.com");
  await real.close();

  const page = await browser.newPage();
  await fakeYouTube(page);
  await page.goto("/?test=1&condition=treatment");
  await expect(page.locator(".test-badge")).toHaveText("TEST SESSION");
  await consent(page, "?test=1&condition=treatment");
  for (const step of [
    async () => survey(page, "tester@example.com"),
    async () => watch(page),
  ]) {
    await expect(page.locator(".test-badge")).toBeVisible();
    await step();
  }
  await expect(page.locator(".test-badge")).toBeVisible();
  await giveAndFinish(page, undefined, "tester@example.com");

  let { responses, emails } = await rows();
  expect(responses.map((r) => [r.condition, r.is_test, r.assignment_method]).sort()).toEqual([
    ["control", false, "server_balanced"],
    ["treatment", true, "test"],
  ]);
  expect(emails.map((e) => [e.email, e.is_test]).sort()).toEqual([["real@example.com", false], ["tester@example.com", true]]);

  await fetch(`${FAKE}/__test/delete-test-data`, { method: "POST" });
  ({ responses, emails } = await rows());
  expect(responses.map((r) => r.is_test)).toEqual([false]);
  expect(emails.map((e) => e.email)).toEqual(["real@example.com"]);
});

test("13. email: required at the start, no 'removed during storage' line, reminders mentioned at the end", async ({ page }) => {
  await consent(page);
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator("main")).not.toContainText("It is removed from your responses during storage");
  await page.getByRole("button", { name: "Continue to the video" }).click();
  await expect(page.locator("#q-email .field-error")).toHaveText("Please answer this question.");
  await page.locator('input[type="email"]').fill("not-an-email");
  await page.getByRole("button", { name: "Continue to the video" }).click();
  await expect(page.locator("#q-email .field-error")).toHaveText("Please enter a valid email address.");

  // Server: email cannot be missing.
  const r = await page.request.post("/api/submit", { data: validPayload(undefined, { email: "" }) });
  expect(r.status()).toBe(400);

  await page.goto("/done");
  await expect(page.getByText("We will reach out to you at the email address you provided with reminders and updates about this study.")).toBeVisible();
});

test("14. rows written by the old (v1) code still insert, marked v1", async () => {
  const now = new Date().toISOString();
  const ok = await (await fetch(`${FAKE}/__test/old-row`, {
    method: "POST",
    // Exactly the fields the v1 code sent: org01 to org12 only, no v2 fields.
    body: JSON.stringify({
      id: crypto.randomUUID(), condition: "control", consent: {}, baseline: {}, shown_org_ids: ["org01"], allocation: { org01: 1000 }, post: {}, started_at: now,
      ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`org${String(i + 1).padStart(2, "0")}_dollars`, i ? 0 : 1000])),
    }),
  })).json();
  expect(ok).toBe(true);
  const { responses, emails } = await rows();
  expect(responses[0]).toMatchObject({ design_version: "v1-12orgs", is_test: false, org14_dollars: 0 });
  expect(emails[0].is_test).toBe(false);
});

test("15. a blocked sessionStorage shows a plain message instead of a blank page", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () { throw new DOMException("blocked", "SecurityError"); };
  });
  await page.goto("/");
  for (const name of ["age", "jain", "us"]) await page.locator(`input[name="${name}"][value="yes"]`).check();
  await page.getByRole("button", { name: /consent to participate/i }).click();
  await expect(page.locator("main [role=alert]")).toHaveText("This browser is blocking temporary storage. Please open the link in Safari or Chrome.");
  await expect(page).toHaveURL(/\/$/);
});

test("16. a failed submit shows Retry, which resends the same session once the connection is back", async ({ page }) => {
  await fakeYouTube(page);
  await consent(page);
  await survey(page, "retry@example.com");
  await watch(page);
  let attempts = 0;
  await page.route("**/api/submit", (route) => { attempts++; return route.abort(); });
  await give(page, 0, 1001);
  await continueButton(page).click();
  await page.getByRole("button", { name: "Confirm gifts" }).click();
  await page.getByRole("button", { name: "Continue to final questions" }).click();
  await answerEverything(page);
  await page.getByRole("button", { name: "Submit my responses" }).click();
  await expect(page.locator(".submit-error .error")).toHaveText("Your responses could not be saved. Please check your connection and try again.");
  expect(attempts).toBe(2); // the first try plus one automatic retry
  const id = (await session(page)).id;
  await page.unroute("**/api/submit");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page).toHaveURL(/\/done$/);
  const { responses } = await rows();
  expect(responses.map((r) => r.id)).toEqual([id]);
});

test("17. keyboard only: expand a card, choose an amount, continue", async ({ page }) => {
  await consent(page);
  await page.goto("/give");
  const head = card(page, 0).locator("button.org-head");
  await head.focus();
  await page.keyboard.press("Enter");
  await expect(head).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Space");
  await expect(head).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  // Tab into the radio group, move to $1,001 with the arrow keys.
  await card(page, 0).locator('input[value="0"]').focus();
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!.closest("label")!).outlineStyle);
  expect(outline).not.toBe("none");
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  await expect(card(page, 0).locator(".org-gift")).toHaveText("Your gift: $1,001");
  await continueButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/give\/review$/);
});

test("video gate: seeking ahead does not unlock Continue", async ({ page }) => {
  await fakeYouTube(page, "seek");
  await consent(page);
  await page.goto("/watch");
  await page.waitForTimeout(3000);
  await expect(page.getByRole("button", { name: "Continue to the giving portal" })).toBeDisabled();
});

test("video embed: real YouTube iframe with related videos off, Continue locked at start", async ({ page }) => {
  await page.route(/youtube-nocookie\.com\/embed\//, (route) => route.fulfill({ contentType: "text/html", body: "<html></html>" }));
  await page.route("https://www.youtube.com/iframe_api", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
  await consent(page);
  await page.goto("/watch");
  const src = await page.locator(".video-frame iframe").getAttribute("src");
  expect(src).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/(TESTCONTRL1|TESTTREATM1)/);
  expect(src).toContain("rel=0");
  expect(src).toContain("playsinline=1");
  await page.waitForTimeout(1500);
  await expect(page.getByRole("button", { name: "Continue to the giving portal" })).toBeDisabled();
  await expect(page.locator(".watched")).toHaveText("0% watched");
});

test("every question's answer is stored in its own column", async ({ page }) => {
  await fakeYouTube(page);
  await consent(page);
  await answerEverything(page);
  await page.locator('input[name="A6"][value="Born outside the US"]').check();
  await page.locator("#q-A7 input").fill("12");
  await page.getByRole("button", { name: "Continue to the video" }).click();
  await watch(page);
  await giveAndFinish(page, [[0, 501], [1, 251], [2, 251]]);

  const { responses, exported, emails } = await rows();
  expect(emails.map((e) => e.email)).toEqual(["everything@example.com"]);
  const row = exported[0];
  const empty = Object.entries(row).filter(([, v]) => v === null || v === "").map(([k]) => k);
  expect(empty).toEqual([]);
  expect(row.a2_gender).toBe("Other");
  expect(row.a2_gender_other).toMatch(/^Other text/);
  expect(row.a7_years_in_us).toBe("12");
  expect(row.b5_priorities).toBe("Local community services; Other");
  expect(row.c1_minimize_harm_daily).toBe(1);

  const r = responses[0];
  const [a, b, c] = r.shown_org_ids;
  expect(r.funded_org_ids).toEqual([a, b, c]);
  expect(r.funded_orgs).toBe(`${name(a)}: $501; ${name(b)}: $251; ${name(c)}: $251`);
  expect(r.allocation_total).toBe(1003);
  expect(r.shown_orgs.split("; ")).toEqual(r.shown_org_ids.map(name));
});

test("required: nothing can be skipped, follow-ups appear only when they apply", async ({ page }) => {
  await consent(page);
  const cont = page.getByRole("button", { name: "Continue to the video" });
  await cont.click();
  await expect(page.locator("main [role=alert]")).toContainText("Please answer every question before continuing.");
  expect(await page.locator("fieldset.invalid").count()).toBeGreaterThan(20);
  expect(await page.evaluate(() => document.activeElement?.closest("fieldset")?.id)).toBe("q-email");

  await page.locator('input[name="A6"][value="US-born"]').check();
  await expect(page.locator("#q-A7")).toHaveCount(0);
  await page.locator('input[name="A6"][value="Born outside the US"]').check();
  await expect(page.locator("#q-A7")).toHaveCount(1);
  await page.locator('input[name="B1"][value="No"]').check();
  await expect(page.locator("#q-B2, #q-B3")).toHaveCount(0);

  await answerEverything(page);
  await page.locator('input[name="A6"][value="Born outside the US"]').check();
  await page.locator("#q-A7 input").fill("400");
  await cont.click();
  await expect(page.locator("#q-A7 .field-error")).toHaveText("Please enter a number of years from 0 to 100.");
  await page.locator("#q-A7 input").fill("12");
  await cont.click();
  await expect(page).toHaveURL(/\/watch$/);
});

test("required: the server refuses a record with any answer missing", async ({ request }) => {
  const base = validPayload();
  const { B1: _b1, ...noB1 } = base.baseline as Record<string, unknown>;
  const { G3: _g3, ...noG3 } = base.post as Record<string, unknown>;
  for (const [data, field] of [
    [{ ...base, baseline: noB1 }, "baseline.B1"],
    [{ ...base, post: noG3 }, "post.G3"],
    [{ ...base, post: { ...base.post, H1: "  " } }, "post.H1"],
    [{ ...base, post: { ...base.post, F2: "org02" } }, "post.F2"],
  ] as const) {
    const r = await request.post("/api/submit", { data });
    expect(r.status()).toBe(400);
    expect((await r.json()).issues.join(" ")).toContain(field);
  }
  expect((await rows()).responses).toHaveLength(0);
});
