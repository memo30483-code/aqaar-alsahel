/**
 * مطابقة أسماء المدن — وحدة نقية صالحة للسيرفر والمتصفح.
 * فصلها يمنع محرك المطابقة من استيراد store المدن الذي يحتوي React hooks.
 */

/** مرادفات المدينة: فلتر «دمياط» يشمل أيضاً إعلانات «دمياط القديمة». */
const CITY_ALIASES: Record<string, string[]> = {
  دمياط: ["دمياط القديمة"],
};

/** هل يطابق اسم مدينة العقار المدينة المختارة؟ (القيمة الفارغة = كل المدن) */
export function cityMatches(propertyCity: string, city: string): boolean {
  if (!city) return true;
  if (propertyCity === city) return true;
  return (CITY_ALIASES[city] ?? []).includes(propertyCity);
}
