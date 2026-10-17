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

`app/api/submit/route.ts` posts to `SUBMIT_WEBHOOK_URL` if set, otherwise logs to the server console. Point the webhook at whatever store the team picks. IP addresses are never read or stored.
