// Session-only storage. Nothing leaves the browser until the participant
// reaches the final page and submits, which is what the consent text promises
// ("none of the data you have entered to that point will be used or stored").
// The one exception is the anonymous assignment counter (/api/assign), which
// records no participant data.

import { drawScenarios, type OrgId } from "./orgs";

export type Condition = "control" | "treatment";
export type ViewportBucket = "mobile" | "tablet" | "desktop";
// server_balanced: /api/assign picked the arm with fewer assignments so far.
// client_fallback: /api/assign failed or timed out; the browser flipped a coin.
// test: a ?test=1 session; the counter is never touched.
export type AssignmentMethod = "server_balanced" | "client_fallback" | "test";

export type Session = {
  id: string;
  condition: Condition;
  assignmentMethod: AssignmentMethod;
  isTest: boolean;
  startedAt: string;
  locale?: string;
  // Drawn once at consent and never redrawn, so back/forward keeps the order.
  shownScenarios: number[];
  shownOrgIds: OrgId[];
  // Cards the participant opened to read the full description.
  expandedOrgIds?: OrgId[];
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

// Some private modes and in-app browsers block or throw on sessionStorage.
export function storageAvailable(): boolean {
  try {
    const probe = `${KEY}-probe`;
    sessionStorage.setItem(probe, "1");
    sessionStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function write(s: Session) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage was checked at consent; if it fails later, keep going in memory
    // for this page rather than breaking it.
  }
}

export function startSession(opts: { condition: Condition; assignmentMethod: AssignmentMethod; isTest: boolean }): Session {
  const s: Session = {
    id: crypto.randomUUID(),
    ...opts,
    startedAt: new Date().toISOString(),
    ...drawScenarios(),
    viewportBucket: viewportBucket(window.innerWidth),
  };
  write(s);
  return s;
}

export function updateSession(patch: Partial<Session>): Session {
  const current = getSession();
  if (!current) throw new Error("no session");
  const s = { ...current, ...patch };
  write(s);
  return s;
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
