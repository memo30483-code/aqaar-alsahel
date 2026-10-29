"use client";

import { useState } from "react";
import { Eye, Palette, RotateCcw, Save, ShieldCheck, Sparkles } from "lucide-react";
import { getSiteSettings, saveSiteSettings, type SiteSettings } from "@/lib/admin-system";
import {
  DEFAULT_THEME,
  PRESET_MAP,
  RAMADAN_CAMPAIGN_TEXT,
  RAMADAN_DEFAULT_MOTIFS,
  SEASON_THEME_UPDATED_EVENT,
  applySeasonThemeToDocument,
  resolveSeasonTheme,
  type RamadanMotifs,
  type SeasonPreset,
  type SeasonThemeCfg,
} from "@/lib/theme-season";
import { BTN_PRIMARY, INPUT, Panel } from "@/components/admin/shared";

const PRESETS: { key: SeasonPreset; labelAr: string; swatch: string }[] = [
  { key: "ramadan", labelAr: "رمضان", swatch: "#152e36" },
  { key: "eid-fitr", labelAr: "عيد الفطر", swatch: "#3a2a1a" },
  { key: "eid-adha", labelAr: "عيد الأضحى", swatch: "#2a2218" },
  { key: "winter", labelAr: "شتاء", swatch: "#0a1628" },
  { key: "spring", labelAr: "ربيع", swatch: "#1a3528" },
  { key: "summer", labelAr: "صيف", swatch: "#332a0a" },
  { key: "fall", labelAr: "خريف", swatch: "#2e2218" },
  { key: "october", labelAr: "أكتوبر", swatch: "#2a1818" },
  { key: "custom", labelAr: "تخصيص يدوي", swatch: "#141a33" },
];

const RAMADAN_MOTIF_OPTIONS: { key: keyof RamadanMotifs; label: string }[] = [
  { key: "crescent", label: "الهلال والنجوم" },
  { key: "lanterns", label: "الفوانيس المعلّقة" },
  { key: "mashrabiya", label: "المشربية وزقاق القاهرة" },
  { key: "iftarCannon", label: "مدفع الإفطار" },
  { key: "coastalReflections", label: "انعكاسات الساحل" },
  { key: "assistantLantern", label: "بيت المساعد داخل الفانوس" },
];

const LABEL = "mb-1 block text-[10.5px] font-extrabold text-sand-600";

interface Draft {
  gold: string;
  sand: string;
  ocean: string;
  accent: string;
  heroGradient: string;
  heroImage: string;
  backgroundImage: string;
  backgroundOpacity: number;
  patternOpacity: number;
}

function draftFrom(cfg: SeasonThemeCfg): Draft {
  return {
    gold: cfg.gold ?? DEFAULT_THEME.gold,
    sand: cfg.sand ?? DEFAULT_THEME.sand,
    ocean: cfg.ocean ?? DEFAULT_THEME.ocean,
    accent: cfg.accent ?? DEFAULT_THEME.accent,
    heroGradient: cfg.heroGradient ?? DEFAULT_THEME.heroGradient,
    heroImage: cfg.heroImage ?? "",
    backgroundImage: cfg.backgroundImage ?? "",
    backgroundOpacity: cfg.backgroundOpacity ?? 0.35,
    patternOpacity: cfg.patternOpacity ?? 0,
  };
}

export default function AdminThemeTab({
  notify,
  can,
  onChange,
}: {
  notify: (msg: string) => void;
  can: (key: string) => boolean;
  onChange: (settings: SiteSettings) => void;
}) {
  const settings = getSiteSettings();
  const current: SeasonThemeCfg = (settings.seasonTheme ?? DEFAULT_THEME) as SeasonThemeCfg;
  const editable = can("site.settings");

  const [preset, setPreset] = useState<SeasonPreset>(current.preset ?? "custom");
  const [active, setActive] = useState(current.active ?? false);
  const [campaignText, setCampaignText] = useState(
    current.campaignText ?? (current.preset === "ramadan" ? RAMADAN_CAMPAIGN_TEXT : "")
  );
  const [motifs, setMotifs] = useState<RamadanMotifs>({
    ...RAMADAN_DEFAULT_MOTIFS,
    ...current.motifs,
  });
  const [draft, setDraft] = useState<Draft>(() => draftFrom(current));

  const patch = (value: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...value }));

  const buildCfg = (): SeasonThemeCfg => ({
    preset,
    active,
    gold: draft.gold,
    sand: draft.sand,
    ocean: draft.ocean,
    accent: draft.accent,
    heroGradient: draft.heroGradient,
    heroImage: draft.heroImage.trim() || undefined,
    backgroundImage: draft.backgroundImage.trim() || undefined,
    backgroundOpacity: draft.backgroundOpacity,
    patternOpacity: draft.patternOpacity,
    campaignText: campaignText.trim(),
    motifs: preset === "ramadan" ? motifs : {},
  });

  /** تغيير الموسم يجلب ألوانه وتدرّجه فوراً داخل النموذج */
  const pickPreset = (next: SeasonPreset) => {
    setPreset(next);
    const colors = next !== "custom" ? PRESET_MAP[next] ?? {} : {};
    setDraft((prev) => ({
      ...prev,
      gold: colors.gold ?? prev.gold,
      sand: colors.sand ?? prev.sand,
      ocean: colors.ocean ?? prev.ocean,
      accent: colors.accent ?? prev.accent,
      heroGradient: colors.heroGradient ?? prev.heroGradient,
    }));
    /* نص رمضان لا يجب أن يظهر تلقائياً في موسم آخر */
    setCampaignText((prev) => {
      const trimmed = prev.trim();
      if (next === "ramadan") return trimmed || RAMADAN_CAMPAIGN_TEXT;
      return trimmed === RAMADAN_CAMPAIGN_TEXT ? "" : prev;
    });
  };

  /** معاينة على الصفحة بدون حفظ */
  const preview = () => {
    applySeasonThemeToDocument(resolveSeasonTheme(buildCfg()));
    notify("معاينة مؤقتة — اضغط «حفظ وتفعيل» لتثبيتها لكل الزوار");
  };

  const save = () => {
    if (!editable) return;
    const cfg = buildCfg();
    const latest = getSiteSettings();
    const next: SiteSettings = { ...latest, seasonTheme: cfg };
    if (!saveSiteSettings(next)) {
      notify("تعذّر حفظ الثيم — مساحة التخزين في المتصفح ممتلئة");
      return;
    }
    onChange(next);
    /* نطبّق الكامل (لا مجرد الألوان) حتى يظهر غلاف الهيرو والخلفية */
    applySeasonThemeToDocument(resolveSeasonTheme(cfg));
    window.dispatchEvent(new Event(SEASON_THEME_UPDATED_EVENT));
    notify(active ? "تم حفظ الثيم وتطبيقه" : "تم إيقاف الثيم واستعادة ألوان الموقع");
  };

  const resetAll = () => {
    setPreset("custom");
    setActive(false);
    setCampaignText("");
    setMotifs({ ...RAMADAN_DEFAULT_MOTIFS });
    setDraft(draftFrom(DEFAULT_THEME));
    notify("تمت استعادة الإعدادات الافتراضية (لم تُحفظ بعد)");
  };

  return (
    <Panel
      title="الثيم الموسمي — تحكم كامل"
      desc="كل ما تغيّره هنا ينطبق على الموقع كله: الألوان (خلفيات، أزرار، شارات، هيرو)، الصور، النصوص، وزينة رمضان."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={preview}
            disabled={!editable}
            className="inline-flex items-center gap-1 rounded-full border border-sand-200 px-3 py-2 text-xs font-bold text-sand-700 disabled:opacity-40"
          >
            <Eye className="h-3.5 w-3.5" /> معاينة
          </button>
          <button type="button" onClick={save} className={BTN_PRIMARY} disabled={!editable}>
            <Save className="h-4 w-4" /> حفظ وتفعيل
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ===== التفعيل ===== */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand-200 bg-sand-50/50 p-3">
          <label className="flex items-center gap-2 text-[12px] font-bold text-ocean-900">
            <input
              type="checkbox"
              checked={active}
              disabled={!editable}
              onChange={(event) => setActive(event.target.checked)}
              className="h-4 w-4 accent-gold-500"
            />
            <ShieldCheck className="h-3.5 w-3.5 text-gold-600" />
            تفعيل الثيم على الموقع
          </label>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white px-3 py-1 text-[10px] font-extrabold text-sand-700">
              <Palette className="h-3 w-3" /> {draft.ocean} / {draft.gold}
            </span>
            <button
              type="button"
              onClick={resetAll}
              disabled={!editable}
              className="inline-flex items-center gap-1 rounded-full border border-sand-200 px-3 py-1.5 text-[11px] font-bold text-sand-700 disabled:opacity-40"
            >
              <RotateCcw className="h-3 w-3" /> افتراضي
            </button>
          </div>
        </div>

        {/* ===== اختيار الموسم ===== */}
        <div>
          <p className="mb-2 text-[11px] font-black text-ocean-900">الموسم</p>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {PRESETS.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={!editable}
                onClick={() => pickPreset(item.key)}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[11.5px] font-extrabold transition ${
                  preset === item.key
                    ? "border-gold-400 bg-gold-50 text-ocean-900 shadow-sm"
                    : "border-sand-200 bg-white text-ocean-700 hover:border-gold-300"
                }`}
              >
                <span
                  aria-hidden
                  className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
                  style={{ background: item.swatch }}
                />
                {item.labelAr}
              </button>
            ))}
          </div>
        </div>

        {/* ===== الألوان ===== */}
        <div className="rounded-2xl border border-sand-200 p-3.5">
          <p className="mb-1 text-[11px] font-black text-ocean-900">ألوان الهوية</p>
          <p className="mb-3 text-[10px] font-semibold leading-5 text-sand-500">
            من هذه الأربعة تُبنى لوحة كاملة (١١ درجة لكل لون) تُستخدم في كل الموقع تلقائياً.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { key: "ocean", label: "الأساسي (النيلي)" },
                { key: "gold", label: "الذهبي" },
                { key: "sand", label: "الخلفية الرملية" },
                { key: "accent", label: "لون التمييز" },
              ] as const
            ).map((item) => (
              <label key={item.key} className="block">
                <span className={LABEL}>{item.label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft[item.key]}
                    disabled={!editable}
                    onChange={(event) => patch({ [item.key]: event.target.value })}
                    className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-sand-200 bg-white"
                    aria-label={item.label}
                  />
                  <input
                    value={draft[item.key]}
                    disabled={!editable}
                    onChange={(event) => patch({ [item.key]: event.target.value })}
                    className={`${INPUT} font-mono text-[11px]`}
                    dir="ltr"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* ===== الهيرو والخلفية ===== */}
        <div className="rounded-2xl border border-sand-200 p-3.5">
          <p className="mb-3 text-[11px] font-black text-ocean-900">الهيرو والخلفية</p>
          <div className="grid gap-3">
            <label className="block">
              <span className={LABEL}>تدرّج الهيرو (CSS)</span>
              <input
                value={draft.heroGradient}
                disabled={!editable}
                onChange={(event) => patch({ heroGradient: event.target.value })}
                className={`${INPUT} font-mono text-[10.5px]`}
                dir="ltr"
              />
            </label>
            <label className="block">
              <span className={LABEL}>صورة غلاف الهيرو (رابط)</span>
              <input
                value={draft.heroImage}
                disabled={!editable}
                onChange={(event) => patch({ heroImage: event.target.value })}
                className={`${INPUT} text-[11px]`}
                dir="ltr"
                placeholder="https://…"
              />
            </label>
            <label className="block">
              <span className={LABEL}>صورة خلفية الصفحة (رابط)</span>
              <input
                value={draft.backgroundImage}
                disabled={!editable}
                onChange={(event) => patch({ backgroundImage: event.target.value })}
                className={`${INPUT} text-[11px]`}
                dir="ltr"
                placeholder="https://…"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL}>
                  شفافية الخلفية — {Math.round(draft.backgroundOpacity * 100)}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={draft.backgroundOpacity}
                  disabled={!editable}
                  onChange={(event) => patch({ backgroundOpacity: Number(event.target.value) })}
                  className="w-full accent-gold-500"
                />
              </label>
              <label className="block">
                <span className={LABEL}>
                  كثافة النقش الإسلامي — {Math.round(draft.patternOpacity * 100)}%
                </span>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.02}
                  value={draft.patternOpacity}
                  disabled={!editable}
                  onChange={(event) => patch({ patternOpacity: Number(event.target.value) })}
                  className="w-full accent-gold-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* ===== النص ===== */}
        <label className="block">
          <span className={LABEL}>نص الحملة (يظهر في الشريط العلوي والهيرو)</span>
          <input
            value={campaignText}
            maxLength={80}
            disabled={!editable}
            onChange={(event) => setCampaignText(event.target.value)}
            className={INPUT}
            placeholder="مثال: رمضان احلى مع عقار FAMILY"
          />
        </label>

        {/* ===== زينة رمضان ===== */}
        {preset === "ramadan" && (
          <div className="space-y-2 rounded-2xl border border-gold-200/70 bg-[linear-gradient(135deg,#fffaf0,#f7f1e5)] p-3.5">
            <p className="text-[11px] font-black text-ocean-900">عناصر زينة رمضان</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {RAMADAN_MOTIF_OPTIONS.map((motif) => (
                <label
                  key={motif.key}
                  className="flex items-center gap-2 rounded-xl border border-sand-200/80 bg-white/80 px-2.5 py-2 text-[10.5px] font-bold text-ocean-800"
                >
                  <input
                    type="checkbox"
                    checked={motifs[motif.key]}
                    disabled={!editable}
                    onChange={(event) =>
                      setMotifs((previous) => ({
                        ...previous,
                        [motif.key]: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-gold-500"
                  />
                  <span>{motif.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-sand-500">
          <Sparkles className="h-3 w-3" />
          الحفظ محلي في هذا المتصفح حتى ربط قاعدة البيانات — استخدم «معاينة» لتجربة أي تعديل قبل تثبيته.
        </p>
      </div>
    </Panel>
  );
}
