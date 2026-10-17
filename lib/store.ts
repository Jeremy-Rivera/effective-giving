// Session-only storage. Nothing leaves the browser until the participant
// reaches the final page and submits, which is what the consent text promises
// ("none of the data you have entered to that point will be used or stored").

import { drawShownOrgIds, randomBit, type OrgId } from "./orgs";

export type Condition = "control" | "treatment";
export type ViewportBucket = "mobile" | "tablet" | "desktop";

export type Session = {
  id: string;
  condition: Condition;
  startedAt: string;
  locale?: string;
  // Drawn once at consent and never redrawn, so back/forward keeps the order.
  shownOrgIds: OrgId[];
  viewportBucket: ViewportBucket;
  allocationConfirmedAt?: string;
  consent?: Record<string, string>;
  email?: string;
  baseline?: Record<string, unknown>;
  video?: { watchedFraction: number; secondsOnPage: number };
  videoId?: string;
  allocation?: Record<string, number>;
  secondsOnAllocation?: number;
  post?: Record<string, unknown>;
};

const KEY = "jain-ea-session";

// Width only; no user-agent sniffing (the consent text limits what we record).
export function viewportBucket(width: number): ViewportBucket {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function startSession(): Session {
  const s: Session = {
    id: crypto.randomUUID(),
    condition: randomBit() ? "treatment" : "control",
    startedAt: new Date().toISOString(),
    shownOrgIds: drawShownOrgIds(),
    viewportBucket: viewportBucket(window.innerWidth),
  };
  sessionStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export function updateSession(patch: Partial<Session>): Session {
  const s = { ...(getSession() ?? startSession()), ...patch };
  sessionStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}
