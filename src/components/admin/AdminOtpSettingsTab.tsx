"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleCheck,
  CircleX,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquareText,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  DEFAULT_OTP_SETTINGS,
  OTP_CHANNEL_LABEL,
  OTP_CHANNELS,
  type OtpChannel,
  type OtpProviderStatuses,
  type OtpSettings,
} from "@/lib/otp";
import { Field, INPUT, Panel, ToggleRow } from "@/components/admin/shared";

interface Props {
  can: (key: string) => boolean;
  notify: (message: string) => void;
}

const CHANNEL_ICON = {
  email: Mail,
  sms: MessageSquareText,
  whatsapp: MessageCircle,
} satisfies Record<OtpChannel, typeof Mail>;

export default function AdminOtpSettingsTab({ can, notify }: Props) {
  const [settings, setSettings] = useState<OtpSettings>(DEFAULT_OTP_SETTINGS);
  const [providers, setProviders] = useState<OtpProviderStatuses | null>(null);
  const [schemaReady, setSchemaReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/otp-settings", {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        settings?: OtpSettings;
        providers?: OtpProviderStatuses;
        schemaReady?: boolean;
        error?: string;
      };
      if (!response.ok || !data.settings || !data.providers) {
        throw new Error(data.error || "تعذر تحميل إعدادات OTP");
      }
      setSettings(data.settings);
      setProviders(data.providers);
      setSchemaReady(data.schemaReady === true);
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر تحميل إعدادات OTP");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const configuredEnabled = useMemo(
    () =>
      OTP_CHANNELS.filter(
        (channel) =>
          settings.channels[channel].enabled && providers?.[channel].configured
      ),
    [providers, settings.channels]
  );

  const setChannel = (channel: OtpChannel, enabled: boolean) => {
    if (enabled && !providers?.[channel].configured) {
      notify(`اربط مزود ${OTP_CHANNEL_LABEL[channel]} أولًا قبل التفعيل`);
      return;
    }
    setSettings((current) => ({
      ...current,
      channels: {
        ...current.channels,
        [channel]: { enabled },
      },
      defaultChannel:
        !enabled && current.defaultChannel === channel
          ? OTP_CHANNELS.find(
              (item) => item !== channel && current.channels[item].enabled
            ) ?? "email"
          : current.defaultChannel,
    }));
  };

  const save = async () => {
    if (!can("otp.manage") || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/otp-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = (await response.json()) as {
        settings?: OtpSettings;
        providers?: OtpProviderStatuses;
        error?: string;
        message?: string;
        schemaReady?: boolean;
      };
      if (!response.ok || !data.settings || !data.providers) {
        throw new Error(data.message || data.error || "تعذر حفظ الإعدادات");
      }
      setSettings(data.settings);
      setProviders(data.providers);
      setSchemaReady(data.schemaReady === true);
      notify("تم حفظ إعدادات OTP على السيرفر");
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !providers) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-3xl border border-sand-200 bg-white py-20 text-sand-600">
        <Loader2 className="h-5 w-5 animate-spin" /> تحميل إعدادات OTP…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Panel
        title="التحقق OTP"
        desc="البريد هو القناة الموصى بها في البداية. SMS وواتساب جاهزان برمجيًا ولا ينفذان أي اتصال أو تكلفة وهما معطلان."
        actions={
          <button
            onClick={() => void save()}
            disabled={!can("otp.manage") || saving}
            className="inline-flex items-center gap-2 rounded-full bg-ocean-950 px-4 py-2 text-xs font-black text-white disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ الإعدادات
          </button>
        }
      >
        <div
          className={`mb-5 rounded-2xl border p-4 ${
            settings.requiredForRegistration
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <ShieldCheck
              className={`mt-0.5 h-5 w-5 ${
                settings.requiredForRegistration
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            />
            <div className="flex-1">
              <p className="font-black text-ocean-950">
                {settings.requiredForRegistration
                  ? "OTP مفروض على التسجيل"
                  : "OTP غير مفروض حاليًا"}
              </p>
              <p className="mt-1 text-xs leading-6 text-sand-700">
                لا تفعّل الفرض قبل ظهور قناة واحدة على الأقل بحالة «مربوطة وجاهزة».
              </p>
              <p
                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${
                  schemaReady
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {schemaReady
                  ? "قاعدة OTP جاهزة"
                  : "قاعدة OTP غير مفعلة — migration مطلوب"}
              </p>
              <label className="mt-3 flex items-center gap-2 text-xs font-black text-ocean-900">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-600"
                  checked={settings.requiredForRegistration}
                  disabled={
                    !can("otp.manage") ||
                    (!settings.requiredForRegistration &&
                      (configuredEnabled.length === 0 || !schemaReady))
                  }
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      requiredForRegistration: event.target.checked,
                    }))
                  }
                />
                فرض التحقق قبل إنشاء أي حساب
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {OTP_CHANNELS.map((channel) => {
            const Icon = CHANNEL_ICON[channel];
            const provider = providers[channel];
            return (
              <section
                key={channel}
                className={`rounded-2xl border p-4 ${
                  settings.channels[channel].enabled && provider.configured
                    ? "border-emerald-300 bg-emerald-50/40"
                    : "border-sand-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-ocean-950 text-gold-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-black text-ocean-950">
                        {OTP_CHANNEL_LABEL[channel]}
                      </h3>
                      <p className="text-[10px] font-bold text-sand-500">
                        {provider.provider}
                      </p>
                    </div>
                  </div>
                  {provider.configured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-700">
                      <CircleCheck className="h-3 w-3" /> مربوط
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600">
                      <CircleX className="h-3 w-3" /> غير مربوط
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <ToggleRow
                    title={
                      settings.channels[channel].enabled
                        ? provider.configured
                          ? "القناة مفعلة"
                          : "محددة للتفعيل — تنتظر الربط"
                        : "القناة معطلة"
                    }
                    hint={
                      settings.channels[channel].enabled && provider.configured
                        ? "يمكن للنظام استخدامها عند فرض OTP."
                        : "لا رسائل ولا اتصالات API ولا تكلفة استخدام."
                    }
                    checked={settings.channels[channel].enabled}
                    onChange={(enabled) => setChannel(channel, enabled)}
                    disabled={
                      !can("otp.manage") ||
                      (!provider.configured &&
                        !settings.channels[channel].enabled)
                    }
                  />
                </div>

                {!provider.configured && (
                  <div className="mt-3 rounded-xl bg-sand-50 p-3">
                    <p className="text-[10px] font-black text-sand-700">
                      يحتاج متغيرات Vercel التالية:
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {provider.missing.map((item) => (
                        <code
                          key={item}
                          className="rounded bg-white px-1.5 py-1 text-[9px] text-rose-700"
                        >
                          {item}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-5 grid gap-4 rounded-2xl border border-sand-200 bg-sand-50 p-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="القناة الافتراضية">
            <select
              value={settings.defaultChannel}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  defaultChannel: event.target.value as OtpChannel,
                }))
              }
              className={INPUT}
            >
              {OTP_CHANNELS.map((channel) => (
                <option
                  key={channel}
                  value={channel}
                  disabled={
                    !settings.channels[channel].enabled ||
                    !providers[channel].configured
                  }
                >
                  {OTP_CHANNEL_LABEL[channel]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="صلاحية الكود — دقائق">
            <input
              type="number"
              min={3}
              max={15}
              value={settings.ttlMinutes}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  ttlMinutes: Number(event.target.value),
                }))
              }
              className={INPUT}
            />
          </Field>
          <Field label="أقصى محاولات للكود">
            <input
              type="number"
              min={3}
              max={10}
              value={settings.maxAttempts}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  maxAttempts: Number(event.target.value),
                }))
              }
              className={INPUT}
            />
          </Field>
          <Field label="إعادة الإرسال — ثانية">
            <input
              type="number"
              min={30}
              max={300}
              value={settings.resendSeconds}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  resendSeconds: Number(event.target.value),
                }))
              }
              className={INPUT}
            />
          </Field>
        </div>

        <label className="mt-4 flex items-start gap-2 rounded-2xl border border-sand-200 p-4 text-xs font-bold text-sand-700">
          <input
            type="checkbox"
            checked={settings.allowUserChoice}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                allowUserChoice: event.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 accent-gold-500"
          />
          السماح للمستخدم باختيار البريد أو SMS أو واتساب إذا كان أكثر من خيار مفعّلًا. عند الإيقاف تُستخدم القناة الافتراضية فقط.
        </label>
      </Panel>

      <Panel
        title="قوالب الرسائل"
        desc="هذه النصوص لا تحتوي أسرارًا. مفاتيح المزودين تبقى في Vercel فقط."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="اسم المرسل في البريد">
            <input
              value={settings.email.fromName}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  email: { ...current.email, fromName: event.target.value },
                }))
              }
              className={INPUT}
            />
          </Field>
          <Field label="عنوان رسالة البريد">
            <input
              value={settings.email.subjectAr}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  email: { ...current.email, subjectAr: event.target.value },
                }))
              }
              className={INPUT}
            />
          </Field>
          <div className="lg:col-span-2">
            <Field
              label="نص SMS"
              hint="استخدم {{code}} للكود و{{minutes}} لمدة الصلاحية."
            >
              <textarea
                rows={3}
                value={settings.sms.messageAr}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    sms: { ...current.sms, messageAr: event.target.value },
                  }))
                }
                className={INPUT}
              />
            </Field>
          </div>
          <Field label="اسم قالب واتساب المعتمد">
            <input
              value={settings.whatsapp.templateName}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  whatsapp: {
                    ...current.whatsapp,
                    templateName: event.target.value,
                  },
                }))
              }
              className={INPUT}
              dir="ltr"
            />
          </Field>
          <Field label="لغة قالب واتساب">
            <input
              value={settings.whatsapp.languageCode}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  whatsapp: {
                    ...current.whatsapp,
                    languageCode: event.target.value,
                  },
                }))
              }
              className={INPUT}
              dir="ltr"
            />
          </Field>
        </div>
      </Panel>
    </div>
  );
}
