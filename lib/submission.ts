// Server-side validation of the completed session and its mapping to the
// `responses` row (supabase/schema.sql). Derived columns are computed here so
// researchers can regress on flat columns without unpacking JSON.

import { z } from "zod";
import { ORG_IDS, SHOWN_COUNT, orgById } from "./orgs";
import { MAX_GIFTS, TOTAL } from "./money";

const orgId = z.enum(ORG_IDS as [string, ...string[]]);
const isoDate = z.string().datetime({ offset: true });
const answers = z.record(z.unknown());

export const submissionSchema = z
  .object({
    id: z.string().uuid(),
    condition: z.enum(["control", "treatment"]),
    startedAt: isoDate,
    locale: z.enum(["en", "hi", "gu"]),
    consent: z.object({
      age: z.literal("yes"),
      jain: z.literal("yes"),
      us: z.literal("yes"),
      consentedAt: isoDate,
      locale: z.string().optional(),
    }),
    email: z.string().trim().email().max(320).optional().or(z.literal("")),
    baseline: answers,
    video: z.object({
      watchedFraction: z.number().min(0).max(1),
      secondsOnPage: z.number().int().nonnegative(),
    }),
    videoId: z.string().max(64),
    shownOrgIds: z
      .array(orgId)
      .length(SHOWN_COUNT)
      .refine((ids) => new Set(ids).size === ids.length, "shownOrgIds must be unique"),
    allocation: z.record(z.number().int().nonnegative()),
    allocationConfirmedAt: isoDate,
    secondsOnAllocation: z.number().int().nonnegative(),
    post: answers,
    viewportBucket: z.enum(["mobile", "tablet", "desktop"]),
  })
  .superRefine((s, ctx) => {
    const entries = Object.entries(s.allocation);
    const sum = entries.reduce((a, [, v]) => a + v, 0);
    if (sum !== TOTAL) ctx.addIssue({ code: "custom", path: ["allocation"], message: `must total ${TOTAL}` });
    if (entries.filter(([, v]) => v > 0).length > MAX_GIFTS)
      ctx.addIssue({ code: "custom", path: ["allocation"], message: `at most ${MAX_GIFTS} organizations` });
    if (entries.some(([k]) => !s.shownOrgIds.includes(k as never)))
      ctx.addIssue({ code: "custom", path: ["allocation"], message: "keys must be in shownOrgIds" });
  });

export type Submission = z.infer<typeof submissionSchema>;

export function toResponseRow(s: Submission) {
  // Email never goes in this row (consent text: it is removed from responses).
  const { email: _drop, ...baseline } = s.baseline as Record<string, unknown>;
  void _drop;

  const funded = Object.entries(s.allocation).filter(([, v]) => v > 0);
  const sumWhere = (pred: (id: string) => boolean) =>
    funded.filter(([id]) => pred(id)).reduce((a, [, v]) => a + v, 0);
  const eaDollars = sumWhere((id) => orgById(id)!.ea);
  const f2 = typeof s.post.F2 === "string" ? s.post.F2 : null;

  return {
    id: s.id,
    started_at: s.startedAt,
    locale: s.locale,
    condition: s.condition,
    consent: s.consent,
    baseline,
    video_watched_fraction: s.video.watchedFraction,
    video_seconds_on_page: s.video.secondsOnPage,
    video_id: s.videoId,
    shown_org_ids: s.shownOrgIds,
    allocation: Object.fromEntries(funded),
    allocation_confirmed_at: s.allocationConfirmedAt,
    seconds_on_allocation: s.secondsOnAllocation,
    post: s.post,
    viewport_bucket: s.viewportBucket,
    n_orgs_funded: funded.length,
    max_single_gift: Math.max(0, ...funded.map(([, v]) => v)),
    ea_dollars: eaDollars,
    non_ea_dollars: TOTAL - eaDollars,
    ea_share: eaDollars / TOTAL,
    jain_values_dollars: sumWhere((id) => orgById(id)!.jainValues),
    top_choice_org_id: f2 && s.shownOrgIds.includes(f2 as never) ? f2 : null,
  };
}
