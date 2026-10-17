import type { OrgId } from "../orgs";

export type Locale = "en" | "hi" | "gu";

// A follow-up question shown (and required) only when an earlier answer
// matches. Compared against the stored English option text, so it is set on
// the English questions only.
export type ShowIf = { id: string; equals: string };

export type Question = (
  | { id: string; type: "radio"; text: string; options: string[]; allowOther?: boolean }
  | { id: string; type: "checkbox"; text: string; options: string[]; max?: number; allowOther?: boolean }
  | { id: string; type: "scale"; text: string; low: string; high: string }
  | { id: string; type: "text"; text: string; inputType?: "text" | "email" | "number" }
  | { id: string; type: "textarea"; text: string }
) & { showIf?: ShowIf };

export type Section = { id: string; title: string; instructions?: string; questions: Question[] };

// Name and full description of each organization, in this language.
// English comes from lib/orgs.ts; the flags (ea, jainValues) live only there.
export type OrgText = { name: string; description: string };

export type Dictionary = {
  langName: string;
  masthead: { protocolLabel: string; protocolTitle: string; irbLabel: string };
  footer: { investigators: string; hypothetical: string; privacy: string };
  landing: {
    title: string; p1: string; contactLead: string; contactJoin: string; p3: string;
    confirmHeading: string;
    q1: string; q1yes: string; q1no: string;
    q2: string; q2yes: string; q2no: string;
    q3: string; q3yes: string; q3no: string;
    consentButton: string; error: string; subtext: string;
  };
  screenedOut: { title: string; body: string; contactLead: string };
  common: {
    other: string; otherPlaceholder: string; emailError: string; stepOf: (n: number, total: number) => string;
    required: string; otherRequired: string; numberError: string; missing: (n: number) => string;
  };
  survey: { title: string; submit: string; sections: Section[] };
  watch: { title: string; lede: string; noVideo: string; watched: (pct: number) => string; cont: string };
  give: {
    title: string; lede: string; hypothetical: string; balance: string;
    remaining: (n: string) => string; complete: string;
    readMore: string; confirm: string; change: string; remove: string; close: string;
    amountLabel: string; yourGift: string; photo: string;
    errAmount: string; errOver: (remaining: string) => string; errMaxGifts: string;
    continueReason: (remaining: string) => string; giftsChosen: (n: number) => string;
    review: string;
  };
  review: { title: string; lede: string; total: string; edit: string; confirm: string };
  confirmation: { title: string; body: string; reference: string; cont: string };
  post: { title: string; submit: string; error: string; sections: Section[] };
  done: { title: string; body: string; contactLead: string };
  orgs: Record<OrgId, OrgText>;
};
