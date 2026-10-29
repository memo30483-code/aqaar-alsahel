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
import {
  projectTypeLabel,
  resolveProjectTypeId,
  type ProjectTypeId,
} from "@/lib/projects-taxonomy";

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

/** حالة اعتماد مشروع/عرض ينشره المهني في صفحته */
/** حدث في دورة حياة المشروع — يُعرض في الخط الزمني للمهني والإدارة */
export type ProjectEventAction =
  | "created"
  | "edited"
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "archived"
  | "featured"
  | "unfeatured";

export interface ProjectEvent {
  id: string;
  action: ProjectEventAction;
  at: string;
  /** اسم المنفّذ (إدارة أو صاحب الحساب) */
  by?: string;
  byRole?: string;
  note?: string;
}

/** الحد الأقصى لعدد المشاريع لكل حساب مهني */
export const MAX_PROJECTS_PER_PROFESSIONAL = 20;
/** الحد الأقصى لصور معرض المشروع */
export const MAX_PROJECT_GALLERY = 10;

export type ProfessionalProjectStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "archived";

/**
 * مشروع عقاري أو عرض تسويقي يضيفه المطور/المسوق في صفحته.
 * لا يظهر للزوار إلا بعد اعتماد الإدارة.
 */
export interface ProfessionalProject {
  id: string;
  titleAr: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  cityAr?: string;
  /** نوع المشروع/العرض: سكني، تجاري، مصيف، إداري… */
  typeAr?: string;
  /** التصنيف الموحّد (enum) — مصدر الفلاتر والتقارير */
  typeId?: ProjectTypeId;
  /** تمييز الإدارة — يظهر في الرئيسية إن وُجد */
  featured?: boolean;
  purpose?: "sale" | "rent" | "marketing" | "project";
  coverUrl?: string;
  /** السعر يبدأ من — نص حر لتجنّب قيود العملة */
  priceFrom?: string;
  deliveryAr?: string;
  areaFrom?: string;
  unitsCount?: number;
  /** معرض صور المشروع (روابط) — تُعرض في صفحة المشروع */
  gallery?: string[];
  /** فيديو تعريفي — يوتيوب أو إنستجرام، يُحوَّل لـ embed عند العرض */
  videoUrl?: string;
  /** مميزات/مرافق المشروع */
  featuresAr?: string[];
  /** خطة السداد كنص حر */
  paymentPlanAr?: string;
  /** موقع المشروع على الخريطة */
  mapLat?: number;
  mapLng?: number;
  status: ProfessionalProjectStatus;
  /** مَن نشر المشروع: المنصة بعد المراجعة أو النشر المباشر للمهني */
  publishedBy?: "admin" | "auto";
  /** سجل الإجراءات على المشروع (آخر ٢٥ حدثاً) */
  history?: ProjectEvent[];
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
  order: number;
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
  /** صورة شخصية — تُستخدم للمحامين بشكل أساسي */
  photoUrl?: string;
  licenseNumber?: string;
  yearsExperience?: number;
  projectsCount?: number;
  /** مشاريع/عروض ينشرها المهني وتُعتمد من الإدارة */
  projects: ProfessionalProject[];
  /** مستندات المراجعة — للإدارة فقط */
  documents: ProfessionalDocument[];
  licenses: ProfessionalLicense[];
  /** ريلز/فيديوهات تعريفية بروابط embed */
  reels: ProfessionalReel[];
  requestedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  /**
   * رمز ملكية يُنشأ لحظة التسجيل — هو ما يسمح لصاحب السجل وحده بفتح لوحة المهني.
   * لا يكفي البريد وحده (كان يسمح بالدخول على ملف أي مهني بكتابة بريده).
   */
  ownerToken?: string;
  /**
   * سياسة نشر المشاريع: مراجعة الإدارة أو نشر مباشر.
   * "auto" تُمنح من الإدارة لحسابات موثوقة فقط.
   */
  publishPolicy?: "review" | "auto";
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

export const PROJECT_STATUS_META: Record<
  ProfessionalProjectStatus,
  { labelAr: string; labelEn: string; className: string }
> = {
  pending: {
    labelAr: "قيد المراجعة",
    labelEn: "Pending review",
    className: "border border-amber-200 bg-amber-50 text-amber-700",
  },
  approved: {
    labelAr: "منشور",
    labelEn: "Published",
    className: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    labelAr: "مرفوض",
    labelEn: "Rejected",
    className: "border border-rose-200 bg-rose-50 text-rose-700",
  },
  draft: {
    labelAr: "مسودة",
    labelEn: "Draft",
    className: "border border-sand-200 bg-sand-50 text-sand-600",
  },
  archived: {
    labelAr: "مؤرشف",
    labelEn: "Archived",
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

function normalizeProject(
  raw: unknown,
  index: number
): ProfessionalProject | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<ProfessionalProject>;
  const titleAr = text(item.titleAr).trim();
  if (!titleAr) return null;
  const status: ProfessionalProjectStatus =
    item.status === "approved" ||
    item.status === "rejected" ||
    item.status === "archived" ||
    item.status === "draft"
      ? item.status
      : "pending";
  const purpose =
    item.purpose === "sale" ||
    item.purpose === "rent" ||
    item.purpose === "marketing" ||
    item.purpose === "project"
      ? item.purpose
      : undefined;
  /* ترحيل تلقائي: نص حر قديم → تصنيف موحّد */
  const typeId =
    resolveProjectTypeId(item.typeId) ?? resolveProjectTypeId(item.typeAr);
  const typeAr =
    optional(item.typeAr) ?? (typeId ? projectTypeLabel(typeId, "ar") : undefined);
  return {
    id: optional(item.id) ?? `project-${index + 1}`,
    titleAr,
    titleEn: optional(item.titleEn),
    descriptionAr: optional(item.descriptionAr),
    descriptionEn: optional(item.descriptionEn),
    cityAr: optional(item.cityAr),
    typeId,
    typeAr,
    purpose,
    coverUrl: optional(item.coverUrl),
    priceFrom: optional(item.priceFrom),
    deliveryAr: optional(item.deliveryAr),
    areaFrom: optional(item.areaFrom),
    unitsCount: Number.isFinite(item.unitsCount)
      ? Number(item.unitsCount)
      : undefined,
    gallery: Array.isArray(item.gallery)
      ? item.gallery.filter(
          (url): url is string => typeof url === "string" && Boolean(url.trim())
        )
      : [],
    videoUrl: optional(item.videoUrl),
    featuresAr: toStringArray(item.featuresAr),
    paymentPlanAr: optional(item.paymentPlanAr),
    mapLat: Number.isFinite(item.mapLat) ? Number(item.mapLat) : undefined,
    mapLng: Number.isFinite(item.mapLng) ? Number(item.mapLng) : undefined,
    status,
    featured: item.featured === true,
    publishedBy:
      item.publishedBy === "auto" || item.publishedBy === "admin"
        ? item.publishedBy
        : undefined,
    history: Array.isArray(item.history)
      ? item.history.filter(
          (event): event is ProjectEvent =>
            Boolean(event) &&
            typeof event === "object" &&
            typeof (event as ProjectEvent).action === "string" &&
            typeof (event as ProjectEvent).at === "string"
        )
      : undefined,
    reviewNote: optional(item.reviewNote),
    createdAt: optional(item.createdAt) ?? new Date().toISOString(),
    reviewedAt: optional(item.reviewedAt),
    order: Number.isFinite(item.order) ? Number(item.order) : index + 1,
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
    photoUrl: optional(raw.photoUrl),
    licenseNumber: optional(raw.licenseNumber),
    yearsExperience: Number.isFinite(raw.yearsExperience)
      ? Number(raw.yearsExperience)
      : undefined,
    projectsCount: Number.isFinite(raw.projectsCount)
      ? Number(raw.projectsCount)
      : undefined,
    projects: Array.isArray(raw.projects)
      ? raw.projects
          .map((item, position) => normalizeProject(item, position))
          .filter((item): item is ProfessionalProject => item !== null)
          .sort((a, b) => a.order - b.order)
      : [],
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
    ownerToken: optional(raw.ownerToken),
    publishPolicy: raw.publishPolicy === "auto" ? "auto" : "review",
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

/** مشروع تجريبي منشور — يُستخدم لعرض شكل الصفحة الكاملة قبل إدخال بيانات حقيقية */
function seedProject(
  input: Omit<ProfessionalProject, "status" | "createdAt" | "reviewedAt">
): ProfessionalProject {
  return {
    status: "approved",
    createdAt: "2026-02-01",
    reviewedAt: "2026-02-02",
    ...input,
  };
}

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
    projects: [
      seedProject({
        id: "prj-nile-plaza",
        titleAr: "نيل بلازا — دمياط الجديدة",
        titleEn: "Nile Plaza — New Damietta",
        descriptionAr:
          "مجمع سكني متكامل على مساحة 12 فدانًا، وحدات بمساحات تبدأ من 120 م² مع أنظمة تقسيط موثقة وتشطيب كامل.",
        cityAr: "دمياط الجديدة",
        typeAr: "سكني",
        purpose: "project",
        priceFrom: "2,400,000",
        deliveryAr: "2027",
        areaFrom: "120",
        unitsCount: 120,
        order: 1,
      }),
      seedProject({
        id: "prj-nile-coast",
        titleAr: "نيل كوست — رأس البر",
        titleEn: "Nile Coast — Ras El Bar",
        descriptionAr:
          "شاليهات بإطلالة مباشرة على البحر، صف أول، بمساحات تبدأ من 85 م² وتسليم متدرج.",
        cityAr: "رأس البر",
        typeAr: "مصيف",
        purpose: "sale",
        priceFrom: "3,100,000",
        deliveryAr: "2026",
        areaFrom: "85",
        unitsCount: 64,
        order: 2,
      }),
    ],
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
    projects: [
      seedProject({
        id: "prj-sahel-bay",
        titleAr: "ساحل باي — جمصة",
        titleEn: "Sahel Bay — Gamasa",
        descriptionAr:
          "شاليهات صف أول على البحر بمساحات تبدأ من 90 م²، مع مسبح مشترك وخدمات أمن على مدار الساعة.",
        cityAr: "جمصة",
        typeAr: "مصيف",
        purpose: "sale",
        priceFrom: "2,750,000",
        deliveryAr: "2026",
        areaFrom: "90",
        unitsCount: 48,
        order: 1,
      }),
    ],
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
    projects: [
      seedProject({
        id: "prj-delta-offer-1",
        titleAr: "شقة 3 غرف — دمياط الجديدة",
        titleEn: "3-bedroom apartment — New Damietta",
        descriptionAr:
          "شقة موثقة بمساحة 140 م²، تشطيب سوبر لوكس، جاهزة للتسليم الفوري مع مراجعة كاملة للمستندات.",
        cityAr: "دمياط الجديدة",
        typeAr: "سكني",
        purpose: "sale",
        priceFrom: "1,950,000",
        areaFrom: "140",
        order: 1,
      }),
      seedProject({
        id: "prj-delta-offer-2",
        titleAr: "محل تجاري — فارسكور",
        titleEn: "Retail unit — Faraskour",
        descriptionAr:
          "محل على شارع رئيسي بمساحة 65 م²، واجهة 8 أمتار، مناسب للأنشطة التجارية والخدمية.",
        cityAr: "فارسكور",
        typeAr: "تجاري",
        purpose: "rent",
        priceFrom: "18,000 / شهريًا",
        areaFrom: "65",
        order: 2,
      }),
    ],
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
    projects: [
      seedProject({
        id: "prj-raselbar-offer-1",
        titleAr: "شاليه صف أول — رأس البر",
        titleEn: "Front-row chalet — Ras El Bar",
        descriptionAr:
          "شاليه 95 م² بإطلالة بحرية مباشرة، مفروش بالكامل، مناسب للمصيف والاستثمار الموسمي.",
        cityAr: "رأس البر",
        typeAr: "مصيف",
        purpose: "sale",
        priceFrom: "3,400,000",
        areaFrom: "95",
        order: 1,
      }),
    ],
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
    projects: [],
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
    projects: [],
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
    projects: [],
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
    projects: [],
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
    projects: record.projects.map((item) => ({ ...item })),
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
  /* ترتيب واضح ومتسق: قيد المراجعة أولاً، ثم المميز، ثم الموثّق، ثم حسب الترتيب */
  const statusRank: Record<ProfessionalStatus, number> = {
    pending: 0,
    approved: 1,
    rejected: 2,
    archived: 3,
  };
  return [...records].sort((a, b) => {
    const rankA = statusRank[a.status] ?? 9;
    const rankB = statusRank[b.status] ?? 9;
    if (rankA !== rankB) return rankA - rankB;
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

/** البحث عن ملف مهني بالبريد — يُستخدم للدخول إلى لوحة المهني */
export function getProfessionalByEmail(email: string): ProfessionalRecord | null {
  const needle = email.trim().toLowerCase();
  if (!needle) return null;
  return (
    getProfessionals().find(
      (record) => (record.email ?? "").trim().toLowerCase() === needle
    ) ?? null
  );
}

/**
 * هل هذا السجل مملوك للجلسة الحالية؟
 * رمز الملكية هو الحكم — البريد وحده لا يكفي، وإلا استطاع أي زائر
 * الدخول إلى لوحة أي مهني بمجرد كتابة بريده في صفحة الدخول.
 * السجلات التجريبية/القديمة بلا رمز ملكية لا تُفتح من لوحة المهني (الإدارة فقط).
 */
export function professionalOwnedBySession(
  record: ProfessionalRecord,
  session: { ownerToken?: string } | null | undefined
): boolean {
  if (!session?.ownerToken || !record.ownerToken) return false;
  return record.ownerToken === session.ownerToken;
}

export function saveProfessionals(records: ProfessionalRecord[]): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(
      PROFESSIONALS_KEY,
      JSON.stringify({ items: records, updatedAt: new Date().toISOString() })
    );
  } catch {
    /* مساحة ممتلئة أو وضع خاص — نُرجع الفشل بدل الإبلاغ بنجاح كاذب */
    return false;
  }
  window.dispatchEvent(new Event(PROFESSIONALS_EVENT));
  return true;
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
  photoUrl?: string;
  licenseNumber?: string;
  yearsExperience?: number;
  projectsCount?: number;
  projects?: ProfessionalProject[];
  documents?: ProfessionalDocument[];
  licenses?: ProfessionalLicense[];
  reels?: ProfessionalReel[];
  status?: ProfessionalStatus;
  verified?: boolean;
  featured?: boolean;
  reviewNote?: string;
  /** رمز ملكية السجل — يُمرَّر من جلسة التسجيل */
  ownerToken?: string;
  /** سياسة نشر المشاريع (تُضبط من الإدارة) */
  publishPolicy?: "review" | "auto";
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

  /* منع تكرار نفس البريد — التكرار يفتح أقدم نسخة عند الدخول ويضيع التعديلات */
  const email = optional(input.email);
  if (
    email &&
    records.some(
      (record) => (record.email ?? "").trim().toLowerCase() === email.toLowerCase()
    )
  ) {
    return {
      ok: false,
      error: "هذا البريد مسجّل بالفعل — تواصل مع الإدارة لتعديل ملفك الحالي",
    };
  }

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
    photoUrl: optional(input.photoUrl),
    licenseNumber: optional(input.licenseNumber),
    yearsExperience: Number.isFinite(input.yearsExperience)
      ? Number(input.yearsExperience)
      : undefined,
    projectsCount: Number.isFinite(input.projectsCount)
      ? Number(input.projectsCount)
      : undefined,
    projects: input.projects ?? [],
    documents: input.documents ?? [],
    licenses: input.licenses ?? [],
    reels: input.reels ?? [],
    requestedAt: now,
    reviewNote: optional(input.reviewNote),
    ownerToken: optional(input.ownerToken),
    order:
      records.filter((item) => item.kind === input.kind).length + 1,
    createdAt: now,
    updatedAt: now,
  };

  if (!saveProfessionals([...records, record])) {
    return {
      ok: false,
      error: "تعذّر حفظ السجل — مساحة التخزين في المتصفح ممتلئة أو غير متاحة",
    };
  }
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
    photoUrl:
      patch.photoUrl !== undefined ? optional(patch.photoUrl) : current.photoUrl,
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
    projects: patch.projects ?? current.projects,
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

  if (!saveProfessionals(records.map((record) => (record.id === id ? updated : record)))) {
    return {
      ok: false,
      error: "تعذّر حفظ التعديلات — مساحة التخزين في المتصفح ممتلئة أو غير متاحة",
    };
  }
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

/* ============================ مشاريع وعروض المهني ============================ */

export interface ProfessionalProjectInput {
  titleAr: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  cityAr?: string;
  typeAr?: string;
  /** التصنيف الموحّد — يُفضّل تمريره بدل النص الحر */
  typeId?: ProjectTypeId;
  purpose?: ProfessionalProject["purpose"];
  coverUrl?: string;
  priceFrom?: string;
  deliveryAr?: string;
  areaFrom?: string;
  unitsCount?: number;
  gallery?: string[];
  videoUrl?: string;
  featuresAr?: string[];
  paymentPlanAr?: string;
  mapLat?: number;
  mapLng?: number;
}

export type ProjectMutationResult =
  | { ok: true; project: ProfessionalProject }
  | { ok: false; error: string };

/** حالة النشر الابتدائية: النشر المباشر متاح فقط لسجل معتمد ومصرّح له */
function resolveProjectStatus(record: ProfessionalRecord): ProfessionalProjectStatus {
  return record.publishPolicy === "auto" && record.status === "approved"
    ? "approved"
    : "pending";
}

/** يبني حدثاً جديداً بسجل المشروع (بحد أقصى ٢٥ حدثاً) */
function withEvent(
  project: ProfessionalProject,
  action: ProjectEventAction,
  extra: { by?: string; byRole?: string; note?: string } = {}
): ProjectEvent[] {
  const event: ProjectEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    action,
    at: new Date().toISOString(),
    by: extra.by,
    byRole: extra.byRole,
    note: extra.note,
  };
  return [...(project.history ?? []), event].slice(-25);
}

function projectFromInput(
  input: ProfessionalProjectInput,
  base: Partial<ProfessionalProject>,
  status: ProfessionalProjectStatus,
  publishedBy?: "admin" | "auto"
): ProfessionalProject {
  return {
    id: base.id ?? `prj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    titleAr: input.titleAr.trim(),
    titleEn: optional(input.titleEn),
    descriptionAr: optional(input.descriptionAr),
    descriptionEn: optional(input.descriptionEn),
    cityAr: optional(input.cityAr),
    typeId: input.typeId,
    typeAr: input.typeId
      ? projectTypeLabel(input.typeId, "ar")
      : optional(input.typeAr),
    featured: base.featured === true,
    purpose: input.purpose,
    coverUrl: optional(input.coverUrl),
    priceFrom: optional(input.priceFrom),
    deliveryAr: optional(input.deliveryAr),
    areaFrom: optional(input.areaFrom),
    unitsCount: Number.isFinite(input.unitsCount)
      ? Number(input.unitsCount)
      : undefined,
    gallery: (input.gallery ?? base.gallery ?? [])
      .filter((url) => typeof url === "string" && Boolean(url.trim()))
      .slice(0, MAX_PROJECT_GALLERY),
    videoUrl: optional(input.videoUrl),
    featuresAr: toStringArray(input.featuresAr),
    paymentPlanAr: optional(input.paymentPlanAr),
    mapLat: Number.isFinite(input.mapLat) ? Number(input.mapLat) : base.mapLat,
    mapLng: Number.isFinite(input.mapLng) ? Number(input.mapLng) : base.mapLng,
    status,
    publishedBy,
    history: [
      ...(base.history ?? []),
      {
        id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        action: base.id
          ? status === "draft"
            ? "draft"
            : "edited"
          : status === "draft"
            ? "draft"
            : "submitted",
        at: new Date().toISOString(),
      } as ProjectEvent,
    ].slice(-25),
    reviewNote: status === "pending" ? undefined : base.reviewNote,
    createdAt: base.createdAt ?? new Date().toISOString(),
    reviewedAt: status === "approved" || status === "rejected" ? new Date().toISOString() : base.reviewedAt,
    order: base.order ?? 1,
  };
}

/** يضيف المهني مشروعًا/عرضًا — «قيد المراجعة» حتى تعتمده الإدارة (أو مسودة بطلب صريح) */
export function addProfessionalProject(
  professionalId: string,
  input: ProfessionalProjectInput,
  options: { asDraft?: boolean } = {}
): ProjectMutationResult {
  const records = getProfessionals();
  const record = records.find((item) => item.id === professionalId);
  if (!record) return { ok: false, error: "السجل غير موجود" };
  if (!input.titleAr.trim()) {
    return { ok: false, error: "اسم المشروع أو العرض مطلوب" };
  }
  /* حد أقصى لكل حساب — يمنع إغراق الدليل بمشاريع مكررة */
  const activeCount = record.projects.filter(
    (project) => project.status !== "archived"
  ).length;
  if (activeCount >= MAX_PROJECTS_PER_PROFESSIONAL) {
    return {
      ok: false,
      error: `الحد الأقصى ${MAX_PROJECTS_PER_PROFESSIONAL} مشروعاً لكل حساب — احذف مشروعاً قديماً أو تواصل مع الإدارة`,
    };
  }

  const status: ProfessionalProjectStatus = options.asDraft
    ? "draft"
    : resolveProjectStatus(record);
  const project = projectFromInput(
    input,
    { order: record.projects.length + 1 },
    status,
    status === "approved" ? "auto" : undefined
  );
  saveProfessionals(
    records.map((item) =>
      item.id === professionalId
        ? {
            ...item,
            projects: [...item.projects, project],
            updatedAt: new Date().toISOString(),
          }
        : item
    )
  );
  return { ok: true, project };
}

/** تعديل مشروع — أي تعديل يعيده للمراجعة من جديد (أو يبقيه مسودة) */
export function updateProfessionalProject(
  professionalId: string,
  projectId: string,
  input: ProfessionalProjectInput,
  options: { asDraft?: boolean } = {}
): ProjectMutationResult {
  const records = getProfessionals();
  const record = records.find((item) => item.id === professionalId);
  if (!record) return { ok: false, error: "السجل غير موجود" };
  const current = record.projects.find((project) => project.id === projectId);
  if (!current) return { ok: false, error: "المشروع غير موجود" };
  if (!input.titleAr.trim()) {
    return { ok: false, error: "اسم المشروع أو العرض مطلوب" };
  }

  /* أي تعديل يعيد المشروع للمراجعة، إلا لو السجل مصرّح له بالنشر المباشر */
  const status: ProfessionalProjectStatus = options.asDraft
    ? "draft"
    : resolveProjectStatus(record);
  const updated = projectFromInput(
    input,
    current,
    status,
    status === "approved" ? "auto" : undefined
  );
  saveProfessionals(
    records.map((item) =>
      item.id === professionalId
        ? {
            ...item,
            projects: item.projects.map((project) =>
              project.id === projectId ? updated : project
            ),
            updatedAt: new Date().toISOString(),
          }
        : item
    )
  );
  return { ok: true, project: updated };
}

export function removeProfessionalProject(
  professionalId: string,
  projectId: string
): void {
  saveProfessionals(
    getProfessionals().map((record) =>
      record.id === professionalId
        ? {
            ...record,
            projects: record.projects.filter(
              (project) => project.id !== projectId
            ),
            updatedAt: new Date().toISOString(),
          }
        : record
    )
  );
}

/** اعتماد/رفض مشروع من الإدارة */
export function setProfessionalProjectStatus(
  professionalId: string,
  projectId: string,
  status: ProfessionalProjectStatus,
  reviewNote?: string,
  actor?: { name?: string; role?: string }
): void {
  const now = new Date().toISOString();
  const action: ProjectEventAction =
    status === "approved"
      ? "approved"
      : status === "rejected"
        ? "rejected"
        : status === "archived"
          ? "archived"
          : status === "draft"
            ? "draft"
            : "submitted";
  saveProfessionals(
    getProfessionals().map((record) =>
      record.id === professionalId
        ? {
            ...record,
            projects: record.projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    status,
                    publishedBy: status === "approved" ? "admin" : project.publishedBy,
                    reviewNote: reviewNote ?? project.reviewNote,
                    reviewedAt: status === "pending" ? undefined : now,
                    history: withEvent(project, action, {
                      by: actor?.name,
                      byRole: actor?.role,
                      note: reviewNote,
                    }),
                  }
                : project
            ),
            updatedAt: now,
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

function writeRequests(requests: ProfessionalRequest[]): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(
      PROFESSIONAL_REQUESTS_KEY,
      JSON.stringify({ items: requests, updatedAt: new Date().toISOString() })
    );
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(PROFESSIONAL_REQUESTS_EVENT));
  return true;
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
  const saved = writeRequests([
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
  if (!saved) {
    return {
      ok: false,
      error: "تعذّر إرسال الطلب — مساحة التخزين في المتصفح ممتلئة أو غير متاحة",
    };
  }
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

/* ============================ صفحة المشروع/العرض ============================ */

export interface PublicProjectEntry {
  record: ProfessionalRecord;
  project: ProfessionalProject;
}

/**
 * شرطان للنشر: السجل معتمد + المشروع معتمد.
 * أي مشروع لم يُعتمد يبقى مخفياً تماماً عن الزوار.
 */
export function isProjectPublic(
  record: ProfessionalRecord,
  project: ProfessionalProject
): boolean {
  return record.status === "approved" && project.status === "approved";
}

/** البحث عن مشروع بمعرّفه — لصفحة العرض المستقلة */
export function findPublicProject(projectId: string): PublicProjectEntry | null {
  if (!projectId) return null;
  for (const record of getProfessionals()) {
    const project = record.projects.find((item) => item.id === projectId);
    if (!project) continue;
    return isProjectPublic(record, project) ? { record, project } : null;
  }
  return null;
}

/** نسخة إدارية تتجاوز بوابة النشر — لمعاينة الأدمن قبل الاعتماد */
export function findProjectForAdmin(projectId: string): PublicProjectEntry | null {
  if (!projectId) return null;
  for (const record of getProfessionals()) {
    const project = record.projects.find((item) => item.id === projectId);
    if (project) return { record, project };
  }
  return null;
}

/** كل المشاريع المنشورة — جاهزة لأي فهرس أو سلايدر لاحقاً */
export function getPublicProjects(): PublicProjectEntry[] {
  return getProfessionals()
    .filter((record) => record.status === "approved")
    .flatMap((record) =>
      record.projects
        .filter((project) => project.status === "approved")
        .map((project) => ({ record, project }))
    )
    .sort((a, b) => a.project.order - b.project.order);
}

/** تمييز مشروع من الإدارة ليظهر في الأماكن المميزة */
export function setProfessionalProjectFeatured(
  professionalId: string,
  projectId: string,
  featured: boolean,
  actor?: { name?: string; role?: string }
): boolean {
  return saveProfessionals(
    getProfessionals().map((record) =>
      record.id === professionalId
        ? {
            ...record,
            projects: record.projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    featured,
                    history: withEvent(
                      project,
                      featured ? "featured" : "unfeatured",
                      { by: actor?.name, byRole: actor?.role }
                    ),
                  }
                : project
            ),
            updatedAt: new Date().toISOString(),
          }
        : record
    )
  );
}

/** المشاريع المميزة من الإدارة — تُستخدم في الرئيسية */
export function getFeaturedProjects(): PublicProjectEntry[] {
  return getPublicProjects().filter((entry) => entry.project.featured === true);
}

/** التحكم من الإدارة: السماح للمهني بالنشر المباشر أو إلزامه بالمراجعة */
export function setProfessionalPublishPolicy(
  professionalId: string,
  policy: "review" | "auto"
): boolean {
  return saveProfessionals(
    getProfessionals().map((record) =>
      record.id === professionalId
        ? { ...record, publishPolicy: policy, updatedAt: new Date().toISOString() }
        : record
    )
  );
}

/* ============================ خطافات React ============================ */

export function useProfessionals(): ProfessionalRecord[] {
  return useProfessionalsState().records;
}

/**
 * نسخة تُرجع أيضاً هل تمت مزامنة التخزين — تمنع ظهور «غير موجود» قبل التحميل.
 */
export function useProfessionalsState(): {
  records: ProfessionalRecord[];
  ready: boolean;
} {
  const [records, setRecords] = useState<ProfessionalRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setRecords(getProfessionals());
      setReady(true);
    };
    sync();
    window.addEventListener(PROFESSIONALS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROFESSIONALS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { records, ready };
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
