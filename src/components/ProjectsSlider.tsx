"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Headset,
  MapPin,
  Megaphone,
} from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import {
  animateScrollTo,
  nextCarouselPosition,
  useDragScroll,
} from "@/lib/use-drag-scroll";
import type { HomeBlock } from "@/lib/home-builder-store";
import { resolveMedia } from "@/lib/home-block-style";

interface Project {
  name: string;
  city: MessageKey;
  image: string;
  price: number;
  plan: MessageKey;
}

const PROJECTS: Project[] = [
  {
    name: "لاجونا رأس البر",
    city: "city.rasElBar",
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80",
    price: 2_100_000,
    plan: "home.projects.plan1",
  },
  {
    name: "ذا ليكس دمياط الجديدة",
    city: "city.newDamietta",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
    price: 1_650_000,
    plan: "home.projects.plan2",
  },
  {
    name: "بلو باي جمصة",
    city: "city.gamasa",
    image:
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80",
    price: 1_950_000,
    plan: "home.projects.plan3",
  },
  {
    name: "وادي يمم ريزيدنس",
    city: "city.newMansoura",
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
    price: 2_400_000,
    plan: "home.projects.plan4",
  },
];

/** المسافة الحقيقية بين بداية بطاقتين — تشمل عرض البطاقة والفراغ بينهما */
function projectStrideOf(node: HTMLDivElement): number {
  const cards = node.querySelectorAll<HTMLElement>("[data-project-card]");
  if (cards.length < 2) return 0;
  return Math.abs(cards[1].offsetLeft - cards[0].offsetLeft);
}

function projectTarget(node: HTMLDivElement, index: number): number {
  const max = Math.max(0, node.scrollWidth - node.clientWidth);
  const position = Math.min(max, projectStrideOf(node) * index);
  const rtl = getComputedStyle(node).direction === "rtl";
  return (rtl ? -1 : 1) * position;
}

function projectIndexAt(node: HTMLDivElement): number {
  const max = Math.max(0, node.scrollWidth - node.clientWidth);
  if (max <= 1) return 0;
  const position = Math.abs(node.scrollLeft);
  const stride = projectStrideOf(node);
  if (stride <= 0) return 0;
  if (max - position <= Math.max(2, stride * 0.05)) {
    return PROJECTS.length - 1;
  }
  return Math.max(
    0,
    Math.min(PROJECTS.length - 1, Math.round(position / stride))
  );
}

/** سلايدر المشاريع المميزة بأسلوب Nawy — أسهم جانبية حقيقية وتمرير أفقي */
export function ProjectsSlider({
  block,
  cardWidth,
}: {
  block?: HomeBlock;
  cardWidth?: number;
}) {
  const { t, locale } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useDragScroll(trackRef);
  const autoplayPauseUntil = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const cardStyle = cardWidth ? { width: `${cardWidth}px` } : undefined;
  const eyebrow =
    (locale === "ar" ? block?.eyebrowAr : block?.eyebrowEn || block?.eyebrowAr) ||
    t("home.projects.eyebrow");
  const title =
    (locale === "ar" ? block?.titleAr : block?.titleEn || block?.titleAr) ||
    t("home.projects.title");
  const subtitle =
    (locale === "ar"
      ? block?.subtitleAr
      : block?.subtitleEn || block?.subtitleAr) || t("home.projects.sub");

  const scrollCards = (direction: 1 | -1) => {
    const node = trackRef.current;
    if (!node) return;
    autoplayPauseUntil.current = Date.now() + 7000;
    const rtl = getComputedStyle(node).direction === "rtl";
    const delta = direction * node.clientWidth * 0.9;
    animateScrollTo(node, node.scrollLeft + (rtl ? -delta : delta));
  };

  const handleScroll = () => {
    const node = trackRef.current;
    if (!node) return;
    setActiveIndex(projectIndexAt(node));
  };

  const goToCard = (index: number) => {
    const node = trackRef.current;
    if (!node) return;
    autoplayPauseUntil.current = Date.now() + 7000;
    animateScrollTo(node, projectTarget(node, index));
  };

  /**
   * انتقال تلقائي هادئ بين المشاريع. أي سحب أو ضغط يدوي يمنحه أولوية
   * ويتوقف التشغيل سبع ثوانٍ، ثم يكمل تلقائياً من البطاقة الحالية.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      const node = trackRef.current;
      if (!node || drag.dragging || Date.now() < autoplayPauseUntil.current) return;

      const stride = projectStrideOf(node);
      const max = Math.max(0, node.scrollWidth - node.clientWidth);
      if (stride <= 0 || max <= 1) return;

      const nextPosition = nextCarouselPosition(node.scrollLeft, max, stride);
      const rtl = getComputedStyle(node).direction === "rtl";
      animateScrollTo(node, (rtl ? -1 : 1) * nextPosition);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [drag.dragging]);

  return (
    <section id="projects" className="scroll-mt-24 border-t border-sand-200 bg-white py-14">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2.5 text-xs font-bold text-gold-700">
              <span aria-hidden className="h-px w-8 bg-gold-400" />
              {eyebrow}
            </p>
            <h2 className="hb-title mt-2.5 text-2xl font-black tracking-tight text-ocean-900 sm:text-3xl">
              {title}
            </h2>
            <p className="hb-body mt-2 flex items-center gap-2 text-[13px] font-medium text-sand-700">
              {subtitle}
              <span className="rounded-md border border-gold-200 bg-gold-50 px-2 py-0.5 text-[9.5px] font-extrabold text-gold-800">
                {t("home.projects.ad")}
              </span>
            </p>
          </div>
        </div>

        {/* الشريط مع أزرار تحكم جانبية يمين ويسار منتصف الشريط */}
        <div className="relative mt-6">
          <button
            type="button"
            onClick={() => scrollCards(-1)}
            aria-label={t("home.projects.prev")}
            className="absolute -start-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-sand-300 bg-white/95 text-ocean-800 shadow-[0_10px_24px_-12px_rgba(20,26,51,0.45)] backdrop-blur transition hover:border-gold-300 hover:bg-gold-50 sm:-start-4"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollCards(1)}
            aria-label={t("home.projects.next")}
            className="absolute -end-2 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-ocean-900 bg-ocean-900 text-white shadow-[0_10px_24px_-12px_rgba(20,26,51,0.6)] transition hover:bg-ocean-950 sm:-end-4"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            ref={trackRef}
            onScroll={handleScroll}
            onPointerDownCapture={() => {
              autoplayPauseUntil.current = Date.now() + 7000;
            }}
            {...drag.handlers}
            className={`flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              drag.dragging ? "cursor-grabbing select-none" : "cursor-grab"
            }`}
          >
            {PROJECTS.map((project) => (
              <article
                key={project.name}
                data-project-card
                style={cardStyle}
                className="group w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(20,26,51,0.35)] sm:w-[360px]"
              >
              <div className="relative h-52 overflow-hidden bg-sand-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={project.name}
                  loading="lazy"
                  className="hb-media h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ocean-950/75 via-transparent to-transparent"
                />
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md border border-sand-300 bg-white/95 px-2 py-1 text-[9.5px] font-black text-ocean-900 backdrop-blur">
                  <BadgeCheck className="h-3 w-3 text-gold-600" />
                  {t("home.projects.devBadge")}
                </span>
                <span className="absolute left-3 top-3 rounded-md bg-ocean-950/80 px-2 py-1 text-[9px] font-extrabold text-white backdrop-blur">
                  {t("home.projects.ad")}
                </span>
                <p className="absolute bottom-3 right-3.5 left-3.5 flex items-center gap-1 text-[10.5px] font-semibold text-sand-100">
                  <MapPin className="h-3 w-3 text-gold-300" />
                  {t(project.city)}
                </p>
              </div>

              <div className="p-4">
                <h3 className="text-[15.5px] font-black text-ocean-900">
                  {project.name}
                </h3>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <p className="text-[17px] font-black text-ocean-900">
                    {formatWithSymbol(project.price)}
                  </p>
                  <p className="text-[10px] font-semibold text-sand-600">
                    {t(project.plan)}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href="/#properties"
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-sand-300 bg-sand-100 text-[11.5px] font-extrabold text-ocean-900 transition hover:bg-sand-200"
                  >
                    {t("home.projects.details")}
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href="/#properties"
                    title={t("home.listings.manageShort")}
                    aria-label={t("home.listings.manageShort")}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gold-200 bg-gold-50 text-gold-600 transition hover:bg-gold-100"
                  >
                    <Headset className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5">
          {PROJECTS.map((project, index) => (
            <button
              key={project.name}
              type="button"
              onClick={() => goToCard(index)}
              aria-label={`${t("home.projects.title")} — ${project.name}`}
              aria-current={index === activeIndex}
              className={`block h-1 rounded-full transition-all ${
                index === activeIndex ? "w-8 bg-ocean-800" : "w-5 bg-sand-300 hover:bg-sand-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** شريط إعلاني أفقي — مساحة إعلانية موسومة بوضوح */
export function AdBand({ block }: { block?: HomeBlock }) {
  const { t, locale } = useI18n();
  const title =
    (locale === "ar" ? block?.titleAr : block?.titleEn || block?.titleAr) ||
    t("home.adband.title");
  const subtitle =
    (locale === "ar"
      ? block?.subtitleAr
      : block?.subtitleEn || block?.subtitleAr) || t("home.adband.desc");
  const hint =
    (locale === "ar" ? block?.bodyAr : block?.bodyEn || block?.bodyAr) ||
    t("home.adband.hint");
  const cta =
    (locale === "ar"
      ? block?.linkLabelAr
      : block?.linkLabelEn || block?.linkLabelAr) || t("home.adband.cta");
  const media = resolveMedia(block?.videoUrl) || resolveMedia(block?.imageUrl);

  return (
    <section className="bg-sand-50 pb-2 pt-8">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <div className="relative flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border border-gold-200 bg-gradient-to-l from-white to-gold-50 px-5 py-4">
          {media?.kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={media.src}
              alt=""
              className="hb-media pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10"
            />
          )}
          {media?.kind === "video" && (
            <video
              src={media.src}
              className="hb-media pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10"
              autoPlay
              muted
              loop
              playsInline
            />
          )}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10px_10px,rgba(201,146,42,0.10)_1.2px,transparent_1.3px)] bg-[length:20px_20px]"
          />
          <span className="relative rounded-md bg-ocean-900 px-2.5 py-1 text-[9.5px] font-extrabold text-white">
            {t("home.adband.label")}
          </span>
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ocean-900 text-sm font-black text-gold-300">
            م
          </span>
          <div className="relative w-full min-w-0 basis-full sm:w-auto sm:flex-1">
            <p className="hb-title text-sm font-black text-ocean-900">
              {title}
            </p>
            <p className="hb-body mt-1 text-[10.5px] font-semibold text-sand-700">
              {subtitle}
            </p>
          </div>
          <span className="relative hidden text-[9.5px] text-sand-600 lg:block">
            {hint}
          </span>
          <Link
            href={block?.linkUrl || "/#properties"}
            className="relative inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-ocean-900 px-4 py-2.5 text-[11.5px] font-extrabold text-white transition hover:bg-ocean-950 sm:w-auto"
          >
            <Megaphone className="h-3.5 w-3.5" />
            {cta}
            <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}
