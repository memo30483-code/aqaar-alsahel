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
import { useI18n } from "@/lib/i18n";
import {
  CURRENCIES,
  CURRENCY_CODES,
  CURRENCY_STORAGE_KEY,
  FALLBACK_RATES,
  RATES_ENDPOINTS,
  convertFromEGP,
  formatAmount,
  pickRates,
  type CurrencyCode,
} from "./currency-data";

/* إعادة تصدير بيانات العملات والدوال النقية للاستخدام من المكوّنات */
export * from "./currency-data";

interface CurrencyValue {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  rates: Record<CurrencyCode, number>;
  /** هل تم جلب الأسعار لحظياً من الإنترنت؟ */
  live: boolean;
  updatedAt: string | null;
  symbol: string;
  convert: (amountInEGP: number) => number;
  format: (amountInEGP: number) => string;
  formatWithSymbol: (amountInEGP: number) => string;
}

const CurrencyContext = createContext<CurrencyValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  const [currency, setCurrencyState] = useState<CurrencyCode>("EGP");
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK_RATES);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  /* استرجاع تفضيل العملة المحفوظ */
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (stored && CURRENCY_CODES.includes(stored as CurrencyCode)) {
        setCurrencyState(stored as CurrencyCode);
      }
    } catch {
      // تجاهل أخطاء التخزين
    }
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch {
      // تجاهل أخطاء التخزين
    }
  }, []);

  /* جلب حي لأسعار الصرف مع الرجوع للقيم الاحتياطية عند الفشل */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      for (const url of RATES_ENDPOINTS) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) continue;
          const parsed = pickRates(await res.json());
          if (!parsed) continue;
          if (cancelled) return;
          setRates((prev) => ({ ...prev, ...parsed, EGP: 1 }));
          setLive(true);
          setUpdatedAt(new Date().toISOString());
          return;
        } catch {
          // فشل هذا المصدر — نجرّب المصدر التالي ثم القيم الاحتياطية
        }
      }
      if (!cancelled) setLive(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const meta = useMemo(
    () => CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0],
    [currency]
  );

  const symbol = meta.symbol[locale];

  const convert = useCallback(
    (amountInEGP: number) => amountInEGP * (rates[currency] ?? 1),
    [rates, currency]
  );

  const format = useCallback(
    (amountInEGP: number) =>
      formatAmount(convertFromEGP(amountInEGP, rates[currency] ?? 1), locale),
    [rates, currency, locale]
  );

  const formatWithSymbol = useCallback(
    (amountInEGP: number) => `${format(amountInEGP)} ${symbol}`,
    [format, symbol]
  );

  const value = useMemo<CurrencyValue>(
    () => ({
      currency,
      setCurrency,
      rates,
      live,
      updatedAt,
      symbol,
      convert,
      format,
      formatWithSymbol,
    }),
    [
      currency,
      setCurrency,
      rates,
      live,
      updatedAt,
      symbol,
      convert,
      format,
      formatWithSymbol,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency يجب استخدامه داخل CurrencyProvider");
  return ctx;
}
