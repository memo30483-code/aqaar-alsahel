/**
 * سجل المدن الديناميكي — مصدر الحقيقة الوحيد لكل قوائم المدن في المنصة.
 *
 * التخزين حالياً في localStorage (نفس أسلوب بقية أجزاء المنصة)، وبنيته
 * (`{ items: CityRecord[] }`) جاهزة للترحيل إلى قاعدة بيانات لاحقاً دون
 * تغيير واجهات الاستخدام.
 */
import { useEffect, useMemo, useState } from "react";
import { CITY_CENTERS, USER_PROPERTIES_KEY } from "@/data/properties";

export type CityDemand = "مرتفع" | "موسمي" | "مستقر";

export interface CityRecord {
  /** معرّف ثابت لا يتغيّر مع تعديل الاسم */
  id: string;
  nameAr: string;
  nameEn: string;
  lat: number;
  lng: number;
  /** تكبير الخريطة عند اختيار المدينة */
  zoom: number;
  /** مفعّلة (تظهر للزوار) أو مخفية/مؤرشفة */
  active: boolean;
  order: number;
  /** مؤشر الطلب في دليل السوق */
  demand?: CityDemand;
  summaryAr?: string;
  summaryEn?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const CITIES_KEY = "aqaar-cities";
export const CITIES_EVENT = "aqaar:cities";

const DEFAULT_ZOOM = 12;

/** المدن الافتراضية — تُستخدم قبل أي تعديل من لوحة التحكم */
export const DEFAULT_CITIES: CityRecord[] = [
  {
    id: "ras-el-bar",
    nameAr: "رأس البر",
    nameEn: "Ras El Bar",
    lat: CITY_CENTERS["رأس البر"].lat,
    lng: CITY_CENTERS["رأس البر"].lng,
    zoom: DEFAULT_ZOOM,
    active: true,
    order: 1,
    demand: "موسمي",
  },
  {
    id: "damietta",
    nameAr: "دمياط",
    nameEn: "Damietta",
    lat: CITY_CENTERS["دمياط"].lat,
    lng: CITY_CENTERS["دمياط"].lng,
    zoom: DEFAULT_ZOOM,
    active: true,
    order: 2,
    demand: "مستقر",
  },
  {
    id: "new-damietta",
    nameAr: "دمياط الجديدة",
    nameEn: "New Damietta",
    lat: CITY_CENTERS["دمياط الجديدة"].lat,
    lng: CITY_CENTERS["دمياط الجديدة"].lng,
    zoom: DEFAULT_ZOOM,
    active: true,
    order: 3,
    demand: "مرتفع",
  },
  {
    id: "faraskur",
    nameAr: "فارسكور",
    nameEn: "Faraskur",
    lat: CITY_CENTERS["فارسكور"].lat,
    lng: CITY_CENTERS["فارسكور"].lng,
    zoom: DEFAULT_ZOOM,
    active: true,
    order: 4,
    demand: "مستقر",
  },
  {
    id: "gamasa",
    nameAr: "جمصة",
    nameEn: "Gamasa",
    lat: CITY_CENTERS["جمصة"].lat,
    lng: CITY_CENTERS["جمصة"].lng,
    zoom: DEFAULT_ZOOM,
    active: true,
    order: 5,
    demand: "موسمي",
  },
  {
    id: "new-mansoura",
    nameAr: "المنصورة الجديدة",
    nameEn: "New Mansoura",
    lat: CITY_CENTERS["المنصورة الجديدة"].lat,
    lng: CITY_CENTERS["المنصورة الجديدة"].lng,
    zoom: DEFAULT_ZOOM,
    active: true,
    order: 6,
    demand: "مرتفع",
  },
  /* مدينة قديمة موجودة في إعلانات سابقة — مخفية من القوائم لكن تُعرض إعلاناتها */
  {
    id: "old-damietta",
    nameAr: "دمياط القديمة",
    nameEn: "Old Damietta",
    lat: CITY_CENTERS["دمياط القديمة"].lat,
    lng: CITY_CENTERS["دمياط القديمة"].lng,
    zoom: DEFAULT_ZOOM,
    active: false,
    order: 7,
    demand: "مستقر",
  },
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function cloneDefaults(): CityRecord[] {
  return DEFAULT_CITIES.map((city) => ({ ...city }));
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCity(raw: Partial<CityRecord>, index: number): CityRecord {
  const nameAr = typeof raw.nameAr === "string" ? raw.nameAr.trim() : "";
  const nameEn =
    typeof raw.nameEn === "string" && raw.nameEn.trim()
      ? raw.nameEn.trim()
      : nameAr;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : `city-${index + 1}`,
    nameAr,
    nameEn,
    lat: toNumber(raw.lat, CITY_CENTERS["دمياط الجديدة"].lat),
    lng: toNumber(raw.lng, CITY_CENTERS["دمياط الجديدة"].lng),
    zoom: toNumber(raw.zoom, DEFAULT_ZOOM),
    active: raw.active !== false,
    order: toNumber(raw.order, index + 1),
    demand: raw.demand,
    summaryAr: raw.summaryAr,
    summaryEn: raw.summaryEn,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/** قراءة المخزون الخام — null يعني «لم يُضبط بعد» فنستخدم الافتراضي */
function readStored(): CityRecord[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CITIES_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as CityRecord[];
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return (parsed as { items: CityRecord[] }).items;
    }
    return [];
  } catch {
    return null;
  }
}

function sortCities(cities: CityRecord[]): CityRecord[] {
  return [...cities].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.nameAr.localeCompare(b.nameAr, "ar");
  });
}

/** كل المدن المسجّلة (مفعّلة ومخفية) مرتبة حسب الترتيب */
export function getCities(): CityRecord[] {
  const stored = readStored();
  if (stored === null) return cloneDefaults();
  return sortCities(
    stored.map(normalizeCity).filter((city) => city.nameAr.length > 0)
  );
}

/** المدن الظاهرة للزوار فقط */
export function getActiveCities(): CityRecord[] {
  return getCities().filter((city) => city.active);
}

/** البحث عن مدينة بالاسم العربي/الإنجليزي أو المعرّف */
export function getCityByName(name: string): CityRecord | undefined {
  const target = name.trim().toLowerCase();
  if (!target) return undefined;
  return getCities().find(
    (city) =>
      city.nameAr.trim().toLowerCase() === target ||
      city.nameEn.trim().toLowerCase() === target ||
      city.id.toLowerCase() === target
  );
}

export function saveCities(cities: CityRecord[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      CITIES_KEY,
      JSON.stringify({ items: cities, updatedAt: new Date().toISOString() })
    );
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CITIES_EVENT));
}

function makeId(nameEn: string, existing: CityRecord[]): string {
  const base = nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const seed = base || "city";
  let candidate = seed;
  let counter = 2;
  while (existing.some((city) => city.id === candidate)) {
    candidate = `${seed}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function duplicateName(
  cities: CityRecord[],
  nameAr: string,
  nameEn: string,
  ignoreId?: string
): boolean {
  const ar = nameAr.trim().toLowerCase();
  const en = nameEn.trim().toLowerCase();
  return cities.some(
    (city) =>
      city.id !== ignoreId &&
      ((ar && city.nameAr.trim().toLowerCase() === ar) ||
        (en && city.nameEn.trim().toLowerCase() === en))
  );
}

export interface CityInput {
  nameAr: string;
  nameEn?: string;
  lat: number;
  lng: number;
  zoom?: number;
  active?: boolean;
  demand?: CityDemand;
  summaryAr?: string;
  summaryEn?: string;
}

export type CityMutationResult =
  | { ok: true; city: CityRecord }
  | { ok: false; error: string };

/** إضافة مدينة جديدة في نهاية الترتيب */
export function addCity(input: CityInput): CityMutationResult {
  const cities = getCities();
  const nameAr = input.nameAr.trim();
  const nameEn = (input.nameEn ?? "").trim() || nameAr;
  if (!nameAr) return { ok: false, error: "اسم المدينة مطلوب" };
  if (duplicateName(cities, nameAr, nameEn)) {
    return { ok: false, error: "توجد مدينة بنفس الاسم بالفعل" };
  }
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    return { ok: false, error: "إحداثيات المدينة غير صالحة" };
  }
  if (Math.abs(input.lat) > 90 || Math.abs(input.lng) > 180) {
    return { ok: false, error: "الإحداثيات خارج النطاق المسموح" };
  }

  const now = new Date().toISOString();
  const city: CityRecord = {
    id: makeId(nameEn, cities),
    nameAr,
    nameEn,
    lat: input.lat,
    lng: input.lng,
    zoom: input.zoom && input.zoom > 0 ? input.zoom : DEFAULT_ZOOM,
    active: input.active !== false,
    order: cities.length
      ? Math.max(...cities.map((item) => item.order)) + 1
      : 1,
    demand: input.demand ?? "مستقر",
    summaryAr: input.summaryAr?.trim() || undefined,
    summaryEn: input.summaryEn?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  saveCities([...cities, city]);
  return { ok: true, city };
}

/** تعديل بيانات مدينة — تغيير الاسم العربي يُحدّث إعلانات المستخدمين المرتبطة */
export function updateCity(id: string, patch: Partial<CityInput>): CityMutationResult {
  const cities = getCities();
  const current = cities.find((city) => city.id === id);
  if (!current) return { ok: false, error: "المدينة غير موجودة" };

  const nameAr = (patch.nameAr ?? current.nameAr).trim();
  const nameEn = (patch.nameEn ?? current.nameEn).trim() || nameAr;
  if (!nameAr) return { ok: false, error: "اسم المدينة مطلوب" };
  if (duplicateName(cities, nameAr, nameEn, id)) {
    return { ok: false, error: "توجد مدينة أخرى بنفس الاسم" };
  }

  const lat = patch.lat ?? current.lat;
  const lng = patch.lng ?? current.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: "إحداثيات المدينة غير صالحة" };
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { ok: false, error: "الإحداثيات خارج النطاق المسموح" };
  }

  const updated: CityRecord = {
    ...current,
    nameAr,
    nameEn,
    lat,
    lng,
    zoom:
      patch.zoom !== undefined && patch.zoom > 0 ? patch.zoom : current.zoom,
    active: patch.active ?? current.active,
    demand: patch.demand ?? current.demand,
    summaryAr:
      patch.summaryAr !== undefined
        ? patch.summaryAr.trim() || undefined
        : current.summaryAr,
    summaryEn:
      patch.summaryEn !== undefined
        ? patch.summaryEn.trim() || undefined
        : current.summaryEn,
    updatedAt: new Date().toISOString(),
  };

  saveCities(cities.map((city) => (city.id === id ? updated : city)));

  if (current.nameAr !== nameAr) {
    renameCityInProperties(current.nameAr, nameAr);
  }

  return { ok: true, city: updated };
}

/** أرشفة/إخفاء مدينة أو إعادة تفعيلها */
export function setCityActive(id: string, active: boolean): void {
  const cities = getCities();
  saveCities(
    cities.map((city) =>
      city.id === id
        ? { ...city, active, updatedAt: new Date().toISOString() }
        : city
    )
  );
}

/** حذف نهائي */
export function removeCity(id: string): void {
  saveCities(getCities().filter((city) => city.id !== id));
}

/** نقل مدينة لأعلى/أسفل في الترتيب */
export function moveCity(id: string, direction: "up" | "down"): void {
  const cities = sortCities(getCities());
  const index = cities.findIndex((city) => city.id === id);
  if (index < 0) return;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= cities.length) return;
  const next = [...cities];
  [next[index], next[target]] = [next[target], next[index]];
  saveCities(next.map((city, position) => ({ ...city, order: position + 1 })));
}

/** تحديث أسماء المدن داخل إعلانات المستخدمين بعد تغيير اسم المدينة */
function renameCityInProperties(oldName: string, newName: string): void {
  if (!isBrowser() || !oldName || !newName || oldName === newName) return;
  try {
    const raw = window.localStorage.getItem(USER_PROPERTIES_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    let changed = false;
    const next = parsed.map((property) => {
      if (
        property &&
        typeof property === "object" &&
        (property as { city?: string }).city === oldName
      ) {
        changed = true;
        return { ...(property as Record<string, unknown>), city: newName };
      }
      return property;
    });
    if (changed) {
      window.localStorage.setItem(USER_PROPERTIES_KEY, JSON.stringify(next));
    }
  } catch {
    // تجاهل أي تلف في التخزين — لا نُفشل تعديل المدينة بسببه
  }
}

/** كل المدن مع الاستماع لتغييرات لوحة التحكم */
export function useAllCities(): CityRecord[] {
  const [cities, setCities] = useState<CityRecord[]>(cloneDefaults);

  useEffect(() => {
    const sync = () => setCities(getCities());
    sync();
    window.addEventListener(CITIES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CITIES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return cities;
}

/** المدن المفعّلة فقط */
export function useActiveCities(): CityRecord[] {
  const cities = useAllCities();
  return useMemo(() => cities.filter((city) => city.active), [cities]);
}
