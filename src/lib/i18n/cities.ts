import type { MessageKey } from "./messages";
import type { City } from "@/types/property";
import { CITY_CENTERS } from "@/data/properties";
import { getCityByName } from "@/lib/cities-store";

/** ربط اسم المدينة العربي (كما هو في البيانات) بمفتاح الترجمة */
export const CITY_MESSAGE_KEY: Record<string, MessageKey> = {
  "كل المدن": "city.all",
  "رأس البر": "city.rasElBar",
  "دمياط": "city.damietta",
  "دمياط الجديدة": "city.newDamietta",
  "دمياط القديمة": "city.oldDamietta",
  "فارسكور": "city.faraskur",
  "جمصة": "city.gamasa",
  "المنصورة الجديدة": "city.newMansoura",
};

/** مرادفات المدينة: فلتر «دمياط» يفتح أيضاً إعلانات «دمياط القديمة» */
const CITY_ALIASES: Record<string, string[]> = {
  دمياط: ["دمياط القديمة"],
};

/** هل يطابق اسم مدينة العقار مدينة الفلتر المختارة؟ ("" = كل المدن) */
export function cityMatches(propertyCity: string, city: City | ""): boolean {
  if (!city) return true;
  if (propertyCity === city) return true;
  return (CITY_ALIASES[city] ?? []).includes(propertyCity);
}

/** مركز المدينة على الخريطة — من سجل المدن الديناميكي مع رجوع آمن */
export function cityCenter(city: City | ""): { lat: number; lng: number } {
  if (city) {
    const record = getCityByName(city);
    if (record) return { lat: record.lat, lng: record.lng };
    if (city in CITY_CENTERS) {
      return CITY_CENTERS[city as keyof typeof CITY_CENTERS];
    }
  }
  return CITY_CENTERS["دمياط الجديدة"];
}

/**
 * اسم مدينة قادم من البيانات باللغة الحالية.
 * المدن الافتراضية تستخدم مفاتيح الترجمة، والمدن المضافة من الأدمن
 * تستخدم الاسمين المحفوظين في سجل المدن.
 */
export function cityLabel(
  name: string,
  t: (key: MessageKey) => string,
  locale: "ar" | "en" = "ar"
): string {
  const key = CITY_MESSAGE_KEY[name];
  if (key) return t(key);
  const record = getCityByName(name);
  if (!record) return name;
  return locale === "en" ? record.nameEn || record.nameAr : record.nameAr;
}
