// The 14 hypothetical organizations for the giving exercise: 7 scenarios, each
// with two organizations (variant A and variant B). Shared by the client
// (cards, draw) and the server (validation, derived columns), so keep this
// module free of browser-only code.
//
// !!! PLACEHOLDER DATA !!!
// Names and descriptions come from AJ Chauradia's document "the charitable
// funds allocation exercise", which has not been pasted in yet. Until it is,
// every entry is titled "PLACEHOLDER NN". Replace `name` and `description`
// VERBATIM (no paraphrasing or shortening), confirm the scenario/variant
// pairing and the ea/jainValues flags against the document, then set
// ORGS_ARE_PLACEHOLDERS to false. Hindi and Gujarati text lives in
// lib/i18n/{hi,gu}.ts under `orgs`; until it exists, English is shown.
//
// Images: /public/orgs/<id>.jpg (see README). If a file is missing the card
// shows a neutral placeholder. The twelve existing photos were chosen for the
// OLD twelve organizations, so they may not match the new ones; imageAlt and
// credit below describe the photo actually in each file.

export const ORGS_ARE_PLACEHOLDERS = true;

export type OrgId =
  | "org01" | "org02" | "org03" | "org04" | "org05" | "org06" | "org07"
  | "org08" | "org09" | "org10" | "org11" | "org12" | "org13" | "org14";

export type Org = {
  id: OrgId;
  // 1 to 7. Never shown to participants.
  scenario: number;
  // Never shown to participants. A is typically the more EA-style option.
  variant: "A" | "B";
  name: string;
  ea: boolean;
  jainValues: boolean;
  description: string;
  imageAlt: string;
  // Photographer and license, shown under the expanded card's text. Full
  // sources and license links: public/orgs/CREDITS.md.
  credit: string;
};

// Photo currently in each public/orgs file (from the previous design).
const PHOTO: Record<string, { imageAlt: string; credit: string }> = {
  org01: { imageAlt: "A smiling boy hangs a blue mosquito net on a wall", credit: "U.S. President's Malaria Initiative, public domain" },
  org02: { imageAlt: "Schoolchildren in an Indian classroom raise their hands as their teacher speaks", credit: "Ambuj Saxena, public domain" },
  org03: { imageAlt: "A health worker gives a vaccination to a boy held by his mother", credit: "Andrew W. McGalliard, U.S. Army, public domain" },
  org04: { imageAlt: "A veterinarian examines a small rescued dog held by a volunteer", credit: "Bob McMillan, FEMA, public domain" },
  org05: { imageAlt: "A researcher studies medical scan images on several computer screens", credit: "Julianne Showalter, U.S. Air Force, public domain" },
  org06: { imageAlt: "A young volunteer kneels beside a tree seedling she has planted", credit: "Steve Hillebrand, U.S. Fish and Wildlife Service, public domain" },
  org07: { imageAlt: "Two analysts review a disease map and charts on a large screen", credit: "CDC Global, CC BY 2.0" },
  org08: { imageAlt: "A teacher holds up a picture book for children in a school library", credit: "Frederick Noronha, CC BY-SA 4.0" },
  org09: { imageAlt: "A long, lit underground tunnel carved through rock", credit: "kallerna, CC BY-SA 3.0" },
  org10: { imageAlt: "Cows resting and standing in a covered shelter", credit: "Irshad M Venur, CC BY-SA 3.0" },
  org11: { imageAlt: "Two researchers in protective suits work at a laboratory safety cabinet", credit: "National Institute of Allergy and Infectious Diseases, public domain" },
  org12: { imageAlt: "People wait in line at an outdoor medical camp", credit: "Sarvodaya Shramadana, CC BY 2.0" },
};

const pad = (n: number) => String(n).padStart(2, "0");

// Default mapping until the document confirms it: scenario = ceil(N/2); odd N
// is variant A (EA-style), even N is variant B (Jain-values).
export const ORGS: Org[] = Array.from({ length: 14 }, (_, i) => {
  const n = i + 1;
  const id = `org${pad(n)}` as OrgId;
  const variant = n % 2 === 1 ? "A" : "B";
  return {
    id,
    scenario: Math.ceil(n / 2),
    variant,
    name: `PLACEHOLDER ${pad(n)}`,
    ea: variant === "A",
    jainValues: variant === "B",
    // Never mention the scenario or variant here: participants read this text.
    description: `Placeholder text for organization ${n} of AJ Chauradia's document. It must be replaced with the full description, word for word, before launch.`,
    imageAlt: PHOTO[id]?.imageAlt ?? "",
    credit: PHOTO[id]?.credit ?? "",
  };
});

export const ORG_IDS = ORGS.map((o) => o.id);
export const orgById = (id: string) => ORGS.find((o) => o.id === id);

export const SCENARIOS = [1, 2, 3, 4, 5, 6, 7] as const;
export const SCENARIOS_SHOWN = 4;
// Two organizations per shown scenario.
export const SHOWN_COUNT = SCENARIOS_SHOWN * 2;

export const orgsInScenario = (scenario: number) => ORGS.filter((o) => o.scenario === scenario).map((o) => o.id);

// Uniform integer in [0, n) from the platform CSPRNG, without modulo bias.
function randomInt(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % n;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Runs once at consent and is stored in the session, so it is never redrawn.
// Picks 4 of the 7 scenarios in random order (a shuffle's first four are
// already in random order). Each scenario's two organizations sit next to
// each other, A or B first by coin flip (decision 11.1). Participants never
// see scenario numbers or A/B labels.
export function drawScenarios(): { shownScenarios: number[]; shownOrgIds: OrgId[] } {
  const shownScenarios = shuffle(SCENARIOS).slice(0, SCENARIOS_SHOWN);
  const shownOrgIds = shownScenarios.flatMap((s) => shuffle(orgsInScenario(s)));
  return { shownScenarios, shownOrgIds };
}

// True when shownOrgIds is exactly the two organizations of each shown
// scenario, pair by pair, in the scenarios' order.
export function isValidDraw(shownScenarios: number[], shownOrgIds: string[]): boolean {
  if (shownScenarios.length !== SCENARIOS_SHOWN || new Set(shownScenarios).size !== SCENARIOS_SHOWN) return false;
  if (!shownScenarios.every((s) => (SCENARIOS as readonly number[]).includes(s))) return false;
  if (shownOrgIds.length !== SHOWN_COUNT) return false;
  return shownScenarios.every((s, i) => {
    const pair = shownOrgIds.slice(i * 2, i * 2 + 2);
    return [...pair].sort().join() === orgsInScenario(s).sort().join();
  });
}

// Coin flip for the experimental condition, from the same CSPRNG. Used only
// when the server assignment is unavailable (client_fallback) or in test mode.
export const randomBit = () => randomInt(2) === 1;
