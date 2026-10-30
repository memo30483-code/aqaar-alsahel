"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Building2, MapPin, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { useActiveCities } from "@/lib/cities-store";
import {
  useProfessionalsState,
  type PublicProjectEntry,
  type ProfessionalProject,
} from "@/lib/professionals-store";
import {
  PROJECT_TYPES,
  resolveProjectTypeId,
  type ProjectTypeId,
} from "@/lib/projects-taxonomy";

const PURPOSES: { value: NonNullable<ProfessionalProject["purpose"]>; key: "prof.profile.purpose.sale" | "prof.profile.purpose.rent" | "prof.profile.purpose.marketing" | "prof.profile.purpose.project" }[] = [
  { value: "sale", key: "prof.profile.purpose.sale" },
  { value: "rent", key: "prof.profile.purpose.rent" },
  { value: "marketing", key: "prof.profile.purpose.marketing" },
  { value: "project", key: "prof.profile.purpose.project" },
];

export default function ProjectsIndex() {
  const { t, locale } = useI18n();
  const { records, ready } = useProfessionalsState();
  const cities = useActiveCities();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [typeId, setTypeId] = useState<ProjectTypeId | "">("");
  const [purpose, setPurpose] = useState<ProfessionalProject["purpose"] | "">("");

  /* كل المشاريع المنشورة: السجل معتمد + المشروع معتمد */
  const all = useMemo<PublicProjectEntry[]>(() => {
    return records
      .filter((record) => record.status === "approved")
      .flatMap((record) =>
        record.projects
          .filter((project) => project.status === "approved")
          .map((project) => ({ record, project }))
      )
      .sort((a, b) => a.project.order - b.project.order);
  }, [records]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(({ record, project }) => {
      if (city && project.cityAr !== city) return false;
      if (purpose && project.purpose !== purpose) return false;
      if (
        typeId &&
        (project.typeId ?? resolveProjectTypeId(project.typeAr)) !== typeId
      ) {
        return false;
      }
      if (!q) return true;
      const hay = `${project.titleAr} ${project.cityAr ?? ""} ${project.typeAr ?? ""} ${
        record.companyAr ?? record.nameAr
      }`.toLowerCase();
      return hay.includes(q);
    });
  }, [all, query, city, purpose, typeId]);

  const hasFilters = Boolean(query.trim() || city || purpose || typeId);

  return (
    <div className="bg-sand-50 pb-16">
      {/* ===== ترويسة ===== */}
      <section className="relative overflow-hidden bg-ocean-950">
        <div className="absolute inset-0 theme-hero opacity-90" />
        <div className="relative mx-auto w-full max-w-[1120px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="flex items-center gap-2.5 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-300">
            <span aria-hidden className="h-px w-8 bg-gold-400/70" />
            {t("prof.projectsIndex.eyebrow")}
          </p>
          <h1 className="mt-3 max-w-2xl text-[26px] font-black leading-[44px] text-white sm:text-[34px]">
            {t("prof.projectsIndex.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-[12.5px] leading-8 text-white/70">
            {t("prof.projectsIndex.desc")}
          </p>
        </div>
      </section>

      {/* ===== الفلاتر ===== */}
      <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-6">
        <div className="-mt-6 rounded-3xl border border-sand-200 bg-white p-3.5 shadow-soft sm:p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("prof.projectsIndex.search")}
                aria-label={t("prof.projectsIndex.search")}
                className="w-full rounded-xl border border-sand-200 bg-sand-50 py-2.5 pe-9 ps-3 text-[12.5px] font-semibold text-ocean-900 outline-none transition placeholder:font-normal placeholder:text-sand-500 focus:border-ocean-500 focus:bg-white"
              />
            </div>
            <select
              value={typeId}
              onChange={(event) => setTypeId(event.target.value as ProjectTypeId | "")}
              aria-label={t("prof.project.type")}
              className="rounded-xl border border-sand-200 bg-white px-2.5 py-2.5 text-[12px] font-semibold text-ocean-900 outline-none focus:border-ocean-500 sm:w-40"
            >
              <option value="">{t("prof.projectsIndex.allTypes")}</option>
              {PROJECT_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {locale === "en" ? type.en : type.ar}
                </option>
              ))}
            </select>
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
              aria-label={t("prof.project.city")}
              className="rounded-xl border border-sand-200 bg-white px-2.5 py-2.5 text-[12px] font-semibold text-ocean-900 outline-none focus:border-ocean-500 sm:w-44"
            >
              <option value="">{t("prof.projectsIndex.allCities")}</option>
              {cities.map((item) => (
                <option key={item.id} value={item.nameAr}>
                  {cityLabel(item.nameAr, t, locale)}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 rounded-xl bg-sand-100 p-1">
              <button
                type="button"
                onClick={() => setPurpose("")}
                aria-pressed={purpose === ""}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                  purpose === "" ? "bg-ocean-700 text-white shadow" : "text-ocean-800 hover:bg-white"
                }`}
              >
                {t("prof.projectsIndex.all")}
              </button>
              {PURPOSES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPurpose(purpose === item.value ? "" : item.value)}
                  aria-pressed={purpose === item.value}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                    purpose === item.value
                      ? "bg-ocean-700 text-white shadow"
                      : "text-ocean-800 hover:bg-white"
                  }`}
                >
                  {t(item.key)}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-2.5 flex flex-wrap items-center gap-2 text-[10.5px] font-bold text-sand-600">
            <SlidersHorizontal className="h-3.5 w-3.5 text-gold-600" />
            {t("prof.projectsIndex.count", { count: visible.length })}
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCity("");
                  setPurpose("");
                  setTypeId("");
                }}
                className="rounded-full border border-sand-200 px-2.5 py-1 text-[10px] font-bold text-sand-700 transition hover:border-gold-300 hover:text-gold-700"
              >
                {t("prof.projectsIndex.clear")}
              </button>
            )}
          </p>
        </div>
      </div>

      {/* ===== الشبكة ===== */}
      <div className="mx-auto mt-6 w-full max-w-[1120px] px-4 sm:px-6">
        {!ready ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-64 animate-pulse rounded-3xl border border-sand-200 bg-white" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-sand-300 bg-white px-6 py-16 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sand-50 text-gold-600">
              <Building2 className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-[18px] font-black text-ocean-900">
              {t("prof.projectsIndex.emptyTitle")}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[11.5px] leading-7 text-sand-600">
              {t("prof.projectsIndex.emptyDesc")}
            </p>
            <Link
              href="/developers"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-ocean-950 px-5 py-2.5 text-[11.5px] font-black text-white transition hover:bg-ocean-900"
            >
              {t("prof.project.backToDirectory")}
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(({ record, project }) => {
              const providerName = record.companyAr || record.nameAr;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-sand-200 bg-white transition hover:-translate-y-0.5 hover:border-gold-300/70 hover:shadow-lg"
                >
                  <span className="relative block h-40 w-full overflow-hidden bg-sand-200">
                    {project.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.coverUrl}
                        alt={project.titleAr}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center bg-gradient-to-br from-ocean-800 to-ocean-950 text-gold-300">
                        <Building2 className="h-8 w-8" />
                      </span>
                    )}
                    {project.purpose && (
                      <span className="absolute start-3 top-3 rounded-lg bg-ocean-950/80 px-2 py-0.5 text-[9.5px] font-bold text-white backdrop-blur">
                        {t(
                          project.purpose === "sale"
                            ? "prof.profile.purpose.sale"
                            : project.purpose === "rent"
                              ? "prof.profile.purpose.rent"
                              : project.purpose === "marketing"
                                ? "prof.profile.purpose.marketing"
                                : "prof.profile.purpose.project"
                        )}
                      </span>
                    )}
                  </span>

                  <span className="flex flex-1 flex-col p-4">
                    {project.cityAr && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-sand-600">
                        <MapPin className="h-3 w-3 text-gold-500" />
                        {cityLabel(project.cityAr, t, locale)}
                        {project.typeAr ? ` · ${project.typeAr}` : ""}
                      </span>
                    )}
                    <span className="mt-1.5 line-clamp-1 text-[13.5px] font-black text-ocean-900">
                      {project.titleAr}
                    </span>
                    {project.descriptionAr && (
                      <span className="mt-1 line-clamp-2 text-[10.5px] leading-5 text-sand-700">
                        {project.descriptionAr}
                      </span>
                    )}

                    <span className="mt-auto flex items-end justify-between gap-2 border-t border-sand-200 pt-3">
                      <span className="min-w-0">
                        {project.priceFrom && (
                          <span className="block text-[12.5px] font-black text-ocean-900">
                            {project.priceFrom}
                          </span>
                        )}
                        <span className="mt-0.5 flex items-center gap-1 truncate text-[9.5px] font-bold text-sand-600">
                          <ShieldCheck className="h-3 w-3 shrink-0 text-gold-500" />
                          {providerName}
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-ocean-900 px-2.5 py-1.5 text-[10px] font-extrabold text-white transition group-hover:bg-ocean-950">
                        {t("prof.project.details")}
                        <ArrowLeft className="h-3 w-3" />
                      </span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
