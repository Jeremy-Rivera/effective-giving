"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { getSession } from "@/lib/store";
import LanguageSwitcher from "./LanguageSwitcher";

// True on a ?test=1 landing page and on every page of a test session.
function useTestMode() {
  const pathname = usePathname();
  const [test, setTest] = useState(false);
  useEffect(() => {
    setTest(Boolean(getSession()?.isTest) || (pathname === "/" && new URLSearchParams(window.location.search).get("test") === "1"));
  }, [pathname]);
  return test;
}

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const test = useTestMode();
  return (
    <>
      {test && <div className="test-badge" role="status">{t.testBadge}</div>}
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
