"use client";

/**
 * استوديو النصوص — تحكم كامل من لوحة الإدارة في كل نص داخل المنصة.
 *
 * طبقتان مستقلتان:
 *  1) `TextOverrides`  → استبدال نص أي مفتاح ترجمة (عربي/إنجليزي).
 *  2) `TextStyles`     → نوع الخط/الحجم/اللون/الوزن/المحاذاة لكل نص.
 *
 * كل 저장 يمرّ عبر localStorage (نفس بقية المخازن) ويُرفع للسحابة تلقائيًا
 * لأن المفتاحين مضافان إلى `CLOUD_KEYS`. لا يؤثر أي منهما على بيانات
 * المالك أو العملاء.
 */

import { messages, type MessageKey } from "@/lib/i18n/messages";

export const TEXT_OVERRIDES_KEY = "aqaar-text-overrides";
export const TEXT_STYLES_KEY = "aqaar-text-styles";

export const TEXT_OVERRIDES_EVENT = "aqaar:text-overrides";
export const TEXT_STYLES_EVENT = "aqaar:text-styles";

export type TextLocale = "ar" | "en";

export interface TextOverride {
  ar: string;
  en: string;
}

export type TextOverrides = Record<string, TextOverride>;

export type TextFont = "cairo" | "tajawal" | "amiri" | "readex";

export interface TextStyleOverride {
  fontFamily?: TextFont;
  /** حجم الخط بالبكسل */
  fontSize?: number;
  /** لون الخط HEX */
  color?: string;
  fontWeight?: "400" | "600" | "700" | "800" | "900";
  align?: "start" | "center" | "end";
}

export type TextStyles = Record<string, TextStyleOverride>;

export const TEXT_FONT_STACK: Record<TextFont, string> = {
  cairo: "var(--font-cairo), Tahoma, sans-serif",
  tajawal: "var(--font-tajawal), Tahoma, sans-serif",
  amiri: "var(--font-amiri), Tahoma, serif",
  readex: "var(--font-readex), Tahoma, sans-serif",
};

export const TEXT_FONT_OPTIONS: { value: TextFont; label: string }[] = [
  { value: "cairo", label: "Cairo — القاهرة" },
  { value: "tajawal", label: "Tajawal — تجوال" },
  { value: "amiri", label: "Amiri — أميري" },
  { value: "readex", label: "Readex Pro — ريدكس" },
];

export const TEXT_WEIGHT_OPTIONS: { value: NonNullable<TextStyleOverride["fontWeight"]>; label: string }[] = [
  { value: "400", label: "عادي" },
  { value: "600", label: "شبه عريض" },
  { value: "700", label: "عريض" },
  { value: "800", label: "أعرض" },
  { value: "900", label: "أسود" },
];

export const TEXT_GROUP_ORDER = [
  "header",
  "footer",
  "home",
  "marketGuide",
  "legal",
  "property",
  "filters",
  "addProperty",
  "register",
  "professionals",
  "ads",
  "admin",
  "general",
] as const;

export type TextGroup = (typeof TEXT_GROUP_ORDER)[number];

export const TEXT_GROUP_LABEL: Record<TextGroup, string> = {
  header: "الهيدر والتنقل",
  footer: "الفوتر",
  home: "الصفحة الرئيسية",
  marketGuide: "البوصلة العقارية",
  legal: "الاستشارات القانونية والهندسية",
  property: "صفحات العقارات",
  filters: "الفلاتر والبحث",
  addProperty: "إضافة عقار",
  register: "التسجيل والحساب",
  professionals: "المطورون والمهنيون",
  ads: "الإعلانات والبنرات",
  admin: "لوحة التحكم",
  general: "نصوص عامة",
};

export interface TextCatalogEntry {
  key: string;
  group: TextGroup;
  ar: string;
  en: string;
}

function groupOf(key: string): TextGroup {
  if (/^(brand|nav|companies|pref|city|currency|country|type|seller|demand|purpose)\./.test(key)) {
    return "header";
  }
  if (key.startsWith("footer.")) return "footer";
  if (key.startsWith("home.")) return "home";
  if (key.startsWith("marketGuide.")) return "marketGuide";
  if (key.startsWith("legal.")) return "legal";
  if (key.startsWith("property.")) return "property";
  if (key.startsWith("filters.")) return "filters";
  if (key.startsWith("addProperty.")) return "addProperty";
  if (key.startsWith("register.")) return "register";
  if (key.startsWith("professionals.")) return "professionals";
  if (key.startsWith("ads.")) return "ads";
  if (key.startsWith("admin.")) return "admin";
  return "general";
}

/** كتالوج كل النصوص المتاحة في المنصة — يُستخدم في لوحة الإدارة */
export const TEXT_CATALOG: TextCatalogEntry[] = (
  Object.keys(messages) as MessageKey[]
).map((key) => ({
  key,
  group: groupOf(key),
  ar: messages[key].ar,
  en: messages[key].en,
}));

export const TEXT_CATALOG_BY_KEY = new Map(
  TEXT_CATALOG.map((entry) => [entry.key, entry])
);

/** هل النص يحتوي متغيّرًا مثل {count}؟ يجب أن يبقى كما هو عند التعديل. */
export function hasPlaceholders(text: string): boolean {
  return /\{[a-zA-Z0-9_]+\}/.test(text);
}

/** استرجاع النص الافتراضي من القاموس */
export function defaultText(key: string, locale: TextLocale): string {
  const entry = messages[key as MessageKey];
  return entry ? entry[locale] : "";
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function notify(event: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(event));
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function cleanColor(value: unknown): string | undefined {
  const text = String(value ?? "").trim();
  return HEX.test(text) ? text : undefined;
}

function boundedSize(value: unknown): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(96, Math.max(8, Math.round(parsed)));
}

function sanitizeOverrides(raw: unknown): TextOverrides {
  if (!raw || typeof raw !== "object") return {};
  const out: TextOverrides = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    if (!TEXT_CATALOG_BY_KEY.has(key)) continue;
    const source = value as Record<string, unknown>;
    const ar = String(source.ar ?? "");
    const en = String(source.en ?? "");
    /* القيمة الفارغة = العودة للنص الافتراضي */
    if (!ar.trim() && !en.trim()) continue;
    out[key] = { ar, en };
  }
  return out;
}

function sanitizeStyles(raw: unknown): TextStyles {
  if (!raw || typeof raw !== "object") return {};
  const out: TextStyles = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    if (!TEXT_CATALOG_BY_KEY.has(key)) continue;
    const source = value as Record<string, unknown>;
    const style: TextStyleOverride = {};
    if (
      source.fontFamily === "cairo" ||
      source.fontFamily === "tajawal" ||
      source.fontFamily === "amiri" ||
      source.fontFamily === "readex"
    ) {
      style.fontFamily = source.fontFamily;
    }
    const fontSize = boundedSize(source.fontSize);
    if (fontSize !== undefined) style.fontSize = fontSize;
    const color = cleanColor(source.color);
    if (color) style.color = color;
    if (
      source.fontWeight === "400" ||
      source.fontWeight === "600" ||
      source.fontWeight === "700" ||
      source.fontWeight === "800" ||
      source.fontWeight === "900"
    ) {
      style.fontWeight = source.fontWeight;
    }
    if (source.align === "start" || source.align === "center" || source.align === "end") {
      style.align = source.align;
    }
    if (Object.keys(style).length) out[key] = style;
  }
  return out;
}

export function getTextOverrides(): TextOverrides {
  return sanitizeOverrides(readJson<unknown>(TEXT_OVERRIDES_KEY, {}));
}

export function saveTextOverrides(value: TextOverrides): boolean {
  const clean = sanitizeOverrides(value);
  const ok = writeJson(TEXT_OVERRIDES_KEY, clean);
  if (ok) notify(TEXT_OVERRIDES_EVENT);
  return ok;
}

export function getTextStyles(): TextStyles {
  return sanitizeStyles(readJson<unknown>(TEXT_STYLES_KEY, {}));
}

export function saveTextStyles(value: TextStyles): boolean {
  const clean = sanitizeStyles(value);
  const ok = writeJson(TEXT_STYLES_KEY, clean);
  if (ok) notify(TEXT_STYLES_EVENT);
  return ok;
}

/** النص المعروض حاليًا (تجاوز الأدمن إن وجد، وإلا الافتراضي) */
export function resolveText(
  key: string,
  locale: TextLocale,
  overrides: TextOverrides
): string {
  const custom = overrides[key]?.[locale];
  if (custom && custom.trim()) return custom;
  return defaultText(key, locale);
}
