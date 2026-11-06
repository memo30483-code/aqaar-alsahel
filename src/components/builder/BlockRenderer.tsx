"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Lock,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { useActiveCities } from "@/lib/cities-store";
import ProfessionalDirectory from "@/components/professionals/ProfessionalDirectory";
import MarqueeStrip from "@/components/MarqueeStrip";
import AdSlider from "@/components/AdSlider";
import { AdBand } from "@/components/ProjectsSlider";
import { FeaturedAdSlot } from "@/components/FeaturedAds";
import FeaturedProjects from "@/components/projects/FeaturedProjects";
import PropertyCard from "@/components/PropertyCard";
import MarketGuideContent from "@/app/market-guide/MarketGuideContent";
import CompanyContent from "@/components/CompanyContent";
import ProjectsIndex from "@/components/projects/ProjectsIndex";
import type { PageBlock } from "@/lib/page-builder-store";
import { mockProperties, USER_PROPERTIES_KEY } from "@/data/properties";
import type { Property } from "@/types/property";
import {
  LISTING_OVERRIDE_KEY,
  getApprovedListingIds,
  getDefaultApprovedIds,
} from "@/lib/admin-system";

const CONTAINER = "mx-auto w-full max-w-[1180px] px-4 sm:px-6";

type Tone = "navy" | "sand" | "white";

function toneOf(block: PageBlock): Tone {
  return block.tone ?? "white";
}

function pick(
  ar: string | undefined,
  en: string | undefined,
  locale: "ar" | "en"
): string | undefined {
  const value = locale === "ar" ? ar : en || ar;
  return value?.trim() ? value : undefined;
}

function SectionShell({
  tone,
  children,
  className = "",
}: {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const bg =
    tone === "navy"
      ? "theme-hero text-white"
      : tone === "sand"
        ? "bg-sand-50 text-ocean-900"
        : "bg-white text-ocean-900";
  return (
    <section className={`${bg} ${className}`}>
      <div className={`${CONTAINER} py-10 sm:py-12`}>{children}</div>
    </section>
  );
}

function BlockTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}) {
  if (!eyebrow && !title && !subtitle) return null;
  return (
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-600">
          <span aria-hidden className="h-px w-6 bg-gold-400/70" />
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className="hb-title mt-2 text-[22px] font-black leading-tight text-ocean-900 sm:text-[28px]">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="hb-body mt-2 text-[12.5px] font-medium leading-7 text-sand-700">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function CtaButtons({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  const primaryLabel = pick(block.linkLabelAr, block.linkLabelEn, locale);
  const secondaryLabel = pick(
    block.secondaryLabelAr,
    block.secondaryLabelEn,
    locale
  );
  if (!primaryLabel && !secondaryLabel) return null;
  return (
    <div className="mt-5 flex flex-wrap gap-2.5">
      {primaryLabel && block.linkUrl && (
        <Link
          href={block.linkUrl}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[11.5px] font-black text-ocean-950 transition hover:-translate-y-0.5"
        >
          {primaryLabel}
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      )}
      {secondaryLabel && block.secondaryUrl && (
        <Link
          href={block.secondaryUrl}
          className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-[11.5px] font-bold text-white transition hover:border-gold-300 hover:text-gold-200"
        >
          <BadgeCheck className="h-3.5 w-3.5" />
          {secondaryLabel}
        </Link>
      )}
    </div>
  );
}

function PageHeaderBlock({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  const tone = toneOf(block);
  const eyebrow = pick(block.eyebrowAr, block.eyebrowEn, locale);
  const title = pick(block.titleAr, block.titleEn, locale);
  const subtitle = pick(block.subtitleAr, block.subtitleEn, locale);

  if (tone === "navy") {
    return (
      <section className="relative overflow-hidden theme-hero px-4 py-12 text-white sm:px-6 sm:py-16">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.24),transparent_65%)]"
        />
        <div className="relative mx-auto w-full max-w-[1180px]">
          {eyebrow && (
            <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-300">
              <span aria-hidden className="h-px w-6 bg-gold-400/70" />
              {eyebrow}
            </p>
          )}
          {title && (
            <h1 className="hb-title mt-3 max-w-3xl text-[26px] font-black leading-[1.35] tracking-tight sm:text-[38px] sm:leading-[1.3]">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="hb-body mt-3 max-w-2xl text-[12.5px] leading-7 text-white/70">
              {subtitle}
            </p>
          )}
          <CtaButtons block={block} />
        </div>
      </section>
    );
  }

  return (
    <SectionShell tone={tone}>
      <BlockTitle eyebrow={eyebrow} title={title} subtitle={subtitle} />
    </SectionShell>
  );
}

function TextBlock({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  return (
    <SectionShell tone={toneOf(block)}>
      <BlockTitle
        eyebrow={pick(block.eyebrowAr, block.eyebrowEn, locale)}
        title={pick(block.titleAr, block.titleEn, locale)}
        subtitle={pick(block.subtitleAr, block.subtitleEn, locale)}
      />
      {pick(block.bodyAr, block.bodyEn, locale) && (
        <p className="hb-body mt-3 max-w-3xl whitespace-pre-line text-[12.5px] leading-8 text-sand-700">
          {pick(block.bodyAr, block.bodyEn, locale)}
        </p>
      )}
    </SectionShell>
  );
}

function BannerBlock({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  const title = pick(block.titleAr, block.titleEn, locale);
  const subtitle = pick(block.subtitleAr, block.subtitleEn, locale);
  const label = pick(block.linkLabelAr, block.linkLabelEn, locale);
  return (
    <section className="relative overflow-hidden bg-ocean-950">
      {block.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.imageUrl}
          alt={title ?? ""}
          className="hb-media absolute inset-0 h-full w-full object-cover opacity-45"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-l from-ocean-950/90 via-ocean-950/60 to-ocean-950/30" />
      <div className={`${CONTAINER} relative py-12 sm:py-16`}>
        <h2 className="hb-title max-w-2xl text-[24px] font-black text-white sm:text-[32px]">
          {title}
        </h2>
        {subtitle && (
          <p className="hb-body mt-2 max-w-xl text-[12.5px] leading-7 text-white/70">
            {subtitle}
          </p>
        )}
        {label && block.linkUrl && (
          <Link
            href={block.linkUrl}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[11.5px] font-black text-ocean-950 transition hover:-translate-y-0.5"
          >
            {label}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        )}
      </div>
    </section>
  );
}

function StatsBlock({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  const items = block.items ?? [];
  return (
    <SectionShell tone={toneOf(block)}>
      <BlockTitle
        eyebrow={pick(block.eyebrowAr, block.eyebrowEn, locale)}
        title={pick(block.titleAr, block.titleEn, locale)}
        subtitle={pick(block.subtitleAr, block.subtitleEn, locale)}
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-sand-200 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(20,26,51,0.45)]"
          >
            <p className="text-2xl font-black text-ocean-900">{item.titleAr}</p>
            <p className="mt-1 text-[11px] font-semibold leading-6 text-sand-600">
              {pick(item.textAr, item.textEn, locale) ?? item.textAr}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function StepsBlock({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  const items = block.items ?? [];
  return (
    <SectionShell tone={toneOf(block)}>
      <BlockTitle
        eyebrow={pick(block.eyebrowAr, block.eyebrowEn, locale)}
        title={pick(block.titleAr, block.titleEn, locale)}
        subtitle={pick(block.subtitleAr, block.subtitleEn, locale)}
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-2xl border border-sand-200 bg-white p-4 shadow-[0_18px_40px_-34px_rgba(20,26,51,0.45)]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-50 text-[12px] font-black text-gold-700">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="mt-2.5 text-[12.5px] font-black text-ocean-900">
              {item.titleAr}
            </p>
            <p className="mt-1 text-[11px] leading-6 text-sand-700">
              {pick(item.textAr, item.textEn, locale) ?? item.textAr}
            </p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function FaqBlock({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  const items = block.items ?? [];
  return (
    <SectionShell tone={toneOf(block)}>
      <BlockTitle
        eyebrow={pick(block.eyebrowAr, block.eyebrowEn, locale)}
        title={pick(block.titleAr, block.titleEn, locale)}
        subtitle={pick(block.subtitleAr, block.subtitleEn, locale)}
      />
      <div className="mt-5 space-y-2">
        {items.map((item) => (
          <details
            key={item.id}
            className="rounded-xl border border-sand-200 bg-white px-4 py-3"
          >
            <summary className="cursor-pointer text-[12px] font-black text-ocean-900">
              {item.titleAr}
            </summary>
            <p className="mt-2 text-[11.5px] leading-7 text-sand-700">
              {pick(item.textAr, item.textEn, locale) ?? item.textAr}
            </p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}

function CtaBlock({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  const tone = toneOf(block);
  const title = pick(block.titleAr, block.titleEn, locale);
  const subtitle = pick(block.subtitleAr, block.subtitleEn, locale);
  const label = pick(block.linkLabelAr, block.linkLabelEn, locale);
  const dark = tone === "navy";
  return (
    <section className={dark ? "theme-hero" : "bg-sand-50"}>
      <div className={`${CONTAINER} py-10 sm:py-12`}>
        <div
          className={`rounded-3xl border p-6 text-center sm:p-8 ${
            dark
              ? "border-white/15 bg-white/[0.05]"
              : "border-sand-200 bg-white"
          }`}
        >
          <h2
            className={`hb-title text-[22px] font-black sm:text-[28px] ${
              dark ? "text-white" : "text-ocean-900"
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`hb-body mx-auto mt-2 max-w-xl text-[12.5px] leading-7 ${
                dark ? "text-white/70" : "text-sand-700"
              }`}
            >
              {subtitle}
            </p>
          )}
          {label && block.linkUrl && (
            <Link
              href={block.linkUrl}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[11.5px] font-black text-ocean-950 transition hover:-translate-y-0.5"
            >
              {label}
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function CitiesBlock({ block }: { block: PageBlock }) {
  const { t, locale } = useI18n();
  const cities = useActiveCities().filter((city) => city.id !== "all");
  return (
    <SectionShell tone={toneOf(block)}>
      <BlockTitle
        eyebrow={pick(block.eyebrowAr, block.eyebrowEn, locale)}
        title={pick(block.titleAr, block.titleEn, locale)}
        subtitle={pick(block.subtitleAr, block.subtitleEn, locale)}
      />
      <div className="mt-5 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {cities.map((city) => (
          <Link
            key={city.id}
            href="/#properties"
            className="flex items-center gap-2 rounded-xl border border-sand-200 bg-white px-3.5 py-3 text-[12px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/50"
          >
            <MapPin className="h-3.5 w-3.5 text-gold-500" />
            {cityLabel(city.id, t, locale)}
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

function TrustStripBlock({ block }: { block: PageBlock }) {
  const { t, locale } = useI18n();
  const title = pick(block.titleAr, block.titleEn, locale);
  return (
    <section className="border-b border-sand-200 bg-white">
      <div className={`${CONTAINER} py-6`}>
        {title && (
          <p className="mb-3 text-[12px] font-black text-ocean-900">{title}</p>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {(["0", "1", "2"] as const).map((index) => (
            <div key={index} className="flex items-start gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand-100 text-gold-600">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[12px] font-black text-ocean-900">
                  {t(`prof.trust.${index}.title` as MessageKey)}
                </p>
                <p className="mt-0.5 text-[10.5px] font-semibold leading-5 text-sand-600">
                  {t(`prof.trust.${index}.text` as MessageKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactBlock({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  const title = pick(block.titleAr, block.titleEn, locale);
  const body = pick(block.bodyAr, block.bodyEn, locale);
  const label = pick(block.linkLabelAr, block.linkLabelEn, locale);
  return (
    <SectionShell tone={toneOf(block)}>
      <div className="flex flex-col items-start gap-4 rounded-3xl border border-sand-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-700">
            <Lock className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13px] font-black text-ocean-900">{title}</p>
            {body && (
              <p className="mt-1 max-w-2xl text-[11.5px] leading-6 text-sand-700">
                {body}
              </p>
            )}
          </div>
        </div>
        {label && block.linkUrl && (
          <Link
            href={block.linkUrl}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ocean-950 px-4 py-2 text-[11px] font-black text-white transition hover:bg-ocean-900"
          >
            {label}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        )}
      </div>
    </SectionShell>
  );
}

function HeroBlock({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  const title = pick(block.titleAr, block.titleEn, locale);
  const subtitle = pick(block.subtitleAr, block.subtitleEn, locale);
  const eyebrow = pick(block.eyebrowAr, block.eyebrowEn, locale);
  return (
    <section className="relative overflow-hidden bg-ocean-950">
      {block.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={block.imageUrl}
          alt={title ?? ""}
          className="hb-media absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(20,26,51,0.92)_0%,rgba(20,26,51,0.72)_34%,rgba(20,26,51,0.28)_62%,rgba(20,26,51,0.06)_100%)]" />
      <div className={`${CONTAINER} relative py-16 text-white`}>
        {eyebrow && (
          <p className="flex items-center gap-2.5 text-xs font-bold text-gold-200">
            <span aria-hidden className="h-px w-8 theme-accent-line" />
            {eyebrow}
          </p>
        )}
        <h1 className="hb-title mt-4 max-w-[680px] text-4xl font-black leading-[1.24] tracking-tight sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="hb-body mt-4 max-w-[600px] text-sm font-medium leading-8 text-[#e8ecf6]">
            {subtitle}
          </p>
        )}
        <CtaButtons block={block} />
      </div>
    </section>
  );
}

/** نسخة قابلة لإعادة الاستخدام من شبكة العقارات لأي صفحة داخل البلدر. */
function FeaturedListingsBlock({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [approvedIds, setApprovedIds] = useState<string[]>(() =>
    getDefaultApprovedIds()
  );

  const sync = useCallback(() => {
    try {
      const stored = localStorage.getItem(USER_PROPERTIES_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setUserProperties(Array.isArray(parsed) ? parsed : []);
    } catch {
      setUserProperties([]);
    }
    setApprovedIds(getApprovedListingIds());
  }, []);

  useEffect(() => {
    sync();
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === USER_PROPERTIES_KEY ||
        event.key === LISTING_OVERRIDE_KEY
      ) {
        sync();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [sync]);

  const properties = useMemo(() => {
    const approved = new Set(approvedIds);
    return [...userProperties, ...mockProperties]
      .filter((property) => approved.has(property.id))
      .slice(0, 6)
      .map((property) => ({ ...property, whatsapp: "" }));
  }, [approvedIds, userProperties]);

  const title = pick(block.titleAr, block.titleEn, locale) ?? "عقارات مميزة";
  const subtitle = pick(block.subtitleAr, block.subtitleEn, locale);

  return (
    <SectionShell tone="sand">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <BlockTitle
          eyebrow={pick(block.eyebrowAr, block.eyebrowEn, locale)}
          title={title}
          subtitle={subtitle}
        />
        <Link
          href="/#properties"
          className="inline-flex items-center gap-1.5 text-[11.5px] font-black text-ocean-700 hover:text-gold-700"
        >
          عرض كل العقارات
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} compact />
        ))}
      </div>
    </SectionShell>
  );
}

/** قسم قصة/ثقة عام يحافظ على روح قسم الرئيسية ويمكن إضافته لأي صفحة. */
function StoryDossierBlock({ block }: { block: PageBlock }) {
  const { locale } = useI18n();
  return (
    <SectionShell tone={toneOf(block)}>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-center">
        <div>
          <BlockTitle
            eyebrow={pick(block.eyebrowAr, block.eyebrowEn, locale)}
            title={pick(block.titleAr, block.titleEn, locale)}
            subtitle={pick(block.subtitleAr, block.subtitleEn, locale)}
          />
          {pick(block.bodyAr, block.bodyEn, locale) && (
            <p className="hb-body mt-3 whitespace-pre-line text-[12px] leading-8 text-sand-700">
              {pick(block.bodyAr, block.bodyEn, locale)}
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-gold-200 bg-gold-50/50 p-5">
          {["توثيق المستندات", "فحص مستقل", "تواصل عبر الإدارة"].map(
            (item) => (
              <p
                key={item}
                className="flex items-center gap-2 border-b border-gold-200/60 py-2.5 text-[11.5px] font-black text-ocean-900 last:border-0"
              >
                <ShieldCheck className="h-4 w-4 text-gold-600" />
                {item}
              </p>
            )
          )}
        </div>
      </div>
    </SectionShell>
  );
}

export default function BlockRenderer({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "page_header":
      return <PageHeaderBlock block={block} />;
    case "hero":
      return <HeroBlock block={block} />;
    case "text":
      return <TextBlock block={block} />;
    case "banner":
      return <BannerBlock block={block} />;
    case "stats":
      return <StatsBlock block={block} />;
    case "steps":
      return <StepsBlock block={block} />;
    case "faq":
      return <FaqBlock block={block} />;
    case "cta":
      return <CtaBlock block={block} />;
    case "cities":
      return <CitiesBlock block={block} />;
    case "verify_strip":
      return <TrustStripBlock block={block} />;
    case "contact_block":
      return <ContactBlock block={block} />;
    case "professionals_directory":
      return (
        <ProfessionalDirectory
          kind={block.kind ?? "developer"}
          hideIntro={block.showIntro === false}
        />
      );
    case "embed_section":
      if (block.componentId === "company") return <CompanyContent />;
      if (block.componentId === "projects_index") {
        return (
          <ProjectsIndex
            showSearch={block.showSearch === true}
            showHeader={block.showHeader === true}
          />
        );
      }
      return <MarketGuideContent />;
    case "marquee":
      return <MarqueeStrip block={block as never} />;
    case "ad_slider":
      return <AdSlider block={block as never} />;
    case "ad_band":
      return <AdBand block={block as never} />;
    case "projects_slider":
      return <FeaturedProjects block={block as never} />;
    case "inline_ad":
      return (
        <SectionShell tone="sand">
          <FeaturedAdSlot block={block as never} />
        </SectionShell>
      );
    case "story_dossier":
      return <StoryDossierBlock block={block} />;
    case "featured_listings":
      return <FeaturedListingsBlock block={block} />;
    case "manage_note":
      return (
        <SectionShell tone="white" className="border-t border-sand-200">
          <p className="flex flex-wrap items-center justify-center gap-2 text-center text-[11px] font-bold text-sand-700">
            <CheckCircle2 className="h-4 w-4 text-gold-600" />
            {block.titleAr ?? "كل التواصل عبر إدارة المنصة"}
          </p>
        </SectionShell>
      );
    default:
      return null;
  }
}
