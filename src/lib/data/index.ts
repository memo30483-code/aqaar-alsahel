/**
 * سجل مصدر البيانات (Data Source Registry).
 *
 * الواجهة تنادي `dataSource()` فقط، ولا تعرف إن كانت البيانات من localStorage
 * أم من قاعدة بيانات. هذا هو الموضع الوحيد الذي يتغيّر عند الترحيل.
 */
import { localCitiesPort } from "@/lib/cities-store";
import type { DataSource } from "./ports";

let source: DataSource | null = null;

/**
 * المصدر الحالي. يُبنى عند أول استخدام (lazy) لتفادي مشاكل ترتيب تحميل
 * الوحدات عند وجود اعتماد متبادل مع المخازن.
 */
export function dataSource(): DataSource {
  if (!source) {
    source = {
      cities: localCitiesPort,
    };
  }
  return source;
}

/**
 * تبديل المصدر بالكامل (يُستخدم عند ربط قاعدة البيانات).
 * مثال لاحق: configureDataSource(createRemoteDataSource(baseUrl)).
 */
export function configureDataSource(next: DataSource): void {
  source = next;
}

export type { DataSource } from "./ports";
