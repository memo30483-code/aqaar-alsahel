/**
 * اسم المدينة كما هو محفوظ في الإعلان.
 * القائمة نفسها ديناميكية وتُدار من لوحة التحكم (`src/lib/cities-store.ts`).
 */
export type City = string;

export type PropertyType =
  | "أرض"
  | "شقة"
  | "محل"
  | "منزل"
  | "فيلا"
  | "شقة دوبلكس"
  | "شاليه"
  | "استوديو";

export type SellerType = "فرد" | "مطور" | "مسوق";

/**
 * حالة تشطيب الوحدة أو العقار.
 * تُستخدم في البحث وفي نموذج «أضف عقارك» للأنواع المبنية (كل الأنواع عدا الأرض).
 */
export type FinishState =
  | "كامل التشطيب"
  | "نصف تشطيب"
  | "بدون تشطيب"
  | "تحت الإنشاء";

export const FINISH_STATES: FinishState[] = [
  "كامل التشطيب",
  "نصف تشطيب",
  "بدون تشطيب",
  "تحت الإنشاء",
];

/** الأنواع التي تُعتبر مبنى/منشأة ويظهر لها اختيار حالة التشطيب */
export function isBuildingType(type: string): boolean {
  return Boolean(type) && type !== "أرض";
}

/** حالة الإعلان — لا يُنشر أي إعلان قبل موافقة إدارة المنصة */
export type PropertyStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "archived"
  | "deleted";

/** بيانات وصفية لمستند مرفوع مع طلب نشر العقار */
export interface PropertyDocument {
  key: string;
  label: string;
  name: string;
  size: number;
  type: string;
  /** مسار داخلي في bucket خاص — لا يتحول إلى رابط عام */
  storagePath?: string;
}

/** نوع العرض: بيع أو إيجار */
export type Purpose = "بيع" | "إيجار";

/**
 * الغرض من البيع — يظهر فقط عندما يكون العرض «بيع».
 * «استكمال أقساط» يخص المالكين الذين تعثّروا في السداد فيضطرون للبيع.
 */
export type SaleReason = "بيع عادي" | "استكمال أقساط";

/** سبب البيع الخاص باستكمال سداد الأقساط */
export const INSTALLMENT_SALE_REASON: SaleReason = "استكمال أقساط";

/** أسباب البيع المعروضة في نموذج «أضف عقارك» */
export const SALE_REASONS: SaleReason[] = ["بيع عادي", INSTALLMENT_SALE_REASON];

export type RoomsFilter = "" | "1" | "2" | "3" | "4+";
export type PropertyTypeFilter = PropertyType | "";
export type PurposeFilter = Purpose | "";
export type SaleReasonFilter = SaleReason | "";
export type FinishFilter = FinishState | "";

export interface Property {
  id: string;
  title: string;
  city: City;
  district: string;
  type: PropertyType;
  area: number;
  rooms: number;
  bathrooms: number;
  price: number;
  sellerType: SellerType;
  whatsapp: string;
  /** اسم مقدم الطلب — بيانات إدارية لا تُعرض للزوار */
  ownerName?: string;
  description: string;
  image: string;
  images: string[];
  lat: number;
  lng: number;
  /** نوع العرض — غياب القيمة يعني "بيع" للإعلانات القديمة */
  purpose?: Purpose;
  /** الغرض من البيع — اختياري، وغيابه يعني بيعاً عادياً */
  saleReason?: SaleReason;
  /** حالة التشطيب — اختيارية للإعلانات القديمة، وتظهر للأنواع المبنية */
  finish?: FinishState;
  /** حالة النشر — غياب القيمة في إعلانات المستخدمين يعني "قيد المراجعة" */
  status?: PropertyStatus;
  /** المستندات المرفوعة مع الطلب (وصفية — التخزين الآمن يُربط لاحقاً) */
  documents?: PropertyDocument[];
  /** تاريخ إرسال الطلب للمراجعة */
  submittedAt?: string;
  /** رقم مرجعي يظهر لصاحب العقار لمتابعة الطلب */
  reference?: string;
  /** هل سعر البيع قابل للتفاوض؟ (يحدده البائع) */
  negotiable?: boolean;
  /** البائع ترك تحديد السعر لإدارة المنصة — يُعطّل السعر والتفاوض */
  priceByAdmin?: boolean;
}

export interface PropertyFilters {
  city: City | "";
  type: PropertyTypeFilter;
  purpose: PurposeFilter;
  /** الغرض من البيع — يستخدمه تبويب «استكمال أقساط» */
  saleReason: SaleReasonFilter;
  priceMin: number;
  priceMax: number;
  rooms: RoomsFilter;
  /** حالة التشطيب المطلوبة */
  finish: FinishFilter;
  /** هل عدّل المستخدم نطاق السعر؟ إن لم يعدّله لا يُطبَّق أي حد سعري */
  priceActive: boolean;
}

/** حدود السلايدر المعروضة — غير مفعّلة افتراضياً حتى لا تُخفى أي إعلانات */
export const PRICE_FILTER_MIN = 0;
export const PRICE_FILTER_MAX = 50_000_000;

export const defaultPropertyFilters: PropertyFilters = {
  city: "",
  type: "",
  purpose: "",
  saleReason: "",
  priceMin: PRICE_FILTER_MIN,
  priceMax: PRICE_FILTER_MAX,
  rooms: "",
  finish: "",
  priceActive: false,
};
