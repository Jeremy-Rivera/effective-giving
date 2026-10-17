// DECISION 8.1 (confirmed Oct 17: keep $1,000 as the maximum). The IRB protocol abstract says participants
// allocate "a hypothetical $10,000". The site, the consent flow and the Oct 16
// meeting all use $1,000. Jeremy is checking with Justin. If the protocol
// figure wins, change TOTAL here AND the "$1,000" wording in lib/i18n/*.ts
// (give.lede, give.complete, give.continueReason) and supabase/schema.sql
// (ea_share comment, the total check).
export const TOTAL = 1000;

// Most organizations one participant may give to (Oct 16 meeting: "show six,
// your maximum donation is three").
export const MAX_GIFTS = 3;

export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
