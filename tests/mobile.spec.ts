import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { answerEverything, card, continueButton, expand, fakeYouTube, give, press, session, useTap } from "./helpers";

// Brief v2, section 8: the verification matrix. Runs in Chromium and WebKit
// (see playwright.config.ts) against its own app server and fake database
// (:3102 / :54322), so it can run in parallel with the acceptance tests.
// Every run here is a test-mode session (?test=1).

const MOBILE_APP = "http://localhost:3102";
const MOBILE_FAKE = "http://localhost:54322";
const SHOTS = "tests/screenshots";
mkdirSync(SHOTS, { recursive: true });

type Device = { name: string; width: number; height: number; touch: boolean; scale: number };
const DEVICES: Device[] = [
  { name: "iphone-se", width: 375, height: 667, touch: true, scale: 2 },
  { name: "narrow-320x568", width: 320, height: 568, touch: true, scale: 2 },
  { name: "iphone-14", width: 390, height: 844, touch: true, scale: 3 },
  { name: "pixel-7", width: 412, height: 915, touch: true, scale: 2.625 },
  { name: "galaxy-s9plus-narrow", width: 320, height: 658, touch: true, scale: 4.5 },
  { name: "ipad-mini", width: 768, height: 1024, touch: true, scale: 2 },
  { name: "phone-landscape", width: 844, height: 390, touch: true, scale: 3 },
];

// No horizontal scrolling, and every control big enough for a thumb.
async function audit(page: Page, device: Device, step: string) {
  const [scrollWidth, innerWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(scrollWidth, `${step}: horizontal overflow`).toBeLessThanOrEqual(innerWidth);
  const small = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLElement>(
      'button, .options label, .scale label, label.amount, input[type="text"], input[type="email"], input[type="number"], textarea',
    ))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44))
      .map(({ el, r }) => `${el.tagName.toLowerCase()}.${el.className} "${(el.textContent ?? "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`),
  );
  expect(small, `${step}: tap targets under 44 px`).toEqual([]);
  await page.screenshot({ path: `${SHOTS}/${test.info().project.name}-${device.name}-${step}.png`, fullPage: true });
}

async function stored(id: string) {
  const { responses } = await (await fetch(`${MOBILE_FAKE}/__test/rows`)).json();
  return (responses as Record<string, any>[]).find((r) => r.id === id);
}

for (const device of DEVICES) {
  test.describe(device.name, () => {
    test.use({
      baseURL: MOBILE_APP,
      viewport: { width: device.width, height: device.height },
      hasTouch: device.touch,
      isMobile: device.width < 700,
      deviceScaleFactor: device.scale,
    });
    test.beforeEach(() => useTap(device.touch));

    for (const condition of ["control", "treatment"] as const) {
      test(`full flow in English as ${condition}`, async ({ page }) => {
        await fakeYouTube(page);
        await page.goto(`/?test=1&condition=${condition}`);
        await audit(page, device, `${condition}-1-landing`);
        for (const name of ["age", "jain", "us"]) await press(page, page.locator(`input[name="${name}"][value="yes"]`));
        await press(page, page.locator(".consent-block button.primary"));
        await expect(page).toHaveURL(/\/survey$/);
        await audit(page, device, `${condition}-2-survey`);
        await answerEverything(page, `${condition}@example.com`);
        await press(page, page.locator(".survey-submit"));
        await expect(page).toHaveURL(/\/watch$/);
        await audit(page, device, `${condition}-3-watch`);
        const frame = (await page.locator(".video-frame").boundingBox())!;
        expect(frame.width / frame.height).toBeCloseTo(16 / 9, 1);
        const cont = page.getByRole("button", { name: "Continue to the giving portal" });
        await expect(cont).toBeEnabled({ timeout: 15_000 });
        await press(page, cont);
        await expect(page).toHaveURL(/\/give$/);
        await audit(page, device, `${condition}-4-give`);
        await give(page, 0, 501);
        await give(page, 2, 501);
        await audit(page, device, `${condition}-5-give-chosen`);
        await press(page, continueButton(page));
        await audit(page, device, `${condition}-6-review`);
        await press(page, page.getByRole("button", { name: "Confirm gifts" }));
        await audit(page, device, `${condition}-7-confirmation`);
        await press(page, page.getByRole("button", { name: "Continue to final questions" }));
        await audit(page, device, `${condition}-8-post`);
        await answerEverything(page);
        const id = (await session(page)).id;
        await press(page, page.getByRole("button", { name: "Submit my responses" }));
        await expect(page).toHaveURL(/\/done$/);
        await audit(page, device, `${condition}-9-done`);
        expect(await stored(id)).toMatchObject({ condition, is_test: true, allocation_total: 1002 });
      });
    }

    test("Hindi and Gujarati: first three pages", async ({ page }) => {
      await fakeYouTube(page);
      for (const [lang, code] of [["हिन्दी", "hi"], ["ગુજરાતી", "gu"]] as const) {
        await page.goto("/?test=1&condition=control");
        await page.evaluate(() => sessionStorage.clear());
        await press(page, page.getByRole("button", { name: lang }));
        await expect(page.locator("html")).toHaveAttribute("lang", code);
        await audit(page, device, `${code}-1-landing`);
        for (const name of ["age", "jain", "us"]) await press(page, page.locator(`input[name="${name}"][value="yes"]`));
        await press(page, page.locator(".consent-block button.primary"));
        await expect(page).toHaveURL(/\/survey$/);
        await audit(page, device, `${code}-2-survey`);
        await answerEverything(page, `${code}@example.com`);
        await press(page, page.locator(".survey-submit"));
        await expect(page).toHaveURL(/\/watch$/);
        await audit(page, device, `${code}-3-watch`);
        await press(page, page.getByRole("button", { name: "English" }));
      }
    });

    test("giving portal by touch: expand, choose, blocked option, No thanks, totals, back", async ({ page }) => {
      await page.goto("/?test=1&condition=control");
      for (const name of ["age", "jain", "us"]) await press(page, page.locator(`input[name="${name}"][value="yes"]`));
      await press(page, page.locator(".consent-block button.primary"));
      await expect(page).toHaveURL(/\/survey$/);
      await page.goto("/give");
      const cont = continueButton(page);
      const total = page.locator(".basket .status");

      // Expanding keeps the tapped header where it was (no jump).
      const head = card(page, 1).locator("button.org-head");
      await head.evaluate((el) => el.scrollIntoView({ block: "center" }));
      const before = (await head.boundingBox())!.y;
      await expand(page, 1);
      expect(Math.abs((await head.boundingBox())!.y - before)).toBeLessThan(2);
      await expect(card(page, 1).locator(".full-description")).toBeVisible();

      // The four valid totals.
      for (const combo of [[[0, 1001]], [[0, 751], [1, 251]], [[0, 501], [1, 501]], [[0, 501], [1, 251], [2, 251]]] as [number, number][][]) {
        for (let i = 0; i < 3; i++) if (await card(page, i).locator(".org-gift").count()) await give(page, i, 0);
        for (const [i, n] of combo) await give(page, i, n);
        await expect(cont).toBeEnabled();
      }
      // A fourth gift: tapping a blocked amount does nothing, and says why.
      await expand(page, 3);
      // force skips Playwright's own checks; centre it first so the tap lands on the button itself.
      const blockedLabel = card(page, 3).locator("label.amount", { hasText: "$251" });
      await blockedLabel.evaluate((el) => el.scrollIntoView({ block: "center" }));
      await blockedLabel.tap({ force: true });
      await expect(page).toHaveURL(/\/give$/);
      await expect(card(page, 3).locator(".org-gift")).toHaveCount(0);
      await expect(card(page, 3).locator(".amount-reason")).toBeVisible();
      // Change a gift to No thanks: invalid total, Continue disabled with a reason.
      await give(page, 2, 0);
      await expect(total).toHaveText("Allocated: $752 of $1,003");
      await expect(cont).toBeDisabled();
      await expect(page.locator("#continue-reason")).toBeVisible();
      // Fix it, continue, come back: everything is still there.
      await give(page, 3, 251);
      await expect(cont).toBeEnabled();
      // The bar never covers the Continue button.
      const bar = (await page.locator(".basket").boundingBox())!;
      const btn = (await cont.boundingBox())!;
      expect(btn.y).toBeGreaterThanOrEqual(bar.y);
      await press(page, cont);
      await expect(page).toHaveURL(/\/give\/review$/);
      await press(page, page.getByRole("button", { name: "Back to giving portal" }));
      await expect(total).toHaveText("Allocated: $1,003 of $1,003");
      await audit(page, device, "touch-give-after-back");
    });
  });
}
