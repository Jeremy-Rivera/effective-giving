"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RequireSession from "@/components/RequireSession";
import { getSession, updateSession, type Condition } from "@/lib/store";
import { useT } from "@/lib/i18n";
import type { Organization } from "@/lib/i18n/types";
import { TOTAL, usd } from "@/lib/money";

export default function GivePage() {
  const router = useRouter();
  return (
    <RequireSession>
      {(s) => (
        <Portal
          condition={s.condition}
          initial={s.allocation ?? {}}
          onReview={(gifts) => { updateSession({ allocation: gifts }); router.push("/give/review"); }}
        />
      )}
    </RequireSession>
  );
}

function Portal({ condition, initial, onReview }: { condition: Condition; initial: Record<string, number>; onReview: (g: Record<string, number>) => void }) {
  const { t } = useT();
  const G = t.give;
  const [gifts, setGifts] = useState<Record<string, number>>(initial);
  const [open, setOpen] = useState<string | null>(null);

  const given = Object.values(gifts).reduce((a, b) => a + b, 0);
  const remaining = TOTAL - given;

  function setGift(id: string, amount: number) {
    const next = { ...gifts };
    if (amount > 0) next[id] = amount; else delete next[id];
    setGifts(next);
    setOpen(null);
  }

  return (
    <>
      <p className="progress">{t.common.stepOf(3, 4)}</p>
      <section className="portal-hero">
        <h1>{G.title}</h1>
        <p className="lede">{G.lede}</p>
        <div className="balance">
          <span className="amount">{usd(Math.max(remaining, 0))}</span>
          <span className="label">{G.balance}</span>
        </div>
        <p className="notice">{G.hypothetical}</p>
      </section>

      {t.organizations.map((o) => (
        <OrgCard
          key={o.id}
          org={o}
          condition={condition}
          amount={gifts[o.id] ?? 0}
          remaining={remaining}
          open={open === o.id}
          onOpen={() => setOpen(open === o.id ? null : o.id)}
          onSet={(n) => setGift(o.id, n)}
        />
      ))}

      <div className="basket">
        <div className="row">
          <span className={`status ${remaining < 0 ? "over" : remaining === 0 ? "complete" : ""}`}>
            {remaining === 0 ? G.complete : remaining > 0 ? G.remaining(usd(remaining)) : G.over(usd(-remaining))}
          </span>
          <button className="primary" type="button" disabled={remaining !== 0} onClick={() => onReview(gifts)}>
            {G.review}
          </button>
        </div>
      </div>
    </>
  );
}

function OrgCard({ org, condition, amount, remaining, open, onOpen, onSet }: {
  org: Organization; condition: Condition; amount: number; remaining: number;
  open: boolean; onOpen: () => void; onSet: (n: number) => void;
}) {
  const { t } = useT();
  const G = t.give;
  const [draft, setDraft] = useState<number>(amount);
  const [custom, setCustom] = useState<string>("");

  const chooserValue = custom !== "" ? Number(custom) || 0 : draft;

  return (
    <article className={`org-card ${amount > 0 ? "given" : ""}`}>
      <div className="cause">{org.cause}</div>
      <h3>{org.name}</h3>
      {condition === "control" ? (
        <p className="detail">{org.control.mission}</p>
      ) : (
        <>
          <p className="detail"><b>{G.mission}:</b> {org.treatment.mission}</p>
          <p className="detail"><b>{G.impact}:</b> {org.treatment.impact}</p>
          <p className="detail"><b>{G.safeguards}:</b> {org.treatment.safeguards}</p>
        </>
      )}

      {amount > 0 && !open ? (
        <div className="given-line">
          <span className="amt">{usd(amount)}</span>
          <span>
            <button className="link" type="button" onClick={onOpen}>{G.change}</button>
            {" "}&middot;{" "}
            <button className="link" type="button" onClick={() => onSet(0)}>{G.remove}</button>
          </span>
        </div>
      ) : !open ? (
        <div className="actions">
          <button className="secondary" type="button" onClick={onOpen}>{G.give}</button>
        </div>
      ) : null}

      {open && (
        <div className="chooser">
          <div className="presets" role="group" aria-label={G.give}>
            {G.presets.map((p) => (
              <button key={p} type="button" className={custom === "" && draft === p ? "active" : ""} onClick={() => { setDraft(p); setCustom(""); }}>
                {usd(p)}
              </button>
            ))}
          </div>
          <label className="custom">
            <span>{G.custom}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={TOTAL}
              step={10}
              placeholder={G.customPlaceholder}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          </label>
          <div className="confirm-row">
            <button
              className="primary"
              type="button"
              disabled={chooserValue <= 0 || chooserValue > remaining + amount}
              onClick={() => onSet(Math.min(chooserValue, TOTAL))}
            >
              {G.addGift}
            </button>
            {chooserValue > remaining + amount && <span className="error">{G.over(usd(chooserValue - remaining - amount))}</span>}
          </div>
        </div>
      )}
    </article>
  );
}
