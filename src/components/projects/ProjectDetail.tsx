"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarClock,
  Layers,
  MapPin,
  Phone,
  PlayCircle,
  Ruler,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { toEmbedUrl } from "@/lib/embed";
import { useSiteSettings, telHref } from "@/lib/site-settings";
import { PROFESSIONAL_KIND_META, PROJECT_STATUS_META } from "@/lib/professionals-store";
import type { ProfessionalProject, ProfessionalRecord } from "@/lib/professionals-store";
import PropertyDetailMapDynamic from "@/components/PropertyDetailMapDynamic";

interface Props {
  record: ProfessionalRecord;
  project: ProfessionalProject;
}

function purposeKey(purpose: ProfessionalProject["purpose"]) {
  switch (purpose) {
    case "sale":
      return "prof.profile.purpose.sale" as const;
    case "rent":
      return "prof.profile.purpose.rent" as const;
    case "marketing":
      return "prof.profile.purpose.marketing" as const;
    case "project":
      return "prof.profile.purpose.project" as const;
    default:
      return null;
  }
}

export default function ProjectDetail({ record, project }: Props) {
  const { t, locale } = useI18n();
  const site = useSiteSettings();
  const meta = PROFESSIONAL_KIND_META[record.kind];
  const purpose = purposeKey(project.purpose);
  const statusMeta = PROJECT_STATUS_META[project.status];
  const providerName = record.companyAr || record.nameAr;
  const gallery = [project.coverUrl, ...(project.gallery ?? [])].filter(
    (url): url is string => Boolean(url)
  );
  const video = project.videoUrl ? toEmbedUrl(project.videoUrl) : null;
  const hasMap =
    typeof project.mapLat === "number" &&
    typeof project.mapLng === "number" &&
    Number.isFinite(project.mapLat) &&
    Number.isFinite(project.mapLng);

  const specs = [
    project.cityAr && {
      Icon: MapPin,
      label: t("prof.project.city"),
      value: cityLabel(project.cityAr, t, locale),
    },
    project.typeAr && {
      Icon: Building2,
      label: t("prof.project.type"),
      value: project.typeAr,
    },
    purpose && { Icon: BadgeCheck, label: t("prof.project.purpose"), value: t(purpose) },
    project.unitsCount ? {
      Icon: Layers,
      label: t("prof.project.units"),
      value: String(project.unitsCount),
    } : null,
    project.areaFrom && {
      Icon: Ruler,
      label: t("prof.project.area"),
      value: project.areaFrom,
    },
    project.deliveryAr && {
      Icon: CalendarClock,
      label: t("prof.project.delivery"),
      value: project.deliveryAr,
    },
  ].filter(Boolean) as { Icon: typeof MapPin; label: string; value: string }[];

  return (
    <div className="bg-sand-50 pb-16">
      {/* ===== شريط المسار ===== */}
      <nav className="border-b border-sand-200 bg-white/80">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center gap-1.5 px-4 py-2.5 text-[10.5px] font-bold text-sand-600 sm:px-6">
          <Link href="/" className="transition hover:text-gold-600">
            {t("prof.project.breadcrumbHome")}
          </Link>
          <span aria-hidden>/</span>
          <Link href={meta.path} className="transition hover:text-gold-600">
            {locale === "en" ? meta.labelEn : meta.labelAr}
          </Link>
          <span aria-hidden>/</span>
          <Link href={`${meta.path}/${record.id}`} className="transition hover:text-gold-600">
            {providerName}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ocean-900">{project.titleAr}</span>
        </div>
      </nav>

      {/* ===== الغلاف ===== */}
      <header className="relative overflow-hidden border-b border-sand-200 bg-ocean-950">
        {project.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.coverUrl}
            alt={project.titleAr}
            className="absolute inset-0 h-full w-full object-cover opacity-45"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(20,26,51,0.92),rgba(20,26,51,0.55))]" />
        <div className="relative mx-auto w-full max-w-[1120px] px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gold-300/40 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-gold-200">
              {statusMeta.labelAr}
            </span>
            {project.cityAr && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/85">
                <MapPin className="h-3 w-3 text-gold-300" />
                {cityLabel(project.cityAr, t, locale)}
              </span>
            )}
            {project.typeAr && (
              <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/85">
                {project.typeAr}
              </span>
            )}
          </div>

          <h1 className="mt-3 max-w-3xl text-2xl font-black leading-10 text-white sm:text-4xl sm:leading-[52px]">
            {project.titleAr}
          </h1>

          <p className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] font-bold text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-gold-300" />
              {t("prof.project.by")}: {providerName}
            </span>
            <Link
              href={`${meta.path}/${record.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10.5px] text-white transition hover:bg-white/20"
            >
              {t("prof.project.viewProfile")}
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {project.priceFrom && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-gold-500 px-3 py-2 text-[12px] font-black text-ocean-950">
                <Wallet className="h-3.5 w-3.5" />
                {t("prof.project.priceFrom")}: {project.priceFrom}
              </span>
            )}
            {project.deliveryAr && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-[11.5px] font-bold text-white">
                <CalendarClock className="h-3.5 w-3.5 text-gold-300" />
                {t("prof.project.delivery")}: {project.deliveryAr}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1120px] gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {/* ===== المعرض ===== */}
          {gallery.length > 0 && (
            <section className="rounded-3xl border border-sand-200 bg-white p-4 sm:p-5">
              <h2 className="text-[13px] font-black text-ocean-900">{t("prof.project.gallery")}</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {gallery.map((url, index) => (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-sand-200 bg-sand-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${project.titleAr} — ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* ===== الفيديو ===== */}
          {video && (
            <section className="rounded-3xl border border-sand-200 bg-white p-4 sm:p-5">
              <h2 className="flex items-center gap-1.5 text-[13px] font-black text-ocean-900">
                <PlayCircle className="h-4 w-4 text-gold-600" />
                {t("prof.project.video")}
              </h2>
              <div className="mt-3 overflow-hidden rounded-2xl border border-sand-200 bg-ocean-950">
                <iframe
                  src={video}
                  title={`${project.titleAr} — video`}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* ===== الوصف ===== */}
          {(project.descriptionAr || project.descriptionEn) && (
            <section className="rounded-3xl border border-sand-200 bg-white p-4 sm:p-5">
              <h2 className="text-[13px] font-black text-ocean-900">
                {t("prof.project.description")}
              </h2>
              <p className="mt-2.5 whitespace-pre-line text-[12.5px] leading-8 text-ocean-800/90">
                {(locale === "en" ? project.descriptionEn : project.descriptionAr) ||
                  project.descriptionAr ||
                  project.descriptionEn}
              </p>
            </section>
          )}

          {/* ===== المميزات ===== */}
          {(project.featuresAr?.length ?? 0) > 0 && (
            <section className="rounded-3xl border border-sand-200 bg-white p-4 sm:p-5">
              <h2 className="text-[13px] font-black text-ocean-900">
                {t("prof.project.features")}
              </h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.featuresAr?.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-1 rounded-full border border-gold-200 bg-gold-50 px-2.5 py-1 text-[10.5px] font-bold text-gold-800"
                  >
                    <BadgeCheck className="h-3 w-3" />
                    {feature}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ===== الموقع ===== */}
          {hasMap && (
            <section className="rounded-3xl border border-sand-200 bg-white p-4 sm:p-5">
              <h2 className="flex items-center gap-1.5 text-[13px] font-black text-ocean-900">
                <MapPin className="h-4 w-4 text-gold-600" />
                {t("prof.project.location")}
              </h2>
              <div className="mt-3 h-64 overflow-hidden rounded-2xl border border-sand-200">
                <PropertyDetailMapDynamic
                  lat={project.mapLat as number}
                  lng={project.mapLng as number}
                  title={project.titleAr}
                />
              </div>
            </section>
          )}
        </div>

        {/* ===== الشريط الجانبي ===== */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-sand-200 bg-white p-4 sm:p-5">
            <h2 className="text-[13px] font-black text-ocean-900">{t("prof.project.details")}</h2>
            <dl className="mt-3 space-y-2">
              {specs.map(({ Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-2 rounded-xl border border-sand-200 bg-sand-50/70 px-3 py-2"
                >
                  <dt className="flex items-center gap-1.5 text-[10.5px] font-bold text-sand-600">
                    <Icon className="h-3.5 w-3.5 text-gold-600" />
                    {label}
                  </dt>
                  <dd className="text-[11.5px] font-extrabold text-ocean-900">{value}</dd>
                </div>
              ))}
            </dl>
            {project.paymentPlanAr && (
              <div className="mt-3 rounded-xl border border-gold-200 bg-gold-50/70 px-3 py-2.5">
                <p className="text-[10px] font-bold text-gold-700">{t("prof.project.paymentPlan")}</p>
                <p className="mt-0.5 text-[11.5px] font-extrabold text-ocean-900">
                  {project.paymentPlanAr}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-sand-200 bg-white p-4 sm:p-5">
            <h2 className="text-[13px] font-black text-ocean-900">{t("prof.project.contact")}</h2>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={`mailto:${site.managementEmail}?subject=${encodeURIComponent(project.titleAr)}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 px-4 py-2.5 text-[11.5px] font-black text-ocean-950 transition hover:-translate-y-0.5"
              >
                <ShieldCheck className="h-4 w-4" />
                {t("prof.project.contact")}
              </a>
              <a
                href={telHref(site.managementPhone)}
                className="flex items-center justify-center gap-2 rounded-xl border border-sand-200 bg-sand-50/60 px-4 py-2.5 text-[11.5px] font-bold text-ocean-800 transition hover:border-gold-300"
                dir="ltr"
              >
                <Phone className="h-3.5 w-3.5 text-gold-600" />
                {site.managementPhone}
              </a>
            </div>
            <p className="mt-3 rounded-xl bg-sand-50 px-3 py-2.5 text-[10px] font-bold leading-5 text-sand-800">
              {t("prof.project.contactNote")}
            </p>
          </section>

          <section className="rounded-3xl border border-sand-200 bg-white p-4 sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-wide text-gold-600">
              {t("prof.project.by")}
            </p>
            <Link
              href={`${meta.path}/${record.id}`}
              className="mt-2 flex items-center gap-2.5 rounded-2xl border border-sand-200 bg-sand-50/50 p-2.5 transition hover:border-gold-300"
            >
              {record.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.logoUrl}
                  alt={providerName}
                  className="h-10 w-10 rounded-xl border border-sand-200 bg-white object-cover"
                />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-ocean-800 to-ocean-950 text-[13px] font-black text-gold-300">
                  {providerName.slice(0, 2)}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-[11.5px] font-extrabold text-ocean-900">
                  {providerName}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-sand-600">
                  <BadgeCheck className="h-3 w-3 text-gold-500" />
                  {locale === "en" ? meta.labelEn : meta.labelAr}
                </span>
              </span>
            </Link>
            <p className="mt-3 flex items-start gap-1.5 text-[9.5px] font-semibold leading-5 text-sand-500">
              <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-gold-500" />
              {t("prof.project.docsHidden")}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
