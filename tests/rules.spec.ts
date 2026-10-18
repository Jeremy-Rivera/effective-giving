import { test, expect } from "@playwright/test";
import { BUDGET, OPTIONS, blockedReason, isValidAllocation } from "../lib/money";
import { ORGS, ORG_IDS, drawScenarios, isValidDraw, orgsInScenario } from "../lib/orgs";
import { teaser } from "../lib/teaser";
import { youTubeId } from "../lib/youtube";

// Pure rules, no browser (brief v2, section 9 items 1, 2 and 4).

const key = (xs: number[]) => xs.filter((n) => n > 0).sort((a, b) => b - a).join(" + ");

test("allocation: exactly four combinations of up to three gifts are valid", () => {
  const valid = new Set<string>();
  // Every way to give OPTIONS amounts to up to three organizations.
  for (const a of OPTIONS) for (const b of OPTIONS) for (const c of OPTIONS)
    if (isValidAllocation([a, b, c])) valid.add(key([a, b, c]));
  expect([...valid].sort()).toEqual(["1001", "501 + 251 + 251", "501 + 501", "751 + 251"].sort());

  for (const bad of [[751, 501], [251, 251, 251], [501, 501, 501], [1001, 251], [751], [501, 251], [251, 251], [0, 0, 0], [1001, 1001]])
    expect(isValidAllocation(bad), key(bad)).toBe(false);
  // A fourth gift is never valid, even with a valid-looking total.
  expect(isValidAllocation([251, 251, 251, 251])).toBe(false);
  // Only the listed amounts.
  for (const bad of [[1000], [250, 751], [500, 501], [1002], [1003]]) expect(isValidAllocation(bad), key(bad)).toBe(false);
});

test("allocation: a fourth gift and amounts over the remaining budget are blocked", () => {
  const three = { org01: 501, org03: 251, org05: 251 };
  for (const n of OPTIONS.filter((n) => n > 0)) expect(blockedReason(three, "org07", n)).toBe("maxGifts");
  expect(blockedReason(three, "org07", 0)).toBeNull();
  // Changing one of the three is allowed within the budget.
  expect(blockedReason(three, "org01", 501)).toBeNull();
  expect(blockedReason(three, "org01", 751)).toBe("budget"); // 751 + 502 > 1003

  const one = { org01: 751 };
  expect(BUDGET - 751).toBe(252);
  expect(blockedReason(one, "org02", 251)).toBeNull();
  for (const n of [501, 751, 1001]) expect(blockedReason(one, "org02", n)).toBe("budget");
  // The organization's own gift does not count against itself.
  expect(blockedReason(one, "org01", 1001)).toBeNull();
});

test("draw: 300 draws are always 4 distinct scenarios as adjacent pairs, well mixed", () => {
  const scenarioOrders = new Set<string>();
  const firstOfPair = new Map<string, number>();
  const seen = Object.fromEntries(ORG_IDS.map((id) => [id, 0]));
  for (let i = 0; i < 300; i++) {
    const { shownScenarios, shownOrgIds } = drawScenarios();
    expect(new Set(shownScenarios).size).toBe(4);
    expect(shownOrgIds).toHaveLength(8);
    expect(new Set(shownOrgIds).size).toBe(8);
    expect(isValidDraw(shownScenarios, shownOrgIds)).toBe(true);
    shownScenarios.forEach((s, j) => {
      expect([...shownOrgIds.slice(j * 2, j * 2 + 2)].sort()).toEqual(orgsInScenario(s).sort());
      firstOfPair.set(shownOrgIds[j * 2], (firstOfPair.get(shownOrgIds[j * 2]) ?? 0) + 1);
    });
    scenarioOrders.add(shownScenarios.join());
    for (const id of shownOrgIds) seen[id]++;
  }
  // Scenario order varies, and both A-first and B-first happen in every scenario.
  expect(scenarioOrders.size).toBeGreaterThan(150);
  for (const o of ORGS) expect(firstOfPair.get(o.id) ?? 0, `${o.id} shown first`).toBeGreaterThan(20);
  // Each organization is shown 4/7 of the time: about 171 of 300.
  for (const [id, n] of Object.entries(seen)) {
    expect(n, id).toBeGreaterThan(120);
    expect(n, id).toBeLessThan(225);
  }
});

test("draw: isValidDraw rejects anything but whole scenario pairs", () => {
  const ok = { s: [1, 2, 3, 4], o: ["org01", "org02", "org04", "org03", "org05", "org06", "org08", "org07"] };
  expect(isValidDraw(ok.s, ok.o)).toBe(true);
  expect(isValidDraw([1, 1, 2, 3], ok.o)).toBe(false); // repeated scenario
  expect(isValidDraw([1, 2, 3], ok.o.slice(0, 6))).toBe(false); // only 3
  expect(isValidDraw([1, 2, 3, 8], ok.o)).toBe(false); // no scenario 8
  expect(isValidDraw(ok.s, ["org01", "org03", "org02", "org04", "org05", "org06", "org07", "org08"])).toBe(false); // split pairs
  expect(isValidDraw([2, 1, 3, 4], ok.o)).toBe(false); // pairs out of the stated order
});

test("data model: 7 scenarios, each one A and one B", () => {
  expect(ORGS).toHaveLength(14);
  for (let s = 1; s <= 7; s++) {
    const pair = ORGS.filter((o) => o.scenario === s);
    expect(pair.map((o) => o.variant).sort()).toEqual(["A", "B"]);
  }
});

test("card summary: first sentence, or more while under 60 characters", () => {
  expect(teaser("A long first sentence that is clearly more than sixty characters long. Second.")).toBe(
    "A long first sentence that is clearly more than sixty characters long.",
  );
  expect(teaser("Short one. Another short one. A third sentence that pushes it over sixty. Last.")).toBe(
    "Short one. Another short one. A third sentence that pushes it over sixty.",
  );
  expect(teaser("No full stop at all")).toBe("No full stop at all");
  expect(teaser("पहला वाक्य। दूसरा वाक्य।")).toBe("पहला वाक्य। दूसरा वाक्य।");
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
