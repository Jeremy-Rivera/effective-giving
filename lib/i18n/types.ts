export type Locale = "en" | "hi" | "gu";

export type Question =
  | { id: string; type: "radio"; text: string; options: string[]; allowOther?: boolean }
  | { id: string; type: "checkbox"; text: string; options: string[]; max?: number; allowOther?: boolean }
  | { id: string; type: "scale"; text: string; low: string; high: string }
  | { id: string; type: "text"; text: string; inputType?: "text" | "email" | "number" }
  | { id: string; type: "textarea"; text: string };

export type Section = { id: string; title: string; instructions?: string; questions: Question[] };

export type Organization = {
  id: string;
  name: string;
  cause: string;
  control: { mission: string };
  treatment: { mission: string; impact: string; safeguards: string };
};

export type Dictionary = {
  langName: string;
  masthead: { protocolLabel: string; protocolTitle: string; irbLabel: string };
  footer: { investigators: string; hypothetical: string; privacy: string };
  landing: {
    title: string; lede: string; p1: string; contactLead: string; contactJoin: string; p3: string;
    confirmHeading: string;
    q1: string; q1yes: string; q1no: string;
    q2: string; q2yes: string; q2no: string;
    q3: string; q3yes: string; q3no: string;
    consentButton: string; error: string; subtext: string;
  };
  screenedOut: { title: string; body: string; contactLead: string };
  common: { other: string; otherPlaceholder: string; emailError: string; stepOf: (n: number, total: number) => string };
  survey: { title: string; submit: string; sections: Section[] };
  watch: { title: string; lede: string; noVideo: string; cont: string };
  give: {
    title: string; lede: string; hypothetical: string; balance: string;
    remaining: (n: string) => string; over: (n: string) => string; complete: string;
    give: string; addGift: string; change: string; remove: string; custom: string; customPlaceholder: string;
    yourGifts: string; noGifts: string; review: string;
    mission: string; impact: string; safeguards: string; presets: number[];
  };
  review: { title: string; lede: string; total: string; edit: string; confirm: string };
  confirmation: { title: string; body: string; reference: string; cont: string };
  post: { title: string; submit: string; error: string; sections: Section[] };
  done: { title: string; body: string; contactLead: string };
  organizations: Organization[];
};
