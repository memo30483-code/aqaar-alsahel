/**
 * سجل بيانات الشركة المالكة للمنصة — مصدر الحقيقة الوحيد لبيانات الكيان
 * القانوني والتجاري الظاهرة للزوار (الفوتر، صفحة بيانات الشركة، الصفحات القانونية).
 *
 * التخزين حالياً في localStorage بنفس أسلوب بقية المنصة، وبنيته
 * (`{ items: CompanyRecord[] }`) جاهزة للترحيل إلى قاعدة بيانات لاحقاً.
 */
import { useEffect, useMemo, useState } from "react";

export interface CompanyLicense {
  id: string;
  /** اسم الترخيص/السجل مثل «السجل التجاري» أو «ترخيص إعلاني» */
  name: string;
  number: string;
  issuer?: string;
  issuedAt?: string;
  expiresAt?: string;
  /** رابط صورة/ملف الترخيص (اختياري) */
  url?: string;
}

export interface CompanyRecord {
  id: string;
  /** ظاهرة للزوار أو مخفية */
  active: boolean;
  /** الشركة المالكة الرئيسية — تُعرض في الفوتر وصفحة البيانات */
  primary: boolean;
  legalNameAr: string;
  legalNameEn: string;
  tradeNameAr: string;
  tradeNameEn: string;
  /** رقم السجل التجاري */
  commercialRegister: string;
  /** رقم البطاقة الضريبية */
  taxCard: string;
  addressAr: string;
  addressEn: string;
  phones: string[];
  emails: string[];
  website?: string;
  workingHoursAr: string;
  workingHoursEn: string;
  aboutAr: string;
  aboutEn: string;
  logoUrl?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  licenses: CompanyLicense[];
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export const COMPANIES_KEY = "aqaar-company-info";
export const COMPANIES_EVENT = "aqaar:company-info";

const DEFAULT_COMPANY_ID = "aqaar-family-owner";

/** بيانات افتراضية قابلة للتعديل بالكامل من لوحة التحكم */
export const DEFAULT_COMPANIES: CompanyRecord[] = [
  {
    id: DEFAULT_COMPANY_ID,
    active: true,
    primary: true,
    legalNameAr: "شركة عقار فاميلي للاستثمار العقاري",
    legalNameEn: "Aqaar Family Real Estate Investment",
    tradeNameAr: "عقار FAMILY",
    tradeNameEn: "Aqaar FAMILY",
    commercialRegister: "",
    taxCard: "",
    addressAr: "دمياط الجديدة — محافظة دمياط، مصر",
    addressEn: "New Damietta — Damietta Governorate, Egypt",
    phones: ["+20 100 123 4567"],
    emails: ["info@aqarfamily.com"],
    website: "",
    workingHoursAr: "السبت – الخميس · 9 ص إلى 6 م",
    workingHoursEn: "Sat – Thu · 9 AM to 6 PM",
    aboutAr:
      "الشركة المالكة والمشغّلة لمنصة عقار FAMILY — منصة تنظيمية وتوثيقية للعروض العقارية في مدن الدلتا، تعمل على التحقق من الملكية وسلامة المستندات قبل نشر أي إعلان.",
    aboutEn:
      "The owner and operator of Aqaar FAMILY — an organizing and verification platform for property listings across the Delta cities, verifying ownership and documents before any listing is published.",
    logoUrl: "",
    facebook: "",
    instagram: "",
    x: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
    licenses: [],
    order: 1,
  },
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function cloneDefaults(): CompanyRecord[] {
  return DEFAULT_COMPANIES.map((company) => ({
    ...company,
    phones: [...company.phones],
    emails: [...company.emails],
    licenses: company.licenses.map((license) => ({ ...license })),
  }));
}

function toText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeLicense(raw: unknown, index: number): CompanyLicense | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<CompanyLicense>;
  const name = toText(item.name).trim();
  const number = toText(item.number).trim();
  if (!name && !number) return null;
  return {
    id: toText(item.id) || `license-${index + 1}`,
    name: name || "ترخيص",
    number,
    issuer: toText(item.issuer).trim() || undefined,
    issuedAt: toText(item.issuedAt).trim() || undefined,
    expiresAt: toText(item.expiresAt).trim() || undefined,
    url: toText(item.url).trim() || undefined,
  };
}

function normalizeCompany(raw: Partial<CompanyRecord>, index: number): CompanyRecord {
  const legalNameAr = toText(raw.legalNameAr).trim();
  const tradeNameAr = toText(raw.tradeNameAr).trim();
  return {
    id: toText(raw.id) || `company-${index + 1}`,
    active: raw.active !== false,
    primary: raw.primary === true,
    legalNameAr,
    legalNameEn: toText(raw.legalNameEn).trim() || legalNameAr,
    tradeNameAr,
    tradeNameEn: toText(raw.tradeNameEn).trim() || tradeNameAr,
    commercialRegister: toText(raw.commercialRegister).trim(),
    taxCard: toText(raw.taxCard).trim(),
    addressAr: toText(raw.addressAr).trim(),
    addressEn: toText(raw.addressEn).trim(),
    phones: toStringArray(raw.phones),
    emails: toStringArray(raw.emails),
    website: toText(raw.website).trim() || undefined,
    workingHoursAr: toText(raw.workingHoursAr).trim(),
    workingHoursEn: toText(raw.workingHoursEn).trim(),
    aboutAr: toText(raw.aboutAr).trim(),
    aboutEn: toText(raw.aboutEn).trim(),
    logoUrl: toText(raw.logoUrl).trim() || undefined,
    facebook: toText(raw.facebook).trim() || undefined,
    instagram: toText(raw.instagram).trim() || undefined,
    x: toText(raw.x).trim() || undefined,
    linkedin: toText(raw.linkedin).trim() || undefined,
    youtube: toText(raw.youtube).trim() || undefined,
    tiktok: toText(raw.tiktok).trim() || undefined,
    licenses: Array.isArray(raw.licenses)
      ? raw.licenses
          .map((license, position) => normalizeLicense(license, position))
          .filter((license): license is CompanyLicense => license !== null)
      : [],
    order: Number.isFinite(raw.order) ? Number(raw.order) : index + 1,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function readStored(): CompanyRecord[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(COMPANIES_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as CompanyRecord[];
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return (parsed as { items: CompanyRecord[] }).items;
    }
    return [];
  } catch {
    return null;
  }
}

function sortCompanies(companies: CompanyRecord[]): CompanyRecord[] {
  return [...companies].sort((a, b) => {
    if (a.primary !== b.primary) return a.primary ? -1 : 1;
    if (a.order !== b.order) return a.order - b.order;
    return a.legalNameAr.localeCompare(b.legalNameAr, "ar");
  });
}

/** كل الشركات المسجّلة (ظاهرة ومخفية) */
export function getCompanies(): CompanyRecord[] {
  const stored = readStored();
  if (stored === null) return cloneDefaults();
  return sortCompanies(
    stored
      .map(normalizeCompany)
      .filter((company) => company.legalNameAr || company.tradeNameAr)
  );
}

/** الشركات الظاهرة للزوار */
export function getActiveCompanies(): CompanyRecord[] {
  return getCompanies().filter((company) => company.active);
}

/** الشركة المالكة الرئيسية الظاهرة — أو أول شركة ظاهرة */
export function getPrimaryCompany(): CompanyRecord | null {
  const active = getActiveCompanies();
  return active.find((company) => company.primary) ?? active[0] ?? null;
}

export function saveCompanies(companies: CompanyRecord[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      COMPANIES_KEY,
      JSON.stringify({ items: companies, updatedAt: new Date().toISOString() })
    );
  } catch {
    return;
  }
  window.dispatchEvent(new Event(COMPANIES_EVENT));
}

export interface CompanyInput {
  legalNameAr: string;
  legalNameEn?: string;
  tradeNameAr?: string;
  tradeNameEn?: string;
  commercialRegister?: string;
  taxCard?: string;
  addressAr?: string;
  addressEn?: string;
  phones?: string[];
  emails?: string[];
  website?: string;
  workingHoursAr?: string;
  workingHoursEn?: string;
  aboutAr?: string;
  aboutEn?: string;
  logoUrl?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  licenses?: CompanyLicense[];
  active?: boolean;
  primary?: boolean;
}

export type CompanyMutationResult =
  | { ok: true; company: CompanyRecord }
  | { ok: false; error: string };

function makeId(existing: CompanyRecord[]): string {
  let counter = 1;
  let candidate = `company-${counter}`;
  while (existing.some((company) => company.id === candidate)) {
    counter += 1;
    candidate = `company-${counter}`;
  }
  return candidate;
}

/** شركة واحدة فقط تكون رئيسية — أي تعيين جديد يلغي السابق */
function applyPrimary(
  companies: CompanyRecord[],
  primaryId: string
): CompanyRecord[] {
  return companies.map((company) => ({
    ...company,
    primary: company.id === primaryId,
  }));
}

export function addCompany(input: CompanyInput): CompanyMutationResult {
  const companies = getCompanies();
  const legalNameAr = (input.legalNameAr ?? "").trim();
  if (!legalNameAr) return { ok: false, error: "الاسم القانوني مطلوب" };

  const now = new Date().toISOString();
  const company: CompanyRecord = {
    id: makeId(companies),
    active: input.active !== false,
    /* أول شركة تُضاف تصبح رئيسية تلقائياً */
    primary: input.primary === true || companies.length === 0,
    legalNameAr,
    legalNameEn: (input.legalNameEn ?? "").trim() || legalNameAr,
    tradeNameAr: (input.tradeNameAr ?? "").trim() || legalNameAr,
    tradeNameEn:
      (input.tradeNameEn ?? "").trim() || (input.tradeNameAr ?? "").trim() || legalNameAr,
    commercialRegister: (input.commercialRegister ?? "").trim(),
    taxCard: (input.taxCard ?? "").trim(),
    addressAr: (input.addressAr ?? "").trim(),
    addressEn: (input.addressEn ?? "").trim(),
    phones: toStringArray(input.phones),
    emails: toStringArray(input.emails),
    website: (input.website ?? "").trim() || undefined,
    workingHoursAr: (input.workingHoursAr ?? "").trim(),
    workingHoursEn: (input.workingHoursEn ?? "").trim(),
    aboutAr: (input.aboutAr ?? "").trim(),
    aboutEn: (input.aboutEn ?? "").trim(),
    logoUrl: (input.logoUrl ?? "").trim() || undefined,
    facebook: (input.facebook ?? "").trim() || undefined,
    instagram: (input.instagram ?? "").trim() || undefined,
    x: (input.x ?? "").trim() || undefined,
    linkedin: (input.linkedin ?? "").trim() || undefined,
    youtube: (input.youtube ?? "").trim() || undefined,
    tiktok: (input.tiktok ?? "").trim() || undefined,
    licenses: input.licenses ?? [],
    order: companies.length
      ? Math.max(...companies.map((item) => item.order)) + 1
      : 1,
    createdAt: now,
    updatedAt: now,
  };

  const next = company.primary
    ? applyPrimary([...companies, company], company.id)
    : [...companies, company];

  saveCompanies(next);
  return { ok: true, company };
}

export function updateCompany(
  id: string,
  patch: Partial<CompanyInput>
): CompanyMutationResult {
  const companies = getCompanies();
  const current = companies.find((company) => company.id === id);
  if (!current) return { ok: false, error: "الشركة غير موجودة" };

  const legalNameAr = (patch.legalNameAr ?? current.legalNameAr).trim();
  if (!legalNameAr) return { ok: false, error: "الاسم القانوني مطلوب" };

  const updated: CompanyRecord = {
    ...current,
    legalNameAr,
    legalNameEn:
      patch.legalNameEn !== undefined
        ? patch.legalNameEn.trim() || legalNameAr
        : current.legalNameEn,
    tradeNameAr:
      patch.tradeNameAr !== undefined
        ? patch.tradeNameAr.trim() || legalNameAr
        : current.tradeNameAr,
    tradeNameEn:
      patch.tradeNameEn !== undefined
        ? patch.tradeNameEn.trim() || current.tradeNameAr
        : current.tradeNameEn,
    commercialRegister:
      patch.commercialRegister !== undefined
        ? patch.commercialRegister.trim()
        : current.commercialRegister,
    taxCard: patch.taxCard !== undefined ? patch.taxCard.trim() : current.taxCard,
    addressAr: patch.addressAr !== undefined ? patch.addressAr.trim() : current.addressAr,
    addressEn: patch.addressEn !== undefined ? patch.addressEn.trim() : current.addressEn,
    phones: patch.phones !== undefined ? toStringArray(patch.phones) : current.phones,
    emails: patch.emails !== undefined ? toStringArray(patch.emails) : current.emails,
    website:
      patch.website !== undefined
        ? patch.website.trim() || undefined
        : current.website,
    workingHoursAr:
      patch.workingHoursAr !== undefined
        ? patch.workingHoursAr.trim()
        : current.workingHoursAr,
    workingHoursEn:
      patch.workingHoursEn !== undefined
        ? patch.workingHoursEn.trim()
        : current.workingHoursEn,
    aboutAr: patch.aboutAr !== undefined ? patch.aboutAr.trim() : current.aboutAr,
    aboutEn: patch.aboutEn !== undefined ? patch.aboutEn.trim() : current.aboutEn,
    logoUrl:
      patch.logoUrl !== undefined ? patch.logoUrl.trim() || undefined : current.logoUrl,
    facebook:
      patch.facebook !== undefined
        ? patch.facebook.trim() || undefined
        : current.facebook,
    instagram:
      patch.instagram !== undefined
        ? patch.instagram.trim() || undefined
        : current.instagram,
    x: patch.x !== undefined ? patch.x.trim() || undefined : current.x,
    linkedin:
      patch.linkedin !== undefined
        ? patch.linkedin.trim() || undefined
        : current.linkedin,
    youtube:
      patch.youtube !== undefined
        ? patch.youtube.trim() || undefined
        : current.youtube,
    tiktok:
      patch.tiktok !== undefined ? patch.tiktok.trim() || undefined : current.tiktok,
    licenses: patch.licenses ?? current.licenses,
    active: patch.active ?? current.active,
    primary: patch.primary ?? current.primary,
    updatedAt: new Date().toISOString(),
  };

  /* لا يمكن إلغاء الرئاسة عن الشركة الوحيدة — نضمن دائماً شركة رئيسية */
  let next = companies.map((company) => (company.id === id ? updated : company));
  if (updated.primary) {
    next = applyPrimary(next, id);
  } else if (!next.some((company) => company.primary)) {
    const fallback = next.find((company) => company.active) ?? next[0];
    if (fallback) next = applyPrimary(next, fallback.id);
  }

  saveCompanies(next);
  const saved = next.find((company) => company.id === id) ?? updated;
  return { ok: true, company: saved };
}

export function setCompanyActive(id: string, active: boolean): void {
  const companies = getCompanies();
  const next = companies.map((company) =>
    company.id === id
      ? { ...company, active, updatedAt: new Date().toISOString() }
      : company
  );
  const target = next.find((company) => company.id === id);
  /** لا نترك الشركة الرئيسية مخفية بلا بديل ظاهر */
  if (target?.primary && !active) {
    const fallback =
      next.find((company) => company.id !== id && company.active) ?? null;
    if (fallback) {
      saveCompanies(applyPrimary(next, fallback.id));
      return;
    }
  }
  saveCompanies(next);
}

export function setPrimaryCompany(id: string): void {
  const companies = getCompanies();
  if (!companies.some((company) => company.id === id)) return;
  saveCompanies(applyPrimary(companies, id));
}

/** حذف نهائي — لا يمكن حذف الشركة الوحيدة */
export function removeCompany(id: string): { ok: boolean; error?: string } {
  const companies = getCompanies();
  if (companies.length <= 1) {
    return { ok: false, error: "لا يمكن حذف الشركة الوحيدة — عدّلها بدلاً من ذلك" };
  }
  const target = companies.find((company) => company.id === id);
  const next = companies.filter((company) => company.id !== id);
  if (target?.primary) {
    const fallback = next.find((company) => company.active) ?? next[0];
    if (fallback) saveCompanies(applyPrimary(next, fallback.id));
    else saveCompanies(next);
    return { ok: true };
  }
  saveCompanies(next);
  return { ok: true };
}

export function moveCompany(id: string, direction: "up" | "down"): void {
  const companies = getCompanies();
  const index = companies.findIndex((company) => company.id === id);
  if (index < 0) return;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= companies.length) return;
  const next = [...companies];
  [next[index], next[target]] = [next[target], next[index]];
  saveCompanies(next.map((company, position) => ({ ...company, order: position + 1 })));
}

/** كل الشركات مع الاستماع لتغييرات لوحة التحكم */
export function useCompanies(): CompanyRecord[] {
  const [companies, setCompanies] = useState<CompanyRecord[]>(cloneDefaults);

  useEffect(() => {
    const sync = () => setCompanies(getCompanies());
    sync();
    window.addEventListener(COMPANIES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPANIES_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return companies;
}

/** الشركة المالكة الرئيسية (أو أول شركة ظاهرة) */
export function usePrimaryCompany(): CompanyRecord | null {
  const companies = useCompanies();
  return useMemo(() => {
    const active = companies.filter((company) => company.active);
    return active.find((company) => company.primary) ?? active[0] ?? null;
  }, [companies]);
}
