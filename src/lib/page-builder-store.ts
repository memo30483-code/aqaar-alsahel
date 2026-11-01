/**
 * محرك بناء الصفحات — نسخة معمّمة من Builder الرئيسية تعمل على كل صفحات المحتوى.
 *
 * الفكرة:
 * - كل صفحة لها `pageId` ومجموعة أقسام (`PageBlock`) مستقلة.
 * - نفس محرك التنسيق (`HomeBlockStyle`) يُطبَّق على أي قسم في أي صفحة.
 * - التخزين مفتاح واحد يضم كل الصفحات، مع ترحيل تلقائي لبيانات البلدر القديمة
 *   الخاصة بالرئيسية حتى لا يفقد الأدمن أي إعداد سابق.
 *
 * التخزين حالياً localStorage (متصفح الأدمن)، وبنيته جاهزة للترحيل إلى قاعدة
 * بيانات لاحقاً: يكفي استبدال readStore/writeStore بنداءات API.
 */
import { useEffect, useMemo, useState } from "react";
import { blockOrder, isBlockEnabled, type BlockKey } from "@/lib/admin-system";
import { sanitizeBlockStyle, type HomeBlockStyle } from "@/lib/home-block-style";

/* ============================ الأنواع ============================ */

export type PageBlockType =
  /* أقسام الرئيسية */
  | "hero"
  | "verify_strip"
  | "marquee"
  | "featured_listings"
  | "projects_slider"
  | "ad_slider"
  | "inline_ad"
  | "ad_band"
  | "story_dossier"
  | "manage_note"
  /* أقسام عامة قابلة للإضافة */
  | "text"
  | "banner"
  | "cities"
  | "stats"
  | "faq"
  | "cta"
  /* أقسام صفحات المحتوى */
  | "page_header"
  | "steps"
  | "professionals_directory"
  | "embed_section"
  | "contact_block";

export interface PageBlockItem {
  id: string;
  titleAr: string;
  titleEn?: string;
  textAr?: string;
  textEn?: string;
  imageUrl?: string;
  linkUrl?: string;
}

export interface PageBlock {
  id: string;
  type: PageBlockType;
  visible: boolean;
  order: number;
  eyebrowAr?: string;
  eyebrowEn?: string;
  titleAr?: string;
  titleEn?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  bodyAr?: string;
  bodyEn?: string;
  imageUrl?: string;
  /** فيديو القسم: ملف mp4/webm أو رابط يوتيوب/فيميو */
  videoUrl?: string;
  linkUrl?: string;
  linkLabelAr?: string;
  linkLabelEn?: string;
  /** زر ثانوي اختياري (رأس الصفحة) */
  secondaryUrl?: string;
  secondaryLabelAr?: string;
  secondaryLabelEn?: string;
  tone?: "navy" | "sand" | "white";
  items?: PageBlockItem[];
  /** تنسيق القسم الكامل */
  style?: HomeBlockStyle;
  /** قسم مدمج: معرّف المكوّن الجاهز */
  componentId?: EmbedComponentId;
  /** دليل المهنيين: نوع المهني */
  kind?: "developer" | "marketer" | "lawyer" | "engineer";
  /** دليل المهنيين: إظهار الهيرو الداخلي أم لا */
  showIntro?: boolean;
}

export type EmbedComponentId = "market_guide" | "company" | "projects_index";

/* ============================ سجل الصفحات ============================ */

export type PageId =
  | "home"
  | "market-guide"
  | "company"
  | "projects"
  | "engineering-consultational"
  | "legal-consultational"
  | "developers"
  | "brokers"
  | "lawyers"
  | "engineers"
  /* صفحات النماذج — التنسيق متاح والبناء مقفول */
  | "add-property"
  | "join"
  | "register"
  | "login"
  /* قوالب التفاصيل والصفحات المساندة */
  | "property"
  | "project"
  | "developer"
  | "broker"
  | "lawyer"
  | "engineer"
  | "professional"
  | "offers"
  | "privacy"
  | "terms"
  | "sitemap";

export type PageFamily = "content" | "form" | "dynamic";

export interface PageMeta {
  id: PageId;
  path: string;
  labelAr: string;
  labelEn: string;
  family: PageFamily;
  /** وصف قصير يظهر في لوحة التحكم */
  description: string;
  /** الأقسام الافتراضية للصفحة */
  defaults: PageBlock[];
  /** هل يمكن للأدمن بناء الصفحة من أقسام؟ (النماذج والقوالب تقبل التنسيق فقط) */
  blocksEnabled?: boolean;
}

export const PAGE_FAMILY_LABEL: Record<PageFamily, string> = {
  content: "صفحة محتوى",
  form: "صفحة نموذج",
  dynamic: "صفحة ديناميكية",
};

function header(
  overrides: Partial<PageBlock> & { titleAr: string }
): PageBlock {
  return {
    id: "page-header",
    type: "page_header",
    visible: true,
    order: 1,
    tone: "navy",
    ...overrides,
  };
}

function directory(
  kind: PageBlock["kind"],
  order = 3
): PageBlock {
  return {
    id: `directory-${kind}`,
    type: "professionals_directory",
    visible: true,
    order,
    kind,
    /* رأس الصفحة وشريط الثقة يغطيان المقدمة — منع التكرار */
    showIntro: false,
  };
}

function trust(order = 2): PageBlock {
  return { id: "trust-strip", type: "verify_strip", visible: true, order };
}

const HOME_DEFAULTS: PageBlock[] = [
  "hero",
  "verify_strip",
  "marquee",
  "featured_listings",
  "ad_band",
  "projects_slider",
  "ad_slider",
  "inline_ad",
  "story_dossier",
  "manage_note",
].map((type, index) => ({
  id: type,
  type: type as PageBlockType,
  visible: true,
  order: index + 1,
}));

export const PAGE_REGISTRY: PageMeta[] = [
  {
    id: "home",
    path: "/",
    labelAr: "الصفحة الرئيسية",
    labelEn: "Home",
    family: "content",
    description: "الهيرو، العقارات، المشاريع، القصة، وكل أقسام الرئيسية.",
    defaults: HOME_DEFAULTS,
  },
  {
    id: "market-guide",
    path: "/market-guide",
    labelAr: "البوصلة العقارية",
    labelEn: "Market guide",
    family: "content",
    description: "دليل السوق ومؤشرات الأسعار، مع رأس صفحة قابل للتحرير.",
    defaults: [
      header({
        eyebrowAr: "البوصلة العقارية",
        titleAr: "افهم السوق قبل ما تشتري",
        subtitleAr:
          "مؤشرات أسعار ومقارنات بين مدن الدلتا، مبنية على بيانات الإعلانات الموثقة على المنصة.",
        tone: "navy",
      }),
      {
        id: "embed-market-guide",
        type: "embed_section",
        visible: true,
        order: 2,
        componentId: "market_guide",
      },
    ],
  },
  {
    id: "company",
    path: "/company",
    labelAr: "بيانات الشركة",
    labelEn: "Company",
    family: "content",
    description: "من نحن، الرؤية، وبيانات الشركة الرسمية.",
    defaults: [
      header({
        eyebrowAr: "عن المنصة",
        titleAr: "عقار FAMILY — عقار أحلامك بثقة موثقة",
        subtitleAr:
          "منصة عقارية تجمع التوثيق القانوني والفحص الهندسي في مكان واحد، وكل تواصل يمر عبر إدارة المنصة.",
        tone: "navy",
      }),
      {
        id: "embed-company",
        type: "embed_section",
        visible: true,
        order: 2,
        componentId: "company",
      },
    ],
  },
  {
    id: "projects",
    path: "/projects",
    labelAr: "المشاريع",
    labelEn: "Projects",
    family: "content",
    description: "فهرس مشاريع المطورين المعتمدين.",
    defaults: [
      header({
        eyebrowAr: "مشاريع معتمدة",
        titleAr: "مشاريع مطورين موثّقين",
        subtitleAr:
          "كل مشروع هنا مرّ على مراجعة الإدارة، وتُعرض وحداته وأسعاره ومواعيد تسليمه بوضوح.",
        tone: "navy",
      }),
      {
        id: "embed-projects",
        type: "embed_section",
        visible: true,
        order: 2,
        componentId: "projects_index",
      },
    ],
  },
  {
    id: "engineering-consultational",
    path: "/engineering-consultational",
    labelAr: "الاستشارات الهندسية",
    labelEn: "Engineering consultations",
    family: "content",
    description: "خدمة الفحص الهندسي مع دليل المكاتب المعتمدة.",
    defaults: [
      header({
        eyebrowAr: "خدمة الاستشارات الهندسية",
        titleAr: "الاستشارات الهندسية",
        subtitleAr:
          "قبل ما تدفع مقدم أي عقار، خلّي المبنى نفسه يتفحص. مكتب هندسي معتمد يراجع الإنشاءات والرسومات والتراخيص.",
        linkLabelAr: "تصفح المكاتب الهندسية",
        linkUrl: "/engineers",
        secondaryLabelAr: "سجّل مكتبك الهندسي",
        secondaryUrl: "/join?role=engineer",
        tone: "navy",
      }),
      {
        id: "engineering-steps",
        type: "steps",
        visible: true,
        order: 2,
        tone: "sand",
        titleAr: "الخدمة بثلاث خطوات",
        items: [
          {
            id: "step-1",
            titleAr: "فحص فني قبل الشراء",
            textAr:
              "تقرير مصور عن حالة الأساسات والإنشاءات والتشطيبات، مع توصيات المعالجة وتقدير التكلفة.",
          },
          {
            id: "step-2",
            titleAr: "مراجعة الرسومات والمستندات",
            textAr:
              "مطابقة الرسومات التنفيذية للواقع ومراجعة تراخيص البناء والاشتراطات قبل التعاقد.",
          },
          {
            id: "step-3",
            titleAr: "إشراف على التنفيذ",
            textAr:
              "زيارات دورية وتقارير جودة لكل مرحلة، من الأعمال الخرسانية حتى التسليم النهائي.",
          },
        ],
      },
      trust(3),
      directory("engineer", 4),
    ],
  },
  {
    id: "legal-consultational",
    path: "/legal-consultational",
    labelAr: "الاستشارات القانونية",
    labelEn: "Legal consultations",
    family: "content",
    description: "خدمة مراجعة العقود والملكية مع دليل المحامين.",
    defaults: [
      header({
        eyebrowAr: "خدمة الاستشارات القانونية",
        titleAr: "الاستشارات القانونية",
        subtitleAr:
          "قبل ما تدفع مقدم أي عقار، خلّي عقدك يتفحص. محامٍ معتمد يراجع الملكية، الرهون، تراخيص المطور، وبنود العقد والغرامات.",
        linkLabelAr: "تصفح المحامين المعتمدين",
        linkUrl: "/lawyers",
        secondaryLabelAr: "سجّل كمحامٍ معتمد",
        secondaryUrl: "/join?role=lawyer",
        tone: "navy",
      }),
      trust(2),
      directory("lawyer", 3),
    ],
  },
  {
    id: "developers",
    path: "/developers",
    labelAr: "دليل المطورين",
    labelEn: "Developers",
    family: "content",
    description: "دليل شركات التطوير العقاري المعتمدة.",
    defaults: [
      header({
        eyebrowAr: "دليل المطورين المعتمدين",
        titleAr: "مطورون موثّقون… مشروعات على أرض الواقع",
        subtitleAr:
          "شركات تطوير عقاري مرّت مستنداتها على مراجعة الإدارة، وتُعرض مشروعاتها وريلز التعريف بها. التوثيق لا يُشترى بالإعلانات.",
        linkLabelAr: "انضم كمطور معتمد",
        linkUrl: "/join?role=developer",
        secondaryLabelAr: "تصفح المشاريع",
        secondaryUrl: "/projects",
        tone: "navy",
      }),
      trust(2),
      directory("developer", 3),
    ],
  },
  {
    id: "brokers",
    path: "/brokers",
    labelAr: "دليل المسوقين",
    labelEn: "Marketers",
    family: "content",
    description: "دليل المسوقين العقاريين المعتمدين.",
    defaults: [
      header({
        eyebrowAr: "دليل المسوقين المعتمدين",
        titleAr: "مسوقون موثّقون… عروض بعقود موثقة",
        subtitleAr:
          "مسوقون عقاريون مرّ سجلهم التجاري على مراجعة الإدارة، ويعرضون وحدات موثقة فقط.",
        linkLabelAr: "انضم كمسوق معتمد",
        linkUrl: "/join?role=marketer",
        secondaryLabelAr: "تصفح العقارات",
        secondaryUrl: "/#properties",
        tone: "navy",
      }),
      trust(2),
      directory("marketer", 3),
    ],
  },
  {
    id: "lawyers",
    path: "/lawyers",
    labelAr: "دليل المحامين",
    labelEn: "Lawyers",
    family: "content",
    description: "دليل المحامين المعتمدين بعد التحقق من الكارنيه.",
    defaults: [
      header({
        eyebrowAr: "دليل المحامين المعتمدين",
        titleAr: "محامون موثّقون… عقدك في أيدٍ أمينة",
        subtitleAr:
          "محامون مرّ كارنيه المحاماة على المراجعة، لفحص الملكية وصياغة العقود والتسجيل العقاري.",
        linkLabelAr: "انضم كمحامٍ معتمد",
        linkUrl: "/join?role=lawyer",
        secondaryLabelAr: "اطلب استشارة قانونية",
        secondaryUrl: "/legal-consultational",
        tone: "navy",
      }),
      trust(2),
      directory("lawyer", 3),
    ],
  },
  {
    id: "engineers",
    path: "/engineers",
    labelAr: "دليل المكاتب الهندسية",
    labelEn: "Engineering offices",
    family: "content",
    description: "دليل المكاتب الهندسية المعتمدة مع سابقة الأعمال.",
    defaults: [
      header({
        eyebrowAr: "دليل المكاتب الهندسية",
        titleAr: "مكاتب هندسية معتمدة… افحص قبل ما تدفع",
        subtitleAr:
          "مكاتب مرّ كارنيه نقابة المهندسين والسجل التجاري على المراجعة، وتُعرض سابقة أعمالها وخدمات الفحص الفني والإشراف.",
        linkLabelAr: "انضم كمكتب هندسي معتمد",
        linkUrl: "/join?role=engineer",
        secondaryLabelAr: "اطلب فحص هندسي",
        secondaryUrl: "/engineering-consultational",
        tone: "navy",
      }),
      trust(2),
      directory("engineer", 3),
    ],
  },
  /* ==================== صفحات النماذج ==================== */
  {
    id: "add-property",
    path: "/add-property",
    labelAr: "إضافة عقار",
    labelEn: "Add property",
    family: "form",
    description:
      "نموذج إضافة عقار بخطواته. تحكم في الخط والأحجام والألوان والخلفية، والنموذج نفسه مقفول لحماية البيانات.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "join",
    path: "/join",
    labelAr: "انضم كمهني",
    labelEn: "Join",
    family: "form",
    description:
      "نموذج تسجيل المطورين والمسوقين والمحامين والمكاتب الهندسية. التنسيق متاح والنموذج مقفول.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "register",
    path: "/register",
    labelAr: "إنشاء حساب",
    labelEn: "Register",
    family: "form",
    description:
      "نموذج إنشاء الحساب والتحقق. التنسيق متاح والنموذج مقفول.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "login",
    path: "/login",
    labelAr: "تسجيل الدخول",
    labelEn: "Login",
    family: "form",
    description:
      "صفحة تسجيل الدخول. تحكم في الخط والألوان والخلفية، والنموذج مقفول.",
    defaults: [],
    blocksEnabled: false,
  },
  /* ==================== قوالب التفاصيل ==================== */
  {
    id: "property",
    path: "/property/[id]",
    labelAr: "قالب صفحة العقار",
    labelEn: "Property template",
    family: "dynamic",
    description:
      "قالب تفاصيل العقار لكل الإعلانات. تحكم في الخط والأحجام والألوان، والبيانات تبقى ديناميكية.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "project",
    path: "/projects/[id]",
    labelAr: "قالب صفحة المشروع",
    labelEn: "Project template",
    family: "dynamic",
    description:
      "قالب تفاصيل المشروع. تحكم في التنسيق العام، والبيانات تبقى ديناميكية.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "developer",
    path: "/developers/[id]",
    labelAr: "قالب ملف المطور",
    labelEn: "Developer profile",
    family: "dynamic",
    description:
      "قالب الملف الكامل للمطور. تحكم في التنسيق العام، والبيانات تبقى ديناميكية.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "broker",
    path: "/brokers/[id]",
    labelAr: "قالب ملف المسوق",
    labelEn: "Marketer profile",
    family: "dynamic",
    description:
      "قالب الملف الكامل للمسوق. تحكم في التنسيق العام، والبيانات تبقى ديناميكية.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "lawyer",
    path: "/lawyers/[id]",
    labelAr: "قالب ملف المحامي",
    labelEn: "Lawyer profile",
    family: "dynamic",
    description:
      "قالب الملف الكامل للمحامي. تحكم في التنسيق العام، والبيانات تبقى ديناميكية.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "engineer",
    path: "/engineers/[id]",
    labelAr: "قالب ملف المكتب الهندسي",
    labelEn: "Engineering office profile",
    family: "dynamic",
    description:
      "قالب الملف الكامل للمكتب الهندسي. تحكم في التنسيق العام، والبيانات تبقى ديناميكية.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "professional",
    path: "/professional",
    labelAr: "لوحة المهني",
    labelEn: "Professional dashboard",
    family: "dynamic",
    description:
      "لوحة صاحب الحساب المهني. تحكم في التنسيق العام، والبيانات تبقى ديناميكية.",
    defaults: [],
    blocksEnabled: false,
  },
  /* ==================== صفحات مساندة ==================== */
  {
    id: "offers",
    path: "/offers",
    labelAr: "العروض والتخفيضات",
    labelEn: "Offers",
    family: "content",
    description:
      "صفحة العروض النشطة. تحكم في التنسيق العام؛ بنية الصفحة مقفولة حاليًا.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "privacy",
    path: "/privacy",
    labelAr: "سياسة الخصوصية",
    labelEn: "Privacy policy",
    family: "content",
    description:
      "مستند سياسة الخصوصية. تحكم في الخط والأحجام والألوان والخلفية.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "terms",
    path: "/terms",
    labelAr: "الشروط والأحكام",
    labelEn: "Terms",
    family: "content",
    description:
      "مستند الشروط والأحكام. تحكم في الخط والأحجام والألوان والخلفية.",
    defaults: [],
    blocksEnabled: false,
  },
  {
    id: "sitemap",
    path: "/sitemap",
    labelAr: "خريطة الموقع",
    labelEn: "Sitemap",
    family: "content",
    description:
      "خريطة الموقع. تحكم في التنسيق العام للصفحة.",
    defaults: [],
    blocksEnabled: false,
  },
];

export function getPageMeta(pageId: PageId): PageMeta {
  return PAGE_REGISTRY.find((page) => page.id === pageId) ?? PAGE_REGISTRY[0];
}

/**
 * يطابق مساراً فعلياً بصفحة في السجل.
 * يدعم القوالب الديناميكية مثل `/developers/eng-nile` → `developer`.
 */
export function pageIdForPath(pathname: string): PageId | undefined {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const exact = PAGE_REGISTRY.find((page) => page.path === clean);
  if (exact) return exact.id;
  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 2) {
    const parent = `/${segments[0]}/[`;
    const dynamic = PAGE_REGISTRY.find((page) => page.path.startsWith(parent));
    if (dynamic) return dynamic.id;
  }
  return undefined;
}

/* ============================ ميتا الأقسام ============================ */

export interface BlockTypeMeta {
  label: string;
  description: string;
  /** قسم يعيش داخل شبكة العقارات ولا يمكن سحبه لموضع مستقل */
  locked?: boolean;
  /** الأقسام المتاحة في صفحات المحتوى غير الرئيسية */
  contentOnly?: boolean;
}

export const BLOCK_TYPE_META: Record<PageBlockType, BlockTypeMeta> = {
  hero: {
    label: "الهيرو + البحث",
    description: "الواجهة الرئيسية مع صورة الغلاف وكارت البحث",
  },
  verify_strip: {
    label: "شريط التحقق والتوثيق",
    description: "خطوات التحقق الثلاث الموثقة",
  },
  marquee: {
    label: "الشريط المتحرك",
    description: "أخبار وشركاء وإعلانات متحركة — تُدار من تبويب البنرات",
  },
  featured_listings: {
    label: "شبكة العقارات",
    description: "أحدث العقارات مع الفلاتر وزر عرض المزيد",
  },
  projects_slider: {
    label: "سلايدر المشاريع",
    description: "مشاريع المطورين المعتمدين",
  },
  ad_slider: {
    label: "شريط إعلانات منزلق",
    description: "بانرات إعلانية منزلقة",
  },
  inline_ad: {
    label: "إعلان داخل شبكة العقارات",
    description: "بطاقة إعلانية تظهر وسط نتائج العقارات — الترتيب غير مؤثر",
    locked: true,
  },
  ad_band: {
    label: "شريط الإعلانات العريض",
    description: "شريط دعوة لإعلانات المطورين",
  },
  story_dossier: {
    label: "قصة المنصة + ملف التحقق",
    description: "قسم القصة مع بطاقة ملف التحقق",
  },
  manage_note: {
    label: "سياسة التواصل",
    description: "شريط تذكير بأن كل التواصل عبر إدارة المنصة",
  },
  text: {
    label: "قسم نصي",
    description: "عنوان ونص حر — مناسب للنبذة أو الإعلان أو الشروط",
  },
  banner: {
    label: "بانر بصورة",
    description: "صورة مع عنوان وزر — مناسب للعروض والحملات",
  },
  cities: {
    label: "شبكة المدن",
    description: "يعرض المدن المفعّلة تلقائياً من سجل المدن",
  },
  stats: {
    label: "أرقام ومؤشرات",
    description: "بطاقات أرقام مع وصف — تُحرَّر بالكامل",
  },
  faq: {
    label: "أسئلة شائعة",
    description: "قائمة أسئلة وإجابات قابلة للطي",
  },
  cta: {
    label: "دعوة لاتخاذ إجراء",
    description: "عنوان ونص وزر رابط",
  },
  page_header: {
    label: "رأس صفحة",
    description: "عنوان الصفحة ووصفها وأزرارها — أساس كل صفحة محتوى",
    contentOnly: true,
  },
  steps: {
    label: "خطوات مرقّمة",
    description: "ثلاث خطوات أو أكثر مع عنوان ووصف لكل خطوة",
    contentOnly: true,
  },
  professionals_directory: {
    label: "دليل المهنيين",
    description: "دليل المطورين أو المسوقين أو المحامين أو المكاتب الهندسية",
    contentOnly: true,
  },
  embed_section: {
    label: "قسم مدمج",
    description: "محتوى جاهز من المنصة (البوصلة، الشركة، فهرس المشاريع)",
    contentOnly: true,
    locked: true,
  },
  contact_block: {
    label: "تواصل مع الإدارة",
    description: "صندوق تواصل يوضح أن كل التواصل يمر عبر إدارة المنصة",
    contentOnly: true,
  },
};

export const CORE_BLOCK_TYPES: PageBlockType[] = [
  "hero",
  "verify_strip",
  "marquee",
  "featured_listings",
  "projects_slider",
  "ad_slider",
  "inline_ad",
  "ad_band",
  "story_dossier",
  "manage_note",
];

export const CUSTOM_BLOCK_TYPES: PageBlockType[] = [
  "text",
  "banner",
  "cities",
  "stats",
  "faq",
  "cta",
  "page_header",
  "steps",
  "professionals_directory",
  "embed_section",
  "contact_block",
];

export const ADDABLE_BLOCK_TYPES: PageBlockType[] = [
  ...CORE_BLOCK_TYPES,
  ...CUSTOM_BLOCK_TYPES,
];

/** الأقسام المتاحة لصفحة معيّنة — الرئيسية تحتفظ بكل القوالب، وغيرها بالأقسام العامة. */
export function addableTypesFor(pageId: PageId): PageBlockType[] {
  if (pageId === "home") return ADDABLE_BLOCK_TYPES;
  const contentShared: PageBlockType[] = [
    "page_header",
    "text",
    "banner",
    "stats",
    "steps",
    "faq",
    "cta",
    "cities",
    "verify_strip",
    "professionals_directory",
    "embed_section",
    "contact_block",
    "ad_slider",
    "marquee",
  ];
  return ADDABLE_BLOCK_TYPES.filter((type) => contentShared.includes(type));
}

export function isCoreBlockType(type: PageBlockType): boolean {
  return CORE_BLOCK_TYPES.includes(type);
}

export function isCustomBlockType(type: PageBlockType): boolean {
  return CUSTOM_BLOCK_TYPES.includes(type);
}

/* ============================ التخزين ============================ */

export const PAGE_BUILDER_KEY = "aqaar-page-builder-v1";
export const PAGE_BUILDER_EVENT = "aqaar:page-builder";
/** مفتاح البلدر القديم — يُقرأ مرة واحدة للترحيل */
export const LEGACY_HOME_KEY = "aqaar-home-builder";

interface StoredPage {
  items: PageBlock[];
  updatedAt?: string;
  /** تنسيق الصفحة العام: الخط الأساسي، الحجم، اللون، الخلفية */
  style?: HomeBlockStyle;
}

interface StoredState {
  pages: Record<string, StoredPage>;
  updatedAt?: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function cloneBlocks(blocks: PageBlock[]): PageBlock[] {
  return blocks.map((block) => ({
    ...block,
    items: block.items?.map((item) => ({ ...item })),
    style: block.style ? { ...block.style } : undefined,
  }));
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeItem(raw: unknown, index: number): PageBlockItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<PageBlockItem>;
  const titleAr = typeof item.titleAr === "string" ? item.titleAr.trim() : "";
  if (!titleAr && !item.textAr) return null;
  return {
    id: toStringOrUndefined(item.id) ?? `item-${index + 1}`,
    titleAr,
    titleEn: toStringOrUndefined(item.titleEn),
    textAr: toStringOrUndefined(item.textAr),
    textEn: toStringOrUndefined(item.textEn),
    imageUrl: toStringOrUndefined(item.imageUrl),
    linkUrl: toStringOrUndefined(item.linkUrl),
  };
}

function normalizeBlock(raw: Partial<PageBlock>, index: number): PageBlock | null {
  const type = raw.type as PageBlockType | undefined;
  if (!type || !(type in BLOCK_TYPE_META)) return null;
  const kind =
    raw.kind === "developer" ||
    raw.kind === "marketer" ||
    raw.kind === "lawyer" ||
    raw.kind === "engineer"
      ? raw.kind
      : undefined;
  const componentId =
    raw.componentId === "market_guide" ||
    raw.componentId === "company" ||
    raw.componentId === "projects_index"
      ? raw.componentId
      : undefined;
  return {
    id: toStringOrUndefined(raw.id) ?? `${type}-${index + 1}`,
    type,
    visible: raw.visible !== false,
    order: Number.isFinite(raw.order) ? Number(raw.order) : index + 1,
    eyebrowAr: toStringOrUndefined(raw.eyebrowAr),
    eyebrowEn: toStringOrUndefined(raw.eyebrowEn),
    titleAr: toStringOrUndefined(raw.titleAr),
    titleEn: toStringOrUndefined(raw.titleEn),
    subtitleAr: toStringOrUndefined(raw.subtitleAr),
    subtitleEn: toStringOrUndefined(raw.subtitleEn),
    bodyAr: toStringOrUndefined(raw.bodyAr),
    bodyEn: toStringOrUndefined(raw.bodyEn),
    imageUrl: toStringOrUndefined(raw.imageUrl),
    videoUrl: toStringOrUndefined(raw.videoUrl),
    linkUrl: toStringOrUndefined(raw.linkUrl),
    linkLabelAr: toStringOrUndefined(raw.linkLabelAr),
    linkLabelEn: toStringOrUndefined(raw.linkLabelEn),
    secondaryUrl: toStringOrUndefined(raw.secondaryUrl),
    secondaryLabelAr: toStringOrUndefined(raw.secondaryLabelAr),
    secondaryLabelEn: toStringOrUndefined(raw.secondaryLabelEn),
    tone:
      raw.tone === "navy" || raw.tone === "sand" || raw.tone === "white"
        ? raw.tone
        : undefined,
    items: Array.isArray(raw.items)
      ? raw.items
          .map((item, position) => normalizeItem(item, position))
          .filter((item): item is PageBlockItem => item !== null)
      : undefined,
    style: sanitizeBlockStyle(raw.style),
    componentId,
    kind,
    showIntro: raw.showIntro !== false,
  };
}

function sortBlocks(blocks: PageBlock[]): PageBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

function readState(): StoredState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(PAGE_BUILDER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const pages = (parsed as { pages?: unknown }).pages;
    if (!pages || typeof pages !== "object") return null;
    return { pages: pages as Record<string, StoredPage> };
  } catch {
    return null;
  }
}

function writeState(state: StoredState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      PAGE_BUILDER_KEY,
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() })
    );
  } catch {
    return;
  }
  window.dispatchEvent(new Event(PAGE_BUILDER_EVENT));
}

function readLegacyHome(): PageBlock[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(LEGACY_HOME_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PageBlock[];
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return (parsed as { items: PageBlock[] }).items;
    }
    return null;
  } catch {
    return null;
  }
}

function defaultBlocksFor(pageId: PageId): PageBlock[] {
  const meta = getPageMeta(pageId);
  if (pageId !== "home") return cloneBlocks(meta.defaults);
  /* الرئيسية: نُرحّل إخفاء/ترتيب الإعدادات القديمة عند أول استخدام */
  return sortBlocks(
    cloneBlocks(meta.defaults).map((block) => ({
      ...block,
      visible: isBlockEnabled(block.type as BlockKey),
      order: blockOrder(block.type as BlockKey),
    }))
  );
}

/* ============================ القراءة والكتابة ============================ */

export function getPageBlocks(pageId: PageId): PageBlock[] {
  const state = readState();
  const stored = state?.pages?.[pageId];

  if (!stored) {
    if (pageId === "home") {
      const legacy = readLegacyHome();
      if (legacy) {
        const normalized = legacy
          .map((block, index) => normalizeBlock(block, index))
          .filter((block): block is PageBlock => block !== null);
        if (normalized.length > 0) return sortBlocks(normalized);
      }
    }
    return defaultBlocksFor(pageId);
  }

  const normalized = (stored.items ?? [])
    .map((block, index) => normalizeBlock(block, index))
    .filter((block): block is PageBlock => block !== null);

  return normalized.length > 0 ? sortBlocks(normalized) : defaultBlocksFor(pageId);
}

export function savePageBlocks(pageId: PageId, blocks: PageBlock[]): void {
  if (!isBrowser()) return;
  const state = readState() ?? { pages: {} };
  const normalized = blocks.map((block, index) => ({
    ...block,
    order: index + 1,
  }));
  writeState({
    ...state,
    pages: {
      ...state.pages,
      [pageId]: { items: normalized, updatedAt: new Date().toISOString() },
    },
  });
}

function makeId(type: PageBlockType, existing: PageBlock[]): string {
  let counter = 1;
  let candidate = `${type}-${counter}`;
  while (existing.some((block) => block.id === candidate)) {
    counter += 1;
    candidate = `${type}-${counter}`;
  }
  return candidate;
}

function defaultContent(type: PageBlockType): Partial<PageBlock> {
  switch (type) {
    case "hero":
      return {
        eyebrowAr: "عقار أحلامك يبدأ من هنا",
        titleAr: "عنوان هيرو جديد",
        subtitleAr: "اكتب وصف هذا الهيرو من لوحة التحكم.",
      };
    case "verify_strip":
      return {
        titleAr: "شريط تحقق جديد",
        subtitleAr: "اكتب وصف خطوات التحقق.",
      };
    case "marquee":
      return {
        titleAr: "شريط متحرك جديد",
        subtitleAr: "إعلانات وأخبار المنصة",
        items: [{ id: "marquee-1", titleAr: "اكتب محتوى الشريط المتحرك هنا" }],
      };
    case "featured_listings":
      return {
        eyebrowAr: "اختيارات عقار FAMILY",
        titleAr: "شبكة عقارات جديدة",
        subtitleAr: "اضبط عنوان ووصف هذه النسخة من الشبكة.",
      };
    case "projects_slider":
      return {
        eyebrowAr: "مشاريع مختارة",
        titleAr: "سلايدر مشاريع جديد",
        subtitleAr: "مشاريع المطورين المعتمدين.",
      };
    case "ad_slider":
      return {
        titleAr: "شريط إعلانات جديد",
        subtitleAr: "أضف بطاقات الإعلان وعدّل صورها وروابطها.",
        items: [
          {
            id: "ad-1",
            titleAr: "عنوان الإعلان",
            textAr: "موقع أو وصف الإعلان",
            linkUrl: "/#projects",
          },
        ],
      };
    case "inline_ad":
      return {
        titleAr: "إعلان مميز داخل العقارات",
        subtitleAr: "مساحة إعلانية واضحة وموسومة بكلمة إعلان.",
        linkLabelAr: "استكشف المشروع",
        linkUrl: "/#projects",
      };
    case "ad_band":
      return {
        titleAr: "مساحة إعلانية للمطورين",
        subtitleAr: "اكتب وصف الشريط الإعلاني هنا.",
        linkLabelAr: "أعلن معنا",
        linkUrl: "/register",
      };
    case "story_dossier":
      return {
        eyebrowAr: "لماذا عقار FAMILY؟",
        titleAr: "قصة جديدة للمنصة",
        subtitleAr: "اكتب وصف هذا القسم وهدفه.",
      };
    case "manage_note":
      return {
        titleAr: "كل التواصل عبر إدارة المنصة",
        bodyAr: "بيانات المالك ومستنداته لا تظهر للزوار.",
      };
    case "text":
      return {
        titleAr: "عنوان القسم",
        bodyAr:
          "اكتب هنا نص القسم. يمكنك استخدام هذا القسم للنبذة عن المنصة أو أي محتوى تحريري.",
        tone: "white",
      };
    case "banner":
      return {
        titleAr: "عنوان البانر",
        subtitleAr: "وصف قصير للعرض أو الحملة الإعلانية.",
        linkLabelAr: "اعرف المزيد",
        tone: "navy",
      };
    case "cities":
      return {
        titleAr: "المدن المعتمدة",
        subtitleAr: "تصفح العقارات حسب المدينة.",
        tone: "sand",
      };
    case "stats":
      return {
        titleAr: "أرقام المنصة",
        items: [
          { id: "stat-1", titleAr: "100%", textAr: "تواصل عبر الإدارة" },
          { id: "stat-2", titleAr: "3", textAr: "خطوات تحقق" },
        ],
        tone: "sand",
      };
    case "faq":
      return {
        titleAr: "أسئلة شائعة",
        items: [
          {
            id: "faq-1",
            titleAr: "كيف يتم التواصل مع المالك؟",
            textAr: "كل التواصل يتم عبر إدارة المنصة فقط.",
          },
        ],
        tone: "white",
      };
    case "cta":
      return {
        titleAr: "أضف عقارك الآن",
        subtitleAr: "ابدأ رحلة توثيق عقارك مع إدارة المنصة.",
        linkLabelAr: "أضف عقارك",
        linkUrl: "/add-property",
        tone: "navy",
      };
    case "page_header":
      return {
        eyebrowAr: "صفحة جديدة",
        titleAr: "عنوان الصفحة",
        subtitleAr: "اكتب وصفاً قصيراً يوضح محتوى الصفحة.",
        tone: "navy",
      };
    case "steps":
      return {
        titleAr: "خطوات الخدمة",
        tone: "sand",
        items: [
          { id: "step-1", titleAr: "الخطوة الأولى", textAr: "وصف الخطوة الأولى." },
          { id: "step-2", titleAr: "الخطوة الثانية", textAr: "وصف الخطوة الثانية." },
          { id: "step-3", titleAr: "الخطوة الثالثة", textAr: "وصف الخطوة الثالثة." },
        ],
      };
    case "professionals_directory":
      return { kind: "developer", showIntro: true };
    case "embed_section":
      return { componentId: "market_guide" };
    case "contact_block":
      return {
        titleAr: "تواصل مع إدارة المنصة",
        bodyAr:
          "بيانات المالك ومستنداته لا تظهر للزوار. كل استفسار أو طلب معاينة يمر عبر إدارة المنصة.",
        linkLabelAr: "تواصل معنا",
        linkUrl: "/company",
        tone: "sand",
      };
    default:
      return {};
  }
}

export function addPageBlock(
  pageId: PageId,
  type: PageBlockType
): PageBlock | null {
  const blocks = getPageBlocks(pageId);
  const block: PageBlock = {
    id: makeId(type, blocks),
    type,
    visible: true,
    order: blocks.length + 1,
    ...defaultContent(type),
  };
  savePageBlocks(pageId, [...blocks, block]);
  return block;
}

export function updatePageBlock(
  pageId: PageId,
  id: string,
  patch: Partial<PageBlock>
): void {
  savePageBlocks(
    pageId,
    getPageBlocks(pageId).map((block) =>
      block.id === id ? { ...block, ...patch, id: block.id, type: block.type } : block
    )
  );
}

export function removePageBlock(pageId: PageId, id: string): void {
  savePageBlocks(
    pageId,
    getPageBlocks(pageId).filter((block) => block.id !== id)
  );
}

export function togglePageBlock(pageId: PageId, id: string): void {
  savePageBlocks(
    pageId,
    getPageBlocks(pageId).map((block) =>
      block.id === id ? { ...block, visible: !block.visible } : block
    )
  );
}

export function duplicatePageBlock(pageId: PageId, id: string): void {
  const blocks = getPageBlocks(pageId);
  const index = blocks.findIndex((block) => block.id === id);
  if (index < 0) return;
  const source = blocks[index];
  const copy: PageBlock = {
    ...source,
    id: makeId(source.type, blocks),
    titleAr: source.titleAr ? `${source.titleAr} (نسخة)` : source.titleAr,
    items: source.items?.map((item) => ({ ...item })),
    style: source.style ? { ...source.style } : undefined,
  };
  const next = [...blocks];
  next.splice(index + 1, 0, copy);
  savePageBlocks(pageId, next);
}

/** نقل قسم إلى موضع جديد (فهرس يبدأ من صفر) */
export function movePageBlock(
  pageId: PageId,
  id: string,
  targetIndex: number
): void {
  const blocks = getPageBlocks(pageId);
  const from = blocks.findIndex((block) => block.id === id);
  if (from < 0) return;
  const target = Math.max(0, Math.min(blocks.length - 1, targetIndex));
  if (target === from) return;
  const next = [...blocks];
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  savePageBlocks(pageId, next);
}

export function movePageBlockBy(
  pageId: PageId,
  id: string,
  direction: "up" | "down"
): void {
  const blocks = getPageBlocks(pageId);
  const index = blocks.findIndex((block) => block.id === id);
  if (index < 0) return;
  movePageBlock(pageId, id, direction === "up" ? index - 1 : index + 1);
}

/** استعادة الترتيب الافتراضي للصفحة */
export function resetPageBlocks(pageId: PageId): void {
  const state = readState();
  if (state?.pages?.[pageId]) {
    const pages = { ...state.pages };
    delete pages[pageId];
    writeState({ ...state, pages });
    return;
  }
  savePageBlocks(pageId, cloneBlocks(getPageMeta(pageId).defaults));
}

/** كل الأقسام (ظاهرة ومخفية) — للوحة التحكم */
export function usePageBlocks(pageId: PageId): PageBlock[] {
  const [blocks, setBlocks] = useState<PageBlock[]>(() =>
    cloneBlocks(getPageMeta(pageId).defaults)
  );

  useEffect(() => {
    const sync = () => setBlocks(getPageBlocks(pageId));
    sync();
    window.addEventListener(PAGE_BUILDER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PAGE_BUILDER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pageId]);

  return blocks;
}

/** الأقسام الظاهرة فقط — للصفحات العامة */
export function useVisiblePageBlocks(pageId: PageId): PageBlock[] {
  const blocks = usePageBlocks(pageId);
  return useMemo(() => blocks.filter((block) => block.visible), [blocks]);
}

/* ============================ تنسيق الصفحة ============================ */

export function getPageStyle(pageId: PageId): HomeBlockStyle | undefined {
  const state = readState();
  return sanitizeBlockStyle(state?.pages?.[pageId]?.style);
}

export function savePageStyle(pageId: PageId, style: HomeBlockStyle): void {
  if (!isBrowser()) return;
  const state = readState() ?? { pages: {} };
  const current = state.pages[pageId] ?? { items: getPageBlocks(pageId) };
  writeState({
    ...state,
    pages: {
      ...state.pages,
      [pageId]: { ...current, style: sanitizeBlockStyle(style) },
    },
  });
}

export function usePageStyle(pageId: PageId): HomeBlockStyle | undefined {
  const [style, setStyle] = useState<HomeBlockStyle | undefined>(undefined);

  useEffect(() => {
    const sync = () => setStyle(getPageStyle(pageId));
    sync();
    window.addEventListener(PAGE_BUILDER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PAGE_BUILDER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [pageId]);

  return style;
}

export function blockLabel(type: PageBlockType): string {
  return BLOCK_TYPE_META[type]?.label ?? type;
}
