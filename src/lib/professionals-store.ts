/**
 * سجل المهنيين المعتمدين على المنصة: المطورون العقاريون، المسوقون، والمحامون.
 *
 * قواعد العمل:
 * - التسجيل يأتي من صاحب الحساب بحالة `pending` ولا يظهر للزوار.
 * - لا يظهر أي سجل للجمهور إلا بعد موافقة الإدارة (`approved`).
 * - شارة التوثيق (`verified`) مستقلة عن الإعلانات المدفوعة وتُمنح يدوياً بعد
 *   مراجعة المستندات.
 * - بيانات التواصل لا تُعرض مباشرة؛ كل التواصل يمر عبر إدارة المنصة.
 * - الفيديوهات روابط embed فقط (يوتيوب/إنستجرام) ولا تُرفع ملفات.
 *
 * التخزين حالياً localStorage بنفس أسلوب بقية المنصة، وبنيته جاهزة للترحيل
 * إلى قاعدة بيانات لاحقاً.
 */
import { useEffect, useMemo, useState } from "react";
import { detectReelPlatform, toEmbedUrl, type ReelPlatform } from "@/lib/embed";

export type ProfessionalKind = "developer" | "marketer" | "lawyer";

export type ProfessionalStatus = "pending" | "approved" | "rejected" | "archived";

export interface ProfessionalReel {
  id: string;
  titleAr: string;
  titleEn?: string;
  /** الرابط كما أدخله المستخدم (يوتيوب/إنستجرام) */
  url: string;
  platform: ReelPlatform;
  order: number;
}

export interface ProfessionalDocument {
  id: string;
  /** نوع المستند: بطاقة، سجل تجاري، بطاقة ضريبية، كارنيه محاماة… */
  type: string;
  label: string;
  fileName?: string;
  /** صورة مصغّرة بصيغة data URL — لا تُعرض للزوار أبداً */
  dataUrl?: string;
  uploadedAt?: string;
}

export interface ProfessionalLicense {
  id: string;
  name: string;
  number: string;
  issuer?: string;
  expiresAt?: string;
  url?: string;
}

export interface ProfessionalSocials {
  facebook?: string;
  instagram?: string;
  x?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

export interface ProfessionalRecord {
  id: string;
  kind: ProfessionalKind;
  status: ProfessionalStatus;
  /** شارة توثيق المستندات — مستقلة عن الإعلانات */
  verified: boolean;
  featured: boolean;
  nameAr: string;
  nameEn?: string;
  companyAr?: string;
  companyEn?: string;
  titleAr?: string;
  titleEn?: string;
  bioAr?: string;
  bioEn?: string;
  cityAr?: string;
  coverageAr?: string[];
  specialtiesAr?: string[];
  phone: string;
  email?: string;
  website?: string;
  socials?: ProfessionalSocials;
  logoUrl?: string;
  licenseNumber?: string;
  yearsExperience?: number;
  projectsCount?: number;
  /** مستندات المراجعة — للإدارة فقط */
  documents: ProfessionalDocument[];
  licenses: ProfessionalLicense[];
  /** ريلز/فيديوهات تعريفية بروابط embed */
  reels: ProfessionalReel[];
  requestedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export const PROFESSIONALS_KEY = "aqaar-professionals";
export const PROFESSIONALS_EVENT = "aqaar:professionals";
export const PROFESSIONAL_REQUESTS_KEY = "aqaar-professional-requests";
export const PROFESSIONAL_REQUESTS_EVENT = "aqaar:professional-requests";

export const PROFESSIONAL_KIND_META: Record<
  ProfessionalKind,
  { labelAr: string; labelEn: string; singularAr: string; path: string }
> = {
  developer: {
    labelAr: "المطورون العقاريون",
    labelEn: "Developers",
    singularAr: "مطور عقاري",
    path: "/developers",
  },
  marketer: {
    labelAr: "المسوقون العقاريون",
    labelEn: "Marketers",
    singularAr: "مسوق عقاري",
    path: "/brokers",
  },
  lawyer: {
    labelAr: "المحامون المعتمدون",
    labelEn: "Lawyers",
    singularAr: "محامٍ معتمد",
    path: "/lawyers",
  },
};

export const STATUS_META: Record<
  ProfessionalStatus,
  { labelAr: string; className: string }
> = {
  pending: {
    labelAr: "قيد المراجعة",
    className: "border border-amber-200 bg-amber-50 text-amber-700",
  },
  approved: {
    labelAr: "معتمد ومنشور",
    className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    labelAr: "مرفوض",
    className: "border border-rose-200 bg-rose-50 text-rose-700",
  },
  archived: {
    labelAr: "مؤرشف",
    className: "border border-sand-200 bg-sand-100 text-sand-700",
  },
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function optional(value: unknown): string | undefined {
  const result = text(value).trim();
  return result || undefined;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n،;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeReel(raw: unknown, index: number): ProfessionalReel | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<ProfessionalReel>;
  const url = text(item.url).trim();
  if (!url) return null;
  return {
    id: optional(item.id) ?? `reel-${index + 1}`,
    titleAr: text(item.titleAr).trim() || "فيديو تعريفي",
    titleEn: optional(item.titleEn),
    url,
    platform: detectReelPlatform(url),
    order: Number.isFinite(item.order) ? Number(item.order) : index + 1,
  };
}

function normalizeDocument(
  raw: unknown,
  index: number
): ProfessionalDocument | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<ProfessionalDocument>;
  const label = text(item.label).trim() || text(item.fileName).trim();
  if (!label) return null;
  return {
    id: optional(item.id) ?? `doc-${index + 1}`,
    type: text(item.type).trim() || "other",
    label,
    fileName: optional(item.fileName),
    dataUrl: optional(item.dataUrl),
    uploadedAt: optional(item.uploadedAt),
  };
}

function normalizeLicense(raw: unknown, index: number): ProfessionalLicense | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<ProfessionalLicense>;
  const name = text(item.name).trim();
  const number = text(item.number).trim();
  if (!name && !number) return null;
  return {
    id: optional(item.id) ?? `license-${index + 1}`,
    name: name || "ترخيص",
    number,
    issuer: optional(item.issuer),
    expiresAt: optional(item.expiresAt),
    url: optional(item.url),
  };
}

function normalizeProfessional(
  raw: Partial<ProfessionalRecord>,
  index: number
): ProfessionalRecord | null {
  const kind = raw.kind;
  if (kind !== "developer" && kind !== "marketer" && kind !== "lawyer") return null;
  const nameAr = text(raw.nameAr).trim() || text(raw.companyAr).trim();
  if (!nameAr) return null;
  const status: ProfessionalStatus =
    raw.status === "approved" ||
    raw.status === "rejected" ||
    raw.status === "archived"
      ? raw.status
      : "pending";
  return {
    id: optional(raw.id) ?? `prof-${index + 1}`,
    kind,
    status,
    verified: raw.verified === true,
    featured: raw.featured === true,
    nameAr,
    nameEn: optional(raw.nameEn),
    companyAr: optional(raw.companyAr),
    companyEn: optional(raw.companyEn),
    titleAr: optional(raw.titleAr),
    titleEn: optional(raw.titleEn),
    bioAr: optional(raw.bioAr),
    bioEn: optional(raw.bioEn),
    cityAr: optional(raw.cityAr),
    coverageAr: toStringArray(raw.coverageAr),
    specialtiesAr: toStringArray(raw.specialtiesAr),
    phone: text(raw.phone).trim(),
    email: optional(raw.email),
    website: optional(raw.website),
    socials:
      raw.socials && typeof raw.socials === "object"
        ? {
            facebook: optional(raw.socials.facebook),
            instagram: optional(raw.socials.instagram),
            x: optional(raw.socials.x),
            linkedin: optional(raw.socials.linkedin),
            youtube: optional(raw.socials.youtube),
            tiktok: optional(raw.socials.tiktok),
          }
        : undefined,
    logoUrl: optional(raw.logoUrl),
    licenseNumber: optional(raw.licenseNumber),
    yearsExperience: Number.isFinite(raw.yearsExperience)
      ? Number(raw.yearsExperience)
      : undefined,
    projectsCount: Number.isFinite(raw.projectsCount)
      ? Number(raw.projectsCount)
      : undefined,
    documents: Array.isArray(raw.documents)
      ? raw.documents
          .map((item, position) => normalizeDocument(item, position))
          .filter((item): item is ProfessionalDocument => item !== null)
      : [],
    licenses: Array.isArray(raw.licenses)
      ? raw.licenses
          .map((item, position) => normalizeLicense(item, position))
          .filter((item): item is ProfessionalLicense => item !== null)
      : [],
    reels: Array.isArray(raw.reels)
      ? raw.reels
          .map((item, position) => normalizeReel(item, position))
          .filter((item): item is ProfessionalReel => item !== null)
          .sort((a, b) => a.order - b.order)
      : [],
    requestedAt: optional(raw.requestedAt) ?? new Date().toISOString(),
    reviewedAt: optional(raw.reviewedAt),
    reviewNote: optional(raw.reviewNote),
    order: Number.isFinite(raw.order) ? Number(raw.order) : index + 1,
    createdAt: optional(raw.createdAt),
    updatedAt: optional(raw.updatedAt),
  };
}

function doc(
  type: string,
  label: string,
  fileName: string
): ProfessionalDocument {
  return {
    id: `doc-${type}`,
    type,
    label,
    fileName,
    uploadedAt: "2026-02-01",
  };
}

const DEMO_YOUTUBE = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";

export const DEFAULT_PROFESSIONALS: ProfessionalRecord[] = [
  {
    id: "dev-nile",
    kind: "developer",
    status: "approved",
    verified: true,
    featured: true,
    nameAr: "د. أحمد محمود",
    nameEn: "Dr. Ahmed Mahmoud",
    companyAr: "شركة النيل للتطوير العقاري",
    companyEn: "Nile Development",
    titleAr: "تطوير مشروعات سكنية ومصيفية",
    titleEn: "Residential & coastal development",
    bioAr:
      "مطور عقاري معتمد يعمل في دمياط الجديدة ورأس البر، متخصص في المشروعات السكنية المتكاملة ووحدات التقسيط الموثقة.",
    bioEn:
      "A verified developer operating in New Damietta and Ras El Bar, focused on integrated residential projects and documented installment units.",
    cityAr: "دمياط الجديدة",
    coverageAr: ["دمياط الجديدة", "رأس البر"],
    specialtiesAr: ["مشروعات سكنية", "وحدات تقسيط", "مصايف"],
    phone: "201000000001",
    email: "sales@nile-dev.example",
    website: "",
    logoUrl: "",
    licenseNumber: "CR-55401",
    yearsExperience: 16,
    projectsCount: 4,
    documents: [
      doc("commercial_register", "السجل التجاري", "nile-cr.pdf"),
      doc("tax_card", "البطاقة الضريبية", "nile-tax.pdf"),
    ],
    licenses: [
      {
        id: "lic-nile-1",
        name: "السجل التجاري",
        number: "CR-55401",
        issuer: "الهيئة العامة للاستثمار",
      },
    ],
    reels: [
      {
        id: "reel-nile-1",
        titleAr: "جولة في مشروع النيل بلازا",
        titleEn: "Nile Plaza project tour",
        url: DEMO_YOUTUBE,
        platform: "youtube",
        order: 1,
      },
    ],
    requestedAt: "2026-01-20",
    reviewedAt: "2026-01-22",
    order: 1,
    createdAt: "2026-01-20",
    updatedAt: "2026-02-01",
  },
  {
    id: "dev-sahel",
    kind: "developer",
    status: "approved",
    verified: true,
    featured: false,
    nameAr: "م. محمد علي",
    nameEn: "Eng. Mohamed Ali",
    companyAr: "مجموعة الساحل للتطوير",
    companyEn: "Sahel Development Group",
    titleAr: "تطوير الشاليهات والوحدات البحرية",
    titleEn: "Chalets & seafront units",
    bioAr:
      "مجموعة تطوير متخصصة في الشاليهات والوحدات ذات الإطلالة البحرية في رأس البر وجمصة.",
    bioEn:
      "A development group specialized in chalets and seafront units in Ras El Bar and Gamasa.",
    cityAr: "رأس البر",
    coverageAr: ["رأس البر", "جمصة"],
    specialtiesAr: ["شاليهات", "إطلالة بحرية"],
    phone: "201000000002",
    email: "info@sahel-dev.example",
    logoUrl: "",
    licenseNumber: "CR-61220",
    yearsExperience: 12,
    projectsCount: 3,
    documents: [doc("commercial_register", "السجل التجاري", "sahel-cr.pdf")],
    licenses: [],
    reels: [],
    requestedAt: "2026-02-06",
    reviewedAt: "2026-02-08",
    order: 2,
    createdAt: "2026-02-06",
    updatedAt: "2026-02-08",
  },
  {
    id: "mkt-delta",
    kind: "marketer",
    status: "approved",
    verified: true,
    featured: true,
    nameAr: "هبة محمد",
    nameEn: "Heba Mohamed",
    companyAr: "مكتب الدلتا للوساطة العقارية",
    companyEn: "Delta Real Estate Office",
    titleAr: "وساطة وتسويق عقاري",
    titleEn: "Real estate brokerage & marketing",
    bioAr:
      "مكتب وساطة عقاري معتمد يعمل على تسويق الوحدات الموثقة فقط، مع مراجعة مستندات كل عرض قبل نشره.",
    bioEn:
      "A verified brokerage marketing only documented units, reviewing each listing's paperwork before publishing.",
    cityAr: "دمياط",
    coverageAr: ["دمياط", "فارسكور", "دمياط الجديدة"],
    specialtiesAr: ["بيع", "إيجار", "تسويق مشروعات"],
    phone: "201000000003",
    email: "delta@aqaar.example",
    logoUrl: "",
    yearsExperience: 9,
    projectsCount: 18,
    documents: [doc("commercial_register", "السجل التجاري", "delta-cr.pdf")],
    licenses: [],
    reels: [
      {
        id: "reel-delta-1",
        titleAr: "نصائح قبل شراء شقة",
        titleEn: "Tips before buying an apartment",
        url: DEMO_YOUTUBE,
        platform: "youtube",
        order: 1,
      },
    ],
    requestedAt: "2026-02-10",
    reviewedAt: "2026-02-12",
    order: 1,
    createdAt: "2026-02-10",
    updatedAt: "2026-02-12",
  },
  {
    id: "mkt-raselbar",
    kind: "marketer",
    status: "approved",
    verified: true,
    featured: false,
    nameAr: "كريم الدسوقي",
    nameEn: "Karim El-Desouky",
    companyAr: "رأس البر للعقارات",
    companyEn: "Ras El Bar Realty",
    titleAr: "تسويق الشاليهات والمصايف",
    titleEn: "Chalet & summer homes marketing",
    bioAr: "متخصص في تسويق الشاليهات والمصايف برأس البر وجمصة.",
    bioEn: "Specialized in marketing chalets and summer homes in Ras El Bar and Gamasa.",
    cityAr: "رأس البر",
    coverageAr: ["رأس البر", "جمصة"],
    specialtiesAr: ["شاليهات", "مصايف", "إيجار موسمي"],
    phone: "201000000004",
    email: "raselbar@aqaar.example",
    logoUrl: "",
    yearsExperience: 6,
    projectsCount: 11,
    documents: [],
    licenses: [],
    reels: [],
    requestedAt: "2026-02-14",
    reviewedAt: "2026-02-15",
    order: 2,
    createdAt: "2026-02-14",
    updatedAt: "2026-02-15",
  },
  {
    id: "law-mahmoud",
    kind: "lawyer",
    status: "approved",
    verified: true,
    featured: true,
    nameAr: "أ. محمود عبد السلام",
    nameEn: "Mahmoud Abdel Salam",
    companyAr: "مكتب عبد السلام للمحاماة",
    companyEn: "Abdel Salam Law Office",
    titleAr: "عقود البيع الابتدائي والتصرفات العقارية",
    titleEn: "Primary sale contracts & property transactions",
    bioAr:
      "محامٍ معتمد متخصص في صياغة عقود البيع الابتدائي ومراجعة التصرفات العقارية.",
    bioEn:
      "A verified lawyer specialized in drafting primary sale contracts and reviewing property transactions.",
    cityAr: "دمياط الجديدة",
    coverageAr: ["دمياط الجديدة", "رأس البر"],
    specialtiesAr: ["عقود بيع", "تصرفات عقارية"],
    phone: "201000000005",
    email: "mahmoud@law.example",
    logoUrl: "",
    licenseNumber: "CAR-1284",
    yearsExperience: 14,
    documents: [doc("bar_card", "كارنيه المحاماة", "mahmoud-bar.pdf")],
    licenses: [],
    reels: [
      {
        id: "reel-law-1",
        titleAr: "إزاي تراجع عقد البيع قبل التوقيع",
        titleEn: "How to review a sale contract",
        url: DEMO_YOUTUBE,
        platform: "youtube",
        order: 1,
      },
    ],
    requestedAt: "2026-01-15",
    reviewedAt: "2026-01-18",
    order: 1,
    createdAt: "2026-01-15",
    updatedAt: "2026-02-01",
  },
  {
    id: "law-hoda",
    kind: "lawyer",
    status: "approved",
    verified: true,
    featured: false,
    nameAr: "أ. هدى الشربيني",
    nameEn: "Hoda El-Sherbiny",
    companyAr: "مكتب الشربيني للمحاماة",
    companyEn: "El-Sherbiny Law Office",
    titleAr: "فحص الملكية والرهون والحجوزات",
    titleEn: "Title search, mortgages & liens",
    bioAr: "متخصصة في فحص الملكية والرهون والحجوزات قبل إتمام البيع.",
    bioEn: "Specialized in title search, mortgages, and liens before closing a sale.",
    cityAr: "دمياط",
    coverageAr: ["دمياط القديمة", "جمصة"],
    specialtiesAr: ["فحص ملكية", "رهون", "حجوزات"],
    phone: "201000000006",
    email: "hoda@law.example",
    logoUrl: "",
    licenseNumber: "CAR-2091",
    yearsExperience: 11,
    documents: [doc("bar_card", "كارنيه المحاماة", "hoda-bar.pdf")],
    licenses: [],
    reels: [],
    requestedAt: "2026-01-15",
    reviewedAt: "2026-01-18",
    order: 2,
    createdAt: "2026-01-15",
    updatedAt: "2026-01-18",
  },
  {
    id: "law-karim",
    kind: "lawyer",
    status: "approved",
    verified: true,
    featured: false,
    nameAr: "أ. كريم الدسوقي",
    nameEn: "Karim El-Desouky",
    companyAr: "مكتب الدسوقي القانوني",
    companyEn: "El-Desouky Legal Office",
    titleAr: "عقود المطورين ووحدات التقسيط",
    titleEn: "Developer contracts & installment units",
    bioAr: "محامٍ معتمد في عقود المطورين ووحدات التقسيط.",
    bioEn: "A verified lawyer for developer contracts and installment units.",
    cityAr: "المنصورة الجديدة",
    coverageAr: ["المنصورة الجديدة", "دمياط الجديدة"],
    specialtiesAr: ["عقود مطورين", "تقسيط"],
    phone: "201000000007",
    email: "karim@law.example",
    logoUrl: "",
    licenseNumber: "CAR-3377",
    yearsExperience: 9,
    documents: [],
    licenses: [],
    reels: [],
    requestedAt: "2026-01-15",
    reviewedAt: "2026-01-18",
    order: 3,
    createdAt: "2026-01-15",
    updatedAt: "2026-01-18",
  },
  {
    id: "law-sara",
    kind: "lawyer",
    status: "approved",
    verified: true,
    featured: false,
    nameAr: "أ. سارة النحاس",
    nameEn: "Sara El-Nahas",
    companyAr: "مكتب النحاس للمحاماة",
    companyEn: "El-Nahas Law Office",
    titleAr: "التسجيل العقاري والشهر العقاري",
    titleEn: "Property registration & notarization",
    bioAr: "متخصصة في التسجيل العقاري وإجراءات الشهر العقاري.",
    bioEn: "Specialized in property registration and notarization procedures.",
    cityAr: "رأس البر",
    coverageAr: ["رأس البر", "جمصة", "دمياط"],
    specialtiesAr: ["تسجيل عقاري", "شهر عقاري"],
    phone: "201000000008",
    email: "sara@law.example",
    logoUrl: "",
    licenseNumber: "CAR-4160",
    yearsExperience: 7,
    documents: [],
    licenses: [],
    reels: [],
    requestedAt: "2026-01-15",
    reviewedAt: "2026-01-18",
    order: 4,
    createdAt: "2026-01-15",
    updatedAt: "2026-01-18",
  },
];

function cloneDefaults(): ProfessionalRecord[] {
  return DEFAULT_PROFESSIONALS.map((record) => ({
    ...record,
    coverageAr: record.coverageAr ? [...record.coverageAr] : [],
    specialtiesAr: record.specialtiesAr ? [...record.specialtiesAr] : [],
    documents: record.documents.map((item) => ({ ...item })),
    licenses: record.licenses.map((item) => ({ ...item })),
    reels: record.reels.map((item) => ({ ...item })),
    socials: record.socials ? { ...record.socials } : undefined,
  }));
}

function readStored(): ProfessionalRecord[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(PROFESSIONALS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ProfessionalRecord[];
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return (parsed as { items: ProfessionalRecord[] }).items;
    }
    return [];
  } catch {
    return null;
  }
}

function sortRecords(records: ProfessionalRecord[]): ProfessionalRecord[] {
  return [...records].sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (a.order !== b.order) return a.order - b.order;
    return a.nameAr.localeCompare(b.nameAr, "ar");
  });
}

export function getProfessionals(): ProfessionalRecord[] {
  const stored = readStored();
  if (stored === null) return sortRecords(cloneDefaults());
  return sortRecords(
    stored
      .map((record, index) => normalizeProfessional(record, index))
      .filter((record): record is ProfessionalRecord => record !== null)
  );
}

/** السجلات المعتمدة فقط — للصفحات العامة */
export function getPublicProfessionals(kind?: ProfessionalKind): ProfessionalRecord[] {
  return getProfessionals().filter(
    (record) =>
      record.status === "approved" && (kind ? record.kind === kind : true)
  );
}

export function getProfessionalById(id: string): ProfessionalRecord | null {
  return getProfessionals().find((record) => record.id === id) ?? null;
}

export function saveProfessionals(records: ProfessionalRecord[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      PROFESSIONALS_KEY,
      JSON.stringify({ items: records, updatedAt: new Date().toISOString() })
    );
  } catch {
    return;
  }
  window.dispatchEvent(new Event(PROFESSIONALS_EVENT));
}

function makeId(kind: ProfessionalKind, existing: ProfessionalRecord[]): string {
  let counter = 1;
  let candidate = `${kind}-${Date.now().toString(36)}-${counter}`;
  while (existing.some((record) => record.id === candidate)) {
    counter += 1;
    candidate = `${kind}-${Date.now().toString(36)}-${counter}`;
  }
  return candidate;
}

export interface ProfessionalInput {
  kind: ProfessionalKind;
  nameAr: string;
  nameEn?: string;
  companyAr?: string;
  companyEn?: string;
  titleAr?: string;
  titleEn?: string;
  bioAr?: string;
  bioEn?: string;
  cityAr?: string;
  coverageAr?: string[] | string;
  specialtiesAr?: string[] | string;
  phone: string;
  email?: string;
  website?: string;
  socials?: ProfessionalSocials;
  logoUrl?: string;
  licenseNumber?: string;
  yearsExperience?: number;
  projectsCount?: number;
  documents?: ProfessionalDocument[];
  licenses?: ProfessionalLicense[];
  reels?: ProfessionalReel[];
  status?: ProfessionalStatus;
  verified?: boolean;
  featured?: boolean;
  reviewNote?: string;
}

export type ProfessionalMutationResult =
  | { ok: true; record: ProfessionalRecord }
  | { ok: false; error: string };

export function addProfessional(
  input: ProfessionalInput
): ProfessionalMutationResult {
  const records = getProfessionals();
  const nameAr = (input.nameAr ?? "").trim() || (input.companyAr ?? "").trim();
  if (!nameAr) return { ok: false, error: "اسم المسؤول أو الجهة مطلوب" };
  if (!input.phone.trim()) return { ok: false, error: "رقم الهاتف مطلوب" };

  const now = new Date().toISOString();
  const record: ProfessionalRecord = {
    id: makeId(input.kind, records),
    kind: input.kind,
    status: input.status ?? "pending",
    verified: input.verified === true,
    featured: input.featured === true,
    nameAr,
    nameEn: optional(input.nameEn),
    companyAr: optional(input.companyAr),
    companyEn: optional(input.companyEn),
    titleAr: optional(input.titleAr),
    titleEn: optional(input.titleEn),
    bioAr: optional(input.bioAr),
    bioEn: optional(input.bioEn),
    cityAr: optional(input.cityAr),
    coverageAr: toStringArray(input.coverageAr),
    specialtiesAr: toStringArray(input.specialtiesAr),
    phone: input.phone.trim(),
    email: optional(input.email),
    website: optional(input.website),
    socials: input.socials,
    logoUrl: optional(input.logoUrl),
    licenseNumber: optional(input.licenseNumber),
    yearsExperience: Number.isFinite(input.yearsExperience)
      ? Number(input.yearsExperience)
      : undefined,
    projectsCount: Number.isFinite(input.projectsCount)
      ? Number(input.projectsCount)
      : undefined,
    documents: input.documents ?? [],
    licenses: input.licenses ?? [],
    reels: input.reels ?? [],
    requestedAt: now,
    reviewNote: optional(input.reviewNote),
    order:
      records.filter((item) => item.kind === input.kind).length + 1,
    createdAt: now,
    updatedAt: now,
  };

  saveProfessionals([...records, record]);
  return { ok: true, record };
}

export function updateProfessional(
  id: string,
  patch: Partial<ProfessionalInput>
): ProfessionalMutationResult {
  const records = getProfessionals();
  const current = records.find((record) => record.id === id);
  if (!current) return { ok: false, error: "السجل غير موجود" };

  const nameAr = (patch.nameAr ?? current.nameAr).trim();
  if (!nameAr) return { ok: false, error: "الاسم مطلوب" };

  const updated: ProfessionalRecord = {
    ...current,
    nameAr,
    nameEn: patch.nameEn !== undefined ? optional(patch.nameEn) : current.nameEn,
    companyAr:
      patch.companyAr !== undefined ? optional(patch.companyAr) : current.companyAr,
    companyEn:
      patch.companyEn !== undefined ? optional(patch.companyEn) : current.companyEn,
    titleAr: patch.titleAr !== undefined ? optional(patch.titleAr) : current.titleAr,
    titleEn: patch.titleEn !== undefined ? optional(patch.titleEn) : current.titleEn,
    bioAr: patch.bioAr !== undefined ? optional(patch.bioAr) : current.bioAr,
    bioEn: patch.bioEn !== undefined ? optional(patch.bioEn) : current.bioEn,
    cityAr: patch.cityAr !== undefined ? optional(patch.cityAr) : current.cityAr,
    coverageAr:
      patch.coverageAr !== undefined
        ? toStringArray(patch.coverageAr)
        : current.coverageAr,
    specialtiesAr:
      patch.specialtiesAr !== undefined
        ? toStringArray(patch.specialtiesAr)
        : current.specialtiesAr,
    phone: patch.phone !== undefined ? patch.phone.trim() : current.phone,
    email: patch.email !== undefined ? optional(patch.email) : current.email,
    website: patch.website !== undefined ? optional(patch.website) : current.website,
    socials: patch.socials ?? current.socials,
    logoUrl: patch.logoUrl !== undefined ? optional(patch.logoUrl) : current.logoUrl,
    licenseNumber:
      patch.licenseNumber !== undefined
        ? optional(patch.licenseNumber)
        : current.licenseNumber,
    yearsExperience:
      patch.yearsExperience !== undefined
        ? Number(patch.yearsExperience) || undefined
        : current.yearsExperience,
    projectsCount:
      patch.projectsCount !== undefined
        ? Number(patch.projectsCount) || undefined
        : current.projectsCount,
    documents: patch.documents ?? current.documents,
    licenses: patch.licenses ?? current.licenses,
    reels: patch.reels ?? current.reels,
    status: patch.status ?? current.status,
    verified: patch.verified ?? current.verified,
    featured: patch.featured ?? current.featured,
    reviewNote:
      patch.reviewNote !== undefined ? optional(patch.reviewNote) : current.reviewNote,
    updatedAt: new Date().toISOString(),
  };

  saveProfessionals(records.map((record) => (record.id === id ? updated : record)));
  return { ok: true, record: updated };
}

export function setProfessionalStatus(
  id: string,
  status: ProfessionalStatus,
  reviewNote?: string
): void {
  const records = getProfessionals();
  const now = new Date().toISOString();
  saveProfessionals(
    records.map((record) =>
      record.id === id
        ? {
            ...record,
            status,
            reviewNote: reviewNote ?? record.reviewNote,
            reviewedAt: status === "pending" ? undefined : now,
            updatedAt: now,
            /* الموافقة تمنح شارة التوثيق افتراضياً بعد مراجعة المستندات */
            verified: status === "approved" ? true : status === "rejected" ? false : record.verified,
          }
        : record
    )
  );
}

export function setProfessionalVerified(id: string, verified: boolean): void {
  const records = getProfessionals();
  saveProfessionals(
    records.map((record) =>
      record.id === id
        ? { ...record, verified, updatedAt: new Date().toISOString() }
        : record
    )
  );
}

export function toggleProfessionalFeatured(id: string): void {
  const records = getProfessionals();
  saveProfessionals(
    records.map((record) =>
      record.id === id
        ? { ...record, featured: !record.featured, updatedAt: new Date().toISOString() }
        : record
    )
  );
}

export function removeProfessional(id: string): void {
  saveProfessionals(getProfessionals().filter((record) => record.id !== id));
}

export function moveProfessional(id: string, direction: "up" | "down"): void {
  const records = getProfessionals();
  const sameKind = records
    .filter((record) => record.kind === records.find((item) => item.id === id)?.kind)
    .sort((a, b) => a.order - b.order);
  const index = sameKind.findIndex((record) => record.id === id);
  if (index < 0) return;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= sameKind.length) return;
  [sameKind[index], sameKind[target]] = [sameKind[target], sameKind[index]];
  const orderMap = new Map(sameKind.map((record, position) => [record.id, position + 1]));
  saveProfessionals(
    records.map((record) =>
      orderMap.has(record.id)
        ? { ...record, order: orderMap.get(record.id) as number }
        : record
    )
  );
}

export type ReelMutationResult =
  | { ok: true; reel: ProfessionalReel }
  | { ok: false; error: string };

export function addProfessionalReel(
  professionalId: string,
  input: { titleAr: string; titleEn?: string; url: string }
): ReelMutationResult {
  const records = getProfessionals();
  const record = records.find((item) => item.id === professionalId);
  if (!record) return { ok: false, error: "السجل غير موجود" };

  const url = input.url.trim();
  if (!url) return { ok: false, error: "رابط الفيديو مطلوب" };
  const embed = toEmbedUrl(url);
  if (!embed) {
    return {
      ok: false,
      error: "الرابط غير مدعوم — استخدم رابط يوتيوب أو ريلز إنستجرام",
    };
  }

  const reel: ProfessionalReel = {
    id: `reel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    titleAr: input.titleAr.trim() || "فيديو تعريفي",
    titleEn: optional(input.titleEn),
    url,
    platform: detectReelPlatform(url),
    order: record.reels.length + 1,
  };

  saveProfessionals(
    records.map((item) =>
      item.id === professionalId
        ? { ...item, reels: [...item.reels, reel], updatedAt: new Date().toISOString() }
        : item
    )
  );
  return { ok: true, reel };
}

export function removeProfessionalReel(
  professionalId: string,
  reelId: string
): void {
  saveProfessionals(
    getProfessionals().map((record) =>
      record.id === professionalId
        ? {
            ...record,
            reels: record.reels.filter((reel) => reel.id !== reelId),
            updatedAt: new Date().toISOString(),
          }
        : record
    )
  );
}

/* ============================ طلبات التواصل ============================ */

export interface ProfessionalRequest {
  id: string;
  professionalId: string;
  professionalName: string;
  kind: ProfessionalKind;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: "new" | "handled";
  createdAt: string;
}

export const PROFESSIONAL_REQUEST_STATUS: Record<
  ProfessionalRequest["status"],
  string
> = {
  new: "جديد",
  handled: "تم التعامل",
};

function readRequests(): ProfessionalRequest[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(PROFESSIONAL_REQUESTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ProfessionalRequest[];
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return (parsed as { items: ProfessionalRequest[] }).items;
    }
    return [];
  } catch {
    return [];
  }
}

function writeRequests(requests: ProfessionalRequest[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      PROFESSIONAL_REQUESTS_KEY,
      JSON.stringify({ items: requests, updatedAt: new Date().toISOString() })
    );
  } catch {
    return;
  }
  window.dispatchEvent(new Event(PROFESSIONAL_REQUESTS_EVENT));
}

export function addProfessionalRequest(input: {
  professionalId: string;
  professionalName: string;
  kind: ProfessionalKind;
  name: string;
  phone: string;
  email?: string;
  message: string;
}): { ok: boolean; error?: string } {
  if (!input.name.trim()) return { ok: false, error: "الاسم مطلوب" };
  if (!input.phone.trim()) return { ok: false, error: "رقم الهاتف مطلوب" };
  if (!input.message.trim()) return { ok: false, error: "اكتب رسالتك" };
  const requests = readRequests();
  writeRequests([
    {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      professionalId: input.professionalId,
      professionalName: input.professionalName,
      kind: input.kind,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: optional(input.email),
      message: input.message.trim(),
      status: "new",
      createdAt: new Date().toISOString(),
    },
    ...requests,
  ]);
  return { ok: true };
}

export function getProfessionalRequests(): ProfessionalRequest[] {
  return readRequests().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function setProfessionalRequestStatus(
  id: string,
  status: ProfessionalRequest["status"]
): void {
  writeRequests(
    readRequests().map((request) =>
      request.id === id ? { ...request, status } : request
    )
  );
}

export function removeProfessionalRequest(id: string): void {
  writeRequests(readRequests().filter((request) => request.id !== id));
}

/* ============================ خطافات React ============================ */

export function useProfessionals(): ProfessionalRecord[] {
  const [records, setRecords] = useState<ProfessionalRecord[]>(cloneDefaults);

  useEffect(() => {
    const sync = () => setRecords(getProfessionals());
    sync();
    window.addEventListener(PROFESSIONALS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROFESSIONALS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return records;
}

export function usePublicProfessionals(
  kind?: ProfessionalKind
): ProfessionalRecord[] {
  const records = useProfessionals();
  return useMemo(
    () =>
      records.filter(
        (record) =>
          record.status === "approved" && (kind ? record.kind === kind : true)
      ),
    [records, kind]
  );
}

export function useProfessionalRequests(): ProfessionalRequest[] {
  const [requests, setRequests] = useState<ProfessionalRequest[]>([]);

  useEffect(() => {
    const sync = () => setRequests(getProfessionalRequests());
    sync();
    window.addEventListener(PROFESSIONAL_REQUESTS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROFESSIONAL_REQUESTS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return requests;
}
