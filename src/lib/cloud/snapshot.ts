"use client";

/**
 * جمع نسخة كاملة من الحالة الحالية لرفعها أول مرة إلى Supabase.
 *
 * بعض أقسام المنصة تستخدم قيمًا افتراضية من الكود ولا تكتبها في
 * localStorage إلا بعد أول تعديل. لذلك لا يكفي رفع المفاتيح الموجودة فقط؛
 * هذه الدالة تجمع القيم الفعلية التي يراها الأدمن حتى قبل أي تعديل.
 */

import {
  ADMIN_DEVELOPERS_KEY,
  ADMIN_LOGS_KEY,
  ADMIN_USERS_KEY,
  LISTING_ACTIONS_KEY,
  LISTING_OVERRIDE_KEY,
  MARQUEE_KEY,
  OFFERS_KEY,
  OFFERS_SETTINGS_KEY,
  PERMISSIONS_KEY,
  SITE_SETTINGS_KEY,
  getAdminLogs,
  getDevelopers,
  getListingActions,
  getMarqueeItems,
  getOffers,
  getOffersSettings,
  getSiteSettings,
  getUsers,
} from "@/lib/admin-system";
import { CITIES_KEY, getCities } from "@/lib/cities-store";
import { COMPANIES_KEY, getCompanies } from "@/lib/company-store";
import {
  PROFESSIONAL_REQUESTS_KEY,
  PROFESSIONALS_KEY,
  getProfessionalRequests,
  getProfessionals,
} from "@/lib/professionals-store";
import {
  ADD_PROPERTY_FIELDS_KEY,
  ADD_PROPERTY_OPTIONS_KEY,
  getAddPropertyFieldSettings,
  getAddPropertyOptions,
} from "@/lib/add-property-fields";
import {
  LEGACY_HOME_KEY,
  PAGE_BUILDER_KEY,
  PAGE_REGISTRY,
  getPageBlocks,
  getPageStyle,
} from "@/lib/page-builder-store";
import { USER_PROPERTIES_KEY } from "@/data/properties";
import { CRM_KEY } from "@/lib/crm-types";
import { getCrmLeads } from "@/lib/crm-store";
import { CLOUD_KEYS } from "./keys";

export interface CloudSnapshotEntry {
  key: string;
  value: unknown;
}

function readLocal(key: string): unknown | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function pageBuilderSnapshot(): unknown {
  const existing = readLocal(PAGE_BUILDER_KEY);
  if (existing !== undefined) return existing;

  const pages: Record<string, { items: unknown[]; style?: unknown }> = {};
  for (const page of PAGE_REGISTRY) {
    const style = getPageStyle(page.id);
    pages[page.id] = {
      items: getPageBlocks(page.id),
      ...(style ? { style } : {}),
    };
  }
  return { pages };
}

/** القيم الموجودة محليًا تتقدّم دائمًا على الافتراضيات المجمّعة. */
function current(key: string, fallback: unknown): unknown {
  const local = readLocal(key);
  return local === undefined ? fallback : local;
}

export function collectCloudSnapshot(): CloudSnapshotEntry[] {
  if (typeof window === "undefined") return [];

  const values = new Map<string, unknown>([
    [SITE_SETTINGS_KEY, current(SITE_SETTINGS_KEY, getSiteSettings())],
    [CITIES_KEY, current(CITIES_KEY, getCities())],
    [COMPANIES_KEY, current(COMPANIES_KEY, getCompanies())],
    [ADMIN_DEVELOPERS_KEY, current(ADMIN_DEVELOPERS_KEY, getDevelopers())],
    [OFFERS_KEY, current(OFFERS_KEY, getOffers())],
    [OFFERS_SETTINGS_KEY, current(OFFERS_SETTINGS_KEY, getOffersSettings())],
    [MARQUEE_KEY, current(MARQUEE_KEY, getMarqueeItems())],
    [PROFESSIONALS_KEY, current(PROFESSIONALS_KEY, getProfessionals())],
    [
      PROFESSIONAL_REQUESTS_KEY,
      current(PROFESSIONAL_REQUESTS_KEY, getProfessionalRequests()),
    ],
    [PAGE_BUILDER_KEY, pageBuilderSnapshot()],
    [
      ADD_PROPERTY_FIELDS_KEY,
      current(ADD_PROPERTY_FIELDS_KEY, getAddPropertyFieldSettings()),
    ],
    [
      ADD_PROPERTY_OPTIONS_KEY,
      current(ADD_PROPERTY_OPTIONS_KEY, getAddPropertyOptions()),
    ],
    [LISTING_OVERRIDE_KEY, current(LISTING_OVERRIDE_KEY, {})],
    [USER_PROPERTIES_KEY, current(USER_PROPERTIES_KEY, [])],
    [ADMIN_USERS_KEY, current(ADMIN_USERS_KEY, getUsers())],
    [PERMISSIONS_KEY, current(PERMISSIONS_KEY, [])],
    [ADMIN_LOGS_KEY, current(ADMIN_LOGS_KEY, getAdminLogs(1000))],
    [LISTING_ACTIONS_KEY, current(LISTING_ACTIONS_KEY, getListingActions())],
    [CRM_KEY, current(CRM_KEY, { items: getCrmLeads() })],
  ]);

  /* المفتاح القديم يُرفع فقط إن كان موجودًا، لتسهيل ترحيل مواقع سابقة. */
  const legacyHome = readLocal(LEGACY_HOME_KEY);
  if (legacyHome !== undefined) values.set(LEGACY_HOME_KEY, legacyHome);

  return Array.from(values.entries())
    .filter(([key]) => Object.prototype.hasOwnProperty.call(CLOUD_KEYS, key))
    .map(([key, value]) => ({ key, value }));
}
