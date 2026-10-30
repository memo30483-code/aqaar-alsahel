/**
 * الثيمات الموسمية:
 * - كل موسم يملك لوحة ألوان كاملة (ocean / sand / gold) تُبنى من ٣ ألوان أساسية.
 * - الألوان تُحقن كمتغيّرات CSS، وكل كلاسات Tailwind تقرأ منها، فيتغيّر الموقع كله.
 * - الألوان والصور والنصوص كلها قابلة للتحكم من لوحة الإدارة.
 */
export const SEASON_THEME_UPDATED_EVENT = "aqaar-season-theme-updated";

export type SeasonPreset =
  | "ramadan"
  | "eid-fitr"
  | "eid-adha"
  | "winter"
  | "spring"
  | "summer"
  | "fall"
  | "october"
  | "custom";

export interface RamadanMotifs {
  crescent: boolean;
  lanterns: boolean;
  mashrabiya: boolean;
  iftarCannon: boolean;
  coastalReflections: boolean;
  assistantLantern: boolean;
}

export interface SeasonThemeCfg {
  preset: SeasonPreset;
  active: boolean;
  gold: string;
  sand: string;
  ocean: string;
  heroGradient: string;
  accent: string;
  /** صورة غلاف الهيرو في الرئيسية (تتجاوز صورة الـBuilder) */
  heroImage?: string;
  /** صورة خلفية الصفحة (طبقة ثابتة خلف المحتوى) */
  backgroundImage?: string;
  /** شفافية صورة الخلفية 0..1 */
  backgroundOpacity?: number;
  /** شفافية نقش المشربية فوق الخلفية 0..1 */
  patternOpacity?: number;
  campaignText?: string;
  motifs?: Partial<RamadanMotifs>;
}

export const RAMADAN_CAMPAIGN_TEXT = "رمضان احلى مع عقار FAMILY";

/**
 * مشهد الزخارف المرسوم فوق صورة الهيرو.
 * - رمضان له طبقة زخارف مستقلة أكثر تفصيلاً (`RamadanDecorations`).
 * - «تخصيص يدوي» بلا زخارف: الأدمن يختار الألوان فقط.
 */
export type SeasonScene =
  | "winter"
  | "spring"
  | "summer"
  | "fall"
  | "october"
  | "eid-fitr"
  | "eid-adha";

export function seasonScene(
  preset: SeasonPreset,
  active: boolean
): SeasonScene | null {
  if (!active) return null;
  switch (preset) {
    case "winter":
    case "spring":
    case "summer":
    case "fall":
    case "october":
    case "eid-fitr":
    case "eid-adha":
      return preset;
    /* رمضان: زخارفه الخاصة — و«custom»: ألوان فقط */
    default:
      return null;
  }
}

/** هل يظهر شريط الزخارف الموسمي في هذه الصفحة؟ */
const RIBBON_HIDDEN_PREFIXES = ["/admin", "/login", "/register"];

export function shouldShowSeasonRibbon(
  preset: SeasonPreset,
  active: boolean,
  pathname: string
): boolean {
  if (!seasonScene(preset, active)) return false;
  /* الرئيسية فيها المشهد الكامل داخل الهيرو */
  if (pathname === "/" || pathname === "") return false;
  return !RIBBON_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export const RAMADAN_DEFAULT_MOTIFS: RamadanMotifs = {
  crescent: true,
  lanterns: true,
  mashrabiya: true,
  iftarCannon: true,
  coastalReflections: true,
  assistantLantern: true,
};

export const DEFAULT_THEME: SeasonThemeCfg = {
  preset: "custom",
  active: false,
  /* مطابقة للوحة العلامة الأساسية حتى يكون «تخصيص بدون تعديل» بلا تغيير بصري */
  gold: "#c9922a",
  sand: "#fdfbf7",
  ocean: "#141a33",
  heroGradient: "linear-gradient(135deg,#141a33 0%,#2d3875 58%,#1a2332 100%)",
  accent: "#c9922a",
};

/**
 * كل ثيم يعبر عن الموسم:
 * - رمضان: أخضر زمردي داكن + ذهبي + هندسة إسلامية
 * - عيد الفطر: ذهبي زاهي + أبيض كريم + نجوم احتفالية
 * - عيد الأضحى: بني الأرض + ذهبي عميق
 * - شتاء: أزرق جليدي + فضي
 * - ربيع: أخضر نضر + كريم فاتح
 * - صيف: ذهبي شمسي + أزرق سماوي
 * - خريف: برتقالي محترق + بني عميق
 * - أكتوبر: أحمر + ذهبي + أسود
 */
export const PRESET_MAP: Record<
  Exclude<SeasonPreset, "custom">,
  Partial<SeasonThemeCfg>
> = {
  ramadan: {
    /* زمردي مصري + ذهب فانوس + كريمي رمضاني */
    gold: "#e7c05e",
    sand: "#f7f0dc",
    ocean: "#0d3b2e",
    heroGradient:
      "radial-gradient(circle at 78% 10%, rgba(231,192,94,0.30), transparent 46%), linear-gradient(160deg,#04241f 0%,#0b3b2e 48%,#113f3c 100%)",
    accent: "#e7c05e",
    /* نقش إسلامي خفيف على كل الصفحات + شفافية خلفية جاهزة */
    patternOpacity: 0.07,
    backgroundOpacity: 0.3,
  },
  "eid-fitr": {
    gold: "#f0c85a",
    sand: "#fdf6e3",
    ocean: "#3a2a1a",
    heroGradient: "linear-gradient(135deg,#3a2a1a 0%,#5a4418 50%,#eec26e 100%)",
    accent: "#eec26e",
  },
  "eid-adha": {
    gold: "#bfa13a",
    sand: "#f2e6ce",
    ocean: "#2a2218",
    heroGradient: "linear-gradient(135deg,#2a2218 0%,#4a3325 50%,#8a6a30 100%)",
    accent: "#cfa13a",
  },
  winter: {
    gold: "#b8cce0",
    sand: "#ebeef5",
    ocean: "#0a1628",
    heroGradient: "linear-gradient(135deg,#0a1628 0%,#1a2d3a 50%,#b8cce0 100%)",
    accent: "#90a8c0",
  },
  spring: {
    gold: "#b8d6b5",
    sand: "#f5f8f0",
    ocean: "#1a3528",
    heroGradient: "linear-gradient(135deg,#1a3528 0%,#2a4a3a 50%,#b8d6b5 100%)",
    accent: "#a8c8a0",
  },
  summer: {
    gold: "#e8c97a",
    sand: "#fdf8e8",
    ocean: "#332a0a",
    heroGradient: "linear-gradient(135deg,#332a0a 0%,#5a4a18 50%,#e8c97a 100%)",
    accent: "#e8a030",
  },
  fall: {
    gold: "#c68a4a",
    sand: "#ede3ce",
    ocean: "#2e2218",
    heroGradient: "linear-gradient(135deg,#2e2218 0%,#5a3a18 50%,#c68a4a 100%)",
    accent: "#d48a30",
  },
  october: {
    gold: "#e0b050",
    sand: "#f0dcc8",
    ocean: "#2a1818",
    heroGradient: "linear-gradient(135deg,#2a1818 0%,#5a2a2a 50%,#e0b050 100%)",
    accent: "#c04040",
  },
};

/* ============================================================
 * بناء لوحة الألوان (١١ درجة لكل لون) من ثلاثة ألوان أساسية
 * ============================================================ */

/** تدرّج الإضاءة الثابت لكل الدرجات — يضمن تبايناً مقروءاً في كل المواسم */
const RAMP: Array<[number, number]> = [
  [50, 97],
  [100, 94],
  [200, 87],
  [300, 77],
  [400, 64],
  [500, 54],
  [600, 45],
  [700, 37],
  [800, 30],
  [900, 25],
  [950, 16],
];

export const PALETTE_VAR_NAMES: string[] = ["ocean", "sand", "gold"].flatMap(
  (name) => RAMP.map(([step]) => `${name}-${step}`)
);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hexToRgbParts(value: string, fallback: string): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(value ?? "").trim());
  if (!match) return hexToRgbParts(fallback, "#000000");
  const int = parseInt(match[1], 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgbTriplet(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return [r, g, b]
    .map((channel) => Math.round((channel + m) * 255))
    .join(" ");
}

/** لوحة كاملة: ocean/sand/gold × ١١ درجة (قيم «r g b» لمتغيّرات CSS) */
export function buildPalette(colors: {
  gold: string;
  sand: string;
  ocean: string;
}): Record<string, string> {
  const out: Record<string, string> = {};
  const add = (name: string, base: string, fallback: string, satScale: number) => {
    const hsl = rgbToHsl(hexToRgbParts(base, fallback));
    for (const [step, targetL] of RAMP) {
      /* الفاتح أهدأ تشبّعاً حتى لا يتحول لهجة نيون، والغامق أوضح */
      const factor = targetL >= 92 ? 0.7 : targetL >= 78 ? 0.85 : targetL >= 45 ? 1 : 0.9;
      const saturation = clamp(hsl[1] * factor * satScale, 8, 85);
      out[`${name}-${step}`] = hslToRgbTriplet(hsl[0], saturation, targetL);
    }
  };
  add("ocean", colors.ocean, "#141a33", 1);
  add("sand", colors.sand, "#fdfbf7", 0.8);
  add("gold", colors.gold, "#c9922a", 1);
  return out;
}

/**
 * لون النص المناسب فوق «لون التمييز» حتى يظل الزر مقروءاً في كل المواسم.
 * يعتمد على الإضاءة النسبية (WCAG) — الألوان الفاتحة تأخذ نصاً داكناً والعكس.
 */
export function accentInk(accent: string): string {
  const [r, g, b] = hexToRgbParts(accent, DEFAULT_THEME.accent);
  const channel = (value: number) => {
    const unit = value / 255;
    return unit <= 0.03928 ? unit / 12.92 : Math.pow((unit + 0.055) / 1.055, 2.4);
  };
  const luminance =
    0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  /* 0.22 = نقطة توازن التباين تقريباً: الفاتح يأخذ نصاً داكناً والداكن يأخذ أبيض */
  return luminance > 0.22 ? "#141a33" : "#ffffff";
}

export interface ResolvedSeasonTheme {
  preset: SeasonPreset;
  active: boolean;
  gold: string;
  sand: string;
  ocean: string;
  heroGradient: string;
  accent: string;
  /** لون النص المقروء فوق لون التمييز (أبيض أو نيلي داكن) */
  accentInk: string;
  campaignText: string;
  motifs: RamadanMotifs;
  heroImage: string;
  backgroundImage: string;
  backgroundOpacity: number;
  patternOpacity: number;
  /** متغيّرات لوحة الألوان جاهزة للحقن */
  palette: Record<string, string>;
}

function toUnit(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return clamp(parsed, 0, 1);
}

/** Resolve administrator settings into one stable, render-ready theme state. */
export function resolveSeasonTheme(
  config: Partial<SeasonThemeCfg> | null | undefined
): ResolvedSeasonTheme {
  const requested = config ?? {};
  const preset = requested.preset ?? DEFAULT_THEME.preset;
  const active = requested.active === true;
  const presetDefaults = preset !== "custom" ? PRESET_MAP[preset] ?? {} : {};
  const values = active ? { ...DEFAULT_THEME, ...presetDefaults, ...requested } : DEFAULT_THEME;
  const isRamadan = active && preset === "ramadan";
  const requestedMotifs = requested.motifs ?? {};
  const motifs: RamadanMotifs = {
    crescent: isRamadan && (requestedMotifs.crescent ?? true),
    lanterns: isRamadan && (requestedMotifs.lanterns ?? true),
    mashrabiya: isRamadan && (requestedMotifs.mashrabiya ?? true),
    iftarCannon: isRamadan && (requestedMotifs.iftarCannon ?? true),
    coastalReflections: isRamadan && (requestedMotifs.coastalReflections ?? true),
    assistantLantern: isRamadan && (requestedMotifs.assistantLantern ?? true),
  };

  const gold = values.gold ?? DEFAULT_THEME.gold;
  const sand = values.sand ?? DEFAULT_THEME.sand;
  const ocean = values.ocean ?? DEFAULT_THEME.ocean;

  return {
    preset,
    active,
    gold,
    sand,
    ocean,
    heroGradient: values.heroGradient ?? DEFAULT_THEME.heroGradient,
    accent: values.accent ?? DEFAULT_THEME.accent,
    accentInk: accentInk(values.accent ?? DEFAULT_THEME.accent),
    /* نص الحملة خاص برمضان افتراضياً؛ بقية المواسم تظهر فقط لو كتب الأدمن نصاً */
    campaignText: requested.campaignText?.trim() || (isRamadan ? RAMADAN_CAMPAIGN_TEXT : ""),
    motifs,
    heroImage: active ? values.heroImage?.trim() || "" : "",
    backgroundImage: active ? values.backgroundImage?.trim() || "" : "",
    backgroundOpacity: active ? toUnit(values.backgroundOpacity, 0.35) : 0,
    patternOpacity: active ? toUnit(values.patternOpacity, 0) : 0,
    palette: active ? buildPalette({ gold, sand, ocean }) : {},
  };
}

/** هل نحن في بيئة متصفح */
function isBrowser(): boolean {
  return typeof document !== "undefined";
}

/**
 * حقن الثيم في الصفحة (متغيّرات CSS + سمات data-*).
 * عند الإيقاف تُحذف المتغيّرات فترجع الألوان الأساسية من :root.
 */
export function applySeasonThemeToDocument(theme: ResolvedSeasonTheme): void {
  if (!isBrowser()) return;
  const root = document.documentElement;
  const style = root.style;

  if (!theme.active) {
    for (const name of PALETTE_VAR_NAMES) style.removeProperty(`--${name}`);
    style.removeProperty("--theme-bg-image");
    style.removeProperty("--theme-pattern-opacity");
    root.dataset.seasonTheme = "default";
    delete root.dataset.ramadanCrescent;
    delete root.dataset.ramadanLanterns;
    delete root.dataset.ramadanMashrabiya;
    delete root.dataset.ramadanCannon;
    delete root.dataset.ramadanCoast;
    delete root.dataset.ramadanAssistant;
    style.setProperty("--season-accent", DEFAULT_THEME.accent);
    style.setProperty("--season-accent-ink", accentInk(DEFAULT_THEME.accent));
    style.setProperty("--hero-gradient-theme", DEFAULT_THEME.heroGradient);
    return;
  }

  for (const [name, value] of Object.entries(theme.palette)) {
    style.setProperty(`--${name}`, value);
  }
  style.setProperty("--season-accent", theme.accent);
  style.setProperty("--season-accent-ink", theme.accentInk);
  style.setProperty("--hero-gradient-theme", theme.heroGradient);
  style.setProperty(
    "--theme-bg-image",
    theme.backgroundImage ? `url("${theme.backgroundImage}")` : "none"
  );
  style.setProperty("--theme-pattern-opacity", String(theme.patternOpacity));

  root.dataset.seasonTheme = theme.preset;
  root.dataset.ramadanCrescent = String(theme.motifs.crescent);
  root.dataset.ramadanLanterns = String(theme.motifs.lanterns);
  root.dataset.ramadanMashrabiya = String(theme.motifs.mashrabiya);
  root.dataset.ramadanCannon = String(theme.motifs.iftarCannon);
  root.dataset.ramadanCoast = String(theme.motifs.coastalReflections);
  root.dataset.ramadanAssistant = String(theme.motifs.assistantLantern);
}

/**
 * سكربت صغير يعمل قبل أول رسم ويحقن الثيم من التخزين المحلي،
 * حتى لا يرى الزائر «ومضة» ألوان العلامة قبل ظهور الموسم.
 * (نفس خوارزمية buildPalette — تُكرَّر هنا نصياً لأنها تعمل قبل تحميل الحِزمة)
 */
export const THEME_BOOT_SCRIPT = `(function(){try{
var raw=localStorage.getItem("aqaar-site-settings");if(!raw)return;
var cfg=(JSON.parse(raw)||{}).seasonTheme||{};if(cfg.active!==true)return;
var steps=[[50,97],[100,94],[200,87],[300,77],[400,64],[500,54],[600,45],[700,37],[800,30],[900,25],[950,16]];
function parts(v,fb){var m=/^#?([0-9a-f]{6})$/i.exec(String(v||""));if(!m)return parts(fb,"#000000");var n=parseInt(m[1],16);return [(n>>16)&255,(n>>8)&255,n&255];}
function hslOf(p){var r=p[0]/255,g=p[1]/255,b=p[2]/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,h=0,s=0;
if(mx!==mn){var d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=(g-b)/d+(g<b?6:0);else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h/=6;}return [h*360,s*100,l*100];}
function rgb(h,s,l){s/=100;l/=100;var c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2,r=0,g=0,b=0;
if(h<60){r=c;g=x;}else if(h<120){r=x;g=c;}else if(h<180){g=c;b=x;}else if(h<240){g=x;b=c;}else if(h<300){r=x;b=c;}else{r=c;b=x;}
return [Math.round((r+m)*255),Math.round((g+m)*255),Math.round((b+m)*255)].join(" ");}
function ink(h){var p=parts(h,"#c9922a");function ch(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}var L=0.2126*ch(p[0])+0.7152*ch(p[1])+0.0722*ch(p[2]);return L>0.22?"#141a33":"#ffffff";}
var root=document.documentElement,st=root.style;
function ramp(name,base,fb,scale){var hsl=hslOf(parts(base,fb));for(var i=0;i<steps.length;i++){var L=steps[i][1];var f=L>=92?0.7:L>=78?0.85:L>=45?1:0.9;var s=hsl[1]*f*scale;if(s<8)s=8;if(s>85)s=85;st.setProperty("--"+name+"-"+steps[i][0],rgb(hsl[0],s,L));}}
ramp("ocean",cfg.ocean,"#141a33",1);ramp("sand",cfg.sand,"#fdfbf7",0.8);ramp("gold",cfg.gold,"#c9922a",1);
if(cfg.accent)st.setProperty("--season-accent",cfg.accent);
st.setProperty("--season-accent-ink",ink(cfg.accent||"#c9922a"));
if(cfg.heroGradient)st.setProperty("--hero-gradient-theme",cfg.heroGradient);
if(cfg.backgroundImage)st.setProperty("--theme-bg-image",'url("'+cfg.backgroundImage+'")');
st.setProperty("--theme-pattern-opacity",String(cfg.patternOpacity==null?0:cfg.patternOpacity));
root.dataset.seasonTheme=cfg.preset||"custom";
var mo=cfg.motifs||{},keys={crescent:"ramadanCrescent",lanterns:"ramadanLanterns",mashrabiya:"ramadanMashrabiya",iftarCannon:"ramadanCannon",coastalReflections:"ramadanCoast",assistantLantern:"ramadanAssistant"};
if(cfg.preset==="ramadan"){for(var k in keys){root.dataset[keys[k]]=String(mo[k]!==false);}}
}catch(e){}})();`;
