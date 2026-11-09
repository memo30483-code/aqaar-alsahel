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
      {/* علامة واتساب نفسها فقط — بدون أي دائرة أو خلفية */}
      <span className="relative block h-[58px] w-[58px] shrink-0 transition duration-200 group-hover:-translate-y-1 sm:h-[64px] sm:w-[64px]">
        {config.pulse && (
          <WhatsAppIcon className="whatsapp-mark-echo absolute inset-0 h-full w-full text-[#25D366] motion-reduce:animate-none" />
        )}
        <WhatsAppIcon
          className={`relative h-full w-full text-[#25D366] ${
            config.pulse ? "whatsapp-mark-pulse" : ""
          }`}
        />
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
