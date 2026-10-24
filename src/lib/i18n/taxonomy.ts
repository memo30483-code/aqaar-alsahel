import type { MessageKey } from "./messages";
import type { PropertyType } from "@/types/property";

/** ربط نوع العقار (كما هو في البيانات) بمفتاح الترجمة */
const PROPERTY_TYPE_KEYS: Record<string, MessageKey> = {
  أرض: "type.land",
  شقة: "type.apartment",
  محل: "type.shop",
  منزل: "type.house",
  فيلا: "type.villa",
  "شقة دوبلكس": "type.duplex",
};

/** أنواع العقارات المعتمدة بالترتيب المعروض في الواجهة */
export const PROPERTY_TYPES: PropertyType[] = [
  "أرض",
  "شقة",
  "محل",
  "منزل",
  "فيلا",
  "شقة دوبلكس",
];

/** ربط نوع البائع بمفتاح الترجمة */
const SELLER_TYPE_KEYS: Record<string, MessageKey> = {
  فرد: "seller.individual",
  مطور: "seller.developer",
  مسوق: "seller.marketer",
};

/** ربط مستوى الطلب السوقي بمفتاح الترجمة */
const DEMAND_KEYS: Record<string, MessageKey> = {
  مرتفع: "demand.high",
  موسمي: "demand.seasonal",
  مستقر: "demand.stable",
};

type Translate = (key: MessageKey) => string;

function resolve(
  map: Record<string, MessageKey>,
  value: string,
  t: Translate
): string {
  const key = map[value];
  return key ? t(key) : value;
}

export const propertyTypeLabel = (value: string, t: Translate) =>
  resolve(PROPERTY_TYPE_KEYS, value, t);

export const sellerTypeLabel = (value: string, t: Translate) =>
  resolve(SELLER_TYPE_KEYS, value, t);

export const demandLabel = (value: string, t: Translate) =>
  resolve(DEMAND_KEYS, value, t);
