import { expect, type Locator, type Page } from "@playwright/test";
import { isVisible } from "../lib/answers";
import type { Section } from "../lib/i18n/types";

// Shared by acceptance.spec.ts and mobile.spec.ts.

export const FAKE = "http://localhost:54321";
export const rows = async () => (await (await fetch(`${FAKE}/__test/rows`)).json()) as {
  responses: Record<string, any>[]; emails: Record<string, any>[]; exported: Record<string, any>[];
};
export const counter = async () => (await (await fetch(`${FAKE}/__test/counter`)).json()) as { n_control: number; n_treatment: number };
export const reset = () => fetch(`${FAKE}/__test/reset`, { method: "POST" });

// Stand-in for the YouTube IFrame API: a 20 s video. `mode: "play"` plays at
// 10x; `mode: "seek"` jumps straight to 19 s, as if the slider were dragged.
export async function fakeYouTube(page: Page, mode: "play" | "seek" = "play") {
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

// Tap on touch devices, click otherwise. mobile.spec.ts turns tapping on in
// beforeEach for touch devices; acceptance.spec.ts leaves it off.
let tapping = false;
export const useTap = (on: boolean) => { tapping = on; };
export const press = async (_page: Page, l: Locator) => (tapping ? l.tap() : l.click());

export async function consent(page: Page, query = "") {
  await page.goto(`/${query}`);
  for (const name of ["age", "jain", "us"]) await press(page, page.locator(`input[name="${name}"][value="yes"]`));
  await press(page, page.getByRole("button", { name: /consent to participate/i }));
  await expect(page).toHaveURL(/\/survey$/);
}

export const session = (page: Page) => page.evaluate(() => JSON.parse(sessionStorage.getItem("jain-ea-session")!));

export async function setCondition(page: Page, condition: "control" | "treatment") {
  await page.evaluate((c) => {
    const s = JSON.parse(sessionStorage.getItem("jain-ea-session")!);
    sessionStorage.setItem("jain-ea-session", JSON.stringify({ ...s, condition: c }));
  }, condition);
}

// Answers every question on the page: first option of each radio group and
// checkbox list, text in every text box, and "Other" plus its text box where
// offered (so the *_other columns are exercised too).
export async function answerEverything(page: Page, email = "everything@example.com") {
  await expect(page.locator("main fieldset").first()).toBeVisible();
  const fieldsets = page.locator("main fieldset");
  for (let i = 0; i < (await fieldsets.count()); i++) {
    const fs = fieldsets.nth(i);
    if (await fs.locator('input[type="radio"]').count()) await fs.locator('input[type="radio"]').first().check({ force: true });
    if (await fs.locator('input[type="checkbox"]').count()) await fs.locator('input[type="checkbox"]').first().check();
    for (const sel of ['input[type="email"]', 'input[type="number"]', "textarea"]) {
      const box = fs.locator(sel);
      if (await box.count()) await box.fill(sel.includes("email") ? email : sel.includes("number") ? "12" : `Answer ${i}`);
    }
  }
  const others = page.locator('input[aria-label="Please specify"]');
  for (let i = 0; i < (await others.count()); i++) {
    const other = others.nth(i);
    await other.fill(`Other text ${i}`);
    const box = other.locator("xpath=ancestor::label").locator('input[type="checkbox"]');
    if (await box.count()) await box.check();
  }
}

export async function survey(page: Page, email: string) {
  await answerEverything(page, email);
  await press(page, page.getByRole("button", { name: "Continue to the video" }));
  await expect(page).toHaveURL(/\/watch$/);
}

export async function watch(page: Page) {
  const cont = page.getByRole("button", { name: "Continue to the giving portal" });
  await expect(cont).toBeEnabled({ timeout: 15_000 });
  await press(page, cont);
  await expect(page).toHaveURL(/\/give$/);
}

export const card = (page: Page, i: number) => page.locator("article.org-card").nth(i);

export async function expand(page: Page, i: number) {
  const head = card(page, i).locator("button.org-head");
  if ((await head.getAttribute("aria-expanded")) !== "true") await press(page, head);
  await expect(head).toHaveAttribute("aria-expanded", "true");
}

// Chooses an amount on card i ("No thanks" for 0).
export async function give(page: Page, i: number, amount: number) {
  await expand(page, i);
  const label = amount === 0 ? "No thanks" : `$${amount.toLocaleString("en-US")}`;
  await press(page, card(page, i).locator("label.amount", { hasText: label }));
}

export const continueButton = (page: Page) => page.getByRole("button", { name: "Review and confirm gifts" });

export async function giveAndFinish(page: Page, gifts: [number, number][] = [[0, 751], [2, 251]], email?: string) {
  for (const [i, n] of gifts) await give(page, i, n);
  await press(page, continueButton(page));
  await press(page, page.getByRole("button", { name: "Confirm gifts" }));
  await press(page, page.getByRole("button", { name: "Continue to final questions" }));
  await answerEverything(page, email);
  await press(page, page.getByRole("button", { name: "Submit my responses" }));
  await expect(page).toHaveURL(/\/done$/);
  await expect(page.getByText("Your responses have been recorded")).toBeVisible();
}

export async function fullRun(page: Page, condition: "control" | "treatment", email: string, query = "") {
  await fakeYouTube(page);
  await consent(page, query);
  if (!query.includes("condition=")) await setCondition(page, condition);
  await survey(page, email);
  await watch(page);
  await giveAndFinish(page);
}

// A full set of answers, as the browser would send them (first option of each
// question; follow-ups included only when their condition holds).
export function completeAnswers(sections: Section[]) {
  const v: Record<string, unknown> = {};
  for (const sec of sections)
    for (const q of sec.questions) {
      if (q.id === "email" || !isVisible(q, v)) continue;
      v[q.id] = q.type === "radio" ? q.options[0] : q.type === "checkbox" ? [q.options[0]] : q.type === "scale" ? 4
        : q.type === "text" ? (q.inputType === "number" ? "5" : "text") : "An answer";
    }
  return v;
}

