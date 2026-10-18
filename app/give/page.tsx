"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RequireSession from "@/components/RequireSession";
import OrgImage from "@/components/OrgImage";
import { updateSession, type Session } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { orgText } from "@/lib/i18n/org-text";
import { orgById, type OrgId } from "@/lib/orgs";
import { teaser } from "@/lib/teaser";
import { BUDGET, OPTIONS, blockedReason, isValidAllocation, sum, usd, type Gifts } from "@/lib/money";

export default function GivePage() {
  return <RequireSession>{(s) => <Portal session={s} />}</RequireSession>;
}

function Portal({ session }: { session: Session }) {
  const router = useRouter();
  const { t } = useT();
  const G = t.give;
  const [gifts, setGifts] = useState<Gifts>(session.allocation ?? {});
  const [expanded, setExpanded] = useState<Set<OrgId>>(new Set());
  // Cards where "No thanks" was tapped, so it shows as chosen. Untouched cards
  // show no choice at all. Either way no gift is stored.
  const [declined, setDeclined] = useState<Set<OrgId>>(new Set());
  const everExpanded = useRef(new Set<OrgId>(session.expandedOrgIds ?? []));
  const openedAt = useRef(Date.now());

  const total = sum(gifts);
  const funded = Object.keys(gifts).length;
  const valid = isValidAllocation(Object.values(gifts));

  // sessionStorage only; nothing is sent until the final submit.
  function choose(id: OrgId, amount: number) {
    const next = { ...gifts };
    setDeclined((d) => { const n = new Set(d); if (amount === 0) n.add(id); else n.delete(id); return n; });
    if (amount === 0) delete next[id];
    else next[id] = amount;
    setGifts(next);
    updateSession({ allocation: next });
  }

  function toggle(id: OrgId) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      if (!everExpanded.current.has(id)) {
        everExpanded.current.add(id);
        updateSession({ expandedOrgIds: Array.from(everExpanded.current) });
      }
    }
    setExpanded(next);
  }

  function cont() {
    const elapsed = Math.round((Date.now() - openedAt.current) / 1000);
    updateSession({ allocation: gifts, secondsOnAllocation: (session.secondsOnAllocation ?? 0) + elapsed });
    router.push("/give/review");
  }

  return (
    <div className="portal">
      <p className="progress">{t.common.stepOf(3, 4)}</p>
      <section className="portal-hero">
        <h1>{G.title}</h1>
        <p className="lede">{G.lede}</p>
        <p className="notice">{G.hypothetical}</p>
      </section>

      {/* One column; the two organizations of a scenario are simply consecutive cards. */}
      <div className="org-list">
        {session.shownOrgIds.map((id) => (
          <OrgCard key={id} id={id} gifts={gifts} declined={declined.has(id)} expanded={expanded.has(id)} onToggle={() => toggle(id)} onChoose={(n) => choose(id, n)} />
        ))}
      </div>

      <div className="basket" role="region" aria-label={G.review}>
        <div className="row">
          <div className="tally" aria-live="polite">
            <span className={`status ${valid ? "complete" : ""}`}>{G.allocated(usd(total), usd(BUDGET))}</span>
            <span className="count">{G.giftsChosen(funded)}{valid ? `. ${G.ready}` : ""}</span>
          </div>
          <button className="primary" type="button" disabled={!valid} aria-describedby={valid ? undefined : "continue-reason"} onClick={cont}>
            {G.review}
          </button>
        </div>
        {!valid && <p id="continue-reason" className="reason">{G.continueReason(usd(total))}</p>}
      </div>
    </div>
  );
}

function OrgCard({ id, gifts, declined, expanded, onToggle, onChoose }: {
  id: OrgId; gifts: Gifts; declined: boolean; expanded: boolean; onToggle: () => void; onChoose: (n: number) => void;
}) {
  const { t } = useT();
  const G = t.give;
  const org = orgText(t, id);
  const amount = gifts[id] ?? 0;
  const panelId = `panel-${id}`;
  const buttonId = `head-${id}`;
  const credit = orgById(id)?.credit;

  const blocked = OPTIONS.map((n) => blockedReason(gifts, id, n));
  const left = BUDGET - (sum(gifts) - amount);
  const reason = blocked.includes("maxGifts") ? G.reasonMaxGifts : blocked.includes("budget") ? G.reasonBudget(usd(left)) : null;

  return (
    <article className={`org-card${amount > 0 ? " given" : ""}${expanded ? " open" : ""}`} data-org={id}>
      <h2 className="org-heading">
        <button type="button" id={buttonId} className="org-head" aria-expanded={expanded} aria-controls={panelId} onClick={onToggle}>
          <OrgImage id={id} name={org.name} />
          <span className="org-head-text">
            <span className="org-name">{org.name}</span>
            <span className="org-summary">{teaser(org.description)}</span>
            {amount > 0 && <span className="org-gift">{G.yourGift}: {usd(amount)}</span>}
            <span className="org-toggle" aria-hidden="true">
              <span className="chev">{expanded ? "▲" : "▼"}</span> {expanded ? G.collapse : G.expand}
            </span>
          </span>
        </button>
      </h2>
      <div id={panelId} className="org-panel" role="region" aria-labelledby={buttonId} hidden={!expanded}>
        <p className="full-description">{org.description}</p>
        <fieldset className="amounts">
          <legend>{G.amountLegend(org.name)}</legend>
          <div className="amount-grid">
            {OPTIONS.map((n, i) => {
              const disabled = blocked[i] !== null && amount !== n;
              const chosen = n === 0 ? amount === 0 && declined : amount === n;
              return (
                <label key={n} className={`amount${chosen ? " selected" : ""}${disabled ? " disabled" : ""}${n === 0 ? " none" : ""}`}>
                  <input
                    type="radio"
                    name={`amount-${id}`}
                    value={n}
                    checked={chosen}
                    disabled={disabled}
                    aria-describedby={disabled && reason ? `reason-${id}` : undefined}
                    onChange={() => onChoose(n)}
                  />
                  <span className="mark" aria-hidden="true">{chosen ? "✓" : ""}</span>
                  <span>{n === 0 ? G.noThanks : usd(n)}</span>
                </label>
              );
            })}
          </div>
          {reason && <p id={`reason-${id}`} className="amount-reason">{reason}</p>}
        </fieldset>
        {credit && <p className="credit">{G.photo}: {credit}</p>}
      </div>
    </article>
  );
}
