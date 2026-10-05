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
| `/` | Landing page with the IRB consent text and three eligibility questions. Assigns Control or Treatment (50/50) on consent. |
| `/screened-out` | Shown when any eligibility answer is No. Nothing stored. |
| `/survey` | Email plus Sections A to D. |
| `/watch` | YouTube player. Control plays the Segment 1 video; Treatment plays the Segment 1 + 2 video. Continue unlocks at 90 percent watched. |
| `/give` | Giving portal: five organization cards, each with a Give button, preset amounts, custom amount, and a running balance. Control sees mission only; Treatment sees mission, impact, and Jain-principles safeguards. |
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
- Organization descriptions (both conditions): `lib/i18n/*.ts` under `organizations`
- Masthead (IRB number): `lib/i18n/*.ts` under `masthead`
- Video IDs and watch gate: `.env.local`

## Storage

`app/api/submit/route.ts` posts to `SUBMIT_WEBHOOK_URL` if set, otherwise logs to the server console. Point the webhook at whatever store the team picks. IP addresses are never read or stored.
