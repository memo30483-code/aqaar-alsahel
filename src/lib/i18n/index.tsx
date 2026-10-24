"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { messages, type MessageKey } from "./messages";

export type Locale = "ar" | "en";

export const LOCALE_STORAGE_KEY = "aqaar-locale";
const DEFAULT_LOCALE: Locale = "ar";

type Vars = Record<string, string | number>;

interface I18nValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  isRtl: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: MessageKey, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

/** استبدال المتغيّرات داخل النص: {city} → القيمة */
function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(String(value)),
    text
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  /* استرجاع تفضيل اللغة المحفوظ */
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored === "ar" || stored === "en") setLocaleState(stored);
    } catch {
      // تجاهل أخطاء التخزين
    }
  }, []);

  const dir: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";

  /* مزامنة خصائص اللغة والاتجاه على عنصر <html> */
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // تجاهل أخطاء التخزين
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "ar" ? "en" : "ar");
  }, [locale, setLocale]);

  const t = useCallback(
    (key: MessageKey, vars?: Vars) => {
      const entry = messages[key];
      return interpolate(entry ? entry[locale] : key, vars);
    },
    [locale]
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, dir, isRtl: dir === "rtl", setLocale, toggleLocale, t }),
    [locale, dir, setLocale, toggleLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n يجب استخدامه داخل I18nProvider");
  return ctx;
}

/** اختصار للترجمة فقط */
export function useT() {
  return useI18n().t;
}

export type { MessageKey };
export { messages };
