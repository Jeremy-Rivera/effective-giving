"use client";

import { dictionaries, locales, useT } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useT();
  return (
    <nav className="lang" aria-label="Language">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          className={locale === l ? "active" : ""}
          onClick={() => setLocale(l)}
        >
          {dictionaries[l].langName}
        </button>
      ))}
    </nav>
  );
}
