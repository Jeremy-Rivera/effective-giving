// Server-side validation of the completed session and its mapping to the
// `responses` row (supabase/schema.sql). Derived columns are computed here so
// researchers can regress on flat columns without unpacking JSON.

import { z } from "zod";
import { ORG_IDS, SHOWN_COUNT, isValidDraw, orgById, type OrgId } from "./orgs";
import { GIFT_AMOUNTS, MAX_GIFTS, MAX_TOTAL, MIN_TOTAL } from "./money";
import { problems } from "./answers";
import { en } from "./i18n/en";

// Stored with every row so analysis never mixes designs. Rows saved before
// this release default to 'v1-12orgs' in the database.
export const DESIGN_VERSION = "v2-14orgs-4scenarios";

// The English questions are the source of truth for what must be answered.
const BASELINE_SECTIONS = en.survey.sections.filter((s) => s.id !== "contact");
const POST_SECTIONS = en.post.sections;

const orgId = z.enum(ORG_IDS as [string, ...string[]]);
const isoDate = z.string().datetime({ offset: true });
const answers = z.record(z.unknown());

export const submissionSchema = z
  .object({
    id: z.string().uuid(),
    condition: z.enum(["control", "treatment"]),
    assignmentMethod: z.enum(["server_balanced", "client_fallback", "test"]),
    isTest: z.boolean(),
    startedAt: isoDate,
    locale: z.enum(["en", "hi", "gu"]),
    consent: z.object({
      age: z.literal("yes"),
      jain: z.literal("yes"),
      us: z.literal("yes"),
      consentedAt: isoDate,
      locale: z.string().optional(),
    }),
    email: z.string().trim().email().max(320),
    baseline: answers,
    video: z.object({
      watchedFraction: z.number().min(0).max(1),
      secondsOnPage: z.number().int().nonnegative(),
    }),
    videoId: z.string().max(64),
    shownScenarios: z.array(z.number().int().min(1).max(7)).length(4),
    shownOrgIds: z.array(orgId).length(SHOWN_COUNT),
    expandedOrgIds: z.array(orgId).max(ORG_IDS.length).default([]),
    allocation: z.record(z.number().int()),
    allocationConfirmedAt: isoDate,
    secondsOnAllocation: z.number().int().nonnegative(),
    post: answers,
    viewportBucket: z.enum(["mobile", "tablet", "desktop"]),
  })
  .superRefine((s, ctx) => {
    if (!isValidDraw(s.shownScenarios, s.shownOrgIds))
      ctx.addIssue({ code: "custom", path: ["shownOrgIds"], message: "must be the two organizations of each of 4 distinct scenarios, in pairs" });
    const entries = Object.entries(s.allocation);
    if (entries.some(([, v]) => !GIFT_AMOUNTS.includes(v)))
      ctx.addIssue({ code: "custom", path: ["allocation"], message: `amounts must be one of ${GIFT_AMOUNTS.join(", ")}` });
    if (entries.length > MAX_GIFTS)
      ctx.addIssue({ code: "custom", path: ["allocation"], message: `at most ${MAX_GIFTS} organizations` });
    const total = entries.reduce((a, [, v]) => a + v, 0);
    if (total < MIN_TOTAL || total > MAX_TOTAL)
      ctx.addIssue({ code: "custom", path: ["allocation"], message: `must total ${MIN_TOTAL} to ${MAX_TOTAL}` });
    if (entries.some(([k]) => !s.shownOrgIds.includes(k as never)))
      ctx.addIssue({ code: "custom", path: ["allocation"], message: "keys must be in shownOrgIds" });
    if (s.expandedOrgIds.some((k) => !s.shownOrgIds.includes(k as never)))
      ctx.addIssue({ code: "custom", path: ["expandedOrgIds"], message: "must be in shownOrgIds" });
    // Every question is required (follow-ups only when shown).
    for (const [where, sections, values] of [["baseline", BASELINE_SECTIONS, s.baseline], ["post", POST_SECTIONS, s.post]] as const)
      for (const [id, problem] of Object.entries(problems(sections, values)))
        ctx.addIssue({ code: "custom", path: [where, id], message: problem });
    if (typeof s.post.F2 !== "string" || !(s.allocation[s.post.F2] > 0))
      ctx.addIssue({ code: "custom", path: ["post", "F2"], message: "must be a funded organization" });
  });

export type Submission = z.infer<typeof submissionSchema>;

export function toResponseRow(s: Submission) {
  // Email never goes in this row (consent text: it is removed from responses).
  const { email: _drop, ...baseline } = s.baseline as Record<string, unknown>;
  void _drop;

  const funded = Object.entries(s.allocation).filter(([, v]) => v > 0);
  const total = funded.reduce((a, [, v]) => a + v, 0);
  const sumWhere = (pred: (id: string) => boolean) =>
    funded.filter(([id]) => pred(id)).reduce((a, [, v]) => a + v, 0);
  const eaDollars = sumWhere((id) => orgById(id)!.ea);
  const f2 = typeof s.post.F2 === "string" ? s.post.F2 : null;
  const topChoice = f2 && s.shownOrgIds.includes(f2 as never) ? f2 : null;
  // Funded organizations in the order they were shown, so columns read naturally.
  const fundedIds = s.shownOrgIds.filter((id) => (s.allocation[id] ?? 0) > 0);
  const name = (id: string) => orgById(id)!.name;
  // One dollar column per organization (0 if not funded or not shown).
  const perOrg = Object.fromEntries(ORG_IDS.map((id: OrgId) => [`${id}_dollars`, s.allocation[id] ?? 0]));
  // Keep only expanded cards that were shown, in shown order, once each.
  const expanded = s.shownOrgIds.filter((id) => s.expandedOrgIds.includes(id));

  return {
    id: s.id,
    started_at: s.startedAt,
    locale: s.locale,
    condition: s.condition,
    assignment_method: s.assignmentMethod,
    is_test: s.isTest,
    design_version: DESIGN_VERSION,
    consent: s.consent,
    baseline,
    video_watched_fraction: s.video.watchedFraction,
    video_seconds_on_page: s.video.secondsOnPage,
    video_id: s.videoId,
    shown_scenarios: s.shownScenarios,
    shown_org_ids: s.shownOrgIds,
    expanded_org_ids: expanded,
    allocation: Object.fromEntries(funded),
    allocation_confirmed_at: s.allocationConfirmedAt,
    seconds_on_allocation: s.secondsOnAllocation,
    post: s.post,
    viewport_bucket: s.viewportBucket,
    allocation_total: total,
    n_orgs_funded: funded.length,
    max_single_gift: Math.max(0, ...funded.map(([, v]) => v)),
    ea_dollars: eaDollars,
    non_ea_dollars: total - eaDollars,
    ea_share: eaDollars / total,
    jain_values_dollars: sumWhere((id) => orgById(id)!.jainValues),
    top_choice_org_id: topChoice,
    top_choice_org_name: topChoice ? name(topChoice) : null,
    funded_org_ids: fundedIds,
    funded_orgs: fundedIds.map((id) => `${name(id)}: $${s.allocation[id]}`).join("; "),
    shown_orgs: s.shownOrgIds.map(name).join("; "),
    ...perOrg,
  };
}
