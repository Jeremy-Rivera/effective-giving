"use client";

import { useRouter } from "next/navigation";
import RequireSession from "@/components/RequireSession";
import { updateSession } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { orgText } from "@/lib/i18n/org-text";
import { sum, usd } from "@/lib/money";

export default function ReviewPage() {
  const router = useRouter();
  const { t } = useT();
  return (
    <RequireSession>
      {(s) => {
        const gifts = s.allocation ?? {};
        const total = sum(gifts);
        return (
          <>
            <p className="progress">{t.common.stepOf(3, 4)}</p>
            <h1>{t.review.title}</h1>
            <p className="lede">{t.review.lede}</p>
            <div className="receipt">
              {s.shownOrgIds.filter((id) => gifts[id]).map((id) => (
                <div className="line" key={id}><span>{orgText(t, id).name}</span><span>{usd(gifts[id])}</span></div>
              ))}
              <div className="line total"><span>{t.review.total}</span><span>{usd(total)}</span></div>
            </div>
            <p className="notice">{t.give.hypothetical}</p>
            <div className="basket">
              <div className="row">
                <button className="secondary" type="button" onClick={() => router.push("/give")}>{t.review.edit}</button>
                <button
                  className="primary"
                  type="button"
                  onClick={() => { updateSession({ allocationConfirmedAt: new Date().toISOString() }); router.push("/give/confirmation"); }}
                >
                  {t.review.confirm}
                </button>
              </div>
            </div>
          </>
        );
      }}
    </RequireSession>
  );
}
