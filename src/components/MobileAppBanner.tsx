"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { AppIcon } from "@/components/app/AppMockup";
import { resolveAppSettings } from "@/lib/app-settings";
import { useSiteSettings } from "@/lib/site-settings";

const DISMISS_KEY = "aqaar-app-banner-dismissed";
const HIDDEN_PREFIXES = ["/app", "/admin", "/login", "/register", "/add-property"];

/**
 * بانر صغير أسفل شاشة الموبايل — يظهر بعد تأخير، ويُغلق نهائياً بضغطة.
 * لا يظهر على الكمبيوتر ولا داخل صفحات الإدارة والتطبيق.
 */
export default function MobileAppBanner() {
  const pathname = usePathname();
  const site = useSiteSettings();
  const app = resolveAppSettings(site.app);
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  const hidden =
    HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") setClosed(true);
    } catch {
      /* التخزين غير متاح — يظل البانر قابلاً للإغلاق لهذه الجلسة */
    }
  }, []);

  useEffect(() => {
    if (!app.showMobileBanner || !app.enabled || closed || hidden) return;
    const timer = window.setTimeout(
      () => setVisible(true),
      Math.max(1, app.bannerDelaySec) * 1000
    );
    return () => window.clearTimeout(timer);
  }, [app.showMobileBanner, app.enabled, app.bannerDelaySec, closed, hidden]);

  if (!visible || closed || hidden || !app.enabled || !app.showMobileBanner) {
    return null;
  }

  const dismiss = () => {
    setClosed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* تجاهل */
    }
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 md:hidden" dir="rtl">
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-ocean-950/95 p-2.5 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <AppIcon size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10.5px] font-black text-white">
            عقار FAMILY على الموبايل
          </p>
          <p className="mt-0.5 truncate text-[9px] font-semibold text-[#b7c1d8]">
            تنبيهات عقارات + بحث بالخريطة
          </p>
        </div>
        <Link
          href="/app"
          className="shrink-0 rounded-lg bg-gold-500 px-2.5 py-1.5 text-[10px] font-black text-white"
        >
          {app.status === "live" ? "حمّل" : "اعرف أكثر"}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="إغلاق بانر التطبيق"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-[#cfd7e8]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
