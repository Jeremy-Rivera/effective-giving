"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startSession, updateSession } from "@/lib/store";
import { useT } from "@/lib/i18n";

type Answers = { age?: string; jain?: string; us?: string };

export default function LandingPage() {
  const router = useRouter();
  const { t, locale } = useT();
  const L = t.landing;
  const [a, setA] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);

  function consent() {
    if (!(a.age && a.jain && a.us)) {
      setError(L.error);
      return;
    }
    const eligible = a.age === "yes" && a.jain === "yes" && a.us === "yes";
    if (!eligible) return router.push("/screened-out");
    startSession();
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
      <p className="lede">{L.lede}</p>
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
        <button className="primary" type="button" onClick={consent}>{L.consentButton}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      <p className="subtext">{L.subtext}</p>
    </>
  );
}
