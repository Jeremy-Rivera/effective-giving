"use client";

import { useState } from "react";
import type { Question, Section } from "@/lib/i18n/types";
import { useT } from "@/lib/i18n";
import { cleanAnswers, isVisible, problems, type Problem } from "@/lib/answers";

type Values = Record<string, unknown>;

// `sections` is the localized copy shown to the participant.
// `canonical` is the English copy; stored answers use English option text so
// data from all three languages lands in one coding scheme. Required-answer
// rules and follow-up conditions (lib/answers.ts) run on the canonical copy.
export default function SurveyForm({ sections, canonical, submitLabel, onSubmit }: {
  sections: Section[]; canonical: Section[]; submitLabel: string; onSubmit: (values: Values) => void;
}) {
  const { t } = useT();
  const [values, setValues] = useState<Values>({});
  const [errors, setErrors] = useState<Record<string, Problem>>({});
  const [summary, setSummary] = useState<string | null>(null);

  const canonQ = new Map<string, Question>();
  canonical.forEach((s) => s.questions.forEach((q) => canonQ.set(q.id, q)));

  const set = (id: string, v: unknown) => {
    setValues((prev) => ({ ...prev, [id]: v }));
    // Clear a question's error as soon as it is answered.
    const qid = id.replace(/_other$/, "");
    if (errors[qid]) setErrors(({ [qid]: _, ...rest }) => rest);
  };

  function toggle(id: string, option: string, max?: number) {
    const current = (values[id] as string[] | undefined) ?? [];
    if (current.includes(option)) return set(id, current.filter((o) => o !== option));
    if (max && current.length >= max) return;
    set(id, [...current, option]);
  }

  function submit() {
    const found = problems(canonical, values);
    const ids = Object.keys(found);
    setErrors(found);
    if (ids.length) {
      setSummary(t.common.missing(ids.length));
      // Move to the first unanswered question.
      const first = document.getElementById(`q-${ids[0]}`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      first?.querySelector<HTMLElement>("input, textarea")?.focus({ preventScroll: true });
      return;
    }
    setSummary(null);
    onSubmit(cleanAnswers(canonical, values));
  }

  const message = (p: Problem) =>
    p === "other" ? t.common.otherRequired : p === "email" ? t.common.emailError : p === "number" ? t.common.numberError : t.common.required;

  return (
    <div>
      {sections.map((s) => (
        <section key={s.id}>
          <h2>{s.title}</h2>
          {s.instructions && <p className="lede">{s.instructions}</p>}
          {s.questions.map((q) => {
            const canon = canonQ.get(q.id) ?? q;
            if (!isVisible(canon, values)) return null;
            return (
              <Field key={q.id} q={q} canon={canon} values={values} set={set} toggle={toggle}
                error={errors[q.id] ? message(errors[q.id]) : null} />
            );
          })}
        </section>
      ))}
      <button className="primary" type="button" onClick={submit}>{submitLabel}</button>
      {summary && <p className="error" role="alert">{summary}</p>}
    </div>
  );
}

function Field({ q, canon, values, set, toggle, error }: {
  q: Question; canon: Question; values: Values; set: (id: string, v: unknown) => void;
  toggle: (id: string, o: string, max?: number) => void; error: string | null;
}) {
  const { t } = useT();
  const otherId = `${q.id}_other`;
  const errId = `q-${q.id}-error`;
  const canonOpt = (i: number) => ("options" in canon ? canon.options[i] : ("options" in q ? q.options[i] : ""));
  const shell = (children: React.ReactNode) => (
    <fieldset id={`q-${q.id}`} className={error ? "invalid" : undefined} aria-describedby={error ? errId : undefined}>
      <legend>{q.text} <span className="req" aria-hidden="true">*</span></legend>
      {children}
      {error && <p id={errId} className="error field-error">{error}</p>}
    </fieldset>
  );

  if (q.type === "text") {
    return shell(
      <input type={q.inputType ?? "text"} inputMode={q.inputType === "number" ? "numeric" : undefined}
        min={q.inputType === "number" ? 0 : undefined} max={q.inputType === "number" ? 100 : undefined}
        required aria-invalid={error ? true : undefined}
        value={(values[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)}
        autoComplete={q.inputType === "email" ? "email" : "off"} />,
    );
  }
  if (q.type === "textarea") {
    return shell(
      <textarea required aria-invalid={error ? true : undefined} value={(values[q.id] as string) ?? ""} onChange={(e) => set(q.id, e.target.value)} />,
    );
  }
  if (q.type === "scale") {
    return shell(
      <>
        <div className="scale" role="radiogroup">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <label key={n}>
              <input type="radio" name={q.id} value={n} checked={values[q.id] === n} onChange={() => set(q.id, n)} />
              {n}
            </label>
          ))}
        </div>
        <div className="scale-ends"><span>{q.low}</span><span>{q.high}</span></div>
      </>,
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
    return shell(
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
      </div>,
    );
  }

  const selected = (values[q.id] as string[] | undefined) ?? [];
  return shell(
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
    </div>,
  );
}
