"use client";

import { useEffect, useState } from "react";
import { Megaphone, Newspaper, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getMarqueeItems, type MarqueeItem } from "@/lib/admin-system";

function Diamond() {
  return (
    <span
      aria-hidden
      className="h-1.5 w-1.5 shrink-0 rotate-45 bg-gold-400 opacity-80"
    />
  );
}

/** شريط متحرك لشركاء النجاح والأخبار — يُعرَض كمساحة إعلانية موسومة */
export default function MarqueeStrip() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<MarqueeItem[]>([]);

  useEffect(() => {
    setItems(getMarqueeItems().filter((item) => item.enabled));
  }, []);

  const label = (item: MarqueeItem) => (locale === "ar" ? item.textAr : item.textEn);

  const renderItems = (prefix: string) => (
    <>
      {items.map((item, index) => (
        <div key={`${prefix}-${item.id}`} className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-2 text-[13px] font-extrabold text-ocean-900">
            <span
              aria-hidden
              className="h-3.5 w-3.5 shrink-0 rotate-45 rounded-[3px] border-2 border-gold-500"
            />
            {label(item)}
          </span>
          <Diamond />
          {item.type === "ad" ? (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-gold-300 bg-gold-50 px-3 py-1.5 text-[11px] font-bold text-gold-800">
              {t("ads.label")}
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-[11px] font-bold text-ocean-700">
              <Newspaper className="h-3 w-3 shrink-0 text-gold-600" />
              {item.type === "partner"
                ? locale === "ar"
                  ? "شريك نجاح"
                  : "Success partner"
                : locale === "ar"
                  ? "خبر"
                  : "News"}
            </span>
          )}
          <Diamond />
          {index === items.length - 1 && null}
        </div>
      ))}
    </>
  );

  if (items.length === 0) return null;

  return (
    <section
      aria-label={t("home.marquee.title")}
      className="relative overflow-hidden border-y border-sand-200 bg-white"
    >
      {/* تلاشٍ على الحافة اليسرى */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[3] w-20 bg-gradient-to-r from-white to-transparent"
      />
      <div className="mx-auto flex w-full max-w-[1440px] items-stretch">
        <div className="relative z-[4] flex w-[168px] shrink-0 flex-col justify-center gap-1 border-l border-sand-200 bg-gradient-to-l from-white to-sand-50 px-4 py-4 sm:w-[196px] sm:ps-6">
          <span className="flex items-center gap-1.5 text-[11.5px] font-black text-ocean-900">
            <Megaphone className="h-3.5 w-3.5 text-gold-600" />
            {t("home.marquee.title")}
            <span className="rounded bg-ocean-900 px-1.5 py-0.5 text-[8px] font-extrabold tracking-wide text-white">
              {t("ads.label")}
            </span>
          </span>
          <span className="flex items-center gap-1 text-[9px] font-bold text-sand-600">
            <ShieldCheck className="h-3 w-3 text-gold-500" />
            {t("home.marquee.sub")}
          </span>
        </div>

        <div className="relative flex min-w-0 flex-1 items-center overflow-hidden py-3">
          <div className="marquee-track flex w-max items-center gap-8">
            {renderItems("a")}
            {renderItems("b")}
          </div>
        </div>
      </div>
    </section>
  );
}
