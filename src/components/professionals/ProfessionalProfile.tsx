"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  Check,
  Film,
  Lock,
  MapPin,
  Phone,
  Ruler,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { isValidEgyptPhone } from "@/lib/phone";
import {
  PROJECT_TYPES,
  resolveProjectTypeId,
  type ProjectTypeId,
} from "@/lib/projects-taxonomy";
import {
  addProfessionalRequest,
  PROFESSIONAL_KIND_META,
  useProfessionalsState,
  type ProfessionalKind,
  type ProfessionalProject,
  type ProfessionalRecord,
} from "@/lib/professionals-store";
import ReelGallery from "@/components/professionals/ReelGallery";

interface Props {
  kind: ProfessionalKind;
  id: string;
}

const FIELD =
  "w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-ocean-900 outline-none transition placeholder:font-medium placeholder:text-sand-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60";
const LABEL = "mb-1.5 block text-[11px] font-extrabold text-sand-700";

function initials(value: string): string {
  const clean = value.replace(/^(أ\.|د\.|م\.|eng\.|dr\.)\s*/i, "").trim();
  return clean.charAt(0) || "؟";
}

function purposeKey(purpose?: ProfessionalProject["purpose"]) {
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

export default function ProfessionalProfile({ kind, id }: Props) {
  const { t, locale } = useI18n();
  const ar = locale === "ar";
  const { records, ready } = useProfessionalsState();
  const record =
    records.find(
      (item) => item.id === id && item.kind === kind && item.status === "approved"
    ) ?? null;

  /* لا نُظهر «الملف غير موجود» قبل مزامنة التخزين */
  if (!ready) {
    return (
      <div className="grid min-h-[50vh] place-items-center bg-sand-50">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold-300 border-t-transparent" />
      </div>
    );
  }

  if (!record) {
    return <NotFound kind={kind} />;
  }

  return (
    <ProfileContent
      key={record.id}
      record={record}
      ar={ar}
      t={t}
      locale={locale}
      kind={kind}
    />
  );
}

function NotFound({ kind }: { kind: ProfessionalKind }) {
  const { t } = useI18n();
  const meta = PROFESSIONAL_KIND_META[kind];
  return (
    <div className="bg-sand-50">
      <section className="mx-auto w-full max-w-[820px] px-4 py-20 text-center sm:px-6">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-gold-600 shadow-sm">
          <Building2 className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-[24px] font-black text-ocean-900">
          {t("prof.profile.notFoundTitle")}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[12px] leading-7 text-sand-600">
          {t("prof.profile.notFoundDesc")}
        </p>
        <Link
          href={meta.path}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-ocean-950 px-5 py-2.5 text-[11.5px] font-black text-white transition hover:bg-ocean-900"
        >
          <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          {t("prof.profile.backToDirectory")}
        </Link>
      </section>
    </div>
  );
}

function ProfileContent({
  record,
  ar,
  t,
  locale,
  kind,
}: {
  record: ProfessionalRecord;
  ar: boolean;
  t: ReturnType<typeof useI18n>["t"];
  locale: "ar" | "en";
  kind: ProfessionalKind;
}) {
  const meta = PROFESSIONAL_KIND_META[kind];
  const approvedProjects = record.projects.filter(
    (project) => project.status === "approved"
  );
  const [typeFilter, setTypeFilter] = useState<ProjectTypeId | "">("");
  /** الأنواع الموجودة فعلاً في مشاريع هذا المهني */
  const availableTypes = useMemo(() => {
    const ids = new Set<ProjectTypeId>();
    for (const project of approvedProjects) {
      const id = project.typeId ?? resolveProjectTypeId(project.typeAr);
      if (id) ids.add(id);
    }
    return PROJECT_TYPES.filter((type) => ids.has(type.id));
  }, [approvedProjects]);
  const visibleProjects = typeFilter
    ? approvedProjects.filter(
        (project) => (project.typeId ?? resolveProjectTypeId(project.typeAr)) === typeFilter
      )
    : approvedProjects;
  const specialties = record.specialtiesAr ?? [];
  const coverage = record.coverageAr ?? [];
  const displayName = record.companyAr || record.nameAr;
  const isLawyer = kind === "lawyer";

  return (
    <div className="bg-sand-50">
      {/* ====================== HERO ====================== */}
      <section className="relative overflow-hidden theme-hero">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.24),transparent_65%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-400 to-transparent"
        />
        <div className="relative mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 sm:py-14">
          <nav className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold text-white/55">
            <Link href="/" className="transition hover:text-gold-200">
              {t("prof.profile.home")}
            </Link>
            <span aria-hidden>/</span>
            <Link href={meta.path} className="transition hover:text-gold-200">
              {ar ? meta.labelAr : meta.labelEn}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-white/80">{displayName}</span>
          </nav>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {isLawyer && record.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.photoUrl}
                  alt={record.nameAr}
                  className="h-24 w-24 shrink-0 rounded-3xl border-2 border-white/20 bg-white object-cover shadow-xl"
                />
              ) : record.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.logoUrl}
                  alt={displayName}
                  className="h-24 w-24 shrink-0 rounded-3xl border-2 border-white/20 bg-white object-cover shadow-xl"
                />
              ) : (
                <span className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-white/10 text-[30px] font-black text-gold-300 ring-2 ring-gold-200/30">
                  {initials(displayName)}
                </span>
              )}

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  {record.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-400/15 px-2.5 py-1 text-[9.5px] font-extrabold text-emerald-200">
                      <BadgeCheck className="h-3 w-3" />
                      {t("prof.card.verified")}
                    </span>
                  )}
                  {record.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gold-300/40 bg-gold-400/15 px-2.5 py-1 text-[9.5px] font-extrabold text-gold-200">
                      <Sparkles className="h-3 w-3" />
                      {t("prof.card.featured")}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[9.5px] font-bold text-white/70">
                    {ar ? meta.singularAr : meta.labelEn}
                  </span>
                </div>
                <h1 className="mt-2.5 text-[26px] font-black leading-tight text-white sm:text-[34px]">
                  {displayName}
                </h1>
                <p className="mt-1 text-[12px] font-semibold text-white/65">
                  {record.nameAr}
                  {record.titleAr ? ` · ${record.titleAr}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[10.5px] font-bold text-white/60">
                  {record.cityAr && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gold-300" />
                      {cityLabel(record.cityAr, t, locale)}
                    </span>
                  )}
                  {record.licenseNumber && (
                    <span className="inline-flex items-center gap-1" dir="ltr">
                      <ShieldCheck className="h-3 w-3 text-gold-300" />
                      {record.licenseNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
              {typeof record.yearsExperience === "number" && (
                <Stat
                  icon={<CalendarClock className="h-4 w-4" />}
                  value={String(record.yearsExperience)}
                  label={t("prof.profile.experience")}
                />
              )}
              {!isLawyer && (
                <Stat
                  icon={<Briefcase className="h-4 w-4" />}
                  value={String(approvedProjects.length)}
                  label={t("prof.profile.publishedProjects")}
                />
              )}
              <Stat
                icon={<Film className="h-4 w-4" />}
                value={String(record.reels.length)}
                label={t("prof.profile.videos")}
              />
              {coverage.length > 0 && (
                <Stat
                  icon={<MapPin className="h-4 w-4" />}
                  value={String(coverage.length)}
                  label={t("prof.stat.cities")}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ====================== BODY ====================== */}
      <div className="mx-auto grid w-full max-w-[1180px] gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-5">
          {(record.bioAr || record.titleAr) && (
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
              <h2 className="text-[14px] font-black text-ocean-900">
                {t("prof.profile.about")}
              </h2>
              <p className="mt-2 text-[12.5px] leading-8 text-sand-800">
                {record.bioAr || record.titleAr}
              </p>

              {specialties.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-600">
                    {t("prof.profile.specialties")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {specialties.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-sand-200 bg-sand-50 px-2.5 py-1 text-[10px] font-bold text-ocean-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {coverage.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-600">
                    {t("prof.profile.coverage")}
                  </p>
                  <p className="mt-1.5 text-[11.5px] font-semibold text-sand-700">
                    {coverage.map((item) => cityLabel(item, t, locale)).join(" · ")}
                  </p>
                </div>
              )}
            </section>
          )}

          {!isLawyer && (
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-[14px] font-black text-ocean-900">
                  <Briefcase className="h-4 w-4 text-gold-600" />
                  {t("prof.profile.projects")}
                </h2>
                <span className="rounded-full border border-sand-200 bg-sand-50 px-2.5 py-1 text-[10px] font-bold text-sand-600">
                  {approvedProjects.length}
                </span>
              </div>

              {approvedProjects.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 px-4 py-6 text-center text-[11.5px] font-semibold text-sand-500">
                  {t("prof.profile.projectsEmpty")}
                </p>
              ) : (
                <>
                  {availableTypes.length > 1 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTypeFilter("")}
                        className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold transition ${
                          typeFilter === ""
                            ? "bg-ocean-950 text-white"
                            : "border border-sand-200 bg-white text-sand-700 hover:border-gold-300"
                        }`}
                      >
                        {t("prof.projectsIndex.all")}
                      </button>
                      {availableTypes.map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() =>
                            setTypeFilter(typeFilter === type.id ? "" : type.id)
                          }
                          className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold transition ${
                            typeFilter === type.id
                              ? "bg-ocean-950 text-white"
                              : "border border-sand-200 bg-white text-sand-700 hover:border-gold-300"
                          }`}
                        >
                          {locale === "en" ? type.en : type.ar}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {visibleProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        t={t}
                        locale={locale}
                      />
                    ))}
                  </div>
                  {visibleProjects.length === 0 && (
                    <p className="mt-3 rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 px-4 py-6 text-center text-[11.5px] font-semibold text-sand-500">
                      {t("prof.projectsIndex.emptyTitle")}
                    </p>
                  )}
                </>
              )}

              <p className="mt-4 flex items-start gap-1.5 text-[10px] leading-5 text-sand-500">
                <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-gold-500" />
                {t("prof.profile.projectsNote")}
              </p>
            </section>
          )}

          <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
            <h2 className="flex items-center gap-2 text-[14px] font-black text-ocean-900">
              <Film className="h-4 w-4 text-gold-600" />
              {t("prof.profile.reels")}
            </h2>
            {record.reels.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 px-4 py-6 text-center text-[11.5px] font-semibold text-sand-500">
                {t("prof.profile.reelsEmpty")}
              </p>
            ) : (
              <ReelGallery reels={record.reels} />
            )}
          </section>
        </main>

        <aside className="space-y-4">
          <ContactCard record={record} ar={ar} t={t} />

          <div className="rounded-3xl border border-sand-200 bg-white p-5">
            <p className="flex items-center gap-2 text-[12px] font-black text-ocean-900">
              <ShieldCheck className="h-4 w-4 text-gold-600" />
              {t("prof.profile.trustTitle")}
            </p>
            <p className="mt-2 text-[10.5px] leading-6 text-sand-600">
              {t("prof.profile.trustText")}
            </p>
          </div>

          <div className="rounded-3xl border border-gold-200/70 bg-gold-50/60 p-5">
            <p className="text-[11px] font-black text-ocean-900">
              {t("prof.profile.manage")}
            </p>
            <Link
              href="/professional"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-ocean-950 px-4 py-2 text-[10.5px] font-black text-white transition hover:bg-ocean-900"
            >
              {t("prof.profile.manageCta")}
              <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-center">
      <span className="mx-auto grid h-8 w-8 place-items-center rounded-xl bg-gold-400/15 text-gold-200">
        {icon}
      </span>
      <p className="mt-1 text-[15px] font-black text-white">{value}</p>
      <p className="mt-0.5 text-[9px] font-bold leading-4 text-white/55">{label}</p>
    </div>
  );
}

function ProjectCard({
  project,
  t,
  locale,
}: {
  project: ProfessionalProject;
  t: ReturnType<typeof useI18n>["t"];
  locale: "ar" | "en";
}) {
  const purpose = purposeKey(project.purpose);
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block h-full"
      aria-label={project.titleAr}
    >
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-sand-200 bg-white transition hover:-translate-y-0.5 hover:border-gold-300/70 hover:shadow-lg">
      {project.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.coverUrl}
          alt={project.titleAr}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="grid h-32 w-full place-items-center bg-[linear-gradient(135deg,#141a33,#2d3875)] text-gold-300">
          <Building2 className="h-8 w-8" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {project.cityAr && (
            <span className="inline-flex items-center gap-1 rounded-full border border-sand-200 bg-sand-50 px-2 py-0.5 text-[9.5px] font-bold text-ocean-800">
              <MapPin className="h-2.5 w-2.5 text-gold-500" />
              {cityLabel(project.cityAr, t, locale)}
            </span>
          )}
          {project.typeAr && (
            <span className="rounded-full border border-ocean-100 bg-ocean-50 px-2 py-0.5 text-[9.5px] font-bold text-ocean-700">
              {project.typeAr}
            </span>
          )}
          {purpose && (
            <span className="rounded-full border border-gold-200 bg-gold-50 px-2 py-0.5 text-[9.5px] font-bold text-gold-700">
              {t(purpose)}
            </span>
          )}
        </div>
        <h3 className="mt-2 text-[13px] font-black text-ocean-900">
          {project.titleAr}
        </h3>
        {project.descriptionAr && (
          <p className="mt-1.5 line-clamp-3 text-[11px] leading-6 text-sand-700">
            {project.descriptionAr}
          </p>
        )}

        <dl className="mt-3 grid grid-cols-2 gap-1.5 rounded-2xl border border-sand-200 bg-sand-50/70 p-2.5 text-[10px]">
          {project.priceFrom && (
            <div className="col-span-2 flex items-center gap-1.5 font-bold text-ocean-900">
              <Wallet className="h-3 w-3 text-gold-500" />
              {t("prof.profile.priceFrom")}: {project.priceFrom}
            </div>
          )}
          {project.deliveryAr && (
            <div className="flex items-center gap-1.5 font-semibold text-sand-700">
              <CalendarClock className="h-3 w-3 text-gold-500" />
              {t("prof.profile.delivery")}: {project.deliveryAr}
            </div>
          )}
          {project.areaFrom && (
            <div className="flex items-center gap-1.5 font-semibold text-sand-700">
              <Ruler className="h-3 w-3 text-gold-500" />
              {t("prof.profile.area")}: {project.areaFrom} م²
            </div>
          )}
          {typeof project.unitsCount === "number" && (
            <div className="flex items-center gap-1.5 font-semibold text-sand-700">
              <Building2 className="h-3 w-3 text-gold-500" />
              {t("prof.profile.units")}: {project.unitsCount}
            </div>
          )}
        </dl>
        <span className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-extrabold text-ocean-700 transition group-hover:text-gold-700">
          {t("prof.project.details")}
          <ArrowLeft className="h-3 w-3 rtl:rotate-180" />
        </span>
      </div>
    </article>
    </Link>
  );
}

function ContactCard({
  record,
  ar,
  t,
}: {
  record: ProfessionalRecord;
  ar: boolean;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    ar
      ? `أرغب في التواصل بخصوص خدمات ${record.companyAr || record.nameAr}.`
      : `I would like to get in touch regarding ${record.companyEn || record.nameAr}.`
  );
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError(t("join.error.required"));
      return;
    }
    if (!isValidEgyptPhone(phone)) {
      setError(t("join.error.phone"));
      return;
    }
    const result = addProfessionalRequest({
      professionalId: record.id,
      professionalName: record.companyAr || record.nameAr,
      kind: record.kind,
      name,
      phone,
      email,
      message,
    });
    if (!result.ok) {
      setError(result.error ?? t("join.error.required"));
      return;
    }
    setError("");
    setSent(true);
  };

  return (
    <div className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
      <p className="flex items-center gap-2 text-[13px] font-black text-ocean-900">
        <Phone className="h-4 w-4 text-gold-600" />
        {t("prof.profile.contact")}
      </p>
      <p className="mt-1.5 text-[10.5px] leading-6 text-sand-600">
        {t("prof.profile.contactDesc")}
      </p>

      {sent ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
          <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white">
            <Check className="h-5 w-5" strokeWidth={3} />
          </span>
          <p className="mt-2 text-[11px] font-bold leading-6 text-emerald-800">
            {t("prof.contact.success")}
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-2.5">
          <label className="block">
            <span className={LABEL}>{t("prof.contact.name")}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>{t("prof.contact.phone")}</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              dir="ltr"
              placeholder="01xxxxxxxxx"
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>{t("prof.contact.email")}</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              dir="ltr"
              placeholder="name@example.com"
              className={FIELD}
            />
          </label>
          <label className="block">
            <span className={LABEL}>{t("prof.contact.message")}</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              className={FIELD}
            />
          </label>
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10.5px] font-bold text-rose-700">
              {error}
            </p>
          )}
          <p className="flex items-start gap-1.5 text-[9.5px] leading-5 text-sand-500">
            <Lock className="mt-0.5 h-3 w-3 shrink-0 text-gold-500" />
            {t("prof.profile.contactNote")}
          </p>
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 px-4 py-2.5 text-[11.5px] font-black text-ocean-950 transition hover:-translate-y-0.5"
          >
            {t("prof.contact.submit")}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
        </form>
      )}
    </div>
  );
}
