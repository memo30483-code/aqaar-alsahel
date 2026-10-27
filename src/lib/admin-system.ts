/**
 * نظام إدارة شامل للموقع - عقار FAMILY
 * يدعم الصلاحيات المخصصة، إعدادات الموقع، العروض، البانرات، وسجل النشاطات
 */

import type { Property, PropertyDocument } from "@/types/property";
import type { UserRole } from "@/lib/session";
import { mockProperties, USER_PROPERTIES_KEY } from "@/data/properties";

export type ListingStatus = "pending" | "approved" | "rejected" | "archived" | "deleted";
export type OfferType = "property_linked" | "general" | "custom";
export type BlockKey =
  | "hero"
  | "verify_strip"
  | "marquee"
  | "featured_listings"
  | "projects_slider"
  | "ad_slider"
  | "inline_ad"
  | "ad_band"
  | "story_dossier"
  | "manage_note";

export interface Permission {
  id: string;
  key: string;
  labelAr: string;
  labelEn: string;
  category: "listings" | "users" | "offers" | "site" | "banners" | "logs" | "settings";
}

export interface AdminPermissionSet {
  adminId: string;
  permissions: string[];
  updatedAt: string;
  updatedBy: string;
}

export interface ListingAction {
  id: string;
  listingId: string;
  action: "approved" | "rejected" | "archived" | "unarchived" | "deleted" | "restored" | "replaced" | "assigned" | "featured" | "unfeatured" | "edited";
  performedBy: string;
  performedByName: string;
  performedByRole: UserRole;
  note?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface AdminListing {
  id: string;
  title: string;
  city: string;
  type: string;
  price: number;
  sellerType: string;
  status: ListingStatus;
  source: "user" | "demo";
  /** رقم متابعة الطلب الذي ظهر لصاحب العقار */
  reference?: string;
  submittedAt?: string;
  /** المستندات المرفقة بالطلب — لا تُعرض للجمهور */
  documents?: PropertyDocument[];
  addedBy?: string;
  addedByName?: string;
  assignedTo?: string;
  assignedToName?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  featuredByAdmin?: boolean;
  replacedBy?: string;
  replacementNote?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  active: boolean;
  joinedAt: string;
  customPermissions?: string[];
}

export interface AdminDeveloper {
  id: string;
  company: string;
  owner: string;
  city: string;
  projects: number;
  verified: boolean;
  requestedAt: string;
}

export interface SiteBlockSettings {
  key: BlockKey;
  enabled: boolean;
  order: number;
}

export interface SiteSettings {
  blocks: SiteBlockSettings[];
  managementPhone: string;
  managementEmail: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
  footerTextAr?: string;
  footerTextEn?: string;
}

export interface Offer {
  id: string;
  titleAr: string;
  titleEn?: string;
  descriptionAr: string;
  descriptionEn?: string;
  type: OfferType;
  propertyId?: string;
  propertyTitle?: string;
  discountPercent?: number;
  oldPrice?: number;
  newPrice?: number;
  image?: string;
  badgeTextAr?: string;
  badgeTextEn?: string;
  startDate?: string;
  endDate?: string;
  enabled: boolean;
  order: number;
  isSeasonal?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OffersSettings {
  enabled: boolean;
  seasonal: boolean;
  startDate?: string;
  endDate?: string;
  showInHeader: boolean;
  showFloatingBanner: boolean;
  pageTitleAr: string;
  pageTitleEn: string;
  pageDescAr: string;
  pageDescEn: string;
  disabledMessageAr: string;
  disabledMessageEn: string;
  bannerTitleAr: string;
  bannerTitleEn: string;
  bannerSubtitleAr: string;
  bannerSubtitleEn: string;
  bannerCtaAr: string;
  bannerCtaEn: string;
}

export interface MarqueeItem {
  id: string;
  textAr: string;
  textEn: string;
  type: "news" | "partner" | "ad";
  enabled: boolean;
  order: number;
  link?: string;
}

export interface AdminLog {
  id: string;
  action: string;
  category: "listings" | "users" | "offers" | "site" | "banners" | "auth" | "settings";
  performedBy: string;
  performedByName: string;
  performedByRole: UserRole;
  details: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export const LISTING_OVERRIDE_KEY = "aqaar-admin-listing-overrides-v2";
export const ADMIN_USERS_KEY = "aqaar-admin-users-v2";
export const ADMIN_DEVELOPERS_KEY = "aqaar-admin-developers-v2";
export const PERMISSIONS_KEY = "aqaar-admin-permissions";
export const SITE_SETTINGS_KEY = "aqaar-site-settings";
export const OFFERS_KEY = "aqaar-offers";
export const OFFERS_SETTINGS_KEY = "aqaar-offers-settings";
export const MARQUEE_KEY = "aqaar-marquee-items";
export const ADMIN_LOGS_KEY = "aqaar-admin-logs";
export const LISTING_ACTIONS_KEY = "aqaar-listing-actions";

export const ALL_PERMISSIONS: Permission[] = [
  { id: "p1", key: "listings.view", labelAr: "عرض الإعلانات", labelEn: "View Listings", category: "listings" },
  { id: "p2", key: "listings.approve", labelAr: "موافقة على الإعلانات", labelEn: "Approve Listings", category: "listings" },
  { id: "p3", key: "listings.reject", labelAr: "رفض الإعلانات", labelEn: "Reject Listings", category: "listings" },
  { id: "p4", key: "listings.edit", labelAr: "تعديل الإعلانات", labelEn: "Edit Listings", category: "listings" },
  { id: "p5", key: "listings.archive", labelAr: "أرشفة الإعلانات", labelEn: "Archive Listings", category: "listings" },
  { id: "p6", key: "listings.delete", labelAr: "حذف الإعلانات نهائياً", labelEn: "Delete Listings Permanently", category: "listings" },
  { id: "p7", key: "listings.restore", labelAr: "استعادة/إعادة نشر", labelEn: "Restore/Republish", category: "listings" },
  { id: "p8", key: "listings.replace", labelAr: "استبدال إعلان بآخر", labelEn: "Replace Listing", category: "listings" },
  { id: "p9", key: "listings.assign", labelAr: "تعيين مسئول للإعلان", labelEn: "Assign Manager", category: "listings" },
  { id: "p10", key: "listings.feature", labelAr: "تمييز الإعلانات", labelEn: "Feature Listings", category: "listings" },
  { id: "p11", key: "users.view", labelAr: "عرض المستخدمين", labelEn: "View Users", category: "users" },
  { id: "p12", key: "users.manage", labelAr: "إدارة المستخدمين والصلاحيات", labelEn: "Manage Users & Permissions", category: "users" },
  { id: "p13", key: "users.roles", labelAr: "تحديد الأدوار يدوياً", labelEn: "Assign Roles Manually", category: "users" },
  { id: "p14", key: "offers.view", labelAr: "عرض العروض", labelEn: "View Offers", category: "offers" },
  { id: "p15", key: "offers.manage", labelAr: "إدارة العروض كاملة", labelEn: "Manage Offers Completely", category: "offers" },
  { id: "p16", key: "offers.publish", labelAr: "تفعيل/إيقاف صفحة العروض", labelEn: "Toggle Offers Page", category: "offers" },
  { id: "p17", key: "site.blocks", labelAr: "تحكم بلوكات الرئيسية", labelEn: "Control Homepage Blocks", category: "site" },
  { id: "p18", key: "site.settings", labelAr: "إعدادات الموقع العامة", labelEn: "General Site Settings", category: "site" },
  { id: "p19", key: "site.contact", labelAr: "تعديل بيانات إدارة الموقع", labelEn: "Edit Management Contact", category: "site" },
  { id: "p20", key: "banners.manage", labelAr: "إدارة البنرات والشريط المتحرك", labelEn: "Manage Banners & Marquee", category: "banners" },
  { id: "p21", key: "logs.view", labelAr: "عرض سجل النشاطات", labelEn: "View Activity Logs", category: "logs" },
  { id: "p22", key: "settings.full", labelAr: "تحكم كامل في كل الإعدادات", labelEn: "Full Control of All Settings", category: "settings" },
];

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: ALL_PERMISSIONS.map(p => p.key),
  admin: [
    "listings.view", "listings.approve", "listings.reject", "listings.edit", 
    "listings.archive", "listings.delete", "listings.restore", "listings.replace", 
    "listings.assign", "listings.feature",
    "users.view", "users.manage", "users.roles",
    "offers.view", "offers.manage", "offers.publish",
    "site.blocks", "site.settings", "site.contact",
    "banners.manage",
    "logs.view"
  ],
  moderator: [
    "listings.view", "listings.approve", "listings.reject", "listings.edit", 
    "listings.archive", "listings.assign", "listings.feature",
    "offers.view", "offers.manage"
  ],
  agent: ["listings.view"],
  user: [],
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  blocks: [
    { key: "hero", enabled: true, order: 1 },
    { key: "verify_strip", enabled: true, order: 2 },
    { key: "marquee", enabled: true, order: 3 },
    { key: "featured_listings", enabled: true, order: 4 },
    { key: "ad_band", enabled: true, order: 5 },
    { key: "projects_slider", enabled: true, order: 6 },
    { key: "ad_slider", enabled: true, order: 7 },
    { key: "inline_ad", enabled: true, order: 8 },
    { key: "story_dossier", enabled: true, order: 10 },
    { key: "manage_note", enabled: true, order: 11 },
  ],
  managementPhone: "+20 100 123 4567",
  managementEmail: "info@aqarfamily.com",
};

export const DEFAULT_OFFERS_SETTINGS: OffersSettings = {
  enabled: false,
  seasonal: true,
  startDate: "",
  endDate: "",
  showInHeader: true,
  showFloatingBanner: true,
  pageTitleAr: "العروض والتخفيضات",
  pageTitleEn: "Offers & Discounts",
  pageDescAr: "أحدث العروض والتخفيضات الموسمية على العقارات",
  pageDescEn: "Latest seasonal offers and discounts on properties",
  disabledMessageAr: "لا توجد عروض متاحة حالياً، يرجى متابعة الموقع لاحقاً",
  disabledMessageEn: "No offers available currently, please check back later",
  bannerTitleAr: "عروض وتخفيضات موسمية",
  bannerTitleEn: "Seasonal Offers & Discounts",
  bannerSubtitleAr: "اضغط هنا لمشاهدة أحدث العروض",
  bannerSubtitleEn: "Click here to view latest offers",
  bannerCtaAr: "شوف العروض",
  bannerCtaEn: "View Offers",
};

export const DEFAULT_MARQUEE: MarqueeItem[] = [
  { id: "m1", textAr: "شركاء النجاح", textEn: "Success Partners", type: "partner", enabled: true, order: 1 },
  { id: "m2", textAr: "أخبار السوق العقاري", textEn: "Real Estate Market News", type: "news", enabled: true, order: 2 },
  { id: "m3", textAr: "إعلان - مساحات إعلانية متاحة", textEn: "Ad - Advertising Spaces Available", type: "ad", enabled: true, order: 3 },
];

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
  } catch {}
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getAdminPermissions(adminId: string): string[] {
  const all = readJson<AdminPermissionSet[]>(PERMISSIONS_KEY, []);
  const found = all.find(p => p.adminId === adminId);
  return found ? found.permissions : [];
}

export function saveAdminPermissions(adminId: string, permissions: string[], updatedBy: string): void {
  const all = readJson<AdminPermissionSet[]>(PERMISSIONS_KEY, []);
  const existing = all.findIndex(p => p.adminId === adminId);
  const entry: AdminPermissionSet = {
    adminId,
    permissions,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  if (existing >= 0) {
    all[existing] = entry;
  } else {
    all.push(entry);
  }
  writeJson(PERMISSIONS_KEY, all);
}

export function hasPermission(
  userRole: UserRole | undefined,
  userId: string | undefined,
  permissionKey: string
): boolean {
  if (!userRole) return false;
  if (userRole === "super_admin" || userRole === "admin") return true;
  const custom = userId ? getAdminPermissions(userId) : [];
  if (custom.includes(permissionKey) || custom.includes("settings.full")) return true;
  const defaults = DEFAULT_ROLE_PERMISSIONS[userRole] || [];
  return defaults.includes(permissionKey);
}

export function getEffectivePermissions(userRole: UserRole | undefined, userId: string | undefined): string[] {
  if (!userRole) return [];
  if (userRole === "super_admin" || userRole === "admin") return ALL_PERMISSIONS.map(p => p.key);
  const custom = userId ? getAdminPermissions(userId) : [];
  const defaults = DEFAULT_ROLE_PERMISSIONS[userRole] || [];
  return Array.from(new Set([...defaults, ...custom]));
}

export function addAdminLog(log: Omit<AdminLog, "id" | "timestamp">): void {
  const logs = readJson<AdminLog[]>(ADMIN_LOGS_KEY, []);
  const entry: AdminLog = {
    ...log,
    id: generateId("log"),
    timestamp: new Date().toISOString(),
  };
  logs.unshift(entry);
  if (logs.length > 1000) logs.splice(1000);
  writeJson(ADMIN_LOGS_KEY, logs);
}

export function getAdminLogs(limit = 100): AdminLog[] {
  const logs = readJson<AdminLog[]>(ADMIN_LOGS_KEY, []);
  return logs.slice(0, limit);
}

export function getSiteSettings(): SiteSettings {
  const stored = readJson<SiteSettings>(SITE_SETTINGS_KEY, DEFAULT_SITE_SETTINGS);
  if (!stored.blocks || stored.blocks.length === 0) {
    return DEFAULT_SITE_SETTINGS;
  }
  /* دمج البلوكات الجديدة مع المحفوظة (مع الاحتفاظ بحالة التفعيل والترتيب) */
  const blocks = DEFAULT_SITE_SETTINGS.blocks.map((block) => {
    const saved = stored.blocks.find((item) => item.key === block.key);
    return saved ? { ...block, enabled: saved.enabled, order: saved.order } : block;
  });
  return { ...DEFAULT_SITE_SETTINGS, ...stored, blocks };
}

export function saveSiteSettings(settings: SiteSettings): void {
  writeJson(SITE_SETTINGS_KEY, settings);
}

/** هل بلوك الصفحة الرئيسية مفعّل؟ (افتراضياً مفعّل لو مفيش إعدادات) */
export function isBlockEnabled(key: BlockKey): boolean {
  if (typeof window === "undefined") return true;
  const settings = getSiteSettings();
  const block = settings.blocks.find((item) => item.key === key);
  return block ? block.enabled : true;
}

/** ترتيب بلوك الصفحة الرئيسية حسب إعدادات الأدمن */
export function blockOrder(key: BlockKey): number {
  if (typeof window === "undefined") {
    const fallback = DEFAULT_SITE_SETTINGS.blocks.find((item) => item.key === key);
    return fallback?.order ?? 99;
  }
  const settings = getSiteSettings();
  const block = settings.blocks.find((item) => item.key === key);
  return block?.order ?? 99;
}

export function getOffersSettings(): OffersSettings {
  const stored = readJson<OffersSettings>(OFFERS_SETTINGS_KEY, DEFAULT_OFFERS_SETTINGS);
  return { ...DEFAULT_OFFERS_SETTINGS, ...stored };
}

export function saveOffersSettings(settings: OffersSettings): void {
  writeJson(OFFERS_SETTINGS_KEY, settings);
}

export function getOffers(): Offer[] {
  return readJson<Offer[]>(OFFERS_KEY, []);
}

export function saveOffers(offers: Offer[]): void {
  writeJson(OFFERS_KEY, offers);
}

export function addOffer(offer: Omit<Offer, "id" | "createdAt" | "updatedAt">): Offer {
  const offers = getOffers();
  const newOffer: Offer = {
    ...offer,
    id: generateId("offer"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  offers.push(newOffer);
  saveOffers(offers);
  return newOffer;
}

export function updateOffer(id: string, patch: Partial<Offer>): void {
  const offers = getOffers();
  const idx = offers.findIndex(o => o.id === id);
  if (idx >= 0) {
    offers[idx] = { ...offers[idx], ...patch, updatedAt: new Date().toISOString() };
    saveOffers(offers);
  }
}

export function deleteOffer(id: string): void {
  const offers = getOffers().filter(o => o.id !== id);
  saveOffers(offers);
}

export function isOffersPageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const settings = getOffersSettings();
  if (!settings.enabled) return false;
  if (settings.seasonal && settings.startDate && settings.endDate) {
    const now = new Date();
    const start = new Date(settings.startDate);
    const end = new Date(settings.endDate);
    end.setHours(23, 59, 59, 999);
    if (now < start || now > end) return false;
  }
  const offers = getOffers();
  const now = new Date();
  const active = offers.filter(o => {
    if (!o.enabled) return false;
    if (o.startDate && new Date(o.startDate) > now) return false;
    if (o.endDate) {
      const end = new Date(o.endDate);
      end.setHours(23, 59, 59, 999);
      if (end < now) return false;
    }
    return true;
  });
  return active.length > 0;
}

export function getActiveOffers(): Offer[] {
  if (typeof window === "undefined") return [];
  const settings = getOffersSettings();
  if (!settings.enabled) return [];
  if (settings.seasonal && settings.startDate && settings.endDate) {
    const now = new Date();
    const start = new Date(settings.startDate);
    const end = new Date(settings.endDate);
    end.setHours(23, 59, 59, 999);
    if (now < start || now > end) return [];
  }
  const offers = getOffers();
  const now = new Date();
  return offers
    .filter(o => {
      if (!o.enabled) return false;
      if (o.startDate && new Date(o.startDate) > now) return false;
      if (o.endDate) {
        const end = new Date(o.endDate);
        end.setHours(23, 59, 59, 999);
        if (end < now) return false;
      }
      return true;
    })
    .sort((a, b) => a.order - b.order);
}

export function getMarqueeItems(): MarqueeItem[] {
  const stored = readJson<MarqueeItem[]>(MARQUEE_KEY, DEFAULT_MARQUEE);
  return stored.length > 0 ? stored : DEFAULT_MARQUEE;
}

export function saveMarqueeItems(items: MarqueeItem[]): void {
  writeJson(MARQUEE_KEY, items);
}

export function addListingAction(action: Omit<ListingAction, "id" | "timestamp">): void {
  const actions = readJson<ListingAction[]>(LISTING_ACTIONS_KEY, []);
  const entry: ListingAction = {
    ...action,
    id: generateId("la"),
    timestamp: new Date().toISOString(),
  };
  actions.unshift(entry);
  if (actions.length > 2000) actions.splice(2000);
  writeJson(LISTING_ACTIONS_KEY, actions);
}

export function getListingActions(listingId?: string): ListingAction[] {
  const actions = readJson<ListingAction[]>(LISTING_ACTIONS_KEY, []);
  if (listingId) return actions.filter(a => a.listingId === listingId);
  return actions.slice(0, 200);
}

interface ListingOverride {
  status?: ListingStatus;
  title?: string;
  price?: number;
  featuredByAdmin?: boolean;
  assignedTo?: string;
  assignedToName?: string;
}

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

function getUserProperties(): Property[] {
  const raw = readJson<unknown>(USER_PROPERTIES_KEY, []);
  return Array.isArray(raw) ? (raw as Property[]) : [];
}

export function getListings(): AdminListing[] {
  const overrides = getOverrides();
  const actions = getListingActions();

  const toRow = (property: Property, source: AdminListing["source"]): AdminListing => {
    const override = overrides[property.id];
    const latestApproval = actions.find(a => a.listingId === property.id && a.action === "approved");
    return {
      id: property.id,
      title: override?.title ?? property.title,
      city: property.city,
      type: property.type,
      price: override?.price ?? property.price,
      sellerType: property.sellerType,
      status: override?.status ?? (source === "user" ? "pending" : defaultStatus(property.id)),
      source,
      addedBy: source === "user" ? "user" : "demo",
      addedByName: source === "user" ? "مستخدم الموقع" : "بيانات تجريبية",
      assignedTo: override?.assignedTo,
      assignedToName: override?.assignedToName,
      approvedBy: latestApproval?.performedByName,
      approvedAt: latestApproval?.timestamp,
      featuredByAdmin: override?.featuredByAdmin || false,
      reference: property.reference,
      submittedAt: property.submittedAt,
      documents: property.documents,
    };
  };

  return [
    ...getUserProperties().map((property) => toRow(property, "user")),
    ...mockProperties.map((property) => toRow(property, "demo")),
  ];
}

/** معرّفات الإعلانات المنشورة فعلياً — بعد موافقة الإدارة فقط */
export function getApprovedListingIds(): string[] {
  return getListings()
    .filter((listing) => listing.status === "approved")
    .map((listing) => listing.id);
}

export function saveListingOverride(id: string, patch: ListingOverride): void {
  const overrides = getOverrides();
  writeJson(LISTING_OVERRIDE_KEY, {
    ...overrides,
    [id]: { ...overrides[id], ...patch },
  });
}

const SEED_USERS: AdminUser[] = [
  { id: "u-1", name: "مدير النظام العام", email: "admin@aqaar.com", phone: "201012345678", role: "super_admin", active: true, joinedAt: "2026-01-12" },
  { id: "u-2", name: "هبة محمد - مشرف إعلانات", email: "heba.moderator@aqarfamily.com", phone: "201098765432", role: "moderator", active: true, joinedAt: "2026-02-03" },
  { id: "u-3", name: "شركة دلتا للتطوير العقاري", email: "sales@delta-dev.com", phone: "201155667788", role: "agent", active: true, joinedAt: "2026-02-19" },
];

export function getUsers(): AdminUser[] {
  const stored = readJson<AdminUser[]>(ADMIN_USERS_KEY, []);
  return stored.length > 0 ? stored : SEED_USERS;
}

export function saveUsers(users: AdminUser[]): void {
  writeJson(ADMIN_USERS_KEY, users);
}

const SEED_DEVELOPERS: AdminDeveloper[] = [
  { id: "d-1", company: "شركة النيل للتطوير العقاري", owner: "د. أحمد محمود", city: "دمياط الجديدة", projects: 4, verified: true, requestedAt: "2026-01-20" },
  { id: "d-2", company: "مجموعة الساحل للتطوير", owner: "م. محمد علي", city: "رأس البر", projects: 3, verified: true, requestedAt: "2026-02-06" },
];

export function getDevelopers(): AdminDeveloper[] {
  const stored = readJson<AdminDeveloper[]>(ADMIN_DEVELOPERS_KEY, []);
  return stored.length > 0 ? stored : SEED_DEVELOPERS;
}

export function saveDevelopers(developers: AdminDeveloper[]): void {
  writeJson(ADMIN_DEVELOPERS_KEY, developers);
}
