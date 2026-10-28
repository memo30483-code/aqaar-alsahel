/**
 * Builder الصفحة الرئيسية — سجل أقسام الرئيسية مع الترتيب والإظهار والإخفاء
 * وإضافة أقسام جديدة وتحرير محتواها.
 *
 * تعتمد الصفحة الرئيسية على ترتيب الأقسام (`order`) داخل حاوية flex،
 * فيمكن للأدمن سحب أي قسم ووضعه في المكان الذي يريده دون تغيير الكود.
 */
import { useEffect, useMemo, useState } from "react";
import { blockOrder, isBlockEnabled, type BlockKey } from "@/lib/admin-system";

export type HomeBlockType =
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
  /* أقسام قابلة للإضافة والتحرير الكامل */
  | "text"
  | "banner"
  | "cities"
  | "stats"
  | "faq"
  | "cta";

export interface HomeBlockItem {
  id: string;
  /** للـ stats: القيمة المعروضة، وللـ faq: السؤال */
  titleAr: string;
  titleEn?: string;
  /** للـ stats: الوصف، وللـ faq: الإجابة */
  textAr?: string;
  textEn?: string;
}

export interface HomeBlock {
  id: string;
  type: HomeBlockType;
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
  linkUrl?: string;
  linkLabelAr?: string;
  linkLabelEn?: string;
  /** نمط الخلفية للأقسام القابلة للإضافة */
  tone?: "navy" | "sand" | "white";
  items?: HomeBlockItem[];
}

export const HOME_BLOCKS_KEY = "aqaar-home-builder";
export const HOME_BLOCKS_EVENT = "aqaar:home-builder";

/** الأقسام الأساسية الموجودة في كود الصفحة — لا تُكرَّر */
export const CORE_BLOCK_TYPES: HomeBlockType[] = [
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

export const CUSTOM_BLOCK_TYPES: HomeBlockType[] = [
  "text",
  "banner",
  "cities",
  "stats",
  "faq",
  "cta",
];

export function isCoreBlockType(type: HomeBlockType): boolean {
  return CORE_BLOCK_TYPES.includes(type);
}

export function isCustomBlockType(type: HomeBlockType): boolean {
  return CUSTOM_BLOCK_TYPES.includes(type);
}

export interface BlockTypeMeta {
  label: string;
  description: string;
  /** قسم يعيش داخل شبكة العقارات ولا يمكن سحبه لموضع مستقل */
  locked?: boolean;
}

export const BLOCK_TYPE_META: Record<HomeBlockType, BlockTypeMeta> = {
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
    description: "قسم القصة النيلية مع بطاقة ملف التحقق",
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
};

function blockLabel(type: HomeBlockType): string {
  return BLOCK_TYPE_META[type]?.label ?? type;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function makeId(type: HomeBlockType, existing: HomeBlock[]): string {
  let counter = 1;
  let candidate = `${type}-${counter}`;
  while (existing.some((block) => block.id === candidate)) {
    counter += 1;
    candidate = `${type}-${counter}`;
  }
  return candidate;
}

/** الترتيب الافتراضي مطابق لترتيب الصفحة الحالي */
const DEFAULT_ORDER: Record<HomeBlockType, number> = {
  hero: 1,
  verify_strip: 2,
  marquee: 3,
  featured_listings: 4,
  ad_band: 5,
  projects_slider: 6,
  ad_slider: 7,
  inline_ad: 8,
  story_dossier: 9,
  manage_note: 10,
  text: 11,
  banner: 12,
  cities: 13,
  stats: 14,
  faq: 15,
  cta: 16,
};

export const DEFAULT_HOME_BLOCKS: HomeBlock[] = [
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
].map((type) => ({
  id: type,
  type: type as HomeBlockType,
  visible: true,
  order: DEFAULT_ORDER[type as HomeBlockType],
}));

function cloneDefaults(): HomeBlock[] {
  return DEFAULT_HOME_BLOCKS.map((block) => ({
    ...block,
    items: block.items?.map((item) => ({ ...item })),
  }));
}

function toStringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeItem(raw: unknown, index: number): HomeBlockItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<HomeBlockItem>;
  const titleAr = typeof item.titleAr === "string" ? item.titleAr.trim() : "";
  if (!titleAr && !item.textAr) return null;
  return {
    id: toStringOrUndefined(item.id) ?? `item-${index + 1}`,
    titleAr,
    titleEn: toStringOrUndefined(item.titleEn),
    textAr: toStringOrUndefined(item.textAr),
    textEn: toStringOrUndefined(item.textEn),
  };
}

function normalizeBlock(raw: Partial<HomeBlock>, index: number): HomeBlock | null {
  const type = raw.type as HomeBlockType | undefined;
  if (!type || !(type in BLOCK_TYPE_META)) return null;
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
    linkUrl: toStringOrUndefined(raw.linkUrl),
    linkLabelAr: toStringOrUndefined(raw.linkLabelAr),
    linkLabelEn: toStringOrUndefined(raw.linkLabelEn),
    tone:
      raw.tone === "navy" || raw.tone === "sand" || raw.tone === "white"
        ? raw.tone
        : undefined,
    items: Array.isArray(raw.items)
      ? raw.items
          .map((item, position) => normalizeItem(item, position))
          .filter((item): item is HomeBlockItem => item !== null)
      : undefined,
  };
}

function readStored(): HomeBlock[] | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(HOME_BLOCKS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as HomeBlock[];
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { items?: unknown }).items)
    ) {
      return (parsed as { items: HomeBlock[] }).items;
    }
    return [];
  } catch {
    return null;
  }
}

function sortBlocks(blocks: HomeBlock[]): HomeBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

/**
 * قراءة أقسام الرئيسية.
 * عند أول استخدام (لا يوجد سجل) نُرحّل إعدادات البلوكات القديمة من
 * `aqaar-site-settings` حتى لا يفقد الأدمن أي إخفاء أو ترتيب سابق.
 */
export function getHomeBlocks(): HomeBlock[] {
  const stored = readStored();
  if (stored === null) {
    const migrated = DEFAULT_HOME_BLOCKS.map((block) => ({
      ...block,
      visible: isBlockEnabled(block.type as BlockKey),
      order: blockOrder(block.type as BlockKey),
    }));
    return sortBlocks(migrated);
  }

  const normalized = stored
    .map((block, index) => normalizeBlock(block, index))
    .filter((block): block is HomeBlock => block !== null);

  /* منع تكرار الأقسام الأساسية */
  const seenCore = new Set<HomeBlockType>();
  const unique = normalized.filter((block) => {
    if (!isCoreBlockType(block.type)) return true;
    if (seenCore.has(block.type)) return false;
    seenCore.add(block.type);
    return true;
  });

  return sortBlocks(unique);
}

export function saveHomeBlocks(blocks: HomeBlock[]): void {
  if (!isBrowser()) return;
  /* نرقّم بحسب ترتيب المصفوفة المُمرَّرة — لا نعيد الفرز بقيم order القديمة */
  const normalized = blocks.map((block, index) => ({
    ...block,
    order: index + 1,
  }));
  try {
    window.localStorage.setItem(
      HOME_BLOCKS_KEY,
      JSON.stringify({ items: normalized, updatedAt: new Date().toISOString() })
    );
  } catch {
    return;
  }
  window.dispatchEvent(new Event(HOME_BLOCKS_EVENT));
}

/** خصائص المحتوى الافتراضية لكل نوع جديد */
function defaultContent(type: HomeBlockType): Partial<HomeBlock> {
  switch (type) {
    case "text":
      return {
        titleAr: "عنوان القسم",
        bodyAr: "اكتب هنا نص القسم. يمكنك استخدام هذا القسم للنبذة عن المنصة أو أي محتوى تحريري.",
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
    default:
      return {};
  }
}

export function addHomeBlock(type: HomeBlockType): HomeBlock | null {
  const blocks = getHomeBlocks();
  if (isCoreBlockType(type) && blocks.some((block) => block.type === type)) {
    return null;
  }
  const block: HomeBlock = {
    id: makeId(type, blocks),
    type,
    visible: true,
    order: blocks.length + 1,
    ...defaultContent(type),
  };
  saveHomeBlocks([...blocks, block]);
  return block;
}

export function updateHomeBlock(
  id: string,
  patch: Partial<HomeBlock>
): void {
  saveHomeBlocks(
    getHomeBlocks().map((block) =>
      block.id === id ? { ...block, ...patch, id: block.id, type: block.type } : block
    )
  );
}

export function removeHomeBlock(id: string): void {
  saveHomeBlocks(getHomeBlocks().filter((block) => block.id !== id));
}

export function toggleHomeBlock(id: string): void {
  saveHomeBlocks(
    getHomeBlocks().map((block) =>
      block.id === id ? { ...block, visible: !block.visible } : block
    )
  );
}

/** نقل قسم إلى موضع جديد (فهرس يبدأ من صفر) */
export function moveHomeBlock(id: string, targetIndex: number): void {
  const blocks = getHomeBlocks();
  const from = blocks.findIndex((block) => block.id === id);
  if (from < 0) return;
  const target = Math.max(0, Math.min(blocks.length - 1, targetIndex));
  if (target === from) return;
  const next = [...blocks];
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  saveHomeBlocks(next);
}

export function moveHomeBlockBy(id: string, direction: "up" | "down"): void {
  const blocks = getHomeBlocks();
  const index = blocks.findIndex((block) => block.id === id);
  if (index < 0) return;
  moveHomeBlock(id, direction === "up" ? index - 1 : index + 1);
}

/** استعادة الترتيب الافتراضي */
export function resetHomeBlocks(): void {
  saveHomeBlocks(cloneDefaults());
}

/** كل الأقسام (ظاهرة ومخفية) — للوحة التحكم */
export function useHomeBlocks(): HomeBlock[] {
  const [blocks, setBlocks] = useState<HomeBlock[]>(cloneDefaults);

  useEffect(() => {
    const sync = () => setBlocks(getHomeBlocks());
    sync();
    window.addEventListener(HOME_BLOCKS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(HOME_BLOCKS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return blocks;
}

/** الأقسام الظاهرة فقط — للصفحة الرئيسية */
export function useVisibleHomeBlocks(): HomeBlock[] {
  const blocks = useHomeBlocks();
  return useMemo(() => blocks.filter((block) => block.visible), [blocks]);
}

export { blockLabel };
