"use client";

import { useI18n } from "@/lib/i18n";
import { useSiteSettings, whatsappHref } from "@/lib/site-settings";
import { normalizeWhatsAppWidgetSettings } from "@/lib/whatsapp-widget";
import WhatsAppIcon from "@/components/WhatsAppIcon";

/** زر واتساب ثابت بلا زر إغلاق — يظهر في جميع صفحات المنصة. */
export default function WhatsAppWidget() {
  const { locale } = useI18n();
  const site = useSiteSettings();
  const config = normalizeWhatsAppWidgetSettings(site.whatsappWidget);
  const phone =
    config.phone.trim() ||
    site.whatsapp?.trim() ||
    site.managementPhone?.trim() ||
    "";

  if (!config.enabled || !phone) return null;

  const label = locale === "ar" ? config.labelAr : config.labelEn;
  const message = locale === "ar" ? config.messageAr : config.messageEn;

  return (
    <a
      href={whatsappHref(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      data-floating-banner="whatsapp"
      dir="ltr"
      aria-label={label}
      title={label}
      className="group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[90] flex items-center gap-2.5 sm:left-6"
    >
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_14px_34px_-12px_rgba(37,211,102,.85)] ring-4 ring-white transition group-hover:-translate-y-1 group-hover:scale-105 sm:h-16 sm:w-16">
        {config.pulse && (
          <>
            <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/55 motion-reduce:animate-none" />
            <span className="absolute -inset-2 -z-20 animate-pulse rounded-full border-2 border-[#25D366]/35 motion-reduce:animate-none" />
          </>
        )}
        <WhatsAppIcon className="h-7 w-7 sm:h-8 sm:w-8" />
      </span>
      {config.showLabel && (
        <span
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="hidden rounded-full border border-emerald-200 bg-white/95 px-4 py-2.5 text-xs font-black text-emerald-800 shadow-lg backdrop-blur-sm transition group-hover:border-emerald-300 group-hover:bg-emerald-50 sm:block"
        >
          {label}
        </span>
      )}
    </a>
  );
}
