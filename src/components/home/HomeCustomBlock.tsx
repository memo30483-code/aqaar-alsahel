"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { useActiveCities } from "@/lib/cities-store";
import type { HomeBlock } from "@/lib/home-builder-store";

interface Props {
  block: HomeBlock;
}

function toneClasses(tone: HomeBlock["tone"]): {
  section: string;
  heading: string;
  text: string;
  eyebrow: string;
} {
  if (tone === "navy") {
    return {
      section:
        "theme-hero text-white",
      heading: "text-white",
      text: "text-white/70",
      eyebrow: "text-gold-300",
    };
  }
  if (tone === "sand") {
    return {
      section: "bg-sand-100/70",
      heading: "text-ocean-900",
      text: "text-sand-700",
      eyebrow: "text-gold-600",
    };
  }
  return {
    section: "bg-white",
    heading: "text-ocean-900",
    text: "text-sand-700",
    eyebrow: "text-gold-600",
  };
}

/** قسم قابل للإضافة والتحرير بالكامل من Builder الرئيسية */
export default function HomeCustomBlock({ block }: Props) {
  const { t, locale } = useI18n();
  const cities = useActiveCities();
  const ar = locale === "ar";

  const tone = toneClasses(block.tone);
  const eyebrow = (ar ? block.eyebrowAr : block.eyebrowEn || block.eyebrowAr) ?? "";
  const title = (ar ? block.titleAr : block.titleEn || block.titleAr) ?? "";
  const subtitle =
    (ar ? block.subtitleAr : block.subtitleEn || block.subtitleAr) ?? "";
  const body = (ar ? block.bodyAr : block.bodyEn || block.bodyAr) ?? "";
  const linkLabel =
    (ar ? block.linkLabelAr : block.linkLabelEn || block.linkLabelAr) ?? "";
  const items = block.items ?? [];

  const heading = (extra?: string) => (
    <div className="max-w-2xl">
      {eyebrow && (
        <p
          className={`flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] ${tone.eyebrow}`}
        >
          <span aria-hidden className="h-px w-6 bg-gold-400/70" />
          {eyebrow}
        </p>
      )}
      {title && (
        <h2
          className={`mt-2 text-[22px] font-black leading-9 sm:text-[28px] sm:leading-10 ${tone.heading} ${extra ?? ""}`}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p className={`mt-2 text-[12.5px] leading-7 ${tone.text}`}>{subtitle}</p>
      )}
    </div>
  );

  const cta = linkLabel && block.linkUrl ? (
    <Link
      href={block.linkUrl}
      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[12px] font-black text-ocean-950 shadow-[0_16px_34px_-22px_rgba(201,146,42,0.9)] transition hover:-translate-y-0.5"
    >
      {linkLabel}
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
    </Link>
  ) : null;

  /* ---------- بانر بصورة ---------- */
  if (block.type === "banner") {
    return (
      <section className="relative overflow-hidden">
        {block.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={block.imageUrl}
            alt={title || "banner"}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 theme-hero"
          />
        )}
        <span
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,20,40,0.92)_0%,rgba(15,20,40,0.72)_48%,rgba(15,20,40,0.35)_100%)]"
        />
        <div className="relative mx-auto w-full max-w-[1240px] px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-xl text-white">
            {eyebrow && (
              <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-300">
                <span aria-hidden className="h-px w-6 bg-gold-400/70" />
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-2 text-[24px] font-black leading-10 sm:text-[32px]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-2.5 text-[12.5px] leading-7 text-white/75">
                {subtitle}
              </p>
            )}
            {cta && <div className="mt-5">{cta}</div>}
          </div>
        </div>
      </section>
    );
  }

  /* ---------- شبكة المدن ---------- */
  if (block.type === "cities") {
    return (
      <section className={`${tone.section} py-12`}>
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
          {heading()}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((city) => (
              <Link
                key={city.id}
                href="/#properties"
                className="group flex items-center justify-between gap-3 rounded-2xl border border-sand-200 bg-white p-4 transition hover:border-gold-300 hover:bg-gold-50/40"
              >
                <span className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-sand-100 text-gold-600">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span className="text-[13px] font-black text-ocean-900">
                    {cityLabel(city.nameAr, t, locale)}
                  </span>
                </span>
                <ArrowLeft className="h-4 w-4 text-sand-400 transition group-hover:text-gold-600 rtl:rotate-180" />
              </Link>
            ))}
          </div>
          {cities.length === 0 && (
            <p className="mt-4 text-[12px] font-semibold text-sand-600">
              {ar ? "لا توجد مدن مفعّلة حالياً." : "No active cities yet."}
            </p>
          )}
        </div>
      </section>
    );
  }

  /* ---------- أرقام ومؤشرات ---------- */
  if (block.type === "stats") {
    return (
      <section className={`${tone.section} py-12`}>
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
          {heading()}
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-sand-200 bg-white p-4 text-center"
              >
                <p className="text-[24px] font-black leading-none text-ocean-900">
                  {(ar ? item.titleAr : item.titleEn || item.titleAr) || "—"}
                </p>
                <p className="mt-2 text-[11px] font-bold text-sand-600">
                  {(ar ? item.textAr : item.textEn || item.textAr) || ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ---------- أسئلة شائعة ---------- */
  if (block.type === "faq") {
    return (
      <section className={`${tone.section} py-12`}>
        <div className="mx-auto w-full max-w-[900px] px-4 sm:px-6">
          {heading()}
          <div className="mt-6 space-y-2">
            {items.map((item) => (
              <details
                key={item.id}
                className="group rounded-2xl border border-sand-200 bg-white p-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-black text-ocean-900">
                  {(ar ? item.titleAr : item.titleEn || item.titleAr) || "—"}
                  <ChevronDown className="h-4 w-4 shrink-0 text-gold-600 transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-[12px] leading-7 text-sand-700">
                  {(ar ? item.textAr : item.textEn || item.textAr) || ""}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ---------- دعوة لاتخاذ إجراء ---------- */
  if (block.type === "cta") {
    return (
      <section className={`${tone.section} py-12`}>
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
          <div
            className={`overflow-hidden rounded-3xl border p-6 text-center sm:p-10 ${
              block.tone === "navy"
                ? "border-white/15 bg-white/[0.06]"
                : "border-gold-300/60 bg-[linear-gradient(135deg,rgba(201,146,42,0.12),rgba(255,255,255,0.92)_55%)]"
            }`}
          >
            <span
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl ${
                block.tone === "navy"
                  ? "bg-white/10 text-gold-300"
                  : "bg-white text-gold-600 shadow-sm"
              }`}
            >
              <Sparkles className="h-5 w-5" />
            </span>
            {title && (
              <h2 className={`mt-3 text-[22px] font-black leading-9 sm:text-[28px] ${tone.heading}`}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className={`mx-auto mt-2 max-w-xl text-[12.5px] leading-7 ${tone.text}`}>
                {subtitle}
              </p>
            )}
            {cta && <div className="mt-5 flex justify-center">{cta}</div>}
          </div>
        </div>
      </section>
    );
  }

  /* ---------- قسم نصي (الافتراضي) ---------- */
  return (
    <section className={`${tone.section} py-12`}>
      <div className="mx-auto w-full max-w-[900px] px-4 sm:px-6">
        {heading()}
        {body && (
          <div className="mt-4 space-y-2.5">
            {body.split("\n").filter(Boolean).map((paragraph) => (
              <p key={paragraph} className={`text-[12.5px] leading-7 ${tone.text}`}>
                {paragraph}
              </p>
            ))}
          </div>
        )}
        {cta && <div className="mt-5">{cta}</div>}
      </div>
    </section>
  );
}
