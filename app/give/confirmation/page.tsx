"use client";

import { useRouter } from "next/navigation";
import RequireSession from "@/components/RequireSession";
import { useT } from "@/lib/i18n";
import { usd } from "@/lib/money";

export default function ConfirmationPage() {
  const router = useRouter();
  const { t } = useT();
  return (
    <RequireSession>
      {(s) => {
        const gifts = s.allocation ?? {};
        const total = Object.values(gifts).reduce((a, b) => a + b, 0);
        return (
          <>
            <p className="progress">{t.common.stepOf(3, 4)}</p>
            <h1>{t.confirmation.title}</h1>
            <p>{t.confirmation.body}</p>
            <div className="receipt">
              <div className="ref">{t.confirmation.reference}: {s.id.slice(0, 8).toUpperCase()}</div>
              {t.organizations.filter((o) => gifts[o.id]).map((o) => (
                <div className="line" key={o.id}><span>{o.name}</span><span>{usd(gifts[o.id])}</span></div>
              ))}
              <div className="line total"><span>{t.review.total}</span><span>{usd(total)}</span></div>
            </div>
            <p className="notice">{t.give.hypothetical}</p>
            <button className="primary" type="button" onClick={() => router.push("/post")}>{t.confirmation.cont}</button>
          </>
        );
      }}
    </RequireSession>
  );
}
