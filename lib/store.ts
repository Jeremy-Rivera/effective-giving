// Session-only storage. Nothing leaves the browser until the participant
// reaches the final page and submits, which is what the consent text promises
// ("none of the data you have entered to that point will be used or stored").

export type Condition = "control" | "treatment";

export type Session = {
  id: string;
  condition: Condition;
  startedAt: string;
  locale?: string;
  allocationConfirmedAt?: string;
  consent?: Record<string, string>;
  email?: string;
  baseline?: Record<string, unknown>;
  video?: { watchedFraction: number; secondsOnPage: number };
  allocation?: Record<string, number>;
  post?: Record<string, unknown>;
};

const KEY = "jain-ea-session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as Session) : null;
}

export function startSession(): Session {
  const s: Session = {
    id: crypto.randomUUID(),
    condition: Math.random() < 0.5 ? "control" : "treatment",
    startedAt: new Date().toISOString(),
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
