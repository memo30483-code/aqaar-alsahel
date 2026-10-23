export type City =
  | "رأس البر"
  | "دمياط الجديدة"
  | "دمياط القديمة"
  | "المنصورة الجديدة"
  | "جمصة";

export type PropertyType = "شقة" | "فيلا" | "محل" | "أرض";
export type SellerType = "فرد" | "مطور" | "مسوق";
export type RoomsFilter = "" | "1" | "2" | "3" | "4+";

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
}

export interface PropertyFilters {
  city: City | "";
  priceMin: number;
  priceMax: number;
  rooms: RoomsFilter;
}

export const PRICE_FILTER_MIN = 500_000;
export const PRICE_FILTER_MAX = 5_000_000;

export const defaultPropertyFilters: PropertyFilters = {
  city: "",
  priceMin: PRICE_FILTER_MIN,
  priceMax: PRICE_FILTER_MAX,
  rooms: "",
};
