"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  FileCheck2,
  Film,
  Lock,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { isValidEgyptPhone } from "@/lib/phone";
import {
  addProfessionalRequest,
  PROFESSIONAL_KIND_META,
  usePublicProfessionals,
  type ProfessionalKind,
  type ProfessionalRecord,
} from "@/lib/professionals-store";

interface Props {
  kind: ProfessionalKind;
}

const FIELD =
  "w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-ocean-900 outline-none transition placeholder:font-medium placeholder:text-sand-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60";
const LABEL = "mb-1.5 block text-[11px] font-extrabold text-sand-700";

const KIND_KEYS: Record<
  ProfessionalKind,
  { eyebrow: MessageKey; title: MessageKey; desc: MessageKey }
> = {
  developer: {
    eyebrow: "prof.developers.eyebrow",
    title: "prof.developers.title",
    desc: "prof.developers.desc",
  },
  marketer: {
    eyebrow: "prof.marketers.eyebrow",
    title: "prof.marketers.title",
    desc: "prof.marketers.desc",
  },
  lawyer: {
    eyebrow: "prof.lawyers.eyebrow",
    title: "prof.lawyers.title",
    desc: "prof.lawyers.desc",
  },
};

const TRUST_POINTS = [
  { title: "prof.trust.0.title", text: "prof.trust.0.text", Icon: FileCheck2 },
  { title: "prof.trust.1.title", text: "prof.trust.1.text", Icon: ShieldCheck },
  { title: "prof.trust.2.title", text: "prof.trust.2.text", Icon: Lock },
] as const satisfies readonly {
  title: MessageKey;
  text: MessageKey;
  Icon: typeof FileCheck2;
}[];

function initials(value: string): string {
  const clean = value.replace(/^(أ\.|د\.|م\.|eng\.|dr\.)\s*/i, "").trim();
  return clean.charAt(0) || "؟";
}

function specialtyList(record: ProfessionalRecord): string[] {
  return record.specialtiesAr ?? [];
}

export default function ProfessionalDirectory({ kind }: Props) {
  const { t, locale } = useI18n();
  const ar = locale === "ar";
  const records = usePublicProfessionals(kind);

  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [specialty, setSpecialty] = useState("all");
  const [contactId, setContactId] = useState<string | null>(null);

  const [requestName, setRequestName] = useState("");
  const [requestPhone, setRequestPhone] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const keys = KIND_KEYS[kind];
  const contactTarget = records.find((record) => record.id === contactId) ?? null;

  const availableCities = useMemo(() => {
    const fromRecords = new Set<string>();
    records.forEach((record) => {
      if (record.cityAr) fromRecords.add(record.cityAr);
      (record.coverageAr ?? []).forEach((item) => fromRecords.add(item));
    });
    return Array.from(fromRecords).sort((a, b) => a.localeCompare(b, "ar"));
  }, [records]);

  const availableSpecialties = useMemo(() => {
    const set = new Set<string>();
    records.forEach((record) =>
      specialtyList(record).forEach((item) => set.add(item))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ar"));
  }, [records]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      const haystack = [
        record.nameAr,
        record.nameEn,
        record.companyAr,
        record.companyEn,
        record.titleAr,
        ...specialtyList(record),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (needle && !haystack.includes(needle)) return false;
      if (city !== "all") {
        const inCity =
          record.cityAr === city || (record.coverageAr ?? []).includes(city);
        if (!inCity) return false;
      }
      if (specialty !== "all" && !specialtyList(record).includes(specialty)) {
        return false;
      }
      return true;
    });
  }, [records, query, city, specialty]);

  const verifiedCount = records.filter((record) => record.verified).length;
  const reelsCount = records.reduce((sum, record) => sum + record.reels.length, 0);

  const closeAll = () => {
    setContactId(null);
    setRequestSent(false);
    setRequestError("");
  };

  const openContact = (record: ProfessionalRecord) => {
    setContactId(record.id);
    setRequestSent(false);
    setRequestError("");
    setRequestName("");
    setRequestPhone("");
    setRequestEmail("");
    setRequestMessage(
      ar
        ? `أرغب في التواصل بخصوص خدمات ${record.companyAr || record.nameAr}.`
        : `I would like to get in touch regarding ${record.companyEn || record.nameAr}.`
    );
  };

  const submitRequest = (event: FormEvent) => {
    event.preventDefault();
    if (!contactTarget) return;
    if (!requestName.trim() || !requestPhone.trim() || !requestMessage.trim()) {
      setRequestError(t("join.error.required"));
      return;
    }
    if (!isValidEgyptPhone(requestPhone)) {
      setRequestError(t("join.error.phone"));
      return;
    }
    const result = addProfessionalRequest({
      professionalId: contactTarget.id,
      professionalName: contactTarget.companyAr || contactTarget.nameAr,
      kind: contactTarget.kind,
      name: requestName,
      phone: requestPhone,
      email: requestEmail,
      message: requestMessage,
    });
    if (!result.ok) {
      setRequestError(result.error ?? t("join.error.required"));
      return;
    }
    setRequestError("");
    setRequestSent(true);
  };

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
        <div className="relative mx-auto w-full max-w-[1180px] px-4 py-14 sm:px-6 sm:py-20">
          <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-300">
            <span aria-hidden className="h-px w-6 bg-gold-400/70" />
            {t(keys.eyebrow)}
          </p>
          <h1 className="mt-4 max-w-3xl text-[28px] font-black leading-[44px] tracking-tight text-white sm:text-[40px] sm:leading-[58px]">
            {t(keys.title)}
          </h1>
          <p className="mt-4 max-w-2xl text-[12.5px] leading-8 text-white/70 sm:text-[13.5px]">
            {t(keys.desc)}
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              href={`/join?role=${kind}`}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-6 py-3 text-[12.5px] font-black text-ocean-950 shadow-[0_20px_44px_-26px_rgba(201,146,42,0.95)] transition hover:-translate-y-0.5"
            >
              {t("prof.join.cta")}
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link
              href="/#properties"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-[12.5px] font-bold text-white transition hover:border-gold-300 hover:text-gold-200"
            >
              {t("legal.hero.browse")}
            </Link>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {[
              { value: String(verifiedCount), label: t("prof.stat.verified") },
              { value: String(reelsCount), label: t("prof.stat.reels") },
              { value: String(availableCities.length), label: t("prof.stat.cities") },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur"
              >
                <p className="text-2xl font-black text-gold-200">{stat.value}</p>
                <p className="mt-1 text-[10.5px] font-bold text-white/50">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================== TRUST ====================== */}
      <section className="border-b border-sand-200 bg-white">
        <div className="mx-auto grid w-full max-w-[1180px] gap-3 px-4 py-7 sm:grid-cols-3 sm:px-6">
          {TRUST_POINTS.map((point) => {
            const Icon = point.Icon;
            return (
              <div key={point.title} className="flex items-start gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sand-100 text-gold-600">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[12px] font-black text-ocean-900">
                    {t(point.title)}
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-semibold leading-5 text-sand-600">
                    {t(point.text)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ====================== FILTERS + GRID ====================== */}
      <section className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 sm:py-12">
        <div className="rounded-3xl border border-sand-200 bg-white p-4 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px_190px]">
            <label className="relative block">
              <span className="sr-only">{t("prof.search.placeholder")}</span>
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("prof.search.placeholder")}
                className={`${FIELD} ps-9`}
              />
            </label>
            <label className="block">
              <span className="sr-only">{t("prof.filter.city")}</span>
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className={FIELD}
              >
                <option value="all">{t("prof.filter.allCities")}</option>
                {availableCities.map((item) => (
                  <option key={item} value={item}>
                    {cityLabel(item, t, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">{t("prof.filter.specialty")}</span>
              <select
                value={specialty}
                onChange={(event) => setSpecialty(event.target.value)}
                className={FIELD}
              >
                <option value="all">{t("prof.filter.allSpecialties")}</option>
                {availableSpecialties.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-bold text-sand-500">
            <span>{t("prof.results", { count: filtered.length })}</span>
            {(query || city !== "all" || specialty !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCity("all");
                  setSpecialty("all");
                }}
                className="rounded-full border border-sand-200 bg-sand-50 px-3 py-1 font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
              >
                {t("prof.filter.reset")}
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-sand-300 bg-white p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-sand-100 text-sand-500">
              <Search className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[13px] font-black text-ocean-900">
              {t("prof.empty.title")}
            </p>
            <p className="mt-1 text-[11.5px] text-sand-600">
              {t("prof.empty.desc")}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((record) => (
              <article
                key={record.id}
                className="flex flex-col rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] transition hover:-translate-y-1 hover:border-gold-300/70"
              >
                <div className="flex items-start justify-between gap-2">
                  {record.logoUrl || record.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={record.logoUrl || record.photoUrl}
                      alt={record.companyAr || record.nameAr}
                      className="h-11 w-11 shrink-0 rounded-2xl border border-sand-200 bg-white object-cover ring-2 ring-gold-200/40"
                    />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-ocean-800 to-ocean-950 text-[15px] font-black text-gold-300 ring-2 ring-gold-300/40">
                      {initials(record.companyAr || record.nameAr)}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {record.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold-300/70 bg-gold-50 px-2.5 py-1 text-[9.5px] font-extrabold text-gold-700">
                        <Sparkles className="h-2.5 w-2.5" />
                        {t("prof.card.featured")}
                      </span>
                    )}
                    {record.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9.5px] font-extrabold text-emerald-700">
                        <BadgeCheck className="h-3 w-3" />
                        {t("prof.card.verified")}
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="mt-3.5 text-[14px] font-black text-ocean-900">
                  {record.companyAr || record.nameAr}
                </h2>
                <p className="mt-0.5 text-[11px] font-semibold text-sand-500">
                  {record.nameAr}
                  {record.titleAr ? ` · ${record.titleAr}` : ""}
                </p>

                <p className="mt-2.5 line-clamp-3 text-[11.5px] leading-6 text-sand-700">
                  {record.bioAr || record.titleAr || ""}
                </p>

                <dl className="mt-3 grid grid-cols-2 gap-1.5 rounded-2xl border border-sand-200 bg-sand-50/70 p-2.5 text-[10px]">
                  {record.cityAr && (
                    <div className="col-span-2 flex items-center gap-1.5 text-sand-700">
                      <MapPin className="h-3 w-3 shrink-0 text-gold-500" />
                      {record.cityAr}
                    </div>
                  )}
                  {typeof record.projectsCount === "number" && (
                    <div className="flex items-center gap-1.5 font-bold text-ocean-800">
                      <Briefcase className="h-3 w-3 text-gold-500" />
                      {t("prof.card.projects", { count: record.projectsCount })}
                    </div>
                  )}
                  {typeof record.yearsExperience === "number" && (
                    <div className="flex items-center gap-1.5 font-bold text-ocean-800">
                      <Building2 className="h-3 w-3 text-gold-500" />
                      {t("prof.card.experience", { count: record.yearsExperience })}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 font-bold text-ocean-800">
                    <Film className="h-3 w-3 text-gold-500" />
                    {record.reels.length
                      ? t("prof.card.reels", { count: record.reels.length })
                      : t("prof.card.noReels")}
                  </div>
                </dl>

                <div className="mt-auto flex flex-col gap-2 pt-4">
                  <Link
                    href={`${PROFESSIONAL_KIND_META[kind].path}/${record.id}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-[11.5px] font-extrabold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
                  >
                    {t("prof.card.view")}
                    <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openContact(record)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ocean-950 px-4 py-2.5 text-[11.5px] font-extrabold text-white transition hover:bg-ocean-900"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {t("prof.card.contact")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-5 flex items-start gap-1.5 text-[10.5px] leading-5 text-sand-500">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-gold-500" />
          {t("prof.disclaimer")}
        </p>
      </section>

      {/* ====================== JOIN BAND ====================== */}
      <section className="mx-auto w-full max-w-[1180px] px-4 pb-14 sm:px-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-ocean-900/10 bg-[linear-gradient(140deg,#141a33_0%,#242e5c_100%)] p-5 text-white shadow-[0_30px_80px_-60px_rgba(20,26,51,0.9)] sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-gold-300">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[14px] font-black">{t("prof.join.title")}</p>
              <p className="mt-1 max-w-xl text-[11.5px] leading-6 text-white/70">
                {t("prof.join.desc")}
              </p>
              <p className="mt-1.5 text-[10.5px] font-bold text-gold-200/80">
                {t("prof.join.note")}
              </p>
            </div>
          </div>
          <Link
            href={`/join?role=${kind}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[11.5px] font-black text-ocean-950 transition hover:-translate-y-0.5"
          >
            {t("prof.join.cta")}
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      {/* ====================== CONTACT MODAL ====================== */}
      {contactTarget && (
        <div
          className="fixed inset-0 z-[85] flex items-start justify-center overflow-y-auto bg-ocean-950/70 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={t("prof.contact.title")}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeAll();
          }}
        >
          <div className="my-4 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-3 border-b border-sand-200 bg-sand-50/70 px-5 py-4">
              <div>
                <p className="text-[13px] font-black text-ocean-900">
                  {t("prof.contact.title")}
                </p>
                <p className="mt-0.5 text-[10.5px] font-semibold text-sand-600">
                  {contactTarget.companyAr || contactTarget.nameAr}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAll}
                className="rounded-lg border border-sand-200 bg-white p-1.5 text-sand-600 transition hover:text-ocean-900"
                aria-label={t("prof.modal.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {requestSent ? (
              <div className="p-6 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-6 w-6" strokeWidth={3} />
                </span>
                <p className="mt-3 text-[13px] font-black text-emerald-800">
                  {t("prof.contact.success")}
                </p>
                <button
                  type="button"
                  onClick={closeAll}
                  className="mt-4 rounded-xl border border-sand-200 bg-white px-5 py-2.5 text-[11.5px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
                >
                  {t("prof.modal.close")}
                </button>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="space-y-3 p-5">
                <p className="text-[11px] leading-6 text-sand-700">
                  {t("prof.contact.desc")}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={LABEL}>{t("prof.contact.name")}</span>
                    <input
                      value={requestName}
                      onChange={(event) => setRequestName(event.target.value)}
                      className={FIELD}
                    />
                  </label>
                  <label className="block">
                    <span className={LABEL}>{t("prof.contact.phone")}</span>
                    <input
                      value={requestPhone}
                      onChange={(event) => setRequestPhone(event.target.value)}
                      inputMode="tel"
                      dir="ltr"
                      placeholder="01xxxxxxxxx"
                      className={FIELD}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className={LABEL}>{t("prof.contact.email")}</span>
                  <input
                    value={requestEmail}
                    onChange={(event) => setRequestEmail(event.target.value)}
                    type="email"
                    dir="ltr"
                    placeholder="name@example.com"
                    className={FIELD}
                  />
                </label>
                <label className="block">
                  <span className={LABEL}>{t("prof.contact.message")}</span>
                  <textarea
                    value={requestMessage}
                    onChange={(event) => setRequestMessage(event.target.value)}
                    rows={3}
                    className={FIELD}
                  />
                </label>
                {requestError && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
                    {requestError}
                  </p>
                )}
                <p className="flex items-start gap-1.5 text-[10px] leading-5 text-sand-500">
                  <Lock className="mt-0.5 h-3 w-3 shrink-0 text-gold-500" />
                  {t("prof.contact.privacy")}
                </p>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[12px] font-black text-ocean-950 transition hover:-translate-y-0.5"
                >
                  {t("prof.contact.submit")}
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
