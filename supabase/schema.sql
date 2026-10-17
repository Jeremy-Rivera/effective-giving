-- Jain Philanthropy and Effective Altruism (USF IRB Study No. 010845)
-- Run once in the Supabase SQL editor (or `psql "$DATABASE_URL" -f supabase/schema.sql`).
-- Safe to re-run: every statement is idempotent.
--
-- Privacy rules this schema enforces (from the consent text):
--   * No IP address, user agent or other request metadata is stored.
--   * The email lives in contact_emails with NO link to responses: no shared
--     id, no foreign key, and only a day-level date, so rows cannot be joined
--     back by timestamp either.
--   * Row level security is on with no policies, so the public (anon) API key
--     can neither read nor write. Only the server's service role key and the
--     researchers' dashboard logins can see data.

create table if not exists public.responses (
  id                      uuid primary key,          -- client session id; makes retries idempotent
  received_at             timestamptz not null default now(),
  started_at              timestamptz,
  locale                  text check (locale in ('en', 'hi', 'gu')),
  condition               text not null check (condition in ('control', 'treatment')),
  consent                 jsonb not null,            -- age/jain/us answers and consentedAt
  baseline                jsonb not null,            -- /survey answers except email (English option text)
  video_watched_fraction  numeric,
  video_seconds_on_page   integer,
  video_id                text,                      -- YouTube id actually shown
  shown_org_ids           text[] not null,           -- the 6 organizations, in the order shown
  allocation              jsonb not null,            -- {org_id: dollars}, funded organizations only
  allocation_confirmed_at timestamptz,
  seconds_on_allocation   integer,
  post                    jsonb not null,            -- /post answers (F2 is an org id)
  viewport_bucket         text check (viewport_bucket in ('mobile', 'tablet', 'desktop')),
  -- Derived at insert by app/api/submit/route.ts (lib/submission.ts):
  n_orgs_funded           integer,
  max_single_gift         integer,
  ea_dollars              integer,
  non_ea_dollars          integer,
  ea_share                numeric,                   -- ea_dollars / 1000
  jain_values_dollars     integer,
  top_choice_org_id       text                       -- post-survey F2 answer
);

create table if not exists public.contact_emails (
  email      text not null,
  -- Day precision on purpose: an exact timestamp would line up with
  -- responses.received_at and re-identify the response.
  created_at timestamptz not null default date_trunc('day', now())
);

alter table public.responses      enable row level security;
alter table public.contact_emails enable row level security;
-- Deliberately no policies: anon and authenticated roles get nothing.
revoke all on public.responses, public.contact_emails from anon, authenticated;

-- Inserts the response and, only if it is new, the email, in one transaction.
-- Returns true when the response was inserted, false when the id already
-- existed (a client retry), in which case nothing is written.
create or replace function public.submit_response(p_response jsonb, p_email text)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  r public.responses;
  inserted integer;
begin
  r := jsonb_populate_record(null::public.responses, p_response);

  insert into public.responses (
    id, started_at, locale, condition, consent, baseline,
    video_watched_fraction, video_seconds_on_page, video_id, shown_org_ids,
    allocation, allocation_confirmed_at, seconds_on_allocation, post, viewport_bucket,
    n_orgs_funded, max_single_gift, ea_dollars, non_ea_dollars, ea_share,
    jain_values_dollars, top_choice_org_id
  ) values (
    r.id, r.started_at, r.locale, r.condition, r.consent, r.baseline,
    r.video_watched_fraction, r.video_seconds_on_page, r.video_id, r.shown_org_ids,
    r.allocation, r.allocation_confirmed_at, r.seconds_on_allocation, r.post, r.viewport_bucket,
    r.n_orgs_funded, r.max_single_gift, r.ea_dollars, r.non_ea_dollars, r.ea_share,
    r.jain_values_dollars, r.top_choice_org_id
  )
  on conflict (id) do nothing;

  get diagnostics inserted = row_count;

  if inserted = 1 and coalesce(btrim(p_email), '') <> '' then
    insert into public.contact_emails (email) values (btrim(p_email));
  end if;

  return inserted = 1;
end;
$$;

revoke all on function public.submit_response(jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_response(jsonb, text) to service_role;

-- Flat, one-row-per-participant view for CSV export and regressions.
-- Every survey answer gets its own column; multi-select answers are joined
-- with "; ". security_invoker keeps RLS in force for anyone querying it.
create or replace view public.responses_export
with (security_invoker = true) as
select
  r.id,
  r.received_at,
  r.started_at,
  r.locale,
  r.condition,
  r.viewport_bucket,
  r.video_id,
  r.video_watched_fraction,
  r.video_seconds_on_page,
  r.seconds_on_allocation,
  r.allocation_confirmed_at,
  array_to_string(r.shown_org_ids, ';') as shown_org_ids,
  r.shown_org_ids[1] as shown_1, r.shown_org_ids[2] as shown_2, r.shown_org_ids[3] as shown_3,
  r.shown_org_ids[4] as shown_4, r.shown_org_ids[5] as shown_5, r.shown_org_ids[6] as shown_6,
  coalesce((r.allocation->>'org01')::int, 0) as org01_dollars,
  coalesce((r.allocation->>'org02')::int, 0) as org02_dollars,
  coalesce((r.allocation->>'org03')::int, 0) as org03_dollars,
  coalesce((r.allocation->>'org04')::int, 0) as org04_dollars,
  coalesce((r.allocation->>'org05')::int, 0) as org05_dollars,
  coalesce((r.allocation->>'org06')::int, 0) as org06_dollars,
  coalesce((r.allocation->>'org07')::int, 0) as org07_dollars,
  coalesce((r.allocation->>'org08')::int, 0) as org08_dollars,
  coalesce((r.allocation->>'org09')::int, 0) as org09_dollars,
  coalesce((r.allocation->>'org10')::int, 0) as org10_dollars,
  coalesce((r.allocation->>'org11')::int, 0) as org11_dollars,
  coalesce((r.allocation->>'org12')::int, 0) as org12_dollars,
  r.n_orgs_funded,
  r.max_single_gift,
  r.ea_dollars,
  r.non_ea_dollars,
  r.ea_share,
  r.jain_values_dollars,
  r.top_choice_org_id,
  -- Section A
  r.baseline->>'A1' as a1_age,
  r.baseline->>'A2' as a2_gender,          r.baseline->>'A2_other' as a2_other,
  r.baseline->>'A3' as a3_education,
  r.baseline->>'A4' as a4_occupation,      r.baseline->>'A4_other' as a4_other,
  r.baseline->>'A5' as a5_region,          r.baseline->>'A5_other' as a5_other,
  r.baseline->>'A6' as a6_generation,
  r.baseline->>'A7' as a7_years_in_us,
  -- Section B
  r.baseline->>'B1' as b1_donated_12mo,
  r.baseline->>'B2' as b2_amount_12mo,
  r.baseline->>'B3' as b3_temple_share,
  r.baseline->>'B4' as b4_karmic_concern,
  (select string_agg(x, '; ') from jsonb_array_elements_text(coalesce(r.baseline->'B5', '[]')) x) as b5_priorities,
  r.baseline->>'B5_other' as b5_other,
  r.baseline->>'B6' as b6_volunteer,
  (r.baseline->>'B7')::int as b7_jain_affiliation_importance,
  -- Section C (1 to 7)
  (r.baseline->>'C1')::int as c1, (r.baseline->>'C2')::int as c2, (r.baseline->>'C3')::int as c3,
  (r.baseline->>'C4')::int as c4, (r.baseline->>'C5')::int as c5,
  -- Section D
  r.baseline->>'D1' as d1_heard_of_ea,
  (r.baseline->>'D2')::int as d2, (r.baseline->>'D3')::int as d3, (r.baseline->>'D4')::int as d4,
  -- Post-survey
  r.post->>'F2' as f2_top_choice,
  (r.post->>'F3')::int as f3_confidence,
  (select string_agg(x, '; ') from jsonb_array_elements_text(coalesce(r.post->'F4', '[]')) x) as f4_influences,
  r.post->>'F4_other' as f4_other,
  (r.post->>'G1')::int as g1, (r.post->>'G2')::int as g2, (r.post->>'G3')::int as g3,
  (r.post->>'G4')::int as g4, (r.post->>'G5')::int as g5, (r.post->>'G6')::int as g6,
  r.post->>'H1' as h1, r.post->>'H2' as h2, r.post->>'H3' as h3
from public.responses r;

revoke all on public.responses_export from anon, authenticated;
