"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startSession, storageAvailable, updateSession, type AssignmentMethod, type Condition } from "@/lib/store";
import { randomBit } from "@/lib/orgs";
import { useT } from "@/lib/i18n";

type Answers = { age?: string; jain?: string; us?: string };

const coin = (): Condition => (randomBit() ? "treatment" : "control");

// Asks the server for the arm with fewer assignments so far (balanced 50/50).
// Never blocks the participant: after 3 seconds, or on any error, the browser
// flips its own coin and the record says so.
async function assign(): Promise<{ condition: Condition; assignmentMethod: AssignmentMethod }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const r = await fetch("/api/assign", { method: "POST", signal: ctrl.signal, cache: "no-store" });
    const { condition } = await r.json();
    if (r.ok && (condition === "control" || condition === "treatment")) return { condition, assignmentMethod: "server_balanced" };
  } catch {
    // fall through
  } finally {
    clearTimeout(timer);
  }
  return { condition: coin(), assignmentMethod: "client_fallback" };
}

// Test mode (?test=1, optionally &condition=control|treatment): the record is
// marked is_test and the real assignment counter is never touched.
function testMode(): { condition: Condition } | null {
  const q = new URLSearchParams(window.location.search);
  if (q.get("test") !== "1") return null;
  const forced = q.get("condition");
  return { condition: forced === "control" || forced === "treatment" ? forced : coin() };
}

export default function LandingPage() {
  const router = useRouter();
  const { t, locale } = useT();
  const L = t.landing;
  const [a, setA] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function consent() {
    if (busy) return;
    if (!(a.age && a.jain && a.us)) {
      setError(L.error);
      return;
    }
    const eligible = a.age === "yes" && a.jain === "yes" && a.us === "yes";
    if (!eligible) return router.push("/screened-out");
    if (!storageAvailable()) return setError(t.storageBlocked);
    setBusy(true);
    const test = testMode();
    const arm = test ? { condition: test.condition, assignmentMethod: "test" as const } : await assign();
    startSession({ ...arm, isTest: Boolean(test) });
    updateSession({
      locale,
      consent: { age: a.age, jain: a.jain, us: a.us, consentedAt: new Date().toISOString(), locale },
    });
    router.push("/survey");
  }

  const radio = (name: keyof Answers, value: string, label: string) => (
    <label>
      <input type="radio" name={name} value={value} checked={a[name] === value} onChange={() => setA({ ...a, [name]: value })} />
      {label}
    </label>
  );

  return (
    <>
      <h1>{L.title}</h1>
      <p>{L.p1}</p>
      <p>
        {L.contactLead} (<a href="mailto:jwhenry@usf.edu">jwhenry@usf.edu</a>) {L.contactJoin} (
        <a href="mailto:ajchauradia@usf.edu">ajchauradia@usf.edu</a>).
      </p>
      <p>{L.p3}</p>

      <section className="consent-block" aria-labelledby="consent-heading">
        <h2 id="consent-heading">{L.confirmHeading}</h2>
        <fieldset>
          <legend>1. {L.q1}</legend>
          <div className="options">{radio("age", "yes", L.q1yes)}{radio("age", "no", L.q1no)}</div>
        </fieldset>
        <fieldset>
          <legend>2. {L.q2}</legend>
          <div className="options">{radio("jain", "yes", L.q2yes)}{radio("jain", "no", L.q2no)}</div>
        </fieldset>
        <fieldset>
          <legend>3. {L.q3}</legend>
          <div className="options">{radio("us", "yes", L.q3yes)}{radio("us", "no", L.q3no)}</div>
        </fieldset>
        <button className="primary" type="button" onClick={consent} aria-busy={busy}>{busy ? L.starting : L.consentButton}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      <p className="subtext">{L.subtext}</p>
    </>
  );
}
