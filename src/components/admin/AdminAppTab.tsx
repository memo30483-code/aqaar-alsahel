"use client";

import { Eye, Save, Smartphone } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { addAdminLog, saveSiteSettings, type SiteSettings } from "@/lib/admin-system";
import {
  DEFAULT_APP_SETTINGS,
  resolveAppSettings,
  type AppFeature,
  type AppReleaseStatus,
} from "@/lib/app-settings";
import {
  BTN_PRIMARY,
  Field,
  INPUT,
  Panel,
  ToggleRow,
} from "@/components/admin/shared";

interface Props {
  settings: SiteSettings;
  can: (key: string) => boolean;
  onChange: (settings: SiteSettings) => void;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

export default function AdminAppTab({ settings, can, onChange, notify, reloadLogs }: Props) {
  const editable = can("settings.full") || can("site.settings");
  const app = resolveAppSettings(settings.app);

  const update = (patch: Partial<typeof app>) => {
    onChange({ ...settings, app: { ...app, ...patch } });
  };

  const updateFeature = (id: string, patch: Partial<AppFeature>) => {
    update({
      features: app.features.map((feature) =>
        feature.id === id ? { ...feature, ...patch } : feature
      ),
    });
  };

  const persist = () => {
    if (!saveSiteSettings(settings)) {
      notify("تعذّر حفظ إعدادات التطبيق — مساحة التخزين ممتلئة");
      return;
    }
    const session = getSession();
    if (session) {
      addAdminLog({
        action: "site.app.update",
        category: "settings",
        performedBy: session.email,
        performedByName: session.name,
        performedByRole: session.role ?? "admin",
        details: "تم تحديث محتوى قسم التطبيق وصفحة /app",
      });
      reloadLogs();
    }
    notify("تم حفظ إعدادات التطبيق");
  };

  return (
    <div className="space-y-5">
      <Panel
        title="حالة التطبيق وظهوره"
        desc="«قريبًا» يعني أزرار المتاجر غير مفعّلة مع تسجيل اهتمام. «متاح الآن» يفتح روابط المتاجر التي تكتبها."
        actions={
          <button onClick={persist} className={BTN_PRIMARY} disabled={!editable}>
            <Save className="h-4 w-4" /> حفظ التطبيق
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleRow
            title="إظهار التطبيق في الموقع"
            hint="زر الهيدر + قسم الرئيسية + الفوتر + بانر الموبايل + صفحة /app."
            checked={app.enabled}
            onChange={(enabled) => update({ enabled })}
            disabled={!editable}
          />
          <ToggleRow
            title="الهيرو يعرض واجهة التطبيق"
            hint="يستبدل صورة العقار في الهيرو بموبايلات التطبيق — كما في التصميم المعتمد."
            checked={app.heroMode}
            onChange={(heroMode) => update({ heroMode })}
            disabled={!editable}
          />
          <Field label="حالة الإطلاق">
            <select
              value={app.status}
              onChange={(event) => update({ status: event.target.value as AppReleaseStatus })}
              className={INPUT}
              disabled={!editable}
            >
              <option value="soon">قريبًا — تسجيل اهتمام</option>
              <option value="live">متاح للتحميل الآن</option>
            </select>
          </Field>
          <Field label="بريد استلام تسجيل الاهتمام" hint="اتركه فارغاً لاستخدام بريد إدارة الموقع.">
            <input
              value={app.interestEmail}
              onChange={(event) => update({ interestEmail: event.target.value })}
              className={INPUT}
              dir="ltr"
              disabled={!editable}
            />
          </Field>
          <Field label="رابط App Store">
            <input
              value={app.iosUrl}
              onChange={(event) => update({ iosUrl: event.target.value })}
              className={INPUT}
              dir="ltr"
              placeholder="https://apps.apple.com/…"
              disabled={!editable}
            />
          </Field>
          <Field label="رابط Google Play">
            <input
              value={app.androidUrl}
              onChange={(event) => update({ androidUrl: event.target.value })}
              className={INPUT}
              dir="ltr"
              placeholder="https://play.google.com/…"
              disabled={!editable}
            />
          </Field>
          <Field label="رابط رمز QR" hint="عادةً رابط الموقع أو رابط صفحة التحميل.">
            <input
              value={app.qrUrl}
              onChange={(event) => update({ qrUrl: event.target.value })}
              className={INPUT}
              dir="ltr"
              disabled={!editable}
            />
          </Field>
          <Field label="تأخير بانر الموبايل (ثواني)" hint="من ٠.٥ إلى ٣٠ ثانية.">
            <input
              type="number"
              min={0.5}
              max={30}
              step={0.5}
              value={app.bannerDelaySec}
              onChange={(event) => update({ bannerDelaySec: Number(event.target.value) })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
          <ToggleRow
            title="بانر الموبايل"
            hint="شريط صغير أسفل شاشة الموبايل يظهر بعد التأخير ويُغلق نهائياً."
            checked={app.showMobileBanner}
            onChange={(showMobileBanner) => update({ showMobileBanner })}
            disabled={!editable}
          />
          <div className="flex items-center gap-2 rounded-2xl border border-sand-200 bg-sand-50/50 p-3">
            <Smartphone className="h-4 w-4 text-gold-600" />
            <Link
              href="/app"
              target="_blank"
              className="inline-flex items-center gap-1 text-[11.5px] font-bold text-gold-700"
            >
              <Eye className="h-3.5 w-3.5" /> معاينة صفحة التطبيق
            </Link>
          </div>
        </div>
      </Panel>

      <Panel
        title="محتوى الهيرو"
        desc="العنوان والوصف في هيرو الرئيسية وصفحة /app. يمكنك الرجوع لأي وقت للقيم الافتراضية."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="السطر الصغير (Eyebrow)">
            <input
              value={app.eyebrowAr}
              onChange={(event) => update({ eyebrowAr: event.target.value })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
          <div className="hidden md:block" />
          <Field label="العنوان — السطر الأول">
            <input
              value={app.titleAr}
              onChange={(event) => update({ titleAr: event.target.value })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
          <Field label="العنوان — السطر الذهبي">
            <input
              value={app.subtitleAr}
              onChange={(event) => update({ subtitleAr: event.target.value })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="الوصف">
              <textarea
                rows={3}
                value={app.descriptionAr}
                onChange={(event) => update({ descriptionAr: event.target.value })}
                className={INPUT}
                disabled={!editable}
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() =>
                update({
                  eyebrowAr: DEFAULT_APP_SETTINGS.eyebrowAr,
                  titleAr: DEFAULT_APP_SETTINGS.titleAr,
                  subtitleAr: DEFAULT_APP_SETTINGS.subtitleAr,
                  descriptionAr: DEFAULT_APP_SETTINGS.descriptionAr,
                })
              }
              disabled={!editable}
              className="text-[11px] font-bold text-gold-700 underline disabled:opacity-40"
            >
              استعادة النصوص الافتراضية
            </button>
          </div>
        </div>
      </Panel>

      <Panel title="ميزات التطبيق" desc="أربع ميزات تظهر في الرئيسية وصفحة /app. عدّل النص كما تحب.">
        <div className="grid gap-3 md:grid-cols-2">
          {app.features.map((feature, index) => (
            <div
              key={feature.id}
              className="rounded-2xl border border-sand-200 bg-sand-50/40 p-3.5"
            >
              <p className="mb-2 text-[11px] font-black text-sand-600">
                الميزة {index + 1}
              </p>
              <Field label="العنوان">
                <input
                  value={feature.titleAr}
                  onChange={(event) => updateFeature(feature.id, { titleAr: event.target.value })}
                  className={INPUT}
                  disabled={!editable}
                />
              </Field>
              <div className="mt-2">
                <Field label="الوصف">
                  <textarea
                    rows={2}
                    value={feature.descAr}
                    onChange={(event) => updateFeature(feature.id, { descAr: event.target.value })}
                    className={INPUT}
                    disabled={!editable}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-sand-600">
          التغييرات تُحفظ عند الضغط على «حفظ التطبيق» بالأعلى.
        </p>
      </Panel>
    </div>
  );
}
