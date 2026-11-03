import {
  accentInk,
  buildPalette,
  DEFAULT_THEME,
} from "@/lib/theme-season";

/**
 * الهوية القابلة للتحكم من لوحة الإدارة:
 * - الشعارات (رئيسي / فاتح / مظلم / أيقونة التطبيق / فافيكون)
 * - عائلة الخط للعناوين والنصوص + حجم الخط الأساسي
 * - ألوان العلامة الأساسية (تُستخدم عندما لا يكون هناك ثيم موسمي مفعّل)
 *
 * كل القيم تُحقن كمتغيّرات CSS، لذا تسري على الموقع كله فوراً.
 */
export const BRANDING_UPDATED_EVENT = "aqaar-branding-updated";

export type FontKey = "cairo" | "tajawal" | "amiri" | "readex";

export interface BrandColors {
  ocean: string;
  gold: string;
  sand: string;
  accent: string;
}

export interface BrandingCfg {
  /** الشعار الرئيسي (يُستخدم إن لم يوجد شعار فاتح/مظلم) */
  logoMain?: string;
  /** الشعار فوق الخلفيات الفاتحة (الهيدر) */
  logoLight?: string;
  /** الشعار فوق الخلفيات الداكنة (الفوتر) */
  logoDark?: string;
  /** أيقونة تطبيق الموبايل (تظهر داخل موك-أب الهاتف) */
  appIcon?: string;
  /** أيقونة المتصفح */
  favicon?: string;
  headingFont: FontKey;
  bodyFont: FontKey;
  /** حجم الخط الأساسي بالبكسل — يكبّر/يصغّر الموقع كله */
  baseFontSize: number;
  colors: BrandColors;
}

export interface ResolvedBranding extends BrandingCfg {
  headingStack: string;
  bodyStack: string;
}

export const FONT_OPTIONS: { key: FontKey; labelAr: string; stack: string }[] = [
  { key: "cairo", labelAr: "Cairo — القاهرة (الافتراضي)", stack: "var(--font-cairo), Tahoma, sans-serif" },
  { key: "tajawal", labelAr: "Tajawal — تجوال", stack: "var(--font-tajawal), Tahoma, sans-serif" },
  { key: "amiri", labelAr: "Amiri — أميري (نسخي فاخر)", stack: "var(--font-amiri), Tahoma, serif" },
  { key: "readex", labelAr: "Readex Pro — ريدكس", stack: "var(--font-readex), Tahoma, sans-serif" },
];

const FONT_STACK: Record<FontKey, string> = FONT_OPTIONS.reduce(
  (map, option) => ({ ...map, [option.key]: option.stack }),
  {} as Record<FontKey, string>
);

export const DEFAULT_BRANDING: BrandingCfg = {
  logoMain: "",
  logoLight: "",
  logoDark: "",
  appIcon: "",
  favicon: "",
  headingFont: "cairo",
  bodyFont: "cairo",
  baseFontSize: 16,
  colors: {
    ocean: DEFAULT_THEME.ocean,
    gold: DEFAULT_THEME.gold,
    sand: DEFAULT_THEME.sand,
    accent: DEFAULT_THEME.accent,
  },
};

function fontKey(value: unknown, fallback: FontKey): FontKey {
  return value === "cairo" || value === "tajawal" || value === "amiri" || value === "readex"
    ? value
    : fallback;
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function hex(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return /^#?[0-9a-f]{6}$/i.test(text)
    ? text.startsWith("#")
      ? text
      : `#${text}`
    : fallback;
}

/** دمج إعدادات الهوية مع الافتراضي بأمان (بدون فقدان الألوان الجزئية) */
export function resolveBranding(config: Partial<BrandingCfg> | null | undefined): ResolvedBranding {
  const cfg = config ?? {};
  const headingFont = fontKey(cfg.headingFont, DEFAULT_BRANDING.headingFont);
  const bodyFont = fontKey(cfg.bodyFont, DEFAULT_BRANDING.bodyFont);
  return {
    logoMain: String(cfg.logoMain ?? "").trim(),
    logoLight: String(cfg.logoLight ?? "").trim(),
    logoDark: String(cfg.logoDark ?? "").trim(),
    appIcon: String(cfg.appIcon ?? "").trim(),
    favicon: String(cfg.favicon ?? "").trim(),
    headingFont,
    bodyFont,
    baseFontSize: clampNumber(cfg.baseFontSize, 14, 19, DEFAULT_BRANDING.baseFontSize),
    colors: {
      ocean: hex(cfg.colors?.ocean, DEFAULT_BRANDING.colors.ocean),
      gold: hex(cfg.colors?.gold, DEFAULT_BRANDING.colors.gold),
      sand: hex(cfg.colors?.sand, DEFAULT_BRANDING.colors.sand),
      accent: hex(cfg.colors?.accent, DEFAULT_BRANDING.colors.accent),
    },
    headingStack: FONT_STACK[headingFont],
    bodyStack: FONT_STACK[bodyFont],
  };
}

/** الشعار المناسب لخلفية فاتحة أو داكنة */
export function logoSrc(branding: BrandingCfg, tone: "light" | "dark"): string {
  return tone === "dark"
    ? branding.logoDark || branding.logoMain || ""
    : branding.logoLight || branding.logoMain || "";
}

/**
 * تطبيق الهوية على <html> كمتغيّرات CSS.
 * ألوان العلامة لا تُطبَّق إذا كان الثيم الموسمي مفعّلاً — الموسم له الأولوية.
 */
export function applyBrandingToDocument(
  branding: ResolvedBranding,
  seasonActive: boolean
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const style = root.style;

  style.setProperty("--font-heading", branding.headingStack);
  style.setProperty("--font-body", branding.bodyStack);
  style.setProperty("--brand-base-size", `${branding.baseFontSize}px`);

  if (!seasonActive) {
    const palette = buildPalette(branding.colors);
    for (const [name, value] of Object.entries(palette)) {
      style.setProperty(`--${name}`, value);
    }
    style.setProperty("--season-accent", branding.colors.accent);
    style.setProperty("--season-accent-ink", accentInk(branding.colors.accent));
  }

  /* الفافيكون — يُنشأ مرة واحدة ثم يُحدَّث */
  let link = document.getElementById("brand-favicon") as HTMLLinkElement | null;
  if (branding.favicon) {
    if (!link) {
      link = document.createElement("link");
      link.id = "brand-favicon";
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = branding.favicon;
  } else if (link) {
    /* عند مسح الفافيكون من اللوحة نرجع فوراً للأيقونة الافتراضية. */
    link.remove();
  }
}

/**
 * سكربت قبل أول رسم: يطبّق الخطوط وحجم الخط وألوان العلامة من التخزين المحلي
 * حتى لا يرى الزائر ومضة الهوية الافتراضية قبل التحميل.
 */
export const BRANDING_BOOT_SCRIPT = `(function(){try{
var raw=localStorage.getItem("aqaar-site-settings");if(!raw)return;
var s=JSON.parse(raw)||{},b=s.branding||{},t=s.seasonTheme||{};
var fonts={cairo:"var(--font-cairo), Tahoma, sans-serif",tajawal:"var(--font-tajawal), Tahoma, sans-serif",amiri:"var(--font-amiri), Tahoma, serif",readex:"var(--font-readex), Tahoma, sans-serif"};
var root=document.documentElement,st=root.style;
st.setProperty("--font-heading",fonts[b.headingFont]||fonts.cairo);
st.setProperty("--font-body",fonts[b.bodyFont]||fonts.cairo);
var size=Number(b.baseFontSize);if(!isFinite(size)||size<14||size>19)size=16;
st.setProperty("--brand-base-size",size+"px");
if(b.favicon){var l=document.getElementById("brand-favicon");if(!l){l=document.createElement("link");l.id="brand-favicon";l.rel="icon";document.head.appendChild(l);}l.href=b.favicon;}
if(t.active===true)return;
var c=b.colors||{};
var steps=[[50,97],[100,94],[200,87],[300,77],[400,64],[500,54],[600,45],[700,37],[800,30],[900,25],[950,16]];
function parts(v,fb){var m=/^#?([0-9a-f]{6})$/i.exec(String(v||""));if(!m)return parts(fb,"#000000");var n=parseInt(m[1],16);return [(n>>16)&255,(n>>8)&255,n&255];}
function hslOf(p){var r=p[0]/255,g=p[1]/255,bl=p[2]/255,mx=Math.max(r,g,bl),mn=Math.min(r,g,bl),l=(mx+mn)/2,h=0,s=0;
if(mx!==mn){var d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=(g-bl)/d+(g<bl?6:0);else if(mx===g)h=(bl-r)/d+2;else h=(r-g)/d+4;h/=6;}return [h*360,s*100,l*100];}
function rgb(h,s,l){s/=100;l/=100;var ch=(1-Math.abs(2*l-1))*s,x=ch*(1-Math.abs((h/60)%2-1)),m=l-ch/2,r=0,g=0,bl=0;
if(h<60){r=ch;g=x;}else if(h<120){r=x;g=ch;}else if(h<180){g=ch;bl=x;}else if(h<240){g=x;bl=ch;}else if(h<300){r=x;bl=ch;}else{r=ch;bl=x;}
return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((bl+m)*255)].join(" ");}
function ramp(name,base,fb,scale){var hsl=hslOf(parts(base,fb));for(var i=0;i<steps.length;i++){var L=steps[i][1];var f=L>=92?0.7:L>=78?0.85:L>=45?1:0.9;var sat=hsl[1]*f*scale;if(sat<8)sat=8;if(sat>85)sat=85;st.setProperty("--"+name+"-"+steps[i][0],rgb(hsl[0],sat,L));}}
ramp("ocean",c.ocean,"#141a33",1);ramp("sand",c.sand,"#fdfbf7",0.8);ramp("gold",c.gold,"#c9922a",1);
st.setProperty("--season-accent",c.accent||"#c9922a");
function ink(h){var p=parts(h,"#c9922a");function q(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}var L=0.2126*q(p[0])+0.7152*q(p[1])+0.0722*q(p[2]);return L>0.22?"#141a33":"#ffffff";}
st.setProperty("--season-accent-ink",ink(c.accent||"#c9922a"));
}catch(e){}})();`;
