"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireSession from "@/components/RequireSession";
import SurveyForm from "@/components/SurveyForm";
import { updateSession } from "@/lib/store";
import { useT, dictionaries } from "@/lib/i18n";

export default function PostPage() {
  const router = useRouter();
  const { t } = useT();
  const [error, setError] = useState<string | null>(null);

  async function finish(values: Record<string, unknown>) {
    const s = updateSession({ post: values });
    const res = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    if (!res.ok) return setError(t.post.error);
    router.push("/done");
  }

  return (
    <RequireSession>
      {() => (
        <>
          <p className="progress">{t.common.stepOf(4, 4)}</p>
          <h1>{t.post.title}</h1>
          <SurveyForm sections={t.post.sections} canonical={dictionaries.en.post.sections} submitLabel={t.post.submit} onSubmit={finish} />
          {error && <p className="error" role="alert">{error}</p>}
        </>
      )}
    </RequireSession>
  );
}
