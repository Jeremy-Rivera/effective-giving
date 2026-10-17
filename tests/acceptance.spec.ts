import { test, expect, type Page, type Request } from "@playwright/test";
import { readFileSync } from "node:fs";
import { ORGS } from "../lib/orgs";
import { youTubeId } from "../lib/youtube";

// Acceptance tests from the feedback brief, section 9 (numbered to match).

const FAKE = "http://localhost:54321";
const rows = async () => (await (await fetch(`${FAKE}/__test/rows`)).json()) as {
  responses: Record<string, any>[]; emails: Record<string, any>[]; exported: Record<string, any>[];
};
const reset = () => fetch(`${FAKE}/__test/reset`, { method: "POST" });
const EA = new Set<string>(ORGS.filter((o) => o.ea).map((o) => o.id));

// Stand-in for the YouTube IFrame API: a 20 s video. `mode: "play"` plays at
// 10x; `mode: "seek"` jumps straight to 19 s, as if the slider were dragged.
async function fakeYouTube(page: Page, mode: "play" | "seek" = "play") {
  await page.route(/youtube-nocookie\.com\/embed\//, (route) => route.fulfill({ contentType: "text/html", body: "<html><body>video</body></html>" }));
  await page.route("https://www.youtube.com/iframe_api", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `
        window.YT = { PlayerState: { ENDED: 0, PLAYING: 1 }, Player: function (el) {
          if (!(el instanceof HTMLIFrameElement)) throw new Error("expected the embed iframe");
          var start = Date.now(), mode = ${JSON.stringify(mode)};
          this.getDuration = function () { return 20; };
          this.getPlaybackRate = function () { return mode === "play" ? 10 : 1; };
          this.getCurrentTime = function () {
            return mode === "play" ? Math.min(20, (Date.now() - start) / 100) : 19;
          };
          this.getPlayerState = function () { return this.getCurrentTime() >= 20 ? 0 : 1; };
        } };
        window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady();`,
    }),
  );
}

async function consent(page: Page) {
  await page.goto("/");
  await page.locator('input[name="age"][value="yes"]').check();
  await page.locator('input[name="jain"][value="yes"]').check();
  await page.locator('input[name="us"][value="yes"]').check();
  await page.getByRole("button", { name: /consent to participate/i }).click();
  await expect(page).toHaveURL(/\/survey$/);
}

const session = (page: Page) => page.evaluate(() => JSON.parse(sessionStorage.getItem("jain-ea-session")!));

async function setCondition(page: Page, condition: "control" | "treatment") {
  await page.evaluate((c) => {
    const s = JSON.parse(sessionStorage.getItem("jain-ea-session")!);
    sessionStorage.setItem("jain-ea-session", JSON.stringify({ ...s, condition: c }));
  }, condition);
}

async function survey(page: Page, email: string) {
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[name="A1"]').first().check();
  await page.locator('input[name="C1"][value="6"]').check();
  await page.getByRole("button", { name: "Continue to the video" }).click();
  await expect(page).toHaveURL(/\/watch$/);
}

async function watch(page: Page) {
  const cont = page.getByRole("button", { name: "Continue to the giving portal" });
  await expect(cont).toBeEnabled({ timeout: 15_000 });
  await cont.click();
  await expect(page).toHaveURL(/\/give$/);
}

async function give(page: Page, cardIndex: number, amount: string) {
  await page.locator("article.org-card").nth(cardIndex).locator(".actions button").click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel(/Gift amount/).fill(amount);
  await dialog.getByRole("button", { name: "Confirm" }).click();
}

async function fullRun(page: Page, condition: "control" | "treatment", email: string) {
  await fakeYouTube(page);
  await consent(page);
  await setCondition(page, condition);
  await survey(page, email);
  await watch(page);
  await give(page, 0, "600");
  await give(page, 3, "400");
  await page.getByRole("button", { name: "Review and confirm gifts" }).click();
  await page.getByRole("button", { name: "Confirm gifts" }).click();
  await page.getByRole("button", { name: "Continue to final questions" }).click();
  await page.locator('input[name="F2"]').first().check();
  await page.locator('input[name="F3"][value="5"]').check();
  await page.getByRole("button", { name: "Submit my responses" }).click();
  await expect(page).toHaveURL(/\/done$/);
  await expect(page.getByText("Your responses have been recorded")).toBeVisible();
}

test.beforeEach(async () => { await reset(); });

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
  expect(Object.keys(emails[0]).sort()).toEqual(["created_at", "email"]); // no id, no join key
  const raw = JSON.stringify(responses);
  expect(raw).not.toContain("@example.com");
  for (const r of responses) expect(JSON.stringify(emails)).not.toContain(r.id);
  // Day-level timestamp only, so emails cannot be matched to responses by time.
  for (const e of emails) expect(new Date(e.created_at).toISOString()).toMatch(/T00:00:00\.000Z$|T\d\d:00:00\.000Z$/);

  const byCond = Object.fromEntries(responses.map((r) => [r.condition, r]));
  expect(Object.keys(byCond).sort()).toEqual(["control", "treatment"]);
  for (const r of responses) {
    expect(r.shown_org_ids).toHaveLength(6);
    expect(Object.values(r.allocation).reduce((a: number, b: any) => a + b, 0)).toBe(1000);
    expect(r.n_orgs_funded).toBe(2);
    expect(r.max_single_gift).toBe(600);
    expect(r.ea_dollars + r.non_ea_dollars).toBe(1000);
    expect(Number(r.ea_share)).toBeCloseTo(r.ea_dollars / 1000);
    expect(r.jain_values_dollars).toBe(r.non_ea_dollars);
    expect(r.top_choice_org_id).toBe(r.shown_org_ids[0]);
    expect(r.video_id).toBeTruthy();
    expect(Number(r.video_watched_fraction)).toBeGreaterThanOrEqual(0.9);
    expect(r.locale).toBe("en");
    expect(["mobile", "tablet", "desktop"]).toContain(r.viewport_bucket);
    expect(r.seconds_on_allocation).toBeGreaterThanOrEqual(0);
    expect(r.baseline.email).toBeUndefined();
  }
  // `npm run test:e2e` builds with these ids.
  expect(byCond.control.video_id).toBe("TESTCONTRL1");
  expect(byCond.treatment.video_id).toBe("TESTTREATM1");
  expect(exported).toHaveLength(2);
  expect(exported[0]).toHaveProperty("org01_dollars");
  expect(exported[0]).toHaveProperty("f2_top_choice");
});

test("2. abandoning at /give writes nothing and sends nothing", async ({ page }) => {
  const posts: Request[] = [];
  page.on("request", (r) => { if (r.method() !== "GET" && r.url().startsWith("http://localhost:3100")) posts.push(r); });
  await fakeYouTube(page);
  await consent(page);
  await survey(page, "abandon@example.com");
  await watch(page);
  await give(page, 0, "500");
  await page.close();
  const { responses, emails } = await rows();
  expect(responses).toHaveLength(0);
  expect(emails).toHaveLength(0);
  expect(posts.filter((r) => !r.url().includes("_rsc")).map((r) => r.url())).toEqual([]);
});

test("3. three-gift limit, exact total, and $1,000 to one organization", async ({ page }) => {
  await consent(page);
  await page.goto("/give");
  const cont = page.getByRole("button", { name: "Review and confirm gifts" });

  await give(page, 0, "100");
  await give(page, 1, "100");
  await give(page, 2, "100");
  await page.locator("article.org-card").nth(3).locator(".actions button").click();
  const dialog = page.locator("dialog[open]");
  await dialog.getByLabel(/Gift amount/).fill("100");
  await dialog.getByRole("button", { name: "Confirm" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "You can give to at most three organizations. Remove or change a gift to add another.",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.locator("article.org-card.given")).toHaveCount(3);

  // $999: Continue disabled, with the reason.
  await give(page, 0, "799");
  await expect(cont).toBeDisabled();
  await expect(page.locator("#continue-reason")).toHaveText("Allocate the full $1,000 to continue. $1 remaining.");

  // $1,001: the gift is refused, so the total never exceeds $1,000.
  await page.locator("article.org-card").nth(0).locator(".actions button").click();
  await page.locator("dialog[open]").getByLabel(/Gift amount/).fill("801");
  await page.locator("dialog[open]").getByRole("button", { name: "Confirm" }).click();
  await expect(page.locator("dialog[open]").getByRole("alert")).toHaveText("That is more than you have left. $800 remaining.");
  await page.keyboard.press("Escape");
  await expect(cont).toBeDisabled();

  // Whole dollars only.
  await page.locator("article.org-card").nth(0).locator(".actions button").click();
  await page.locator("dialog[open]").getByLabel(/Gift amount/).fill("10.50");
  await page.locator("dialog[open]").getByRole("button", { name: "Confirm" }).click();
  await expect(page.locator("dialog[open]").getByRole("alert")).toHaveText("Enter a whole-dollar amount from $1 to $1,000.");
  await page.keyboard.press("Escape");

  // $1,000 to one organization.
  for (const i of [1, 2]) await page.locator("article.org-card").nth(i).getByRole("button", { name: /^Remove/ }).click();
  await give(page, 0, "1000");
  await expect(cont).toBeEnabled();
  await expect(page.locator("#continue-reason")).toHaveCount(0);

  // Server enforces the same rules.
  const s = await session(page);
  const base = validPayload(s.id, s.shownOrgIds);
  const four = Object.fromEntries(s.shownOrgIds.slice(0, 4).map((id: string) => [id, 250]));
  for (const allocation of [four, { [s.shownOrgIds[0]]: 999 }, { [s.shownOrgIds[0]]: 1001 }, { org99: 1000 }]) {
    const r = await page.request.post("/api/submit", { data: { ...base, allocation } });
    expect(r.status()).toBe(400);
  }
  expect((await rows()).responses).toHaveLength(0);
});

function validPayload(id: string, shownOrgIds: string[]) {
  const now = new Date().toISOString();
  return {
    id, condition: "control", startedAt: now, locale: "en", shownOrgIds, viewportBucket: "desktop",
    consent: { age: "yes", jain: "yes", us: "yes", consentedAt: now, locale: "en" },
    email: "dup@example.com", baseline: { A1: "25 to 34" },
    video: { watchedFraction: 0.95, secondsOnPage: 300 }, videoId: "TESTVIDEO01",
    allocation: { [shownOrgIds[0]]: 1000 }, allocationConfirmedAt: now, secondsOnAllocation: 60,
    post: { F3: 5 },
  };
}

test("4. submitting the same session id twice stores one row", async ({ request }) => {
  const payload = validPayload(crypto.randomUUID(), ["org01", "org02", "org03", "org04", "org05", "org06"]);
  const a = await request.post("/api/submit", { data: payload });
  const b = await request.post("/api/submit", { data: payload });
  expect(a.status()).toBe(200);
  expect(b.status()).toBe(200);
  expect(await b.json()).toMatchObject({ ok: true, duplicate: true });
  const { responses, emails } = await rows();
  expect(responses).toHaveLength(1);
  expect(emails).toHaveLength(1);
});

test("5. 30 consents: 3 EA + 3 non-EA, varied order, never reshuffled", async ({ browser }) => {
  const orders = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await consent(page);
    const ids: string[] = (await session(page)).shownOrgIds;
    expect(new Set(ids).size).toBe(6);
    expect(ids.filter((id) => EA.has(id))).toHaveLength(3);
    orders.add(ids.join(","));

    if (i < 5) {
      await page.goto("/give");
      const shown = () => page.locator("article.org-card").evaluateAll((els) => els.map((e) => e.getAttribute("data-org")));
      expect(await shown()).toEqual(ids);
      await page.goBack();
      await page.goForward();
      expect(await shown()).toEqual(ids);
      await page.reload();
      expect(await shown()).toEqual(ids);
      await page.goto("/survey");
      await page.goto("/give");
      expect(await shown()).toEqual(ids);
    }
    await ctx.close();
  }
  expect(orders.size).toBeGreaterThanOrEqual(25);
});

test("6. production server without Supabase env returns 500, not success", async ({ request }) => {
  const payload = validPayload(crypto.randomUUID(), ["org01", "org02", "org03", "org04", "org05", "org06"]);
  const r = await request.post("http://localhost:3101/api/submit", { data: payload });
  expect(r.status()).toBe(500);
});

test("7. no IP, forwarded-for, or user agent in stored rows or app logs", async ({ browser }) => {
  const ctx = await browser.newContext({
    userAgent: "UA-CANARY-7f3a",
    extraHTTPHeaders: { "X-Forwarded-For": "203.0.113.77", "X-Real-IP": "203.0.113.78" },
  });
  const page = await ctx.newPage();
  await fullRun(page, "control", "privacy@example.com");
  // Also a rejected submission, to exercise the error path's logging.
  await page.request.post("/api/submit", { data: { id: "not-a-uuid" } });
  await ctx.close();

  const stored = JSON.stringify(await rows());
  const log = readFileSync(".playwright/app.log", "utf8");
  for (const needle of ["UA-CANARY-7f3a", "203.0.113.77", "203.0.113.78", "127.0.0.1", "::1"]) {
    expect(stored).not.toContain(needle);
    expect(log).not.toContain(needle);
  }
  expect(log).not.toContain("privacy@example.com");
});

test("8. landing page: IRB line in en/hi/gu, English copy verbatim", async ({ page }) => {
  await page.goto("/");
  const irb = page.locator("header .protocol .irb");
  await expect(irb).toHaveText("USF IRB Study No. 010845");
  await expect(page.locator("h1")).toHaveText("Welcome to our survey!");

  const norm = (s: string) => s.replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
  const paras = (await page.locator("main > p").allTextContents()).map(norm);
  expect(paras[0]).toBe(norm(`This survey is in support of a study on "Jain Philanthropy and Effective Altruism" conducted by researchers at the University of South Florida and will take approximately 20 minutes to complete. The purpose of the study is to understand the choices that American Jains make in their support of various charitable organizations, including differences in generational tendencies as well as underlying motivations (e.g. religious v. secular) for making choices in charitable donation. The survey asks for some general information about your current giving status after which you will watch a short video and complete a short questionnaire regarding hypothetical donations to a set of charitable organizations. Please note that the organizations listed in this section of the survey are fictional and any similarities they may have to current global charities are purely coincidental. The only identifying personal information you will be asked to provide is your email address. We do not anticipate any risks to you in undertaking this survey. Our paper on Jain charitable giving will be shared with JSTB for distribution following publication.`));
  expect(paras[1]).toBe("Contact the survey researchers should you wish to follow up with them for any reason: Prof. Justin Henry (jwhenry@usf.edu) and AJ Chauradia (ajchauradia@usf.edu).");
  expect(paras[2]).toBe("You are free to stop taking the online survey at any time, in which case none of the data you have entered to that point will be used or electronically stored. Publication of data from this study will be purely anonymous in aggregate form. No identifying information will be made public from this study. For more information on the digital security of data collected from this study, see below.");
  await expect(page.getByRole("heading", { name: "To participate, please confirm:" })).toBeVisible();

  // IRB line is the first text inside the masthead's protocol row, above the content.
  const irbBox = (await irb.boundingBox())!;
  const h1Box = (await page.locator("h1").boundingBox())!;
  expect(irbBox.y).toBeLessThan(h1Box.y);

  for (const lang of ["हिन्दी", "ગુજરાતી"]) {
    await page.getByRole("button", { name: lang }).click();
    await expect(irb).toHaveText("USF IRB Study No. 010845");
  }
});

test.describe("9. phone layout (390 px) and keyboard", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const noHorizontalScroll = async (page: Page) =>
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  test("no horizontal scroll; video fills the width; dialog fits", async ({ page }) => {
    await fakeYouTube(page);
    await page.goto("/");
    await noHorizontalScroll(page);
    await page.screenshot({ path: ".playwright/390-landing.png", fullPage: true });
    await consent(page);
    await survey(page, "phone@example.com");
    await expect(page.locator(".video-frame iframe")).toBeVisible();
    const frame = (await page.locator(".video-frame").boundingBox())!;
    expect(frame.x).toBe(0);
    expect(frame.width).toBe(390);
    await noHorizontalScroll(page);
    await page.screenshot({ path: ".playwright/390-watch.png" });
    await watch(page);
    expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("jain-ea-session")!).viewportBucket)).toBe("mobile");
    await noHorizontalScroll(page);
    await page.screenshot({ path: ".playwright/390-give.png", fullPage: true });
    await page.locator("article.org-card").first().locator(".actions button").click();
    const dialog = page.locator("dialog[open]");
    const box = (await dialog.boundingBox())!;
    expect(box.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: ".playwright/390-dialog.png" });
    await dialog.evaluate((d) => d.scrollTo(0, d.scrollHeight));
    await page.screenshot({ path: ".playwright/390-dialog-bottom.png" });
  });

  test("keyboard-only giving, focus trapped in the dialog", async ({ page }) => {
    await consent(page);
    await page.goto("/give");
    const giveWithKeyboard = async (cardIndex: number, amount: string) => {
      const opener = page.locator("article.org-card").nth(cardIndex).locator(".actions button");
      await opener.focus();
      await page.keyboard.press("Enter");
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toBeVisible();
      // Tab through more than the dialog's focusable elements; focus must stay inside.
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("Tab");
        expect(await page.evaluate(() => !!document.activeElement?.closest("dialog[open]"))).toBe(true);
      }
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("Shift+Tab");
        expect(await page.evaluate(() => !!document.activeElement?.closest("dialog[open]"))).toBe(true);
      }
      await dialog.getByLabel(/Gift amount/).focus();
      await page.keyboard.type(amount);
      await page.keyboard.press("Enter");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      // Focus returns to the control that opened the dialog.
      expect(await opener.evaluate((el) => el === document.activeElement)).toBe(true);
    };
    await giveWithKeyboard(0, "700");
    await giveWithKeyboard(1, "300");
    // Escape closes without saving.
    await page.locator("article.org-card").nth(2).locator(".actions button").focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    const cont = page.getByRole("button", { name: "Review and confirm gifts" });
    await cont.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/give\/review$/);
  });
});

test("10. accessibility spot check: labels, focus outline, alerts", async ({ page }) => {
  const unlabeled = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll("input, textarea"))
        .filter((el) => {
          const i = el as HTMLInputElement;
          const fieldset = i.closest("fieldset")?.querySelector("legend")?.textContent;
          return !(i.labels?.length || i.getAttribute("aria-label") || i.getAttribute("aria-labelledby") || (i.type === "text" && fieldset) || (i.tagName === "TEXTAREA" && fieldset) || (i.type === "email" && fieldset) || (i.type === "number" && fieldset));
        })
        .map((el) => el.outerHTML),
    );
  await page.goto("/");
  expect(await unlabeled()).toEqual([]);
  await page.getByRole("button", { name: /consent to participate/i }).click();
  await expect(page.locator("main [role=alert]")).toHaveText("Please answer all three questions to continue.");

  await consent(page);
  expect(await unlabeled()).toEqual([]);
  await page.goto("/give");
  await page.locator("article.org-card").first().locator(".actions button").click();
  expect(await unlabeled()).toEqual([]);
  const confirm = page.locator("dialog[open]").getByRole("button", { name: "Confirm" });
  await confirm.click();
  await expect(page.locator("dialog[open] [role=alert]")).toHaveText("Enter a whole-dollar amount from $1 to $1,000.");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(outline).not.toBe("none");
  await page.keyboard.press("Escape");
  await page.goto("/post");
  expect(await unlabeled()).toEqual([]);
});

test("video gate: seeking ahead does not unlock Continue", async ({ page }) => {
  await fakeYouTube(page, "seek");
  await consent(page);
  await page.goto("/watch");
  await page.waitForTimeout(3000);
  await expect(page.getByRole("button", { name: "Continue to the giving portal" })).toBeDisabled();
});

test("video links: any YouTube link format or a bare id works", () => {
  for (const input of [
    "NIOSrCD-yIM",
    " https://youtu.be/NIOSrCD-yIM?si=AbCdEf ",
    "https://www.youtube.com/watch?v=NIOSrCD-yIM&t=10s",
    "https://m.youtube.com/watch?v=NIOSrCD-yIM",
    "https://www.youtube.com/embed/NIOSrCD-yIM",
    "https://www.youtube.com/shorts/NIOSrCD-yIM",
    "https://www.youtube-nocookie.com/embed/NIOSrCD-yIM?rel=0",
  ]) expect(youTubeId(input)).toBe("NIOSrCD-yIM");
  for (const input of ["", "REPLACE_ME", "https://vimeo.com/123", "https://youtube.com/watch?v=short", undefined])
    expect(youTubeId(input)).toBe("");
});

test("video embed: real YouTube iframe with related videos off, Continue locked at start", async ({ page }) => {
  await page.route(/youtube-nocookie\.com\/embed\//, (route) => route.fulfill({ contentType: "text/html", body: "<html></html>" }));
  await page.route("https://www.youtube.com/iframe_api", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
  await consent(page);
  await page.goto("/watch");
  const src = await page.locator(".video-frame iframe").getAttribute("src");
  expect(src).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/TESTCONTRL1|^https:\/\/www\.youtube-nocookie\.com\/embed\/TESTTREATM1/);
  expect(src).toContain("rel=0");
  expect(src).toContain("enablejsapi=1");
  await page.waitForTimeout(1500);
  await expect(page.getByRole("button", { name: "Continue to the giving portal" })).toBeDisabled();
  await expect(page.locator(".watched")).toHaveText("0% watched");
});
