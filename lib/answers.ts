// Completeness rules for the survey forms, shared by the browser (to block
// Continue and mark what is missing) and the server (to refuse incomplete
// records). Every visible question is required.

import type { Question, Section } from "./i18n/types";

export type Values = Record<string, unknown>;
export type Problem = "required" | "other" | "email" | "number";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const filled = (v: unknown) => typeof v === "string" && v.trim() !== "";

export function isVisible(q: Question, values: Values) {
  return !q.showIf || values[q.showIf.id] === q.showIf.equals;
}

function problem(q: Question, values: Values): Problem | null {
  const v = values[q.id];
  const other = values[`${q.id}_other`];
  switch (q.type) {
    case "radio":
      if (!filled(v)) return "required";
      return v === "Other" && !filled(other) ? "other" : null;
    case "checkbox":
      if (!Array.isArray(v) || v.length === 0) return "required";
      return v.includes("Other") && !filled(other) ? "other" : null;
    case "scale":
      return typeof v === "number" && v >= 1 && v <= 7 ? null : "required";
    case "text":
      if (!filled(v)) return "required";
      if (q.inputType === "email" && !EMAIL.test((v as string).trim())) return "email";
      if (q.inputType === "number") {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0 || n > 100) return "number";
      }
      return null;
    case "textarea":
      return filled(v) ? null : "required";
  }
}

// Question id -> what is wrong, for every visible question that fails.
export function problems(sections: Section[], values: Values): Record<string, Problem> {
  const out: Record<string, Problem> = {};
  for (const s of sections)
    for (const q of s.questions) {
      if (!isVisible(q, values)) continue;
      const p = problem(q, values);
      if (p) out[q.id] = p;
    }
  return out;
}

// Drops answers to questions that ended up hidden, and "Other" text whose
// "Other" option is no longer selected, so stored data matches what was asked.
export function cleanAnswers(sections: Section[], values: Values): Values {
  const out: Values = { ...values };
  for (const s of sections)
    for (const q of s.questions) {
      const v = out[q.id];
      if (!isVisible(q, out)) { delete out[q.id]; delete out[`${q.id}_other`]; continue; }
      const otherChosen = v === "Other" || (Array.isArray(v) && v.includes("Other"));
      if (!otherChosen) delete out[`${q.id}_other`];
    }
  return out;
}
