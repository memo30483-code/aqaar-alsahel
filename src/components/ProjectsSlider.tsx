"use client";

import Link from "next/link";
import { useRef } from "react";
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

/** سلايدر المشاريع المميزة بأسلوب Nawy — أسهم حقيقية وتمرير أفقي */
export function ProjectsSlider() {
  const { t } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollCards = (direction: 1 | -1) => {
    const node = trackRef.current;
    if (!node) return;
    const rtl = getComputedStyle(node).direction === "rtl";
    node.scrollBy({
      left: direction * node.clientWidth * 0.9 * (rtl ? -1 : 1),
      behavior: "smooth",
    });
  };

  return (
    <section id="projects" className="scroll-mt-24 border-t border-sand-200 bg-white py-14">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2.5 text-xs font-bold text-gold-700">
              <span aria-hidden className="h-px w-8 bg-gold-400" />
              {t("home.projects.eyebrow")}
            </p>
            <h2 className="mt-2.5 text-2xl font-black tracking-tight text-ocean-900 sm:text-3xl">
              {t("home.projects.title")}
            </h2>
            <p className="mt-2 flex items-center gap-2 text-[13px] font-medium text-sand-700">
              {t("home.projects.sub")}
              <span className="rounded-md border border-gold-200 bg-gold-50 px-2 py-0.5 text-[9.5px] font-extrabold text-gold-800">
                {t("home.projects.ad")}
              </span>
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollCards(-1)}
              aria-label={t("home.projects.title")}
              className="grid h-10 w-10 place-items-center rounded-full border border-sand-300 bg-white text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCards(1)}
              aria-label={t("home.projects.title")}
              className="grid h-10 w-10 place-items-center rounded-full border border-ocean-900 bg-ocean-900 text-white transition hover:bg-ocean-950"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {PROJECTS.map((project) => (
            <article
              key={project.name}
              className="group w-[300px] shrink-0 snap-start overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(20,26,51,0.35)] sm:w-[360px]"
            >
              <div className="relative h-52 overflow-hidden bg-sand-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={project.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
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

        <div className="mt-4 flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3].map((dot) => (
            <span
              key={dot}
              className={`block h-1 rounded-full ${
                dot === 0 ? "w-8 bg-ocean-800" : "w-5 bg-sand-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** شريط إعلاني أفقي — مساحة إعلانية موسومة بوضوح */
export function AdBand() {
  const { t } = useI18n();

  return (
    <section className="bg-sand-50 pb-2 pt-8">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <div className="relative flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl border border-gold-200 bg-gradient-to-l from-white to-gold-50 px-5 py-4">
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
            <p className="text-sm font-black text-ocean-900">
              {t("home.adband.title")}
            </p>
            <p className="mt-1 text-[10.5px] font-semibold text-sand-700">
              {t("home.adband.desc")}
            </p>
          </div>
          <span className="relative hidden text-[9.5px] text-sand-600 lg:block">
            {t("home.adband.hint")}
          </span>
          <Link
            href="/#properties"
            className="relative inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-ocean-900 px-4 py-2.5 text-[11.5px] font-extrabold text-white transition hover:bg-ocean-950 sm:w-auto"
          >
            <Megaphone className="h-3.5 w-3.5" />
            {t("home.adband.cta")}
            <ArrowRight className="h-3 w-3 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </section>
  );
}
