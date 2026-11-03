/**
 * إعدادات قسم التطبيق — التنويهات المختصرة في الرئيسية وصفحة /app
 * وبانر الموبايل، وكلها قابلة للتحكم من لوحة الإدارة.
 */
export type AppReleaseStatus = "soon" | "live";

export type AppFeatureIcon = "bell" | "map" | "heart" | "shield";

export interface AppFeature {
  id: string;
  icon: AppFeatureIcon;
  titleAr: string;
  descAr: string;
}

export interface AppSettings {
  /** إظهار التطبيق في الموقع كله (الهيدر/الأقسام/الصفحة/الفوتر/البانر) */
  enabled: boolean;
  status: AppReleaseStatus;
  /** حقل قديم للتوافق مع الإعدادات السابقة؛ الهيرو الآن عقاري دائماً. */
  heroMode: boolean;
  eyebrowAr: string;
  titleAr: string;
  subtitleAr: string;
  descriptionAr: string;
  features: AppFeature[];
  iosUrl: string;
  androidUrl: string;
  /** رابط يُشفَّر في رمز QR */
  qrUrl: string;
  showMobileBanner: boolean;
  /** ثواني قبل ظهور بانر الموبايل */
  bannerDelaySec: number;
  /** بريد استلام تسجيل الاهتمام (افتراضياً بريد إدارة الموقع) */
  interestEmail: string;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  enabled: true,
  status: "soon",
  heroMode: false,
  eyebrowAr: "تطبيق عقار FAMILY",
  titleAr: "عقار أحلامك",
  subtitleAr: "في جيبك",
  descriptionAr:
    "نفس الثقة ونفس فحص المستندات… بس أسرع. تصفّح العقارات، شوفها على الخريطة، واحفظ اللي يعجبك — واستلم تنبيه أول ما ينزل عقار موثّق في مدينتك.",
  features: [
    {
      id: "alerts",
      icon: "bell",
      titleAr: "تنبيه فوري",
      descAr: "أول ما ينزل عقار مطابق لبحثك، يوصلك إشعار على الموبايل.",
    },
    {
      id: "map",
      icon: "map",
      titleAr: "بحث بالخريطة",
      descAr: "شوف الكورنيش والكمبوندات والأسعار على الخريطة مباشرة.",
    },
    {
      id: "saved",
      icon: "heart",
      titleAr: "حفظ ومقارنة",
      descAr: "احفظ اللي يعجبك وقارن بين ٣ عقارات جنب بعض.",
    },
    {
      id: "verify",
      icon: "shield",
      titleAr: "توثيق زي الموقع",
      descAr: "نفس فحص المستندات، والتواصل عبر الإدارة بدون أرقام ملاك.",
    },
  ],
  iosUrl: "",
  androidUrl: "",
  qrUrl: "https://aqaar-alsahel.vercel.app",
  showMobileBanner: false,
  bannerDelaySec: 6,
  interestEmail: "",
};

export const APP_STATUS_LABEL: Record<AppReleaseStatus, string> = {
  soon: "قريبًا — تسجيل اهتمام",
  live: "متاح للتحميل الآن",
};

/** دمج آمن يحافظ على الميزات الأربع حتى لو حُفظت ناقصة */
export function resolveAppSettings(config: Partial<AppSettings> | null | undefined): AppSettings {
  const cfg = config ?? {};
  const saved = Array.isArray(cfg.features) ? cfg.features : [];
  const features = DEFAULT_APP_SETTINGS.features.map((feature) => {
    const match = saved.find((item) => item && item.id === feature.id);
    if (!match) return feature;
    return {
      ...feature,
      titleAr: String(match.titleAr ?? feature.titleAr),
      descAr: String(match.descAr ?? feature.descAr),
      icon: feature.icon,
    };
  });
  const delay = Number(cfg.bannerDelaySec);
  return {
    ...DEFAULT_APP_SETTINGS,
    ...cfg,
    status: cfg.status === "live" ? "live" : "soon",
    enabled: cfg.enabled !== false,
    /* لا يُسمح للتطبيق باستبدال واجهة المنصة العقارية. */
    heroMode: false,
    /* البانر اختياري ولا يظهر افتراضياً حتى لا يزاحم العقارات. */
    showMobileBanner: cfg.showMobileBanner === true,
    bannerDelaySec: Number.isFinite(delay) ? Math.min(30, Math.max(0.5, delay)) : DEFAULT_APP_SETTINGS.bannerDelaySec,
    features,
  };
}

/** هل يوجد رابط متجر فعلي؟ */
export function storeHref(app: AppSettings, store: "ios" | "android"): string {
  return (store === "ios" ? app.iosUrl : app.androidUrl).trim();
}

/** رابط رمز QR مع صورة بديلة آمنة */
export function qrImageSrc(value: string): string {
  const target = value.trim() || DEFAULT_APP_SETTINGS.qrUrl;
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(target)}`;
}
