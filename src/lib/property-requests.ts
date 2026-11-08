/**
 * طلبات العقار (العقار المطلوب) — أنواع وثوابت مشتركة بين الواجهة والسيرفر.
 *
 * الملف نقي بلا `window` ولا Supabase حتى يُستخدم في مكوّنات العميل وفي
 * معالجات الـAPI والمطابقة الذكية.
 */

import {
  FINISH_STATES,
  INSTALLMENT_SALE_REASON,
  SALE_REASONS,
  type FinishState,
  type PropertyType,
  type Purpose,
  type SaleReason,
} from "@/types/property";
import { PROPERTY_TYPES } from "@/lib/i18n/taxonomy";

export const PROPERTY_REQUEST_KIND = "property_request";
/** حدث متصفح لتحديث شارة تنبيهات الطلبات فورًا */
export const PROPERTY_REQUEST_NOTIFICATIONS_EVENT =
  "aqaar:property-request-notifications";

export const PROPERTY_REQUEST_STATUSES = [
  "new",
  "searching",
  "matched",
  "contacted",
  "won",
  "closed",
] as const;

export type PropertyRequestStatus = (typeof PROPERTY_REQUEST_STATUSES)[number];

export const PROPERTY_REQUEST_STATUS_LABEL: Record<
  PropertyRequestStatus,
  string
> = {
  new: "جديد",
  searching: "جاري البحث",
  matched: "تم الترشيح",
  contacted: "تم التواصل",
  won: "تم البيع",
  closed: "مغلق",
};

export const PROPERTY_REQUEST_STATUS_STYLE: Record<
  PropertyRequestStatus,
  string
> = {
  new: "border-sky-200 bg-sky-50 text-sky-700",
  searching: "border-amber-200 bg-amber-50 text-amber-700",
  matched: "border-violet-200 bg-violet-50 text-violet-700",
  contacted: "border-indigo-200 bg-indigo-50 text-indigo-700",
  won: "border-emerald-200 bg-emerald-50 text-emerald-700",
  closed: "border-sand-200 bg-sand-100 text-sand-700",
};

export type PropertyRequestPriority = "hot" | "warm" | "cold";

export const PROPERTY_REQUEST_PRIORITY_LABEL: Record<
  PropertyRequestPriority,
  string
> = {
  hot: "عاجل",
  warm: "متوسط",
  cold: "عادي",
};

export const PROPERTY_REQUEST_PRIORITY_STYLE: Record<
  PropertyRequestPriority,
  string
> = {
  hot: "border-rose-200 bg-rose-50 text-rose-700",
  warm: "border-amber-200 bg-amber-50 text-amber-700",
  cold: "border-sand-200 bg-sand-50 text-sand-600",
};

/** طريقة التواصل المفضّلة لمقدّم الطلب */
export type ContactPreference = "whatsapp" | "phone" | "email";

export const CONTACT_PREFERENCE_LABEL: Record<ContactPreference, string> = {
  whatsapp: "واتساب",
  phone: "اتصال هاتفي",
  email: "بريد إلكتروني",
};

/** مدة/طريقة الاستلام المطلوبة */
export const DELIVERY_OPTIONS = [
  "جاهز للاستلام",
  "خلال ٦ أشهر",
  "خلال سنة",
  "خلال سنتين",
  "مرن",
] as const;

export type DeliveryOption = (typeof DELIVERY_OPTIONS)[number];

export type PropertyRequestEventKind =
  | "created"
  | "status"
  | "note"
  | "sent"
  | "contact";

export interface PropertyRequestEvent {
  id: string;
  at: string;
  by: string;
  kind: PropertyRequestEventKind;
  text: string;
}

/** تفاصيل العقار المطلوب — كل الحقول اختيارية عدا الغرض */
export interface PropertyRequestBrief {
  purpose: Purpose;
  types: PropertyType[];
  cities: string[];
  districts: string[];
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  roomsMin: number | null;
  bathroomsMin: number | null;
  finishes: FinishState[];
  saleReason: SaleReason | "";
  delivery: string;
  notes: string;
  contactPreference: ContactPreference;
}

export interface PropertyRequest {
  id: string;
  reference: string;
  name: string;
  phone: string;
  email: string;
  brief: PropertyRequestBrief;
  status: PropertyRequestStatus;
  priority: PropertyRequestPriority;
  assignedTo?: string;
  assignedToName?: string;
  /** ملاحظات داخلية لا تظهر لمقدّم الطلب */
  adminNotes: string;
  /** معرّفات العقارات التي أُرسلت للعميل بالفعل */
  sentPropertyIds: string[];
  /** العقارات التي شاهد العميل تنبيهها — تحفظ العداد بين الأجهزة */
  seenPropertyIds: string[];
  /** حساب المستخدم إن أرسل الطلب وهو مسجّل */
  accountId?: string;
  history: PropertyRequestEvent[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

/** نتيجة مطابقة عقار واحد لطلب */
export interface PropertyRequestMatch {
  propertyId: string;
  score: number;
  reasons: string[];
  /** السعر أعلى من الميزانية بنسبة بسيطة */
  overBudget: boolean;
  /** السعر يحدده فريق المنصة */
  priceOnRequest: boolean;
}

export interface PropertyRequestsSettings {
  enabled: boolean;
  /**
   * `signed_in`: المسجّلون فقط (الافتراضي المطلوب).
   * `open`: أي زائر، مع ربط الطلب بحسابه تلقائياً إن كان مسجلاً.
   */
  audience: "signed_in" | "open";
  /** إظهار دعوة «اطلب عقارك» في الصفحة الرئيسية */
  showOnHome: boolean;
  pageTitleAr: string;
  pageTitleEn: string;
  pageSubtitleAr: string;
  pageSubtitleEn: string;
  ctaLabelAr: string;
  ctaLabelEn: string;
  successNoteAr: string;
  successNoteEn: string;
  homeTitleAr: string;
  homeTitleEn: string;
  homeSubtitleAr: string;
  homeSubtitleEn: string;
  homeCtaAr: string;
  homeCtaEn: string;
  /** نص يظهر بجانب نموذج التواصل لتوضيح سرية البيانات */
  contactNoteAr: string;
  contactNoteEn: string;
}

export const DEFAULT_PROPERTY_REQUEST_SETTINGS: PropertyRequestsSettings = {
  enabled: true,
  audience: "signed_in",
  showOnHome: true,
  pageTitleAr: "مش لاقي عقارك؟ قولنا مواصفاتك",
  pageTitleEn: "Can't find your property? Tell us what you need",
  pageSubtitleAr:
    "سجّل مواصفات العقار الذي تبحث عنه، وفريق عقار FAMILY يرشّح لك العقارات المطابقة من الإعلانات المعتمدة ويتواصل معك.",
  pageSubtitleEn:
    "Share the specs of the property you are looking for. The Aqaar FAMILY team matches it with approved listings and contacts you.",
  ctaLabelAr: "أرسل طلب العقار",
  ctaLabelEn: "Send property request",
  successNoteAr:
    "تم استلام طلبك. سيتواصل معك فريق الإدارة خلال ٤٨ ساعة عمل بعرض العقارات المطابقة.",
  successNoteEn:
    "Your request was received. Our team will contact you within 48 business hours with matching properties.",
  homeTitleAr: "عقارك المطلوب… بنوصفه لك",
  homeTitleEn: "The property you want, described by you",
  homeSubtitleAr:
    "قولنا المدينة والميزانية وعدد الغرف، وفريق المنصة يجيب لك العقارات المطابقة ويتواصل معك.",
  homeSubtitleEn:
    "Tell us the city, budget and rooms. Our team finds matching properties and contacts you.",
  homeCtaAr: "اطلب عقارك الآن",
  homeCtaEn: "Request your property",
  contactNoteAr:
    "بياناتك تُستخدم للتواصل معك بخصوص طلبك فقط، ولا تظهر للزوار أو لمقدّمي العقارات.",
  contactNoteEn:
    "Your details are used only to contact you about this request and are never shown to visitors or sellers.",
};

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function normalizePropertyRequestSettings(
  value: unknown
): PropertyRequestsSettings {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const defaults = DEFAULT_PROPERTY_REQUEST_SETTINGS;
  const audience = source.audience === "open" ? "open" : "signed_in";

  return {
    enabled: flag(source.enabled, defaults.enabled),
    audience,
    showOnHome: flag(source.showOnHome, defaults.showOnHome),
    pageTitleAr: text(source.pageTitleAr, defaults.pageTitleAr),
    pageTitleEn: text(source.pageTitleEn, defaults.pageTitleEn),
    pageSubtitleAr: text(source.pageSubtitleAr, defaults.pageSubtitleAr),
    pageSubtitleEn: text(source.pageSubtitleEn, defaults.pageSubtitleEn),
    ctaLabelAr: text(source.ctaLabelAr, defaults.ctaLabelAr),
    ctaLabelEn: text(source.ctaLabelEn, defaults.ctaLabelEn),
    successNoteAr: text(source.successNoteAr, defaults.successNoteAr),
    successNoteEn: text(source.successNoteEn, defaults.successNoteEn),
    homeTitleAr: text(source.homeTitleAr, defaults.homeTitleAr),
    homeTitleEn: text(source.homeTitleEn, defaults.homeTitleEn),
    homeSubtitleAr: text(source.homeSubtitleAr, defaults.homeSubtitleAr),
    homeSubtitleEn: text(source.homeSubtitleEn, defaults.homeSubtitleEn),
    homeCtaAr: text(source.homeCtaAr, defaults.homeCtaAr),
    homeCtaEn: text(source.homeCtaEn, defaults.homeCtaEn),
    contactNoteAr: text(source.contactNoteAr, defaults.contactNoteAr),
    contactNoteEn: text(source.contactNoteEn, defaults.contactNoteEn),
  };
}

export function isPropertyRequestStatus(
  value: unknown
): value is PropertyRequestStatus {
  return (
    typeof value === "string" &&
    (PROPERTY_REQUEST_STATUSES as readonly string[]).includes(value)
  );
}

export function isPropertyRequestPriority(
  value: unknown
): value is PropertyRequestPriority {
  return value === "hot" || value === "warm" || value === "cold";
}

export function isContactPreference(value: unknown): value is ContactPreference {
  return value === "whatsapp" || value === "phone" || value === "email";
}

export function isKnownPropertyType(value: unknown): value is PropertyType {
  return (
    typeof value === "string" &&
    (PROPERTY_TYPES as readonly string[]).includes(value)
  );
}

export function isKnownFinish(value: unknown): value is FinishState {
  return (
    typeof value === "string" &&
    (FINISH_STATES as readonly string[]).includes(value)
  );
}

export function isKnownSaleReason(value: unknown): value is SaleReason {
  return (
    typeof value === "string" &&
    (SALE_REASONS as readonly string[]).includes(value)
  );
}

export const INSTALLMENT_REASON = INSTALLMENT_SALE_REASON;

/** تفاصيل فارغة — تُستخدم كنقطة بداية للنموذج وللتطبيع */
export function emptyPropertyRequestBrief(): PropertyRequestBrief {
  return {
    purpose: "بيع",
    types: [],
    cities: [],
    districts: [],
    priceMin: null,
    priceMax: null,
    areaMin: null,
    areaMax: null,
    roomsMin: null,
    bathroomsMin: null,
    finishes: [],
    saleReason: "",
    delivery: "مرن",
    notes: "",
    contactPreference: "whatsapp",
  };
}

/** تطبيع تفاصيل الطلب القادمة من التخزين أو من الواجهة */
export function normalizePropertyRequestBrief(
  value: unknown
): PropertyRequestBrief {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const base = emptyPropertyRequestBrief();

  const types = Array.isArray(source.types)
    ? Array.from(
        new Set(source.types.filter(isKnownPropertyType))
      ).slice(0, PROPERTY_TYPES.length)
    : [];
  const finishes = Array.isArray(source.finishes)
    ? Array.from(new Set(source.finishes.filter(isKnownFinish))).slice(0, 4)
    : [];
  const cities = Array.isArray(source.cities)
    ? Array.from(
        new Set(
          source.cities
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      ).slice(0, 10)
    : [];
  const districts = Array.isArray(source.districts)
    ? Array.from(
        new Set(
          source.districts
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      ).slice(0, 8)
    : [];

  const purpose: Purpose = source.purpose === "إيجار" ? "إيجار" : "بيع";
  const saleReason =
    purpose === "بيع" && isKnownSaleReason(source.saleReason)
      ? source.saleReason
      : base.saleReason;

  return {
    purpose,
    types,
    cities,
    districts,
    priceMin: numberOrNull(source.priceMin),
    priceMax: numberOrNull(source.priceMax),
    areaMin: numberOrNull(source.areaMin),
    areaMax: numberOrNull(source.areaMax),
    roomsMin: numberOrNull(source.roomsMin),
    bathroomsMin: numberOrNull(source.bathroomsMin),
    finishes,
    saleReason,
    delivery: text(source.delivery, base.delivery),
    notes: text(source.notes).slice(0, 2000),
    contactPreference: isContactPreference(source.contactPreference)
      ? source.contactPreference
      : base.contactPreference,
  };
}

/** رقم مرجعي قصير يسهل على العميل والإدارة تتبّع الطلب */
export function propertyRequestReference(date = new Date()): string {
  const stamp = `${date.getFullYear()}`.slice(2) +
    `${date.getMonth() + 1}`.padStart(2, "0") +
    `${date.getDate()}`.padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `REQ-${stamp}-${random}`;
}

/** ملخّص عربي قصير للطلب — يُستخدم في رسائل واتساب وبطاقات الإدارة */
export function propertyRequestSummary(brief: PropertyRequestBrief): string {
  const parts: string[] = [];
  parts.push(brief.purpose === "إيجار" ? "إيجار" : "بيع");
  if (brief.types.length) parts.push(brief.types.join(" / "));
  if (brief.cities.length) parts.push(brief.cities.join(" / "));
  if (brief.priceMax) parts.push(`حتى ${formatPriceShort(brief.priceMax)}`);
  if (brief.roomsMin) parts.push(`${brief.roomsMin}+ غرف`);
  if (brief.areaMin || brief.areaMax) {
    parts.push(
      `${brief.areaMin ? `${brief.areaMin}` : "—"}-${brief.areaMax ? `${brief.areaMax}` : "—"} م²`
    );
  }
  return parts.join(" • ");
}

function formatPriceShort(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${Number.isInteger(millions) ? millions : millions.toFixed(1)} مليون`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)} ألف`;
  return `${value}`;
}
