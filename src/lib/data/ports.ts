/**
 * عقود منفذ البيانات (Data Ports).
 *
 * كل قراءة/كتابة في المنصة تمر من هنا بدل استدعاء localStorage مباشرة من الواجهة.
 * التنفيذ الحالي محلي (المخازن الحالية)، وللانتقال إلى قاعدة بيانات:
 * اكتب تنفيذاً بديلاً بنفس التوقيع (fetch → API) ثم نادِ configureDataSource
 * في مكان واحد — دون أي تعديل على المكوّنات.
 *
 * النوع هنا «تعاقدي» فقط (type-only) حتى لا ينشأ اعتماد دائري مع المخازن.
 */
import type {
  CityInput,
  CityMutationResult,
  CityRecord,
} from "@/lib/cities-store";

/** منفذ المدن — قراءة وكتابة غير متزامنة */
export interface CitiesPort {
  list(): Promise<CityRecord[]>;
  add(input: CityInput): Promise<CityMutationResult>;
  update(id: string, patch: Partial<CityInput>): Promise<CityMutationResult>;
  setActive(id: string, active: boolean): Promise<boolean>;
  remove(id: string): Promise<boolean>;
  move(id: string, direction: "up" | "down"): Promise<boolean>;
}

/**
 * جذر منافذ البيانات.
 * لإضافة كيان جديد: أضف منفذه هنا ثم نفّذه محلياً (خلف المخزن الحالي)
 * وبعيداً (مع قاعدة البيانات) — نفس النمط المطبّق على المدن.
 */
export interface DataSource {
  cities: CitiesPort;
}
