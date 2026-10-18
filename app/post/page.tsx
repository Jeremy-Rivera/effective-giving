"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireSession from "@/components/RequireSession";
import SurveyForm from "@/components/SurveyForm";
import { getSession, updateSession, type Session } from "@/lib/store";
import { useT, dictionaries } from "@/lib/i18n";
import { orgText } from "@/lib/i18n/org-text";
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
      return [{ ...q, options: displayNames ? funded.map((id) => orgText(t, id).name) : funded }];
    }),
  }));
}

export default function PostPage() {
  const router = useRouter();
  const { t } = useT();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Sends the stored session. The server ignores a repeated session id, so
  // retrying (automatically once, then with the Retry button) never doubles a
  // record. Everything stays in sessionStorage until this succeeds.
  async function send() {
    const s = getSession();
    if (!s || sending) return;
    setSending(true);
    setError(null);
    const attempt = () =>
      fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) })
        .then((r) => r.ok, () => false);
    const jitter = () => new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
    const ok = (await attempt()) || (await jitter(), await attempt());
    setSending(false);
    if (!ok) return setError(t.post.error);
    router.push("/done");
  }

  function finish(session: Session, values: Record<string, unknown>) {
    const funded = session.shownOrgIds.filter((id) => (session.allocation ?? {})[id] > 0);
    updateSession({ post: funded.length === 1 ? { ...values, F2: funded[0] } : values });
    return send();
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
          {error && (
            <div className="submit-error" role="alert">
              <p className="error">{error}</p>
              <button className="primary" type="button" onClick={send} disabled={sending}>{t.post.retry}</button>
            </div>
          )}
        </>
      )}
    </RequireSession>
  );
}
