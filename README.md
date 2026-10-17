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
| `/` | Landing page with the IRB consent text and three eligibility questions. On consent, assigns Control or Treatment (50/50) and draws the six organizations. |
| `/screened-out` | Shown when any eligibility answer is No. Nothing stored. |
| `/survey` | Email plus Sections A to D. |
| `/watch` | YouTube player. Control plays the Segment 1 video; Treatment plays the Segment 1 + 2 video. Continue unlocks at 90 percent watched. |
| `/give` | Giving portal: six of the twelve organizations (3 EA + 3 Jain-values, shuffled, drawn once at consent). Each card has an image, a teaser, and "Read more", which opens a full-page dialog with the full description and the gift amount. Give up to three organizations; total must be exactly $1,000. Both conditions see the same text. |
| `/give/review` | Receipt-style summary with Back and Confirm. |
| `/give/confirmation` | Thank-you page with a reference number and summary. |
| `/post` | Sections F to H. Submits the whole record to `/api/submit`. |
| `/done` | Closing page. Clears the browser session. |

Everything is held in `sessionStorage` until the final submit, so a participant who stops partway leaves nothing behind, which matches the consent language.

## Languages

All copy lives in `lib/i18n/en.ts`, `hi.ts`, and `gu.ts`. Each file holds the consent text, survey items, portal copy, and organization descriptions for one language. Stored answers use the English option text regardless of display language, so all three languages land in one coding scheme. The participant's language is saved with their record (`locale`).

The Hindi and Gujarati consent text has not been reviewed by a native speaker. Have it checked before it goes to IRB.

## Where to edit content

- Consent and landing text: `lib/i18n/*.ts` under `landing`
- Survey items: `lib/i18n/*.ts` under `survey.sections` and `post.sections`
- Organizations (English text, EA flags, image alt text): `lib/orgs.ts`; Hindi and Gujarati under `orgs` in `lib/i18n/hi.ts` and `gu.ts`
- Selection mode (stratified 3 + 3, or any 6 of 12): `SELECTION_MODE` in `lib/orgs.ts`
- Total to allocate and the three-gift limit: `TOTAL` and `MAX_GIFTS` in `lib/money.ts`
- Masthead (IRB number): `lib/i18n/*.ts` under `masthead`
- Video IDs and watch gate: `.env.local`

## Organization images

Put one image per organization at `public/orgs/org01.jpg` ... `public/orgs/org12.jpg` (the ids in `lib/orgs.ts`). Until a file exists, the card shows a neutral placeholder with the organization name. Set each organization's `imageAlt` in `lib/orgs.ts` to a short, neutral description; leave it empty if the image is purely decorative.

Image requirements:

- License-free (public domain or a license that allows this use, with attribution recorded if required)
- No non-vegetarian food
- No tattoos
- No identifiable logos of real organizations
- No depictions of religious figures
- Landscape, roughly 16:9, at least 1200 px wide, under 300 KB

## Storage

Responses go to Supabase (Postgres). `supabase/schema.sql` creates:

- `responses`: one row per completed participant, keyed by the browser session id (a retry never double-inserts), with derived columns for analysis (`ea_dollars`, `ea_share`, `jain_values_dollars`, `n_orgs_funded`, `max_single_gift`, `top_choice_org_id`).
- `contact_emails`: email plus a day-level date, with no id or other link to `responses` (consent text: the email is removed from responses).
- `responses_export`: a flat view, one column per answer and per organization, for CSV export.

`app/api/submit/route.ts` validates the record (total exactly $1,000, at most three organizations, only shown organizations), then calls `submit_response()`, which writes both tables in one transaction. It needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server-only). Without them it returns 500 in production; in `npm run dev` it prints a warning and the record instead of saving. IP addresses, user agents and request bodies are never read or logged.

## Tests

    npx playwright install chromium   # once
    npm run test:e2e

Builds the site with test video ids and runs the acceptance tests in `tests/acceptance.spec.ts` against a production server and a local stand-in for Supabase (`tests/fake-supabase.mjs`, which runs `supabase/schema.sql` in PGlite). Screenshots at 390 px land in `.playwright/`. Run `npm run build` afterwards before `npm start`, since the test build bakes in placeholder video ids.
