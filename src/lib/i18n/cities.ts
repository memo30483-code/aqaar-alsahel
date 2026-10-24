import type { MessageKey } from "./messages";
import type { City } from "@/types/property";
import { CITY_CENTERS } from "@/data/properties";

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

/** المدن المعتمدة بالترتيب المعتمد — بنفس القيم المخزّنة في البيانات */
export const CITY_NAMES: City[] = [
  "رأس البر",
  "دمياط",
  "دمياط الجديدة",
  "فارسكور",
  "جمصة",
  "المنصورة الجديدة",
];

/** مفاتيح ترجمة المدن بنفس ترتيب CITY_NAMES */
export const CITY_KEYS: MessageKey[] = CITY_NAMES.map(
  (name) => CITY_MESSAGE_KEY[name]
);

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

/** مركز المدينة على الخريطة — مع الرجوع لدمياط الجديدة للمدن غير المدرجة في البيانات */
export function cityCenter(city: City | ""): { lat: number; lng: number } {
  if (city && city in CITY_CENTERS) {
    return CITY_CENTERS[city as keyof typeof CITY_CENTERS];
  }
  return CITY_CENTERS["دمياط الجديدة"];
}

/** ترجمة اسم مدينة قادم من البيانات إلى اللغة الحالية */
export function cityLabel(
  name: string,
  t: (key: MessageKey) => string
): string {
  const key = CITY_MESSAGE_KEY[name];
  return key ? t(key) : name;
}
