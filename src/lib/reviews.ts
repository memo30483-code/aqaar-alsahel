/**
 * أنواع ومصطلحات نظام التقييمات — ملف نقي (سيرفر + متصفح).
 */

export type ReviewEntity = "property" | "developer" | "professional";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReviewPolicy = "open_verified" | "verified_only" | "open";

export interface ReviewSubRatingItem {
  key: string;
  label: string;
}

export interface ReviewEntitySettings {
  enabled: boolean;
  items: ReviewSubRatingItem[];
}

export interface ReviewSettings {
  /** open_verified: أي زائر + شارة موثّق | verified_only: الموثّقون فقط | open: مفتوح بدون شارات */
  policy: ReviewPolicy;
  /** مراجعة التقييم قبل النشر */
  moderation: boolean;
  subRatings: Record<ReviewEntity, ReviewEntitySettings>;
}

export interface Review {
  id: string;
  entityType: ReviewEntity;
  entityId: string;
  name: string;
  rating: number;
  subRatings: Record<string, number>;
  comment?: string;
  status: ReviewStatus;
  verified: boolean;
  adminReply?: string;
  reportedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  subAverages: Record<string, number>;
}

export const REVIEW_ENTITY_LABEL: Record<ReviewEntity, string> = {
  property: "عقار",
  developer: "مطور عقاري",
  professional: "مهني",
};

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "بانتظار المراجعة",
  approved: "منشور",
  rejected: "مرفوض",
};

export const REVIEW_POLICY_LABEL: Record<ReviewPolicy, string> = {
  open_verified: "أي زائر — مع شارة «موثّق» لمن تعامل عبر المنصة",
  verified_only: "الموثّقون فقط (من سبق له تعامل عبر المنصة)",
  open: "أي زائر — بدون شارات توثيق",
};

export const REVIEW_POLICY_NOTE: Record<ReviewPolicy, string> = {
  open_verified:
    "يستطيع أي زائر التقييم مرة واحدة، ويظهر تقييمه بشارة «موثّق» فقط إذا طابق هاتفه أو بريده عميلًا مسجلًا في CRM.",
  verified_only:
    "لن يُقبل التقييم إلا إذا كان رقم الهاتف أو البريد مطابقًا لعميل سبق له تعامل عبر المنصة.",
  open: "أي زائر يستطيع التقييم مرة واحدة، ولا تُعرض شارات توثيق.",
};

export const DEFAULT_SUB_RATINGS: Record<ReviewEntity, ReviewEntitySettings> = {
  property: {
    enabled: true,
    items: [
      { key: "accuracy", label: "دقة الوصف" },
      { key: "value", label: "السعر مقابل القيمة" },
      { key: "location", label: "الموقع والحي" },
      { key: "condition", label: "حالة العقار" },
    ],
  },
  developer: {
    enabled: true,
    items: [
      { key: "quality", label: "جودة المشروعات" },
      { key: "delivery", label: "الالتزام بالمواعيد" },
      { key: "service", label: "خدمة العملاء" },
    ],
  },
  professional: {
    enabled: true,
    items: [
      { key: "professionalism", label: "الاحترافية" },
      { key: "response", label: "سرعة الاستجابة" },
      { key: "clarity", label: "وضوح التعامل" },
    ],
  },
};

export const DEFAULT_REVIEW_SETTINGS: ReviewSettings = {
  policy: "open_verified",
  moderation: true,
  subRatings: DEFAULT_SUB_RATINGS,
};

export const REVIEW_ENTITIES: ReviewEntity[] = [
  "property",
  "developer",
  "professional",
];

const POLICY_VALUES: ReviewPolicy[] = ["open_verified", "verified_only", "open"];

function cleanLabel(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 80)
    : fallback;
}

function normalizeEntitySettings(
  raw: unknown,
  fallback: ReviewEntitySettings
): ReviewEntitySettings {
  if (!raw || typeof raw !== "object") return fallback;
  const item = raw as { enabled?: unknown; items?: unknown };
  const items = Array.isArray(item.items)
    ? item.items
        .slice(0, 8)
        .flatMap((entry, index) => {
          if (!entry || typeof entry !== "object") return [];
          const record = entry as { key?: unknown; label?: unknown };
          const key =
            typeof record.key === "string" && /^[a-z0-9_]{2,32}$/.test(record.key)
              ? record.key
              : `item_${index + 1}`;
          return [
            {
              key,
              label: cleanLabel(
                record.label,
                fallback.items[index]?.label ?? `تقييم فرعي ${index + 1}`
              ),
            },
          ];
        })
    : fallback.items;
  return {
    enabled: item.enabled !== false && items.length > 0,
    items: items.length ? items : fallback.items,
  };
}

export function normalizeReviewSettings(value: unknown): ReviewSettings {
  if (!value || typeof value !== "object") {
    return {
      ...DEFAULT_REVIEW_SETTINGS,
      subRatings: { ...DEFAULT_SUB_RATINGS },
    };
  }
  const raw = value as Record<string, unknown>;
  const policy = POLICY_VALUES.includes(raw.policy as ReviewPolicy)
    ? (raw.policy as ReviewPolicy)
    : DEFAULT_REVIEW_SETTINGS.policy;
  const subRaw =
    raw.subRatings && typeof raw.subRatings === "object"
      ? (raw.subRatings as Record<string, unknown>)
      : {};
  return {
    policy,
    moderation: raw.moderation !== false,
    subRatings: {
      property: normalizeEntitySettings(
        subRaw.property,
        DEFAULT_SUB_RATINGS.property
      ),
      developer: normalizeEntitySettings(
        subRaw.developer,
        DEFAULT_SUB_RATINGS.developer
      ),
      professional: normalizeEntitySettings(
        subRaw.professional,
        DEFAULT_SUB_RATINGS.professional
      ),
    },
  };
}

/** إعدادات آمنة للعرض العام — بدون أي حقول إدارية */
export function publicReviewSettings(
  settings: ReviewSettings,
  entityType: ReviewEntity
): {
  policy: ReviewPolicy;
  moderation: boolean;
  subRatings: ReviewEntitySettings;
} {
  return {
    policy: settings.policy,
    moderation: settings.moderation,
    subRatings: settings.subRatings[entityType],
  };
}

export function clampRating(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(5, Math.max(1, Math.round(parsed)));
}

export function summarizeReviews(reviews: Review[]): ReviewSummary {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  const subTotals: Record<string, { total: number; count: number }> = {};
  let total = 0;
  for (const review of reviews) {
    const rating = clampRating(review.rating);
    if (!rating) continue;
    distribution[rating as 1 | 2 | 3 | 4 | 5] += 1;
    total += rating;
    for (const [key, value] of Object.entries(review.subRatings ?? {})) {
      const sub = clampRating(value);
      if (!sub) continue;
      const entry = subTotals[key] ?? { total: 0, count: 0 };
      entry.total += sub;
      entry.count += 1;
      subTotals[key] = entry;
    }
  }
  const subAverages: Record<string, number> = {};
  for (const [key, entry] of Object.entries(subTotals)) {
    if (entry.count) {
      subAverages[key] = Math.round((entry.total / entry.count) * 10) / 10;
    }
  }
  const count = reviews.length;
  return {
    average: count ? Math.round((total / count) * 10) / 10 : 0,
    count,
    distribution,
    subAverages,
  };
}

/** منع الروابط وأرقام الهواتف داخل التعليقات */
export function reviewCommentIssue(value: string): string | null {
  const text = value.trim();
  if (text.length > 1200) return "التعليق أطول من المسموح (1200 حرف)";
  if (/(https?:\/\/|www\.|\.com|\.net|\.org)/i.test(text)) {
    return "لا يُسمح بإضافة روابط داخل التقييم";
  }
  if (/(\+?\d[\d\s-]{7,})/.test(text)) {
    return "لا يُسمح بكتابة أرقام هواتف داخل التقييم";
  }
  return null;
}
