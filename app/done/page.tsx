"use client";

import { useEffect } from "react";
import { clearSession } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function DonePage() {
  const { t } = useT();
  useEffect(() => { clearSession(); }, []);
  return (
    <>
      <h1>{t.done.title}</h1>
      <p>{t.done.body}</p>
      <p>{t.done.reminders}</p>
      <p>
        {t.done.contactLead} <a href="mailto:jwhenry@usf.edu">jwhenry@usf.edu</a>, <a href="mailto:ajchauradia@usf.edu">ajchauradia@usf.edu</a>
      </p>
    </>
  );
}
