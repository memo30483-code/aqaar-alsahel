import type { MessageKey } from "@/lib/i18n";

/**
 * إعدادات حقول صفحة «أضف عقارك» — يتحكم فيها الأدمن:
 * أي حقل إجباري (لا يُقبل الطلب بدونه) وأي حقل اختياري.
 * الإعدادات عامة وتنطبق على كل طلبات النشر.
 */

export type AddPropertyFieldKey =
  | "title"
  | "city"
  | "district"
  | "type"
  | "area"
  | "price"
  | "rooms"
  | "bathrooms"
  | "description"
  | "sellerType"
  | "whatsapp"
  | "image"
  | "doc_owner_id"
  | "doc_ownership"
  | "doc_license"
  | "doc_utility"
  | "doc_power_of_attorney"
  | "doc_tax";

export type AddPropertyFieldGroup =
  | "listing"
  | "details"
  | "contact"
  | "media"
  | "documents";

export interface AddPropertyFieldDef {
  key: AddPropertyFieldKey;
  /** التسمية العربية كما تظهر في الصفحة والإدارة */
  label: string;
  labelKey: MessageKey;
  group: AddPropertyFieldGroup;
  defaultRequired: boolean;
  /** حقل أساسي في بنية الإعلان — يبقى إجبارياً دائماً */
  locked?: boolean;
}

export const ADD_PROPERTY_FIELDS_KEY = "aqaar-add-property-fields";

/** حدث يُطلق عند تغيير الإعدادات من لوحة التحكم */
export const ADD_PROPERTY_FIELDS_EVENT = "aqaar:add-property-fields";

export const ADD_PROPERTY_FIELD_GROUPS: {
  key: AddPropertyFieldGroup;
  label: string;
  desc: string;
}[] = [
  {
    key: "listing",
    label: "بيانات الإعلان",
    desc: "العنوان والمدينة والحي.",
  },
  {
    key: "details",
    label: "تفاصيل العقار",
    desc: "النوع والمساحة والسعر والغرف والوصف.",
  },
  {
    key: "contact",
    label: "بيانات التواصل",
    desc: "نوع البائع ورقم التواصل (لا يظهر للزوار).",
  },
  {
    key: "media",
    label: "الصورة والموقع",
    desc: "صورة العقار — الموقع يُحدَّد دائماً على الخريطة.",
  },
  {
    key: "documents",
    label: "مستندات السلامة القانونية",
    desc: "أي مستند تختاره إجبارياً يمنع إرسال الطلب من دونه.",
  },
];

export const ADD_PROPERTY_FIELDS: AddPropertyFieldDef[] = [
  {
    key: "title",
    label: "عنوان الإعلان",
    labelKey: "addProperty.fieldTitle",
    group: "listing",
    defaultRequired: true,
  },
  {
    key: "city",
    label: "المدينة",
    labelKey: "addProperty.fieldCity",
    group: "listing",
    defaultRequired: true,
    locked: true,
  },
  {
    key: "district",
    label: "الحي",
    labelKey: "addProperty.fieldDistrict",
    group: "listing",
    defaultRequired: true,
  },
  {
    key: "type",
    label: "نوع العقار",
    labelKey: "addProperty.fieldType",
    group: "details",
    defaultRequired: true,
    locked: true,
  },
  {
    key: "area",
    label: "المساحة (م²)",
    labelKey: "addProperty.fieldArea",
    group: "details",
    defaultRequired: true,
  },
  {
    key: "price",
    label: "السعر (ج.م)",
    labelKey: "addProperty.fieldPrice",
    group: "details",
    defaultRequired: true,
  },
  {
    key: "rooms",
    label: "عدد الغرف",
    labelKey: "addProperty.fieldRooms",
    group: "details",
    defaultRequired: true,
  },
  {
    key: "bathrooms",
    label: "عدد الحمامات",
    labelKey: "addProperty.fieldBathrooms",
    group: "details",
    defaultRequired: true,
  },
  {
    key: "description",
    label: "وصف العقار",
    labelKey: "addProperty.fieldDescription",
    group: "details",
    defaultRequired: true,
  },
  {
    key: "sellerType",
    label: "نوع البائع",
    labelKey: "addProperty.fieldSellerType",
    group: "contact",
    defaultRequired: true,
  },
  {
    key: "whatsapp",
    label: "رقم التواصل",
    labelKey: "addProperty.fieldWhatsapp",
    group: "contact",
    defaultRequired: true,
  },
  {
    key: "image",
    label: "صورة العقار",
    labelKey: "addProperty.fieldImage",
    group: "media",
    defaultRequired: true,
  },
  {
    key: "doc_owner_id",
    label: "بطاقة المالك (الرقم القومي)",
    labelKey: "addProperty.doc.owner_id",
    group: "documents",
    defaultRequired: true,
  },
  {
    key: "doc_ownership",
    label: "عقد الملكية / سند الملكية",
    labelKey: "addProperty.doc.ownership",
    group: "documents",
    defaultRequired: true,
  },
  {
    key: "doc_license",
    label: "الترخيص أو محضر الحيازة",
    labelKey: "addProperty.doc.license",
    group: "documents",
    defaultRequired: true,
  },
  {
    key: "doc_utility",
    label: "إيصال مرافق (كهرباء أو مياه)",
    labelKey: "addProperty.doc.utility",
    group: "documents",
    defaultRequired: true,
  },
  {
    key: "doc_power_of_attorney",
    label: "توكيل رسمي",
    labelKey: "addProperty.doc.power_of_attorney",
    group: "documents",
    defaultRequired: false,
  },
  {
    key: "doc_tax",
    label: "شهادة ضريبة عقارية",
    labelKey: "addProperty.doc.tax",
    group: "documents",
    defaultRequired: false,
  },
];

export type AddPropertyFieldSettings = Record<AddPropertyFieldKey, boolean>;

const buildDefaults = (): AddPropertyFieldSettings => {
  const result = {} as AddPropertyFieldSettings;
  for (const field of ADD_PROPERTY_FIELDS) {
    result[field.key] = field.locked ? true : field.defaultRequired;
  }
  return result;
};

export const DEFAULT_ADD_PROPERTY_FIELD_SETTINGS: AddPropertyFieldSettings =
  buildDefaults();

/** مفتاح إعدادات مستند بعينه */
export function documentFieldKey(key: string): AddPropertyFieldKey {
  return `doc_${key}` as AddPropertyFieldKey;
}

/** قراءة إعدادات الحقول مع دمج الافتراضي — الحقول المقفلة تبقى إجبارية */
export function getAddPropertyFieldSettings(): AddPropertyFieldSettings {
  const settings = buildDefaults();
  if (typeof window === "undefined") return settings;

  try {
    const raw = window.localStorage.getItem(ADD_PROPERTY_FIELDS_KEY);
    const stored: unknown = raw ? JSON.parse(raw) : null;
    if (!stored || typeof stored !== "object") return settings;

    for (const field of ADD_PROPERTY_FIELDS) {
      if (field.locked) continue;
      const value = (stored as Record<string, unknown>)[field.key];
      if (typeof value === "boolean") settings[field.key] = value;
    }
  } catch {
    /* تجاهل أي تلف في التخزين والعودة للافتراضي */
  }

  return settings;
}

/** حفظ إعدادات الحقول — تُجبر الحقول المقفلة على الإجبارية */
export function saveAddPropertyFieldSettings(
  settings: AddPropertyFieldSettings
): void {
  if (typeof window === "undefined") return;

  const next = { ...settings };
  for (const field of ADD_PROPERTY_FIELDS) {
    if (field.locked) next[field.key] = true;
  }

  try {
    window.localStorage.setItem(ADD_PROPERTY_FIELDS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(ADD_PROPERTY_FIELDS_EVENT));
  } catch {
    /* تجاهل أخطاء التخزين */
  }
}

/** استعادة الإعدادات الافتراضية */
export function resetAddPropertyFieldSettings(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ADD_PROPERTY_FIELDS_KEY);
    window.dispatchEvent(new Event(ADD_PROPERTY_FIELDS_EVENT));
  } catch {
    /* تجاهل أخطاء التخزين */
  }
}

/** عدد الحقول الإجبارية والاختيارية */
export function countAddPropertyFields(settings: AddPropertyFieldSettings): {
  required: number;
  optional: number;
} {
  let required = 0;
  let optional = 0;
  for (const field of ADD_PROPERTY_FIELDS) {
    if (settings[field.key]) required += 1;
    else optional += 1;
  }
  return { required, optional };
}
