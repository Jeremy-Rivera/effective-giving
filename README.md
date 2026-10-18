# Jain Philanthropy and Effective Altruism: study site

Next.js 14 (App Router), no UI framework. Deploys to Vercel or Netlify with zero config.
Available in English, Hindi, and Gujarati via the switcher in the masthead.

## Run locally

    npm install
    cp .env.example .env.local   # add the two YouTube IDs
    npm run dev

## Flow

| Route | What it does |
|---|---|
| `/` | Landing page with the IRB consent text and three eligibility questions. On consent, asks `/api/assign` for the condition (balanced 50/50, falling back to a coin flip after 3 seconds) and draws 4 of the 7 scenarios. Add `?test=1` (optionally `&condition=control` or `treatment`) for a test session. |
| `/screened-out` | Shown when any eligibility answer is No. Nothing stored. |
| `/survey` | Email plus Sections A to D. |
| `/watch` | YouTube player. Control plays the Segment 1 video; Treatment plays the Segment 1 + 2 video. Continue unlocks at 90 percent watched. |
| `/give` | Giving portal: 8 organizations (4 random scenarios of 7, each scenario's two organizations next to each other, drawn once at consent). One card per row; tapping a card shows the full description and the amount buttons (No thanks, $251, $501, $751, $1,001). At most three gifts; Continue unlocks when the total is $1,001 to $1,003. |
| `/give/review` | Receipt-style summary with Back and Confirm. |
| `/give/confirmation` | Thank-you page with a reference number and summary. |
| `/post` | Sections F to H. Submits the whole record to `/api/submit`. |
| `/done` | Closing page. Clears the browser session. |

Everything is held in `sessionStorage` until the final submit, so a participant who stops partway leaves nothing behind, which matches the consent language.

## Languages

All copy lives in `lib/i18n/en.ts`, `hi.ts`, and `gu.ts`. Each file holds the consent text, survey items, portal copy, and organization descriptions for one language. Stored answers use the English option text regardless of display language, so all three languages land in one coding scheme. The participant's language is saved with their record (`locale`).

## Where to edit content

- Consent and landing text: `lib/i18n/*.ts` under `landing`
- Survey items: `lib/i18n/*.ts` under `survey.sections` and `post.sections`
- Organizations (English text, EA flags, image alt text): `lib/orgs.ts`; Hindi and Gujarati under `orgs` in `lib/i18n/hi.ts` and `gu.ts`
- Scenario pairs, A/B and EA flags: `scenario`, `variant`, `ea`, `jainValues` in `lib/orgs.ts` (verbatim from AJ's "Seven Scenarios - Revised" document)
- Budget, amounts, gift limit and valid totals: `lib/money.ts`
- Masthead (IRB number): `lib/i18n/*.ts` under `masthead`
- Video IDs and watch gate: `.env.local`

## Organization images

One image per organization lives at `public/orgs/org01.jpg` ... `org14.jpg` (the ids in `lib/orgs.ts`). All twelve are openly licensed photos from Wikimedia Commons; sources, authors and licenses are in `public/orgs/CREDITS.md`. Each organization's `imageAlt` and `credit` (shown as plain text under the enlarged image, as CC BY and CC BY-SA require) are in `lib/orgs.ts`. If a file is missing, the card shows a neutral placeholder with the organization name.

To replace an image, overwrite the file, then update `imageAlt`, `credit` and the CREDITS.md row.

Image requirements:

- License-free (public domain or a license that allows this use, with attribution recorded if required)
- No non-vegetarian food
- No tattoos
- No identifiable logos of real organizations
- No depictions of religious figures
- Landscape, roughly 16:9 or 3:2, about 960 px wide, under 150 KB

## Storage

Responses go to Supabase (Postgres). `supabase/schema.sql` creates:

- `responses`: one row per completed participant, keyed by the browser session id (a retry never double-inserts), with derived columns for analysis (`ea_dollars`, `ea_share`, `jain_values_dollars`, `n_orgs_funded`, `max_single_gift`, `top_choice_org_id`).
- `contact_emails`: email plus a day-level date, with no id or other link to `responses` (consent text: the email is removed from responses).
- `assignment_state` and `assign_condition()`: two counters that keep Control and Treatment balanced; no participant data.
- `is_test` on both tables marks `?test=1` sessions; `supabase/delete-test-data.sql` removes them. `design_version` separates v2 rows from earlier ones (`v1-12orgs`).
- `responses_export`: a flat view, one column per answer and per organization, for CSV export.

`app/api/submit/route.ts` validates the record (amounts from the fixed list, total $1,001 to $1,003, at most three organizations, only shown organizations, whole scenario pairs), then calls `submit_response()`, which writes both tables in one transaction. It needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-only). Without them it returns 500 in production; in `npm run dev` it prints a warning and the record instead of saving. IP addresses, user agents and request bodies are never read or logged.

## Tests

    npx playwright install chromium   # once
    npm run test:e2e

Builds the site with test video ids and runs the acceptance tests in `tests/acceptance.spec.ts` against a production server and a local stand-in for Supabase (`tests/fake-supabase.mjs`, which runs `supabase/schema.sql` in PGlite). Phone screenshots (7 viewports, Chromium and WebKit) land in `tests/screenshots/`. `tests/load.spec.ts` fires 60 concurrent assignments and submissions; point it at a deployed site with `LOAD_BASE=https://... npx playwright test --project=load`. Run `npm run build` afterwards before `npm start`, since the test build bakes in placeholder video ids.
