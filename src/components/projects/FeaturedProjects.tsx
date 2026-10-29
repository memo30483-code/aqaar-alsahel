"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Building2, MapPin, ShieldCheck, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import {
  useProfessionalsState,
  type PublicProjectEntry,
} from "@/lib/professionals-store";
import { ProjectsSlider } from "@/components/ProjectsSlider";

/**
 * قسم «مشاريع مميزة» في الرئيسية.
 * يعرض ما ميّزته الإدارة فعلياً من مشاريع المطورين المنشورة.
 * ولو مفيش ولا مشروع مميز، نرجع للسلايدر التجريبي حتى تظل الرئيسية كاملة.
 */
export default function FeaturedProjects() {
  const { t, locale } = useI18n();
  const { records, ready } = useProfessionalsState();

  const featured = useMemo<PublicProjectEntry[]>(() => {
    const entries = records
      .filter((record) => record.status === "approved")
      .flatMap((record) =>
        record.projects
          .filter((project) => project.status === "approved" && project.featured === true)
          .map((project) => ({ record, project }))
      );
    return entries.sort((a, b) => a.project.order - b.project.order);
  }, [records]);

  /* قبل تحميل التخزين لا نعرض شيئاً — ثم يظهر القسم أو البديل */
  if (!ready) return null;
  if (featured.length === 0) {
    /* نفس بيانات السلايدر القديم، مع تحقق من الدالة لتفادي فرق التحميل */
    return <ProjectsSlider />;
  }

  return (
    <section id="projects" className="scroll-mt-24 border-t border-sand-200 bg-white py-14">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2.5 text-xs font-bold text-gold-700">
              <span aria-hidden className="h-px w-8 bg-gold-400" />
              {t("home.featuredProjects.eyebrow")}
            </p>
            <h2 className="mt-2.5 text-2xl font-black tracking-tight text-ocean-900 sm:text-3xl">
              {t("home.featuredProjects.title")}
            </h2>
            <p className="mt-2 text-[13px] font-medium text-sand-700">
              {t("home.featuredProjects.desc")}
            </p>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 bg-white px-4 py-2 text-[11.5px] font-extrabold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
          >
            {t("home.featuredProjects.all")}
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 6).map(({ record, project }) => {
            const provider = record.companyAr || record.nameAr;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-sand-200 bg-white transition hover:-translate-y-1 hover:border-gold-300/70 hover:shadow-[0_24px_50px_-24px_rgba(20,26,51,0.35)]"
              >
                <span className="relative block h-44 w-full overflow-hidden bg-sand-200">
                  {project.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.coverUrl}
                      alt={project.titleAr}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center bg-[linear-gradient(135deg,#141a33,#2d3875)] text-gold-300">
                      <Building2 className="h-8 w-8" />
                    </span>
                  )}
                  <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-lg bg-gold-500 px-2 py-0.5 text-[9.5px] font-black text-ocean-950">
                    <Star className="h-3 w-3" />
                    {t("home.featuredProjects.badge")}
                  </span>
                </span>

                <span className="flex flex-1 flex-col p-4">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-sand-600">
                    <MapPin className="h-3 w-3 text-gold-500" />
                    {project.cityAr ? cityLabel(project.cityAr, t, locale) : "—"}
                    {project.typeAr ? ` · ${project.typeAr}` : ""}
                  </span>
                  <span className="mt-1.5 line-clamp-1 text-[14px] font-black text-ocean-900">
                    {project.titleAr}
                  </span>
                  <span className="mt-auto flex items-end justify-between gap-2 border-t border-sand-200 pt-3">
                    <span className="min-w-0">
                      {project.priceFrom && (
                        <span className="block text-[13px] font-black text-ocean-900">
                          {project.priceFrom}
                        </span>
                      )}
                      <span className="mt-0.5 flex items-center gap-1 truncate text-[9.5px] font-bold text-sand-600">
                        <ShieldCheck className="h-3 w-3 shrink-0 text-gold-500" />
                        {provider}
                      </span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-ocean-900 px-2.5 py-1.5 text-[10px] font-extrabold text-white">
                      {t("prof.project.details")}
                      <ArrowLeft className="h-3 w-3" />
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
