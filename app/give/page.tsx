"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RequireSession from "@/components/RequireSession";
import OrgImage from "@/components/OrgImage";
import { updateSession, type Session } from "@/lib/store";
import { useT } from "@/lib/i18n";
import type { OrgId } from "@/lib/orgs";
import { MAX_GIFTS, TOTAL, usd } from "@/lib/money";

type Gifts = Record<string, number>;

export default function GivePage() {
  return <RequireSession>{(s) => <Portal session={s} />}</RequireSession>;
}

// First sentence of the description, plus the second if the first is short.
function teaser(text: string) {
  const sentences = text.match(/.+?[.!?।](?=\s|$)/g) ?? [text];
  const first = sentences[0].trim();
  return first.length < 140 && sentences[1] ? `${first} ${sentences[1].trim()}` : first;
}

function Portal({ session }: { session: Session }) {
  const router = useRouter();
  const { t } = useT();
  const G = t.give;
  const [gifts, setGifts] = useState<Gifts>(session.allocation ?? {});
  const [open, setOpen] = useState<OrgId | null>(null);
  const openedAt = useRef(Date.now());

  const given = Object.values(gifts).reduce((a, b) => a + b, 0);
  const remaining = TOTAL - given;
  const funded = Object.keys(gifts).length;

  function save(next: Gifts) {
    setGifts(next);
    updateSession({ allocation: next }); // sessionStorage only; nothing is sent
  }

  function cont() {
    const elapsed = Math.round((Date.now() - openedAt.current) / 1000);
    updateSession({ allocation: gifts, secondsOnAllocation: (session.secondsOnAllocation ?? 0) + elapsed });
    router.push("/give/review");
  }

  return (
    <>
      <p className="progress">{t.common.stepOf(3, 4)}</p>
      <section className="portal-hero">
        <h1>{G.title}</h1>
        <p className="lede">{G.lede}</p>
        <div className="balance">
          <span className="amount">{usd(remaining)}</span>
          <span className="label">{G.balance}</span>
        </div>
        <p className="notice">{G.hypothetical}</p>
      </section>

      {session.shownOrgIds.map((id) => (
        <OrgCard
          key={id}
          id={id}
          amount={gifts[id] ?? 0}
          onOpen={() => setOpen(id)}
          onRemove={() => { const next = { ...gifts }; delete next[id]; save(next); }}
        />
      ))}

      {open && (
        <OrgDialog
          id={open}
          gifts={gifts}
          onClose={() => setOpen(null)}
          onSet={(n) => { save({ ...gifts, [open]: n }); setOpen(null); }}
          onRemove={() => { const next = { ...gifts }; delete next[open]; save(next); setOpen(null); }}
        />
      )}

      <div className="basket">
        <div className="row">
          <div aria-live="polite">
            <span className={`status ${remaining === 0 ? "complete" : ""}`}>
              {remaining === 0 ? G.complete : G.remaining(usd(remaining))}
            </span>
            <span className="count">{G.giftsChosen(funded)}</span>
          </div>
          <button className="primary" type="button" disabled={remaining !== 0} aria-describedby="continue-reason" onClick={cont}>
            {G.review}
          </button>
        </div>
        {remaining !== 0 && <p id="continue-reason" className="reason">{G.continueReason(usd(remaining))}</p>}
      </div>
    </>
  );
}

function OrgCard({ id, amount, onOpen, onRemove }: { id: OrgId; amount: number; onOpen: () => void; onRemove: () => void }) {
  const { t } = useT();
  const G = t.give;
  const org = t.orgs[id];
  const headingId = `card-${id}`;

  return (
    <article className={`org-card ${amount > 0 ? "given" : ""}`} aria-labelledby={headingId} data-org={id}>
      <button type="button" className="image-button" onClick={onOpen} aria-label={`${G.readMore}: ${org.name}`} tabIndex={-1}>
        <OrgImage id={id} name={org.name} />
      </button>
      <div className="org-body">
        <h3 id={headingId}>{org.name}</h3>
        <p className="detail">{teaser(org.description)}</p>
        {amount > 0 && (
          <div className="given-line">
            <span>{G.yourGift}: <span className="amt">{usd(amount)}</span></span>
            <button className="link" type="button" onClick={onRemove}>{G.remove}<span className="sr-only">: {org.name}</span></button>
          </div>
        )}
        <div className="actions">
          <button className="secondary" type="button" onClick={onOpen}>
            {amount > 0 ? G.change : G.readMore}<span className="sr-only">: {org.name}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

function OrgDialog({ id, gifts, onClose, onSet, onRemove }: {
  id: OrgId; gifts: Gifts; onClose: () => void; onSet: (n: number) => void; onRemove: () => void;
}) {
  const { t } = useT();
  const G = t.give;
  const org = t.orgs[id];
  const ref = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const current = gifts[id] ?? 0;
  const [draft, setDraft] = useState(current ? String(current) : "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current!;
    const opener = document.activeElement as HTMLElement | null;
    if (!d.open) d.showModal();
    return () => {
      if (d.open) d.close();
      opener?.focus();
    };
  }, []);

  // Native modal <dialog> already makes the page behind it inert and closes on
  // Escape; this keeps Tab cycling inside the dialog instead of escaping to the
  // browser chrome.
  function trapTab(e: React.KeyboardEvent) {
    if (e.key !== "Tab") return;
    const items = Array.from(ref.current!.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function confirm() {
    const text = draft.trim().replace(/^\$/, "").replace(/,/g, "");
    const n = Number(text);
    const others = Object.entries(gifts).filter(([k]) => k !== id);
    const left = TOTAL - others.reduce((a, [, v]) => a + v, 0);
    if (!/^\d+$/.test(text) || n < 1 || n > TOTAL) return setError(G.errAmount);
    if (!current && others.length >= MAX_GIFTS) return setError(G.errMaxGifts);
    if (n > left) return setError(G.errOver(usd(left)));
    onSet(n);
  }

  return (
    <dialog
      ref={ref}
      className="org-dialog"
      aria-labelledby={`${uid}-title`}
      onKeyDown={trapTab}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className="dialog-inner">
        <div className="dialog-top">
          <button type="button" className="link close" onClick={onClose}>{G.close}</button>
        </div>
        <OrgImage id={id} name={org.name} large />
        <h2 id={`${uid}-title`}>{org.name}</h2>
        <p className="full-description">{org.description}</p>

        <form className="gift-form" noValidate onSubmit={(e) => { e.preventDefault(); confirm(); }}>
          <label htmlFor={`${uid}-amount`}>{G.amountLabel}</label>
          <div className="amount-row">
            <span className="currency" aria-hidden="true">$</span>
            <input
              id={`${uid}-amount`}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={draft}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${uid}-error` : undefined}
              onChange={(e) => { setDraft(e.target.value); setError(null); }}
            />
            <button className="primary" type="submit">{G.confirm}</button>
          </div>
          {error && <p id={`${uid}-error`} className="error" role="alert">{error}</p>}
          {current > 0 && (
            <p><button className="link" type="button" onClick={onRemove}>{G.remove}</button></p>
          )}
        </form>
        <p className="notice">{G.hypothetical}</p>
      </div>
    </dialog>
  );
}
