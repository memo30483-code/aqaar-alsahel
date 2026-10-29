/**
 * تصنيف موحّد لأنواع المشاريع/العروض.
 *
 * السبب: كان النوع نصاً حراً («سكني»، «سكنى»، «Residential») فتاهت الفلاتر
 * والتقارير. هنا مصدر واحد للأنواع، والقديم يُحوَّل تلقائياً.
 * ملاحظة: عند ربط قاعدة البيانات يصبح هذا الحقل enum بدل نص.
 */
export type ProjectTypeId =
  | "residential"
  | "commercial"
  | "administrative"
  | "medical"
  | "coastal"
  | "mixed"
  | "land";

export const PROJECT_TYPES: { id: ProjectTypeId; ar: string; en: string }[] = [
  { id: "residential", ar: "سكني", en: "Residential" },
  { id: "commercial", ar: "تجاري", en: "Commercial" },
  { id: "administrative", ar: "إداري", en: "Administrative" },
  { id: "medical", ar: "طبي", en: "Medical" },
  { id: "coastal", ar: "مصيف", en: "Coastal" },
  { id: "mixed", ar: "متعدد الاستخدام", en: "Mixed use" },
  { id: "land", ar: "أراضي", en: "Land" },
];

const BY_ID = new Map<string, (typeof PROJECT_TYPES)[number]>(
  PROJECT_TYPES.map((type) => [type.id, type])
);

/** مرادفات النصوص الحرة القديمة */
const ALIASES: Record<string, ProjectTypeId> = {
  سكنى: "residential",
  سكنية: "residential",
  residential: "residential",
  تجارى: "commercial",
  تجارية: "commercial",
  commercial: "commercial",
  ادارى: "administrative",
  إدارى: "administrative",
  ادارية: "administrative",
  administrative: "administrative",
  طبية: "medical",
  clinics: "medical",
  medical: "medical",
  مصيفى: "coastal",
  مصيفي: "coastal",
  سياحي: "coastal",
  سياحية: "coastal",
  chalets: "coastal",
  coastal: "coastal",
  مختلط: "mixed",
  "mixed use": "mixed",
  mixed: "mixed",
  اراضى: "land",
  أراضي: "land",
  أرض: "land",
  land: "land",
};

/** تصنيف موحّد من أي نص — يرجع undefined لو مش معروف */
export function resolveProjectTypeId(
  value: string | null | undefined
): ProjectTypeId | undefined {
  if (!value) return undefined;
  const raw = value.trim();
  if (!raw) return undefined;
  const lower = raw.toLowerCase();

  if (BY_ID.has(lower)) return lower as ProjectTypeId;
  if (ALIASES[lower]) return ALIASES[lower];

  /* مطابقة جزئية داخل نص أطول (مثل «سكني فاخر») */
  for (const type of PROJECT_TYPES) {
    if (raw.includes(type.ar) || lower.includes(type.en.toLowerCase())) {
      return type.id;
    }
  }
  for (const [alias, id] of Object.entries(ALIASES)) {
    if (lower.includes(alias)) return id;
  }
  return undefined;
}

export function projectTypeLabel(
  id: ProjectTypeId | undefined,
  locale: "ar" | "en" = "ar"
): string {
  if (!id) return "";
  const type = BY_ID.get(id);
  return type ? (locale === "en" ? type.en : type.ar) : "";
}
