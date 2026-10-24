import type { Locale } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";

/**
 * بيانات العملات والدوال النقية (بدون React)
 * منفصلة عن `currency.tsx` حتى يمكن استخدامها في مكوّنات السيرفر مثل `generateMetadata`.
 */

export type CurrencyCode = "EGP" | "SAR" | "AED" | "KWD" | "USD";

export const CURRENCY_STORAGE_KEY = "aqaar-currency";

/** العملة الافتراضية عند التوليد على السيرفر (لا وصول لتفضيل المستخدم المحفوظ محلياً) */
export const DEFAULT_CURRENCY: CurrencyCode = "EGP";

export interface CurrencyMeta {
  code: CurrencyCode;
  /** رمز العملة حسب اللغة */
  symbol: Record<Locale, string>;
  countryKey: MessageKey;
}

/** العملات المدعومة وربطها بالدول */
export const CURRENCIES: CurrencyMeta[] = [
  { code: "EGP", symbol: { ar: "ج.م", en: "EGP" }, countryKey: "country.EG" },
  { code: "SAR", symbol: { ar: "ر.س", en: "SAR" }, countryKey: "country.SA" },
  { code: "AED", symbol: { ar: "د.إ", en: "AED" }, countryKey: "country.AE" },
  { code: "KWD", symbol: { ar: "د.ك", en: "KWD" }, countryKey: "country.KW" },
  { code: "USD", symbol: { ar: "$", en: "USD" }, countryKey: "country.US" },
];

/** أسعار صرف احتياطية: قيمة 1 جنيه مصري مقابل كل عملة */
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  EGP: 1,
  SAR: 0.0769,
  AED: 0.0753,
  KWD: 0.00629,
  USD: 0.0205,
};

export const CURRENCY_CODES: CurrencyCode[] = [
  "EGP",
  "SAR",
  "AED",
  "KWD",
  "USD",
];

/** نقاط جلب مفتوحة ومجانية لأسعار الصرف مقابل الجنيه المصري */
export const RATES_ENDPOINTS = [
  "https://open.er-api.com/v6/latest/EGP",
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/egp.json",
];

/** استخراج الأسعار من أكثر من صيغة استجابة */
export function pickRates(
  payload: unknown
): Partial<Record<CurrencyCode, number>> | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  // صيغة open.er-api.com → { rates: { USD, SAR, ... } }
  const direct = data.rates as Record<string, unknown> | undefined;
  // صيغة jsdelivr → { egp: { usd, sar, ... } }
  const nested = data.egp as Record<string, unknown> | undefined;
  const source = direct ?? nested;
  if (!source) return null;

  const out: Partial<Record<CurrencyCode, number>> = {};
  CURRENCY_CODES.forEach((code) => {
    const raw = source[code] ?? source[code.toLowerCase()];
    if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
      out[code] = raw;
    }
  });
  return out.EGP ? out : null;
}

/** بيانات العملة المطلوبة أو العملة الافتراضية عند عدم توفرها */
export function currencyMeta(code: CurrencyCode): CurrencyMeta {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/** تحويل مبلغ من الجنيه المصري بسعر صرف معيّن مع تقريب مناسب */
export function convertFromEGP(amountInEGP: number, rate: number): number {
  const value = amountInEGP * rate;
  return value >= 100 ? Math.round(value) : Math.round(value * 100) / 100;
}

/** صياغة رقم العملة حسب اللغة */
export function formatAmount(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

/** صياغة مبلغ بالجنيه المصري بعد تحويله لعملة محددة مع رمزها */
export function formatConvertedPrice(
  amountInEGP: number,
  code: CurrencyCode = DEFAULT_CURRENCY,
  locale: Locale = "ar",
  rate: number = FALLBACK_RATES[code] ?? 1
): string {
  const amount = formatAmount(convertFromEGP(amountInEGP, rate), locale);
  return `${amount} ${currencyMeta(code).symbol[locale]}`;
}
