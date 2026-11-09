/**
 * فلتر الخصوصية المركزي للحالة العامة.
 *
 * قاعدة البيانات تحتفظ بالنسخة الكاملة ليستخدمها الأدمن، لكن الزائر لا يستلم
 * أبدًا مستندات المالك أو رقم واتسابه أو رموز ملكية حسابات المهنيين.
 */

import { isPublicCloudKey } from "./keys";

export interface PublicCloudRow {
  key: string;
  value: unknown;
  is_public: boolean;
  updated_at: string;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function sanitizeListingOverrides(value: unknown): Record<string, unknown> {
  const source = objectValue(value);
  const result: Record<string, unknown> = {};
  for (const [id, raw] of Object.entries(source)) {
    const item = objectValue(raw);
    result[id] = {
      ...(typeof item.status === "string" ? { status: item.status } : {}),
      ...(typeof item.title === "string" ? { title: item.title } : {}),
      ...(typeof item.price === "number" ? { price: item.price } : {}),
      ...(typeof item.featuredByAdmin === "boolean"
        ? { featuredByAdmin: item.featuredByAdmin }
        : {}),
      ...(typeof item.replacedBy === "string" ? { replacedBy: item.replacedBy } : {}),
    };
  }
  return result;
}

function sanitizeProperties(
  value: unknown,
  overrides: Record<string, unknown>
): unknown[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((raw) => {
      const property = objectValue(raw);
      const id = typeof property.id === "string" ? property.id : "";
      const override = objectValue(overrides[id]);
      /* إعلانات المستخدم لا تظهر للعامة إلا بموافقة الإدارة الصريحة */
      return id && override.status === "approved";
    })
    .map((raw) => {
      const property = objectValue(raw);
      const id = String(property.id ?? "");
      const override = objectValue(overrides[id]);
      return {
        id,
        title:
          typeof override.title === "string" ? override.title : property.title,
        city: property.city,
        district: property.district,
        type: property.type,
        area: property.area,
        rooms: property.rooms,
        bathrooms: property.bathrooms,
        price:
          typeof override.price === "number" ? override.price : property.price,
        sellerType: property.sellerType,
        /* لا يُرسل رقم المالك للمتصفح — التواصل عبر الإدارة فقط */
        whatsapp: "",
        description: property.description,
        image: property.image,
        images: Array.isArray(property.images) ? property.images : [],
        lat: property.lat,
        lng: property.lng,
        purpose: property.purpose,
        saleReason: property.saleReason,
        finish: property.finish,
        status: "approved",
        negotiable: property.negotiable,
        priceByAdmin: property.priceByAdmin,
      };
    });
}

function sanitizeProfessionals(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((raw) => objectValue(raw).status === "approved")
    .map((raw) => {
      const source = objectValue(raw);
      const publicRecord: Record<string, unknown> = { ...source };
      delete publicRecord.documents;
      delete publicRecord.ownerToken;
      delete publicRecord.reviewNote;
      delete publicRecord.accountId;
      delete publicRecord.phone;
      delete publicRecord.email;

      publicRecord.projects = Array.isArray(source.projects)
        ? source.projects
            .filter((project) => objectValue(project).status === "approved")
            .map((project) => {
              const publicProject: Record<string, unknown> = {
                ...objectValue(project),
              };
              delete publicProject.reviewNote;
              delete publicProject.history;
              return publicProject;
            })
        : [];

      return publicRecord;
    });
}

/**
 * تنقية صفوف الحالة قبل حقنها في HTML أو إرجاعها من الـAPI العام.
 * النسخة الأصلية لا تتغير وتظل متاحة للأدمن الموثّق فقط.
 */
export function sanitizePublicCloudRows<T extends PublicCloudRow>(rows: T[]): T[] {
  const visible = rows.filter((row) => isPublicCloudKey(row.key));
  const overrideRow = visible.find(
    (row) => row.key === "aqaar-admin-listing-overrides-v2"
  );
  const overrides = sanitizeListingOverrides(overrideRow?.value);

  return visible.map((row) => {
    let value = row.value;
    if (row.key === "aqaar-admin-listing-overrides-v2") {
      value = overrides;
    } else if (row.key === "aqaar-properties") {
      value = sanitizeProperties(row.value, overrides);
    } else if (row.key === "aqaar-professionals") {
      value = sanitizeProfessionals(row.value);
    }
    return { ...row, value };
  });
}
