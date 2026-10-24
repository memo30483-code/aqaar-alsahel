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
}

export interface PropertyFilters {
  city: City | "";
  type: PropertyTypeFilter;
  purpose: PurposeFilter;
  priceMin: number;
  priceMax: number;
  rooms: RoomsFilter;
}

export const PRICE_FILTER_MIN = 500_000;
export const PRICE_FILTER_MAX = 5_000_000;

export const defaultPropertyFilters: PropertyFilters = {
  city: "",
  type: "",
  purpose: "",
  priceMin: PRICE_FILTER_MIN,
  priceMax: PRICE_FILTER_MAX,
  rooms: "",
};
