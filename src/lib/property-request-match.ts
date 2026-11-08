/**
 * محرّك مطابقة طلبات العقار مع الإعلانات المنشورة.
 *
 * دالة نقية بلا React أو Supabase، تُستخدم على السيرفر لحساب أفضل
 * العقارات المطابقة لكل طلب، ويمكن اختبارها مباشرة.
 */

import type { Property } from "@/types/property";
import { cityMatches } from "@/lib/city-match";
import type {
  PropertyRequestBrief,
  PropertyRequestMatch,
} from "@/lib/property-requests";

/** تبسيط النص العربي للمقارنة: تشكيل، همزات، ة/ه، ى/ي */
export function normalizeArabic(value: string): string {
  return value
    .toString()
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

function within(value: number, min: number | null, max: number | null): boolean {
  if (min !== null && value < min) return false;
  if (max !== null && value > max) return false;
  return true;
}

function matchCity(propertyCity: string, cities: string[]): "exact" | "alias" | null {
  if (!cities.length) return "exact";
  for (const city of cities) {
    if (propertyCity === city) return "exact";
    if (cityMatches(propertyCity, city)) return "alias";
  }
  return null;
}

function matchDistrict(propertyDistrict: string, districts: string[]): boolean {
  if (!districts.length) return false;
  const target = normalizeArabic(propertyDistrict);
  if (!target) return false;
  return districts.some((district) => {
    const needle = normalizeArabic(district);
    return Boolean(needle) && (target.includes(needle) || needle.includes(target));
  });
}

/**
 * مطابقة عقار واحد بطلب. ترجع null إذا لم يجتز الفلاتر الأساسية،
 * أو نتيجة بها درجة من 0 إلى 100 وأسباب عربية واضحة.
 */
export function matchPropertyRequest(
  brief: PropertyRequestBrief,
  property: Property
): PropertyRequestMatch | null {
  const purpose = property.purpose ?? "بيع";
  if (purpose !== brief.purpose) return null;

  if (brief.types.length && !brief.types.includes(property.type)) return null;

  const cityResult = matchCity(property.city, brief.cities);
  if (!cityResult) return null;

  /* الميزانية: نقبل تجاوزاً بسيطاً حتى 10% مع تعليم ذلك للإدارة */
  const price = Number(property.price) || 0;
  const priceOnRequest = property.priceByAdmin === true || price <= 0;
  let overBudget = false;
  let overBudgetRatio = 0;
  if (!priceOnRequest && brief.priceMax !== null) {
    if (price > brief.priceMax * 1.1) return null;
    overBudget = price > brief.priceMax;
    overBudgetRatio = overBudget
      ? (price - brief.priceMax) / Math.max(1, brief.priceMax)
      : 0;
  }

  const area = Number(property.area) || 0;
  if (area > 0) {
    if (brief.areaMin !== null && area < brief.areaMin * 0.9) return null;
    if (brief.areaMax !== null && area > brief.areaMax * 1.1) return null;
  } else if (brief.areaMin !== null || brief.areaMax !== null) {
    return null;
  }

  if (brief.roomsMin !== null && (Number(property.rooms) || 0) < brief.roomsMin) {
    return null;
  }
  if (
    brief.bathroomsMin !== null &&
    (Number(property.bathrooms) || 0) < brief.bathroomsMin
  ) {
    return null;
  }

  if (brief.finishes.length) {
    if (!property.finish || !brief.finishes.includes(property.finish)) {
      return null;
    }
  }

  const saleReason = property.saleReason ?? "بيع عادي";
  if (brief.purpose === "بيع" && brief.saleReason && saleReason !== brief.saleReason) {
    return null;
  }

  let score = 50;
  const reasons: string[] = ["نوع العقار مطابق"];

  if (cityResult === "exact") {
    score += 12;
    reasons.push("نفس المدينة");
  } else {
    score += 7;
    reasons.push("مدينة قريبة");
  }

  const districtHit = matchDistrict(property.district, brief.districts);
  if (districtHit) {
    score += 10;
    reasons.push("نفس المنطقة");
  }

  if (!priceOnRequest) {
    if (brief.priceMax !== null && price <= brief.priceMax) {
      score += 12;
      reasons.push("داخل الميزانية");
    } else if (overBudget) {
      score += 4;
      reasons.push("أعلى من الميزانية قليلاً");
    } else if (brief.priceMin !== null && price >= brief.priceMin * 0.85) {
      score += 4;
      reasons.push("قريب من الميزانية");
    }
    if (brief.priceMin !== null && price < brief.priceMin * 0.6) {
      score -= 4;
    }
  } else {
    reasons.push("السعر عند الطلب");
  }

  if (within(area, brief.areaMin, brief.areaMax) && (brief.areaMin || brief.areaMax)) {
    score += 5;
    reasons.push("المساحة مناسبة");
  }

  if (brief.roomsMin !== null && (Number(property.rooms) || 0) >= brief.roomsMin) {
    score += 4;
    reasons.push("عدد الغرف مناسب");
  }

  if (
    brief.bathroomsMin !== null &&
    (Number(property.bathrooms) || 0) >= brief.bathroomsMin
  ) {
    score += 2;
  }

  if (property.finish && brief.finishes.includes(property.finish)) {
    score += 6;
    reasons.push("التشطيب مطابق");
  }

  if (brief.purpose === "بيع" && brief.saleReason && saleReason === brief.saleReason) {
    score += 5;
    if (brief.saleReason === "استكمال أقساط") reasons.push("فرصة استكمال أقساط");
  }

  if (brief.delivery === "جاهز للاستلام" && property.finish !== "تحت الإنشاء") {
    score += 2;
  }

  if (property.image) score += 1;
  if (overBudgetRatio > 0.05) score -= 3;

  return {
    propertyId: property.id,
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons: Array.from(new Set(reasons)).slice(0, 5),
    overBudget,
    priceOnRequest,
  };
}

/** ترتيب أفضل العقارات المطابقة لطلب (الافتراضي: أفضل 20) */
export function rankPropertyMatches(
  brief: PropertyRequestBrief,
  properties: Property[],
  limit = 20
): PropertyRequestMatch[] {
  return properties
    .map((property) => matchPropertyRequest(brief, property))
    .filter((match): match is PropertyRequestMatch => match !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
}
