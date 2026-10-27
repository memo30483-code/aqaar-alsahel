"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Gift, X } from "lucide-react";
import { getOffersSettings, isOffersPageAvailable } from "@/lib/admin-system";
import { useI18n } from "@/lib/i18n";

const HIDDEN_KEY = "aqaar-offers-banner-hidden-session";

/**
 * هل بانر العروض العائم نشط الآن؟ تُستخدم لمنع تعارضه مع البانر الإعلاني الآخر.
 */
export function isOffersBannerActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getOffersSettings();
    if (!current.enabled || !current.showFloatingBanner) return false;
    if (sessionStorage.getItem(HIDDEN_KEY)) return false;
    return isOffersPageAvailable();
  } catch {
    return false;
  }
}

/**
 * بانر عائم ضخم لصفحة العروض الموسمية.
 * يظهر في الصفحة الرئيسية فقط، وفقط عندما تكون الصفحة مفعّلة ومتاحة فعلياً،
 * ويختفي لبقية جلسة المتصفح عند ضغط الزائر على زر الإغلاق.
 */
export default function OffersFloatingBanner() {
  const { locale } = useI18n();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [settings, setSettings] = useState(getOffersSettings());

  useEffect(() => {
    if (pathname !== "/") {
      setShow(false);
      return;
    }

    const current = getOffersSettings();
    setSettings(current);
    if (!current.enabled || !current.showFloatingBanner) return;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(HIDDEN_KEY)) return;

    let visible = false;
    try {
      visible = isOffersPageAvailable();
    } catch {
      visible = false;
    }
    if (!visible) return;

    const timer = setTimeout(() => setShow(true), 900);
    return () => clearTimeout(timer);
  }, [pathname]);

  const hide = () => {
    setShow(false);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(HIDDEN_KEY, "1");
    }
  };

  /* إبلاغ بقية العناصر العائمة (زر المساعد) بوجود البانر حتى ترتفع فوقه */
  useEffect(() => {
    const root = document.documentElement;
    if (show) root.dataset.offersBanner = "1";
    else delete root.dataset.offersBanner;
    return () => {
      delete root.dataset.offersBanner;
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      data-floating-banner="offers"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-3 sm:px-6 sm:pb-6"
    >
      <div className="offers-banner-in pointer-events-auto relative w-full max-w-2xl overflow-hidden rounded-[26px] border border-[rgba(217,185,92,0.45)] bg-[linear-gradient(120deg,#0f172a_0%,#1c2547_45%,#0f172a_100%)] p-4 shadow-[0_50px_120px_-40px_rgba(15,23,42,0.85)] sm:p-5">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.35),transparent_65%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-[#d9b95c] to-transparent"
        />

        <button
          onClick={hide}
          aria-label={locale === "ar" ? "إخفاء الإعلان" : "Dismiss"}
          className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#b8963b] to-[#e0c274] text-white shadow-[0_10px_24px_-12px_rgba(217,185,92,0.9)]">
              <Gift className="h-6 w-6" />
            </span>
            <div className="pe-8 sm:pe-0">
              <p className="text-[15px] font-black leading-tight text-white sm:text-base">
                {locale === "ar" ? settings.bannerTitleAr : settings.bannerTitleEn}
              </p>
              <p className="mt-1 text-xs text-white/70 sm:text-[13px]">
                {locale === "ar" ? settings.bannerSubtitleAr : settings.bannerSubtitleEn}
              </p>
            </div>
          </div>

          <Link
            href="/offers"
            onClick={hide}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#b8963b] to-[#e0c274] px-5 py-2.5 text-sm font-black text-[#1a2140] transition hover:-translate-y-0.5 sm:ms-auto"
          >
            {locale === "ar" ? settings.bannerCtaAr : settings.bannerCtaEn}
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
