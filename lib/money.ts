// DECISION 8.1 / 11.7: the IRB protocol abstract says participants allocate
// "a hypothetical $10,000". The Oct 17 meeting chose a budget of up to $1,003
// (amounts end in 1, which Jain donors prefer over round numbers). Jeremy is
// checking with Justin. If the figure changes, change the constants here AND
// the dollar wording in lib/i18n/*.ts (give.lede, give.continueReason) and the
// comments in supabase/schema.sql.

// The most a participant may allocate (the "up to" figure shown on /give).
export const BUDGET = 1003;

// The only choices per organization. 0 is "No thanks".
export const OPTIONS = [0, 251, 501, 751, 1001] as const;
export const GIFT_AMOUNTS: readonly number[] = OPTIONS.filter((n) => n > 0);

// Most organizations one participant may give to.
export const MAX_GIFTS = 3;

// A valid total is more than $1,000 and at most $1,003. With amounts ending
// in 1 and at most three gifts, exactly four combinations qualify:
// 1001; 751 + 251; 501 + 501; 501 + 251 + 251.
export const MIN_TOTAL = 1001;
export const MAX_TOTAL = 1003;

export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export type Gifts = Record<string, number>;

export const sum = (gifts: Gifts) => Object.values(gifts).reduce((a, b) => a + b, 0);

export function isValidAllocation(amounts: number[]): boolean {
  const gifts = amounts.filter((n) => n > 0);
  const total = gifts.reduce((a, b) => a + b, 0);
  return gifts.length <= MAX_GIFTS && gifts.every((n) => GIFT_AMOUNTS.includes(n)) && total >= MIN_TOTAL && total <= MAX_TOTAL;
}

// Why an amount cannot be chosen for one organization right now, given the
// gifts to the OTHER organizations. null means it can be chosen.
export type Blocked = "maxGifts" | "budget" | null;

export function blockedReason(gifts: Gifts, id: string, amount: number): Blocked {
  if (amount === 0) return null;
  const others = Object.entries(gifts).filter(([k, v]) => k !== id && v > 0);
  if (others.length >= MAX_GIFTS) return "maxGifts";
  if (amount > BUDGET - others.reduce((a, [, v]) => a + v, 0)) return "budget";
  return null;
}
