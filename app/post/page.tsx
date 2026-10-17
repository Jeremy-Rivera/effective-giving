"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireSession from "@/components/RequireSession";
import SurveyForm from "@/components/SurveyForm";
import { updateSession, type Session } from "@/lib/store";
import { useT, dictionaries } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/types";

// F2 ("Which organization did you give the most to?") lists only the
// organizations this participant funded, in the order they were shown. The
// stored answer is the org id. With a single funded organization the answer
// is known, so the question is skipped and pre-answered.
function postSections(t: Dictionary, s: Session, displayNames: boolean) {
  const funded = s.shownOrgIds.filter((id) => (s.allocation ?? {})[id] > 0);
  return t.post.sections.map((sec) => ({
    ...sec,
    questions: sec.questions.flatMap((q) => {
      if (q.id !== "F2" || q.type !== "radio") return [q];
      if (funded.length <= 1) return [];
      return [{ ...q, options: displayNames ? funded.map((id) => t.orgs[id].name) : funded }];
    }),
  }));
}

export default function PostPage() {
  const router = useRouter();
  const { t } = useT();
  const [error, setError] = useState<string | null>(null);

  async function finish(session: Session, values: Record<string, unknown>) {
    setError(null);
    const funded = session.shownOrgIds.filter((id) => (session.allocation ?? {})[id] > 0);
    const post = funded.length === 1 ? { ...values, F2: funded[0] } : values;
    const s = updateSession({ post });
    const send = () =>
      fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) })
        .then((r) => r.ok, () => false);
    // One automatic retry. Safe because the server ignores a repeated session id.
    const ok = (await send()) || (await new Promise((r) => setTimeout(r, 1500)), await send());
    if (!ok) return setError(t.post.error);
    router.push("/done");
  }

  return (
    <RequireSession>
      {(s) => (
        <>
          <p className="progress">{t.common.stepOf(4, 4)}</p>
          <h1>{t.post.title}</h1>
          <SurveyForm
            sections={postSections(t, s, true)}
            canonical={postSections(dictionaries.en, s, false)}
            submitLabel={t.post.submit}
            onSubmit={(values) => finish(s, values)}
          />
          {error && <p className="error" role="alert">{error}</p>}
        </>
      )}
    </RequireSession>
  );
}
