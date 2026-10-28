export type City =
  | "رأس البر"
  | "دمياط"
  | "دمياط الجديدة"
  | "دمياط القديمة"
  | "فارسكور"
  | "جمصة"
  | "المنصورة الجديدة";

export type PropertyType =
  | "أرض"
  | "شقة"
  | "محل"
  | "منزل"
  | "فيلا"
  | "شقة دوبلكس";

export type SellerType = "فرد" | "مطور" | "مسوق";

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
}

/** نوع العرض: بيع أو إيجار */
export type Purpose = "بيع" | "إيجار";

export type RoomsFilter = "" | "1" | "2" | "3" | "4+";
export type PropertyTypeFilter = PropertyType | "";
export type PurposeFilter = Purpose | "";

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
  description: string;
  image: string;
  images: string[];
  lat: number;
  lng: number;
  /** نوع العرض — غياب القيمة يعني "بيع" للإعلانات القديمة */
  purpose?: Purpose;
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
  priceMin: number;
  priceMax: number;
  rooms: RoomsFilter;
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
  priceMin: PRICE_FILTER_MIN,
  priceMax: PRICE_FILTER_MAX,
  rooms: "",
  priceActive: false,
};
