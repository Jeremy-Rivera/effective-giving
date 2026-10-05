"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Dictionary, Locale } from "./types";
import { en } from "./en";
import { hi } from "./hi";
import { gu } from "./gu";

export const dictionaries: Record<Locale, Dictionary> = { en, hi, gu };
export const locales: Locale[] = ["en", "hi", "gu"];
export type { Dictionary, Locale };

const KEY = "jain-ea-locale";

const Ctx = createContext<{ locale: Locale; t: Dictionary; setLocale: (l: Locale) => void }>({
  locale: "en",
  t: en,
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Locale | null;
    if (saved && locales.includes(saved)) setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(l: Locale) {
    localStorage.setItem(KEY, l);
    setLocaleState(l);
  }

  return <Ctx.Provider value={{ locale, t: dictionaries[locale], setLocale }}>{children}</Ctx.Provider>;
}

export function useT() {
  return useContext(Ctx);
}
