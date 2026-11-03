"use client";

import { Image as ImageIcon, Palette, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { getSession } from "@/lib/session";
import {
  addAdminLog,
  saveSiteSettings,
  type SiteSettings,
} from "@/lib/admin-system";
import {
  BRANDING_UPDATED_EVENT,
  DEFAULT_BRANDING,
  FONT_OPTIONS,
  type BrandingCfg,
  type FontKey,
} from "@/lib/branding";
import { BTN_PRIMARY, Field, INPUT, Panel } from "@/components/admin/shared";

interface Props {
  settings: SiteSettings;
  can: (key: string) => boolean;
  onChange: (settings: SiteSettings) => void;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

const MAX_LOGO_BYTES = 400 * 1024;

function ImageField({
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const pick = (file: File | null | undefined) => {
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      window.alert("حجم الصورة أكبر من ٤٠٠ كيلوبايت — استخدم صورة أصغر أو رابط مباشر.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-sand-200 bg-sand-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain p-1" />
          ) : (
            <ImageIcon className="h-4 w-4 text-sand-400" />
          )}
        </span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://… أو ارفع صورة"
          className={INPUT}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-sand-200 bg-white px-2.5 py-2 text-[11px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/50 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          رفع
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
          className="hidden"
          disabled={disabled}
          onChange={(event) => pick(event.target.files?.[0])}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled}
            aria-label="مسح الصورة"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-rose-100 text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </Field>
  );
}

const COLOR_FIELDS: { key: keyof BrandingCfg["colors"]; label: string; hint: string }[] = [
  { key: "ocean", label: "اللون الأساسي (كحلي)", hint: "العناوين الداكنة والأزرار الرئيسية." },
  { key: "gold", label: "اللون الذهبي", hint: "التوقيع الذهبي والتفاصيل الفاخرة." },
  { key: "sand", label: "لون الخلفية (رملي)", hint: "خلفية الصفحات الفاتحة." },
  { key: "accent", label: "لون التمييز", hint: "يُستخدم في العروض والثيم النشط." },
];

export default function AdminBrandTab({ settings, can, onChange, notify, reloadLogs }: Props) {
  const editable = can("settings.full") || can("site.settings");
  const brand: BrandingCfg = settings.branding ?? DEFAULT_BRANDING;

  const update = (patch: Partial<BrandingCfg>) => {
    onChange({ ...settings, branding: { ...brand, ...patch } });
  };

  const persist = () => {
    if (!saveSiteSettings(settings)) {
      notify("تعذّر حفظ الهوية — مساحة التخزين ممتلئة. جرّب شعارات أصغر.");
      return;
    }
    window.dispatchEvent(new Event(BRANDING_UPDATED_EVENT));
    const session = getSession();
    if (session) {
      addAdminLog({
        action: "site.branding.update",
        category: "settings",
        performedBy: session.email,
        performedByName: session.name,
        performedByRole: session.role ?? "admin",
        details: "تم تحديث الشعارات والخطوط والألوان الأساسية للموقع",
      });
      reloadLogs();
    }
    notify("تم حفظ الهوية وتطبيقها على الموقع كله");
  };

  return (
    <div className="space-y-5">
      <Panel
        title="الشعارات"
        desc="ارفع صورة أو ضع رابطاً مباشراً. تُطبَّق فور الحفظ على الهيدر والفوتر وأيقونة المتصفح والتطبيق."
        actions={
          <button onClick={persist} className={BTN_PRIMARY} disabled={!editable}>
            <Save className="h-4 w-4" /> حفظ الهوية
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ImageField
            label="الشعار الرئيسي"
            hint="يُستخدم في كل مكان إن لم تحدد شعاراً فاتحاً أو مظلماً."
            value={brand.logoMain ?? ""}
            onChange={(logoMain) => update({ logoMain })}
            disabled={!editable}
          />
          <ImageField
            label="الشعار على الخلفية الفاتحة (الهيدر)"
            hint="الشعار الأفقي أو المربّع فوق الأبيض/الرملي."
            value={brand.logoLight ?? ""}
            onChange={(logoLight) => update({ logoLight })}
            disabled={!editable}
          />
          <ImageField
            label="الشعار على الخلفية الداكنة (الفوتر)"
            hint="نسخة فاتحة/ذهبية من الشعار."
            value={brand.logoDark ?? ""}
            onChange={(logoDark) => update({ logoDark })}
            disabled={!editable}
          />
          <ImageField
            label="أيقونة تطبيق الموبايل"
            hint="تظهر داخل شاشات التطبيق وفي بانر الموبايل."
            value={brand.appIcon ?? ""}
            onChange={(appIcon) => update({ appIcon })}
            disabled={!editable}
          />
          <ImageField
            label="أيقونة المتصفح (Favicon)"
            hint="مربّعة ٥١٢×٥١٢ أو ٣٢×٣٢ PNG/ICO."
            value={brand.favicon ?? ""}
            onChange={(favicon) => update({ favicon })}
            disabled={!editable}
          />
          <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
            <p className="text-[11px] font-extrabold text-sand-700">معاينة سريعة</p>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-sand-200 bg-white p-3">
              <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-ocean-950">
                {brand.logoLight || brand.logoMain ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logoLight || brand.logoMain}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="font-heading text-lg font-black text-gold-300">F</span>
                )}
              </span>
              <span>
                <span className="font-heading block text-sm font-black text-ocean-900">
                  عقار FAMILY
                </span>
                <span className="block text-[10px] font-semibold text-sand-600">
                  المعاينة تتحدث أثناء التعديل
                </span>
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="الخطوط والأحجام"
        desc="اختر عائلة الخط للعناوين والنصوص، وتحكّم في الحجم الأساسي للموقع."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="خط العناوين" hint="يُطبَّق على h1–h6 وعناوين الأقسام.">
            <select
              value={brand.headingFont}
              onChange={(event) => update({ headingFont: event.target.value as FontKey })}
              className={INPUT}
              disabled={!editable}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.key} value={font.key}>
                  {font.labelAr}
                </option>
              ))}
            </select>
          </Field>
          <Field label="خط النصوص" hint="يُطبَّق على كل نصوص الموقع والأزرار.">
            <select
              value={brand.bodyFont}
              onChange={(event) => update({ bodyFont: event.target.value as FontKey })}
              className={INPUT}
              disabled={!editable}
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.key} value={font.key}>
                  {font.labelAr}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={`حجم الخط الأساسي: ${brand.baseFontSize}px`}
            hint="١٤–١٩px. يكبّر/يصغّر كل نصوص الموقع ومسافاتها بشكل متناسق."
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={14}
                max={19}
                step={0.5}
                value={brand.baseFontSize}
                onChange={(event) => update({ baseFontSize: Number(event.target.value) })}
                disabled={!editable}
                className="h-2 w-full accent-gold-600"
              />
              <span className="w-12 shrink-0 rounded-lg border border-sand-200 bg-sand-50 py-1 text-center text-[11px] font-black text-ocean-900">
                {brand.baseFontSize}px
              </span>
            </div>
          </Field>
          <div className="rounded-2xl border border-sand-200 bg-white p-4">
            <p className="text-[11px] font-extrabold text-sand-700">معاينة الخط</p>
            <p
              className={`mt-2 text-lg font-black leading-snug text-ocean-900 ${brand.headingFont === "cairo" ? "font-sans" : ""}`}
              style={{
                fontFamily: FONT_OPTIONS.find((font) => font.key === brand.headingFont)?.stack,
              }}
            >
              عقار أحلامك بثقة موثّقة
            </p>
            <p
              className="mt-1 text-[11.5px] font-medium leading-6 text-sand-700"
              style={{
                fontFamily: FONT_OPTIONS.find((font) => font.key === brand.bodyFont)?.stack,
              }}
            >
              سوق عقاري موثّق في رأس البر ودمياط — بعد التحقق من المستندات والسلامة القانونية.
            </p>
          </div>
        </div>
      </Panel>

      <Panel
        title="الألوان الأساسية"
        desc="ألوان العلامة عندما لا يكون الثيم الموسمي مفعّلاً. عند تفعيل موسم من «الثيم» تكون الأولوية لألوان الموسم."
        actions={
          <button
            type="button"
            onClick={() => onChange({ ...settings, branding: DEFAULT_BRANDING })}
            disabled={!editable}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sand-200 bg-white px-3 py-2 text-[11px] font-bold text-ocean-800 transition hover:border-gold-300 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" /> الافتراضي
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {COLOR_FIELDS.map((field) => (
            <Field key={field.key} label={field.label} hint={field.hint}>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brand.colors[field.key]}
                  onChange={(event) =>
                    update({
                      colors: { ...brand.colors, [field.key]: event.target.value },
                    })
                  }
                  disabled={!editable}
                  className="h-9 w-12 cursor-pointer rounded-lg border border-sand-200 bg-white p-1"
                />
                <input
                  value={brand.colors[field.key]}
                  onChange={(event) =>
                    update({
                      colors: { ...brand.colors, [field.key]: event.target.value },
                    })
                  }
                  disabled={!editable}
                  dir="ltr"
                  className={INPUT}
                />
              </div>
            </Field>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-sand-600">
          <Palette className="h-3.5 w-3.5" />
          التغييرات تُحفظ عند الضغط على «حفظ الهوية» بالأعلى.
        </p>
      </Panel>
    </div>
  );
}
