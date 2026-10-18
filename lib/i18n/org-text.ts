import type { Dictionary, OrgText } from "./types";
import { en } from "./en";

// An organization's name and description in the participant's language, or
// the English (verbatim) text when no translation exists yet.
export const orgText = (t: Dictionary, id: string): OrgText =>
  (t.orgs as Record<string, OrgText | undefined>)[id] ?? (en.orgs as Record<string, OrgText>)[id];
