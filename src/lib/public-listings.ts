import { Property } from "@/types/property";
import { getApprovedListingIds } from "@/lib/admin-system";

/**
 * سياسة النشر: لا يظهر أي إعلان في الواجهة العامة إلا بعد موافقة إدارة المنصة.
 * الطلبات الجديدة تُحفظ بحالة "قيد المراجعة" ولا تُعرض للزوار.
 */
export function filterPublishedProperties(properties: Property[]): Property[] {
  const approved = new Set(getApprovedListingIds());
  return properties.filter((property) => approved.has(property.id));
}

/** هل هذا العقار منشور للجمهور؟ */
export function isPropertyPublished(id: string): boolean {
  return getApprovedListingIds().includes(id);
}
