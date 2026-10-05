"use client";

import { useRouter } from "next/navigation";
import RequireSession from "@/components/RequireSession";
import SurveyForm from "@/components/SurveyForm";
import { updateSession } from "@/lib/store";
import { useT, dictionaries } from "@/lib/i18n";

export default function SurveyPage() {
  const router = useRouter();
  const { t } = useT();
  return (
    <RequireSession>
      {() => (
        <>
          <p className="progress">{t.common.stepOf(1, 4)}</p>
          <h1>{t.survey.title}</h1>
          <SurveyForm
            sections={t.survey.sections}
            canonical={dictionaries.en.survey.sections}
            submitLabel={t.survey.submit}
            onSubmit={(values) => {
              const { email, ...baseline } = values;
              updateSession({ email: email as string, baseline });
              router.push("/watch");
            }}
          />
        </>
      )}
    </RequireSession>
  );
}
