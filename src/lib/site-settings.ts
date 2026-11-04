"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SITE_SETTINGS,
  getSiteSettings,
  type SiteSettings,
} from "@/lib/admin-system";
import { CLOUD_EVENT } from "@/lib/cloud/keys";

/**
 * قراءة إعدادات الموقع المحفوظة من لوحة التحكم.
 * القيم الافتراضية تُستخدم قبل التحميل (SSR) لتفادي اختلاف الترطيب.
 */
export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    const sync = () => setSettings(getSiteSettings());
    sync();

    window.addEventListener(CLOUD_EVENT, sync);
    window.addEventListener("aqaar-branding-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CLOUD_EVENT, sync);
      window.removeEventListener("aqaar-branding-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return settings;
}

/** تحويل رقم الهاتف إلى رابط اتصال صالح */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** تحويل رقم الهاتف إلى رابط واتساب صالح */
export function whatsappHref(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
