/**
 * تنسيق الأقسام في Builder الرئيسية.
 *
 * كل قسم يحمل كائن `style` اختياري يُترجم إلى متغيّرات CSS تُطبَّق على غلاف
 * القسم (`.hb-scope`)، فتتحكم في: نوع الخط، أحجام العناوين والنصوص، الألوان،
 * المحاذاة، المسافات، الخلفية، ومقاسات الصور والفيديو.
 *
 * التخزين آمن: أي قيمة غير صالحة تُهمَل بدل أن تُفسد الصفحة.
 */

export type HomeBlockFont = "cairo" | "tajawal" | "amiri" | "readex";

export interface HomeBlockStyle {
  /** نوع الخط — يُحمَّل من next/font */
  fontFamily?: HomeBlockFont;
  /** حجم عنوان القسم بالبكسل */
  titleSize?: number;
  /** حجم نص القسم بالبكسل */
  bodySize?: number;
  /** لون العنوان (HEX) */
  titleColor?: string;
  /** لون النص (HEX) */
  bodyColor?: string;
  /** محاذاة نص القسم */
  align?: "start" | "center" | "end";
  /** مسافة رأسية إضافية حول القسم (تكبير/تصغير القسم) */
  paddingY?: number;
  /** خلفية القسم (HEX) */
  background?: string;
  /** ارتفاع الصورة أو الفيديو بالبكسل */
  mediaHeight?: number;
  /** طريقة عرض الوسائط داخل مساحتها */
  mediaFit?: "cover" | "contain";
  /** استدارة حواف الوسائط */
  mediaRadius?: number;
  /** عرض بطاقة السلايدر بالبكسل */
  cardWidth?: number;
}

export const FONT_OPTIONS: { value: HomeBlockFont; label: string; hint: string }[] = [
  { value: "cairo", label: "Cairo", hint: "خط العلامة الافتراضي — واضح ومقروء" },
  { value: "tajawal", label: "Tajawal", hint: "هندسي حديث — مناسب للعناوين" },
  { value: "amiri", label: "Amiri", hint: "نسخ كلاسيكي — مناسب للنصوص الطويلة" },
  { value: "readex", label: "Readex Pro", hint: "عريض وواضح — مناسب للأرقام" },
];

const FONT_CLASS: Record<HomeBlockFont, string> = {
  cairo: "hb-font-cairo",
  tajawal: "hb-font-tajawal",
  amiri: "hb-font-amiri",
  readex: "hb-font-readex",
};

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** لون HEX صالح أو undefined */
export function cleanColor(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = String(value).trim();
  return HEX_COLOR.test(trimmed) ? trimmed : undefined;
}

function boundedInt(value: unknown, min: number, max: number): number | undefined {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

/** تنظيف أي تنسيق قادم من التخزين أو من نموذج الإدارة */
export function sanitizeBlockStyle(raw: unknown): HomeBlockStyle | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const source = raw as Record<string, unknown>;
  const out: HomeBlockStyle = {};

  if (typeof source.fontFamily === "string" && source.fontFamily in FONT_CLASS) {
    out.fontFamily = source.fontFamily as HomeBlockFont;
  }
  const titleSize = boundedInt(source.titleSize, 14, 72);
  if (titleSize !== undefined) out.titleSize = titleSize;
  const bodySize = boundedInt(source.bodySize, 10, 32);
  if (bodySize !== undefined) out.bodySize = bodySize;
  const titleColor = cleanColor(source.titleColor as string | undefined);
  if (titleColor) out.titleColor = titleColor;
  const bodyColor = cleanColor(source.bodyColor as string | undefined);
  if (bodyColor) out.bodyColor = bodyColor;
  if (source.align === "start" || source.align === "center" || source.align === "end") {
    out.align = source.align;
  }
  const paddingY = boundedInt(source.paddingY, 0, 160);
  if (paddingY !== undefined) out.paddingY = paddingY;
  const background = cleanColor(source.background as string | undefined);
  if (background) out.background = background;
  const mediaHeight = boundedInt(source.mediaHeight, 80, 720);
  if (mediaHeight !== undefined) out.mediaHeight = mediaHeight;
  if (source.mediaFit === "cover" || source.mediaFit === "contain") {
    out.mediaFit = source.mediaFit;
  }
  const mediaRadius = boundedInt(source.mediaRadius, 0, 48);
  if (mediaRadius !== undefined) out.mediaRadius = mediaRadius;
  const cardWidth = boundedInt(source.cardWidth, 200, 560);
  if (cardWidth !== undefined) out.cardWidth = cardWidth;

  return Object.keys(out).length > 0 ? out : undefined;
}

/** كلاس الخط المطلوب — يُضاف لغلاف القسم */
export function blockFontClass(style?: HomeBlockStyle): string {
  return style?.fontFamily ? FONT_CLASS[style.fontFamily] : "";
}

/**
 * كلاسات غلاف القسم: خط + مفاتيح تفعيل الأحجام والألوان ومقاسات الوسائط.
 * تُضاف مفاتيح التفعيل فقط عند ضبط القيمة، فلا يتغيّر الشكل الافتراضي.
 */
export function blockScopeClasses(
  style?: HomeBlockStyle,
  options?: { backgroundMedia?: boolean }
): string[] {
  const classes = ["hb-scope", blockFontClass(style)];
  if (style?.titleSize) classes.push("hb-has-title-size");
  if (style?.bodySize) classes.push("hb-has-body-size");
  if (style?.titleColor) classes.push("hb-has-title-color");
  if (style?.bodyColor) classes.push("hb-has-body-color");
  if (style?.mediaHeight) classes.push("hb-has-media-height");
  if (style?.mediaFit) classes.push("hb-has-media-fit");
  if (style?.mediaRadius !== undefined) classes.push("hb-has-media-radius");
  if (style?.background) classes.push("hb-has-bg");
  if (options?.backgroundMedia) classes.push("hb-bg-media");
  return classes.filter(Boolean);
}

/**
 * متغيّرات CSS التي تقرأها كلاسات `.hb-*`.
 * الأحجام تُقيَّد بـ clamp حتى لا يتكسّر العنوان على الموبايل.
 */
export function blockCssVars(style?: HomeBlockStyle): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!style) return vars;
  if (style.paddingY !== undefined) vars["--hb-py"] = `${style.paddingY}px`;
  if (style.background) vars["--hb-bg"] = style.background;
  if (style.titleSize) {
    vars["--hb-title-size"] = `clamp(${Math.round(style.titleSize * 0.62)}px, 4.2vw, ${style.titleSize}px)`;
  }
  if (style.bodySize) {
    vars["--hb-body-size"] = `clamp(${Math.round(style.bodySize * 0.85)}px, 3.2vw, ${style.bodySize}px)`;
  }
  if (style.titleColor) vars["--hb-title-color"] = style.titleColor;
  if (style.bodyColor) vars["--hb-body-color"] = style.bodyColor;
  if (style.align) vars["--hb-align"] = style.align;
  if (style.mediaHeight) vars["--hb-media-height"] = `${style.mediaHeight}px`;
  if (style.mediaFit) vars["--hb-media-fit"] = style.mediaFit;
  if (style.mediaRadius !== undefined) vars["--hb-radius"] = `${style.mediaRadius}px`;
  return vars;
}

/* ============================================================
 * الوسائط: صورة / فيديو مباشر / رابط تضمين (يوتيوب، فيميو)
 * ============================================================ */

export type MediaKind = "image" | "video" | "embed";

export interface ResolvedMedia {
  kind: MediaKind;
  src: string;
}

/** تحويل روابط المشاركة إلى روابط تضمين قابلة للعرض */
export function toEmbedUrl(url: string): string {
  const youtube =
    url.match(/youtu\.be\/([\w-]{6,})/) || url.match(/youtube\.com\/.*[?&]v=([\w-]{6,})/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

export function resolveMedia(url?: string | null): ResolvedMedia | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  if (/youtu\.be\/|youtube\.com\/|vimeo\.com\//i.test(trimmed)) {
    return { kind: "embed", src: toEmbedUrl(trimmed) };
  }
  if (/\.(mp4|webm|ogg)(\?|#|$)/i.test(trimmed)) {
    return { kind: "video", src: trimmed };
  }
  return { kind: "image", src: trimmed };
}
