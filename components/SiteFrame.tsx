"use client";

import { useT } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  return (
    <>
      <div className="band" aria-hidden="true">
        <span /><span /><span /><span /><span />
      </div>
      <header className="masthead">
        <div className="masthead-row">
          <div className="masthead-text">
            <div className="institution">{t.masthead.protocolTitle}</div>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="protocol">
          <b className="irb">{t.masthead.irbLabel}</b>
          <span>{t.masthead.protocolLabel}</span>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <p>{t.footer.investigators}</p>
        <p>{t.footer.hypothetical}</p>
        <p>{t.footer.privacy}</p>
      </footer>
    </>
  );
}
