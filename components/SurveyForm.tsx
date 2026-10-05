"use client";

import { useState } from "react";
import type { Question, Section } from "@/lib/i18n/types";
import { useT } from "@/lib/i18n";

type Values = Record<string, unknown>;

// `sections` is the localized copy shown to the participant.
// `canonical` is the English copy; stored answers use English option text so
// data from all three languages lands in one coding scheme.
export default function SurveyForm({ sections, canonical, submitLabel, onSubmit }: {
  sections: Section[]; canonical: Section[]; submitLabel: string; onSubmit: (values: Values) => void;
}) {
  const { t } = useT();
  const [values, setValues] = useState<Values>({});
  const [error, setError] = useState<string | null>(null);

  const canonQ = new Map<string, Question>();
  canonical.forEach((s) => s.questions.forEach((q) => canonQ.set(q.id, q)));

  const set = (id: string, v: unknown) => setValues((prev) => ({ ...prev, [id]: v }));

  function toggle(id: string, option: string, max?: number) {
    const current = (values[id] as string[] | undefined) ?? [];
    if (current.includes(option)) return set(id, current.filter((o) => o !== option));
    if (max && current.length >= max) return;
    set(id, [...current, option]);
  }

  function submit() {
    const email = values.email as string | undefined;
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(t.common.emailError);
    setError(null);
    onSubmit(values);
  }

  return (
    <div>
      {sections.map((s) => (
        <section key={s.id}>
          <h2>{s.title}</h2>
          {s.instructions && <p className="lede">{s.instructions}</p>}
          {s.questions.map((q) => (
            <Field key={q.id} q={q} canon={canonQ.get(q.id) ?? q} values={values} set={set} toggle={toggle} />
          ))}
        </section>
      ))}
      <button className="primary" type="button" onClick={submit}>{submitLabel}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}

function Field({ q, canon, values, set, toggle }: {
  q: Question; canon: Question; values: Values; set: (id: string, v: unknown) => void; toggle: (id: string, o: string, max?: number) => void;
}) {
  const { t } = useT();
  const otherId = `${q.id}_other`;
  const canonOpt = (i: number) => ("options" in canon ? canon.options[i] : ("options" in q ? q.options[i] : ""));

  if (q.type === "text") {
    return (
      <fieldset>
        <legend>{q.text}</legend>
        <input type={q.inputType ?? "text"} value={(values[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} autoComplete={q.inputType === "email" ? "email" : "off"} />
      </fieldset>
    );
  }
  if (q.type === "textarea") {
    return (
      <fieldset>
        <legend>{q.text}</legend>
        <textarea value={(values[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />
      </fieldset>
    );
  }
  if (q.type === "scale") {
    return (
      <fieldset>
        <legend>{q.text}</legend>
        <div className="scale" role="radiogroup">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <label key={n}>
              <input type="radio" name={q.id} value={n} checked={values[q.id] === n} onChange={() => set(q.id, n)} />
              {n}
            </label>
          ))}
        </div>
        <div className="scale-ends"><span>{q.low}</span><span>{q.high}</span></div>
      </fieldset>
    );
  }

  const other = (
    <span style={{ flex: 1 }}>
      {t.common.other}{" "}
      <input type="text" aria-label={t.common.otherPlaceholder} placeholder={t.common.otherPlaceholder}
        value={(values[otherId] as string) ?? ""}
        onFocus={() => q.type === "radio" && set(q.id, "Other")}
        onChange={(e) => set(otherId, e.target.value)} />
    </span>
  );

  if (q.type === "radio") {
    return (
      <fieldset>
        <legend>{q.text}</legend>
        <div className="options">
          {q.options.map((o, i) => (
            <label key={o}>
              <input type="radio" name={q.id} value={canonOpt(i)} checked={values[q.id] === canonOpt(i)} onChange={() => set(q.id, canonOpt(i))} />
              {o}
            </label>
          ))}
          {q.allowOther && (
            <label>
              <input type="radio" name={q.id} value="Other" checked={values[q.id] === "Other"} onChange={() => set(q.id, "Other")} />
              {other}
            </label>
          )}
        </div>
      </fieldset>
    );
  }

  const selected = (values[q.id] as string[] | undefined) ?? [];
  return (
    <fieldset>
      <legend>{q.text}</legend>
      <div className="options">
        {q.options.map((o, i) => (
          <label key={o}>
            <input type="checkbox" checked={selected.includes(canonOpt(i))} onChange={() => toggle(q.id, canonOpt(i), q.max)} />
            {o}
          </label>
        ))}
        {q.allowOther && (
          <label>
            <input type="checkbox" checked={selected.includes("Other")} onChange={() => toggle(q.id, "Other", q.max)} />
            {other}
          </label>
        )}
      </div>
    </fieldset>
  );
}
