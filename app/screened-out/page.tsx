"use client";

import { useT } from "@/lib/i18n";

export default function ScreenedOut() {
  const { t } = useT();
  return (
    <>
      <h1>{t.screenedOut.title}</h1>
      <p>{t.screenedOut.body}</p>
      <p>
        {t.screenedOut.contactLead} <a href="mailto:jwhenry@usf.edu">jwhenry@usf.edu</a>, <a href="mailto:ajchauradia@usf.edu">ajchauradia@usf.edu</a>
      </p>
    </>
  );
}
