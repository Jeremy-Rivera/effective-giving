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
  top_choice_org_id       text,                      -- post-survey F2 answer
  top_choice_org_name     text,
  funded_org_ids          text[],                    -- organizations given money, in shown order
  funded_orgs             text,                      -- e.g. "Gau Seva Trust: $600; Global Malaria Initiative: $400"
  shown_orgs              text,                      -- names of the 6 shown, in order
  org01_dollars           integer not null default 0, -- Global Malaria Initiative
  org02_dollars           integer not null default 0, -- Ahimsa Education Trust
  org03_dollars           integer not null default 0, -- Pandemic Preparedness Network
  org04_dollars           integer not null default 0, -- Jiva Daya Animal Trust
  org05_dollars           integer not null default 0, -- AI Health Research Initiative
  org06_dollars           integer not null default 0, -- Living Earth Foundation
  org07_dollars           integer not null default 0, -- Global Outbreak Surveillance Alliance
  org08_dollars           integer not null default 0, -- Jain Community Learning Centers
  org09_dollars           integer not null default 0, -- Global Nuclear Risk Institute
  org10_dollars           integer not null default 0, -- Gau Seva Trust
  org11_dollars           integer not null default 0, -- Future Humanity Foundation
  org12_dollars           integer not null default 0  -- Compassion in Action Foundation
);

-- Columns added after the first release (no-ops on a fresh install).
alter table public.responses
  add column if not exists top_choice_org_name text,
  add column if not exists funded_org_ids text[],
  add column if not exists funded_orgs text,
  add column if not exists shown_orgs text,
  add column if not exists org01_dollars integer not null default 0,
  add column if not exists org02_dollars integer not null default 0,
  add column if not exists org03_dollars integer not null default 0,
  add column if not exists org04_dollars integer not null default 0,
  add column if not exists org05_dollars integer not null default 0,
  add column if not exists org06_dollars integer not null default 0,
  add column if not exists org07_dollars integer not null default 0,
  add column if not exists org08_dollars integer not null default 0,
  add column if not exists org09_dollars integer not null default 0,
  add column if not exists org10_dollars integer not null default 0,
  add column if not exists org11_dollars integer not null default 0,
  add column if not exists org12_dollars integer not null default 0;

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
  inserted integer;
begin
  -- Every column of responses is filled from the JSON, so a column added later
  -- can never be silently dropped. received_at is always the server's time.
  insert into public.responses
  select (jsonb_populate_record(null::public.responses, p_response || jsonb_build_object('received_at', now()))).*
  on conflict (id) do nothing;

  get diagnostics inserted = row_count;

  if inserted = 1 and coalesce(btrim(p_email), '') <> '' then
    insert into public.contact_emails (email) values (btrim(p_email));
  end if;

  return inserted = 1;
end;
$$;

-- Fill the newer columns for any rows saved before they existed.
with names(id, name) as (values
    ('org01', 'Global Malaria Initiative'),
    ('org02', 'Ahimsa Education Trust'),
    ('org03', 'Pandemic Preparedness Network'),
    ('org04', 'Jiva Daya Animal Trust'),
    ('org05', 'AI Health Research Initiative'),
    ('org06', 'Living Earth Foundation'),
    ('org07', 'Global Outbreak Surveillance Alliance'),
    ('org08', 'Jain Community Learning Centers'),
    ('org09', 'Global Nuclear Risk Institute'),
    ('org10', 'Gau Seva Trust'),
    ('org11', 'Future Humanity Foundation'),
    ('org12', 'Compassion in Action Foundation')
)
update public.responses r set
  funded_org_ids = sub.ids,
  funded_orgs = sub.txt,
  shown_orgs = (select string_agg(n.name, '; ' order by o.ord) from unnest(r.shown_org_ids) with ordinality o(id, ord) join names n on n.id = o.id),
  top_choice_org_name = (select name from names where id = r.top_choice_org_id),
  org01_dollars = coalesce((r.allocation->>'org01')::int, 0),
  org02_dollars = coalesce((r.allocation->>'org02')::int, 0),
  org03_dollars = coalesce((r.allocation->>'org03')::int, 0),
  org04_dollars = coalesce((r.allocation->>'org04')::int, 0),
  org05_dollars = coalesce((r.allocation->>'org05')::int, 0),
  org06_dollars = coalesce((r.allocation->>'org06')::int, 0),
  org07_dollars = coalesce((r.allocation->>'org07')::int, 0),
  org08_dollars = coalesce((r.allocation->>'org08')::int, 0),
  org09_dollars = coalesce((r.allocation->>'org09')::int, 0),
  org10_dollars = coalesce((r.allocation->>'org10')::int, 0),
  org11_dollars = coalesce((r.allocation->>'org11')::int, 0),
  org12_dollars = coalesce((r.allocation->>'org12')::int, 0)
from (
  select r2.id,
    array_agg(o.id order by o.ord) filter (where coalesce((r2.allocation->>o.id)::int, 0) > 0) as ids,
    string_agg(n.name || ': $' || (r2.allocation->>o.id), '; ' order by o.ord) filter (where coalesce((r2.allocation->>o.id)::int, 0) > 0) as txt
  from public.responses r2, unnest(r2.shown_org_ids) with ordinality o(id, ord)
  join names n on n.id = o.id
  group by r2.id
) sub
where sub.id = r.id and r.funded_orgs is null;

revoke all on function public.submit_response(jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_response(jsonb, text) to service_role;

-- Flat, one-row-per-participant view for CSV export and regressions.
-- Every survey answer has its own column (answers are the English option text;
-- 1 to 7 scales are numbers; multi-select answers are joined with "; ").
-- A blank cell means the participant skipped that question.
-- security_invoker keeps RLS in force for anyone querying it.
drop view if exists public.responses_export;
create view public.responses_export
with (security_invoker = true) as
select
  r.id,
  r.received_at,
  r.started_at,
  (r.consent->>'consentedAt')::timestamptz as consented_at,
  r.locale,
  r.condition,
  r.viewport_bucket,
  -- Giving exercise
  r.funded_orgs,
  r.n_orgs_funded,
  r.top_choice_org_name,
  r.max_single_gift,
  r.ea_dollars,
  r.non_ea_dollars,
  r.ea_share,
  r.jain_values_dollars,
  r.org01_dollars as org01_global_malaria_initiative_dollars,
  r.org02_dollars as org02_ahimsa_education_trust_dollars,
  r.org03_dollars as org03_pandemic_preparedness_network_dollars,
  r.org04_dollars as org04_jiva_daya_animal_trust_dollars,
  r.org05_dollars as org05_ai_health_research_initiative_dollars,
  r.org06_dollars as org06_living_earth_foundation_dollars,
  r.org07_dollars as org07_global_outbreak_surveillance_alliance_dollars,
  r.org08_dollars as org08_jain_community_learning_centers_dollars,
  r.org09_dollars as org09_global_nuclear_risk_institute_dollars,
  r.org10_dollars as org10_gau_seva_trust_dollars,
  r.org11_dollars as org11_future_humanity_foundation_dollars,
  r.org12_dollars as org12_compassion_in_action_foundation_dollars,
  r.shown_orgs,
  array_to_string(r.funded_org_ids, ';') as funded_org_ids,
  array_to_string(r.shown_org_ids, ';') as shown_org_ids,
  r.top_choice_org_id,
  r.seconds_on_allocation,
  r.allocation_confirmed_at,
  -- Video
  r.video_id,
  r.video_watched_fraction,
  r.video_seconds_on_page,
  -- Section A: Background
  r.baseline->>'A1' as a1_age,
  r.baseline->>'A2' as a2_gender,          r.baseline->>'A2_other' as a2_gender_other,
  r.baseline->>'A3' as a3_education,
  r.baseline->>'A4' as a4_occupation,      r.baseline->>'A4_other' as a4_occupation_other,
  r.baseline->>'A5' as a5_region,          r.baseline->>'A5_other' as a5_region_other,
  r.baseline->>'A6' as a6_generational_status,
  r.baseline->>'A7' as a7_years_in_us,
  -- Section B: Baseline giving
  r.baseline->>'B1' as b1_donated_past_12mo,
  r.baseline->>'B2' as b2_amount_past_12mo,
  r.baseline->>'B3' as b3_share_to_temple,
  r.baseline->>'B4' as b4_karmic_concern,
  (select string_agg(x, '; ') from jsonb_array_elements_text(coalesce(r.baseline->'B5', '[]')) x) as b5_priorities,
  r.baseline->>'B5_other' as b5_priorities_other,
  r.baseline->>'B6' as b6_volunteering,
  (r.baseline->>'B7')::int as b7_jain_affiliation_importance,
  -- Section C: Jain ethics (1 = strongly disagree, 7 = strongly agree)
  (r.baseline->>'C1')::int as c1_minimize_harm_daily,
  (r.baseline->>'C2')::int as c2_worry_unintended_harm,
  (r.baseline->>'C3')::int as c3_environment_important,
  (r.baseline->>'C4')::int as c4_animals_moral_priority,
  (r.baseline->>'C5')::int as c5_charity_can_harm,
  -- Section D: Evidence-based giving
  r.baseline->>'D1' as d1_heard_of_ea,
  (r.baseline->>'D2')::int as d2_compare_by_outcomes,
  (r.baseline->>'D3')::int as d3_metrics_miss_values,
  (r.baseline->>'D4')::int as d4_trust_transparency,
  -- Section F: About your gifts
  r.post->>'F2' as f2_gave_most_to_org_id,
  (r.post->>'F3')::int as f3_confidence,
  (select string_agg(x, '; ') from jsonb_array_elements_text(coalesce(r.post->'F4', '[]')) x) as f4_influences,
  r.post->>'F4_other' as f4_influences_other,
  -- Section G: Reactions (1 = strongly disagree, 7 = strongly agree)
  (r.post->>'G1')::int as g1_easier_to_compare,
  (r.post->>'G2')::int as g2_consider_non_jain_org,
  (r.post->>'G3')::int as g3_metrics_increased_trust,
  (r.post->>'G4')::int as g4_safeguards_increased_trust,
  (r.post->>'G5')::int as g5_respected_jain_values,
  (r.post->>'G6')::int as g6_learn_more_ebp,
  -- Section H: In your own words
  r.post->>'H1' as h1_responsible_giving,
  r.post->>'H2' as h2_concerns_impact_metrics,
  r.post->>'H3' as h3_safeguards_wanted
from public.responses r;

revoke all on public.responses_export from anon, authenticated;
