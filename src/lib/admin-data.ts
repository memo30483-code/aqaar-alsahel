/**
 * طبقة بيانات لوحة تحكم المدير:
 * أنواع السجلات + قراءة/كتابة الحالة في localStorage دون تعديل ملفات البيانات الأساسية.
 */

import { mockProperties, USER_PROPERTIES_KEY } from "@/data/properties";
import type { Property } from "@/types/property";
import type { UserRole } from "@/lib/session";

/* ============================ الأنواع ============================ */

/** حالة مراجعة الإعلان */
export type ListingStatus = "pending" | "approved" | "rejected";

/** صفّ إعلان داخل جدول الإدارة */
export interface AdminListing {
  id: string;
  title: string;
  city: string;
  type: string;
  price: number;
  sellerType: string;
  status: ListingStatus;
  /** "user" للإعلانات المضافة من الموقع و"demo" للبيانات التجريبية */
  source: "user" | "demo";
}

/** مستخدم مسجّل داخل اللوحة */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  joinedAt: string;
}

/** طلب انضمام مطوّر عقاري */
export interface AdminDeveloper {
  id: string;
  company: string;
  owner: string;
  city: string;
  projects: number;
  verified: boolean;
  requestedAt: string;
}

/** تعديلات المدير على إعلان (تبقى في localStorage ولا تمسّ البيانات الأساسية) */
interface ListingOverride {
  status?: ListingStatus;
  title?: string;
  price?: number;
}

/* ============================ مفاتيح التخزين ============================ */

export const LISTING_OVERRIDE_KEY = "aqaar-admin-listing-overrides";
export const ADMIN_USERS_KEY = "aqaar-admin-users";
export const ADMIN_DEVELOPERS_KEY = "aqaar-admin-developers";

/* ============================ أدوات تخزين آمنة ============================ */

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // تجاهل أخطاء التخزين (الوضع الخاص أو امتلاء المساحة)
  }
}

/* ============================ الإعلانات ============================ */

/** حالات مبدئية للبيانات التجريبية حتى تُظهر اللوحة تنوّعاً في المراجعة */
const DEMO_PENDING = ["do-2", "mn-1", "gm-1"];
const DEMO_REJECTED = ["do-4"];

function defaultStatus(id: string): ListingStatus {
  if (DEMO_PENDING.includes(id)) return "pending";
  if (DEMO_REJECTED.includes(id)) return "rejected";
  return "approved";
}

function getOverrides(): Record<string, ListingOverride> {
  return readJson<Record<string, ListingOverride>>(LISTING_OVERRIDE_KEY, {});
}

/** إعلانات المستخدمين المخزّنة محلياً من صفحة "أضف عقارك" */
function getUserProperties(): Property[] {
  const raw = readJson<unknown>(USER_PROPERTIES_KEY, []);
  return Array.isArray(raw) ? (raw as Property[]) : [];
}

/** كل الإعلانات: إعلانات المستخدمين أولاً ثم البيانات التجريبية */
export function getListings(): AdminListing[] {
  const overrides = getOverrides();

  const toRow = (property: Property, source: AdminListing["source"]): AdminListing => {
    const override = overrides[property.id];
    return {
      id: property.id,
      title: override?.title ?? property.title,
      city: property.city,
      type: property.type,
      price: override?.price ?? property.price,
      sellerType: property.sellerType,
      status: override?.status ?? (source === "user" ? "pending" : defaultStatus(property.id)),
      source,
    };
  };

  return [
    ...getUserProperties().map((property) => toRow(property, "user")),
    ...mockProperties.map((property) => toRow(property, "demo")),
  ];
}

/** تحديث حالة أو بيانات إعلان معيّن */
export function saveListingOverride(id: string, patch: ListingOverride): void {
  const overrides = getOverrides();
  writeJson(LISTING_OVERRIDE_KEY, {
    ...overrides,
    [id]: { ...overrides[id], ...patch },
  });
}

/* ============================ المستخدمون ============================ */

const SEED_USERS: AdminUser[] = [
  {
    id: "u-1",
    name: "محمود السيد الشريف",
    email: "admin@aqaar-alsahel.com",
    phone: "201012345678",
    role: "super_admin",
    active: true,
    joinedAt: "2026-01-12",
  },
  {
    id: "u-2",
    name: "هبة عبد الرحمن",
    email: "heba.moderator@aqaar-alsahel.com",
    phone: "201098765432",
    role: "moderator",
    active: true,
    joinedAt: "2026-02-03",
  },
  {
    id: "u-3",
    name: "شركة الدلتا للتطوير العقاري",
    email: "sales@delta-dev.com",
    phone: "201155667788",
    role: "agent",
    active: true,
    joinedAt: "2026-02-19",
  },
  {
    id: "u-4",
    name: "كريم فتحي الدسوقي",
    email: "karim.fathy@gmail.com",
    phone: "201221144556",
    role: "agent",
    active: false,
    joinedAt: "2026-03-08",
  },
  {
    id: "u-5",
    name: "منى إبراهيم سلامة",
    email: "mona.ibrahim@outlook.com",
    phone: "201006677889",
    role: "user",
    active: true,
    joinedAt: "2026-03-27",
  },
  {
    id: "u-6",
    name: "أحمد جمال الدين",
    email: "ahmed.gamal@yahoo.com",
    phone: "201288990011",
    role: "user",
    active: true,
    joinedAt: "2026-04-02",
  },
];

export function getUsers(): AdminUser[] {
  const stored = readJson<AdminUser[]>(ADMIN_USERS_KEY, []);
  return stored.length > 0 ? stored : SEED_USERS;
}

export function saveUsers(users: AdminUser[]): void {
  writeJson(ADMIN_USERS_KEY, users);
}

/* ============================ المطورون العقاريون ============================ */

const SEED_DEVELOPERS: AdminDeveloper[] = [
  {
    id: "d-1",
    company: "شركة الدلتا للتطوير العقاري",
    owner: "م. طارق الدلتا",
    city: "دمياط الجديدة",
    projects: 4,
    verified: true,
    requestedAt: "2026-01-20",
  },
  {
    id: "d-2",
    company: "مجموعة الساحل للاستثمار",
    owner: "م. رانيا البحر",
    city: "رأس البر",
    projects: 3,
    verified: true,
    requestedAt: "2026-02-06",
  },
  {
    id: "d-3",
    company: "المنصورة الحديثة للتطوير",
    owner: "م. عمرو الشرقاوي",
    city: "المنصورة الجديدة",
    projects: 2,
    verified: false,
    requestedAt: "2026-03-15",
  },
  {
    id: "d-4",
    company: "نماء فارسكور للعقارات",
    owner: "م. سامح عبد الله",
    city: "فارسكور",
    projects: 1,
    verified: false,
    requestedAt: "2026-04-09",
  },
];

export function getDevelopers(): AdminDeveloper[] {
  const stored = readJson<AdminDeveloper[]>(ADMIN_DEVELOPERS_KEY, []);
  return stored.length > 0 ? stored : SEED_DEVELOPERS;
}

export function saveDevelopers(developers: AdminDeveloper[]): void {
  writeJson(ADMIN_DEVELOPERS_KEY, developers);
}
