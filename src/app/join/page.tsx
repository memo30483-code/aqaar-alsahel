"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  FileCheck2,
  Film,
  Lock,
  Scale,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { useActiveCities } from "@/lib/cities-store";
import { isValidReelUrl, toEmbedUrl } from "@/lib/embed";
import { readCompressedImage } from "@/lib/image-upload";
import {
  addProfessional,
  type ProfessionalDocument,
  type ProfessionalKind,
  type ProfessionalReel,
} from "@/lib/professionals-store";

const FIELD =
  "w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-ocean-900 outline-none transition placeholder:font-medium placeholder:text-sand-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60";
const LABEL = "mb-1.5 block text-[11px] font-extrabold text-sand-700";

const ROLES: {
  id: ProfessionalKind;
  labelKey: MessageKey;
  Icon: typeof Building2;
}[] = [
  { id: "developer", labelKey: "join.role.developer", Icon: Building2 },
  { id: "marketer", labelKey: "join.role.marketer", Icon: BadgeCheck },
  { id: "lawyer", labelKey: "join.role.lawyer", Icon: Scale },
];

interface DocDef {
  key: string;
  type: string;
  labelAr: string;
  labelEn: string;
  required: boolean;
}

const DOC_DEFS: Record<ProfessionalKind, DocDef[]> = {
  developer: [
    {
      key: "commercial_register",
      type: "commercial_register",
      labelAr: "السجل التجاري",
      labelEn: "Commercial register",
      required: true,
    },
    {
      key: "tax_card",
      type: "tax_card",
      labelAr: "البطاقة الضريبية",
      labelEn: "Tax card",
      required: true,
    },
    {
      key: "national_id",
      type: "national_id",
      labelAr: "بطاقة المسؤول",
      labelEn: "Responsible person ID",
      required: true,
    },
  ],
  marketer: [
    {
      key: "commercial_register",
      type: "commercial_register",
      labelAr: "السجل التجاري للمكتب",
      labelEn: "Office commercial register",
      required: true,
    },
    {
      key: "tax_card",
      type: "tax_card",
      labelAr: "البطاقة الضريبية",
      labelEn: "Tax card",
      required: false,
    },
    {
      key: "national_id",
      type: "national_id",
      labelAr: "بطاقة المسؤول",
      labelEn: "Responsible person ID",
      required: true,
    },
  ],
  lawyer: [
    {
      key: "bar_card",
      type: "bar_card",
      labelAr: "كارنيه المحاماة",
      labelEn: "Bar association card",
      required: true,
    },
    {
      key: "national_id",
      type: "national_id",
      labelAr: "بطاقة المحامي",
      labelEn: "Lawyer ID card",
      required: true,
    },
  ],
};

interface UploadedDoc {
  dataUrl: string;
  fileName: string;
}

function JoinForm() {
  const { t, locale } = useI18n();
  const ar = locale === "ar";
  const cities = useActiveCities();
  const searchParams = useSearchParams();

  const initialRole = searchParams.get("role");
  const [kind, setKind] = useState<ProfessionalKind>(
    initialRole === "marketer" || initialRole === "lawyer" ? initialRole : "developer"
  );

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [coverage, setCoverage] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [license, setLicense] = useState("");
  const [experience, setExperience] = useState("");
  const [projects, setProjects] = useState("");

  const [docs, setDocs] = useState<Record<string, UploadedDoc | undefined>>({});
  const [reels, setReels] = useState<{ id: string; title: string; url: string }[]>([]);
  const [reelTitle, setReelTitle] = useState("");
  const [reelUrl, setReelUrl] = useState("");
  const [reelError, setReelError] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const docDefs = DOC_DEFS[kind];

  useEffect(() => {
    /* عند تغيير نوع النشاط نُفرّغ مستندات النوع السابق */
    setDocs({});
    setReelError("");
  }, [kind]);

  const missing = useMemo(() => {
    if (!name.trim()) return true;
    if (kind !== "lawyer" && !company.trim()) return true;
    if (!phone.trim()) return true;
    return docDefs.some((def) => def.required && !docs[def.key]);
  }, [name, company, phone, kind, docDefs, docs]);

  const onUpload = async (def: DocDef, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const dataUrl = await readCompressedImage(file);
    setDocs((prev) => ({
      ...prev,
      [def.key]: { dataUrl, fileName: file.name },
    }));
  };

  const addReel = () => {
    if (!reelUrl.trim()) return;
    if (!isValidReelUrl(reelUrl)) {
      setReelError(t("join.reel.invalid"));
      return;
    }
    setReels((prev) => [
      ...prev,
      {
        id: `reel-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: reelTitle.trim() || (ar ? "فيديو تعريفي" : "Intro video"),
        url: reelUrl.trim(),
      },
    ]);
    setReelTitle("");
    setReelUrl("");
    setReelError("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (missing) {
      setError(t("join.error.required"));
      return;
    }
    if (!/^(20)?0?1[0125]\d{8}$/.test(phone.replace(/\D/g, ""))) {
      setError(t("join.error.phone"));
      return;
    }

    setSubmitting(true);
    setError("");

    const documents: ProfessionalDocument[] = docDefs
      .filter((def) => docs[def.key])
      .map((def) => {
        const upload = docs[def.key] as UploadedDoc;
        return {
          id: `doc-${def.key}-${Date.now()}`,
          type: def.type,
          label: ar ? def.labelAr : def.labelEn,
          fileName: upload.fileName,
          dataUrl: upload.dataUrl,
          uploadedAt: new Date().toISOString(),
        };
      });

    const reelRecords: ProfessionalReel[] = reels.map((reel, index) => ({
      id: reel.id,
      titleAr: reel.title,
      url: reel.url,
      platform: toEmbedUrl(reel.url)?.includes("instagram") ? "instagram" : "youtube",
      order: index + 1,
    }));

    const result = addProfessional({
      kind,
      nameAr: name,
      companyAr: kind === "lawyer" ? company || name : company,
      titleAr: title,
      cityAr: city,
      coverageAr: coverage,
      specialtiesAr: specialties,
      phone,
      email,
      bioAr: bio,
      licenseNumber: license,
      yearsExperience: experience ? Number(experience) : undefined,
      projectsCount: projects ? Number(projects) : undefined,
      documents,
      reels: reelRecords,
      status: "pending",
      verified: false,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    return (
      <div className="bg-sand-50">
        <section className="mx-auto w-full max-w-[820px] px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white">
              <Check className="h-7 w-7" strokeWidth={3} />
            </span>
            <h1 className="mt-4 text-[22px] font-black text-ocean-900">
              {t("join.success.title")}
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-[12px] leading-7 text-sand-700">
              {t("join.success.desc")}
            </p>
            <div className="mx-auto mt-5 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-start">
              <p className="flex items-start gap-2 text-[11px] font-bold leading-6 text-amber-800">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                {t("join.pendingNote")}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setDone(false);
                  setDocs({});
                  setReels([]);
                  setName("");
                  setCompany("");
                  setPhone("");
                  setEmail("");
                  setBio("");
                  setTitle("");
                  setCity("");
                  setCoverage("");
                  setSpecialties("");
                  setLicense("");
                  setExperience("");
                  setProjects("");
                }}
                className="rounded-xl border border-sand-200 bg-white px-5 py-2.5 text-[12px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
              >
                {t("join.success.again")}
              </button>
              <Link
                href="/"
                className="rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[12px] font-black text-ocean-950 transition hover:-translate-y-0.5"
              >
                {t("join.success.home")}
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-sand-50">
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#141a33_0%,#242e5c_58%,#141a33_100%)]">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.24),transparent_65%)]"
        />
        <div className="relative mx-auto w-full max-w-[1100px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-300">
            <span aria-hidden className="h-px w-6 bg-gold-400/70" />
            {t("join.eyebrow")}
          </p>
          <h1 className="mt-3 max-w-2xl text-[26px] font-black leading-[44px] text-white sm:text-[34px]">
            {t("join.title")}
          </h1>
          <p className="mt-3 max-w-2xl text-[12.5px] leading-8 text-white/70">
            {t("join.desc")}
          </p>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[1100px] gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form
          onSubmit={submit}
          className="min-w-0 space-y-5 rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6"
        >
          {/* نوع النشاط */}
          <div>
            <h2 className="text-[14px] font-black text-ocean-900">{t("join.role")}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {ROLES.map((role) => {
                const Icon = role.Icon;
                const active = kind === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setKind(role.id)}
                    className={`flex items-center gap-2 rounded-2xl border p-3 text-start text-[12px] font-bold transition ${
                      active
                        ? "border-gold-400/70 bg-[linear-gradient(135deg,#141a33,#2d3875)] text-white shadow"
                        : "border-sand-200 bg-white text-ocean-900 hover:border-gold-300 hover:bg-gold-50/40"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${active ? "text-gold-300" : "text-sand-400"}`}
                    />
                    {t(role.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* البيانات */}
          <div className="border-t border-sand-200 pt-5">
            <h2 className="text-[14px] font-black text-ocean-900">
              {t("join.section.basic")}
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className={LABEL}>{t("join.field.name")} *</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>
                  {kind === "lawyer" ? t("join.field.company") : `${t("join.field.company")} *`}
                </span>
                <input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>{t("join.field.title")}</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>{t("join.field.city")}</span>
                <select
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className={FIELD}
                >
                  <option value="">—</option>
                  {cities.map((item) => (
                    <option key={item.id} value={item.nameAr}>
                      {cityLabel(item.nameAr, t, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={LABEL}>{t("join.field.coverage")}</span>
                <input
                  value={coverage}
                  onChange={(event) => setCoverage(event.target.value)}
                  placeholder={t("join.field.coverageHint")}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>{t("join.field.specialties")}</span>
                <input
                  value={specialties}
                  onChange={(event) => setSpecialties(event.target.value)}
                  placeholder={t("join.field.specialtiesHint")}
                  className={FIELD}
                />
              </label>
              <label className="block">
                <span className={LABEL}>{t("join.field.phone")} *</span>
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
                <span className={LABEL}>{t("join.field.email")}</span>
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
                <span className={LABEL}>{t("join.field.license")}</span>
                <input
                  value={license}
                  onChange={(event) => setLicense(event.target.value)}
                  dir="ltr"
                  className={FIELD}
                />
              </label>
              {kind !== "lawyer" && (
                <>
                  <label className="block">
                    <span className={LABEL}>{t("join.field.experience")}</span>
                    <input
                      value={experience}
                      onChange={(event) =>
                        setExperience(event.target.value.replace(/[^0-9]/g, ""))
                      }
                      inputMode="numeric"
                      dir="ltr"
                      className={FIELD}
                    />
                  </label>
                  <label className="block">
                    <span className={LABEL}>{t("join.field.projects")}</span>
                    <input
                      value={projects}
                      onChange={(event) =>
                        setProjects(event.target.value.replace(/[^0-9]/g, ""))
                      }
                      inputMode="numeric"
                      dir="ltr"
                      className={FIELD}
                    />
                  </label>
                </>
              )}
              <label className="block sm:col-span-2">
                <span className={LABEL}>{t("join.field.bio")}</span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={3}
                  className={FIELD}
                />
              </label>
            </div>
          </div>

          {/* المستندات */}
          <div className="border-t border-sand-200 pt-5">
            <h2 className="flex items-center gap-2 text-[14px] font-black text-ocean-900">
              <FileCheck2 className="h-4 w-4 text-gold-600" />
              {t("join.section.docs")}
            </h2>
            <p className="mt-1 text-[10.5px] leading-5 text-sand-600">
              {t("join.doc.hint")}
            </p>
            <div className="mt-3 space-y-2.5">
              {docDefs.map((def) => {
                const upload = docs[def.key];
                return (
                  <div
                    key={def.key}
                    className={`flex flex-wrap items-center gap-3 rounded-2xl border-2 border-dashed p-3 ${
                      upload
                        ? "border-emerald-200 bg-emerald-50/40"
                        : "border-sand-300 bg-sand-50/60"
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-gold-600 shadow-sm">
                      <Upload className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-black text-ocean-900">
                        {ar ? def.labelAr : def.labelEn}
                        {def.required && <span className="text-gold-600"> *</span>}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-semibold text-sand-500">
                        {upload ? upload.fileName : t("join.doc.upload")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="cursor-pointer rounded-lg bg-ocean-950 px-3 py-1.5 text-[10.5px] font-bold text-white transition hover:bg-ocean-900">
                        {upload ? t("join.doc.replace") : t("join.doc.upload")}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => onUpload(def, event)}
                        />
                      </label>
                      {upload && (
                        <button
                          type="button"
                          onClick={() =>
                            setDocs((prev) => ({ ...prev, [def.key]: undefined }))
                          }
                          className="rounded-lg border border-rose-200 bg-white p-1.5 text-rose-600 transition hover:bg-rose-50"
                          aria-label={t("join.doc.remove")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* الريلز */}
          <div className="border-t border-sand-200 pt-5">
            <h2 className="flex items-center gap-2 text-[14px] font-black text-ocean-900">
              <Film className="h-4 w-4 text-gold-600" />
              {t("join.section.reels")}
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <input
                value={reelTitle}
                onChange={(event) => setReelTitle(event.target.value)}
                placeholder={t("join.reel.title")}
                className={FIELD}
              />
              <input
                value={reelUrl}
                onChange={(event) => setReelUrl(event.target.value)}
                placeholder={t("join.reel.url")}
                dir="ltr"
                className={FIELD}
              />
              <button
                type="button"
                onClick={addReel}
                className="rounded-xl border border-gold-300 bg-gold-50 px-4 py-2 text-[11px] font-black text-gold-700 transition hover:bg-gold-100"
              >
                {t("join.reel.add")}
              </button>
            </div>
            {reelError && (
              <p className="mt-2 text-[10.5px] font-bold text-rose-600">{reelError}</p>
            )}
            {reels.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {reels.map((reel) => (
                  <li
                    key={reel.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-sand-200 bg-sand-50/60 px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-bold text-ocean-900">
                        {reel.title}
                      </span>
                      <span
                        className="block truncate text-[9.5px] text-sand-500"
                        dir="ltr"
                      >
                        {reel.url}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setReels((prev) => prev.filter((item) => item.id !== reel.id))
                      }
                      className="shrink-0 rounded-lg border border-rose-200 bg-white p-1.5 text-rose-600 transition hover:bg-rose-50"
                      aria-label={t("join.reel.remove")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
              {error}
            </p>
          )}

          <div className="border-t border-sand-200 pt-5">
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[13px] font-black transition sm:w-auto ${
                submitting
                  ? "cursor-not-allowed bg-sand-200 text-sand-500"
                  : "bg-gradient-to-l from-gold-500 to-gold-400 text-ocean-950 shadow-[0_18px_38px_-24px_rgba(201,146,42,0.95)] hover:-translate-y-0.5"
              }`}
            >
              {submitting ? t("join.submitting") : t("join.submit")}
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            <p className="mt-2.5 flex items-start gap-1.5 text-[10px] font-medium leading-5 text-sand-600">
              <Lock className="mt-0.5 h-3 w-3 shrink-0 text-gold-600" />
              {t("join.privacy")}
            </p>
          </div>
        </form>

        {/* العمود الجانبي */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-3xl border border-gold-300/60 bg-[linear-gradient(135deg,rgba(201,146,42,0.12),rgba(255,255,255,0.92)_55%)] p-5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-gold-600 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[12.5px] font-black text-ocean-900">
              {t("join.pendingNote")}
            </p>
            <p className="mt-1.5 text-[11px] leading-6 text-sand-700">
              {t("prof.trust.1.text")}
            </p>
          </section>

          <section className="rounded-3xl border border-sand-200 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-600">
              {t("prof.join.eyebrow")}
            </p>
            <ul className="mt-2.5 space-y-2 text-[11px] leading-6 text-sand-700">
              <li className="flex items-start gap-2">
                <Check className="mt-1 h-3 w-3 shrink-0 text-emerald-600" />
                {t("prof.trust.0.text")}
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-1 h-3 w-3 shrink-0 text-emerald-600" />
                {t("prof.trust.2.text")}
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-1 h-3 w-3 shrink-0 text-emerald-600" />
                {t("prof.join.note")}
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-sand-50" />}>
      <JoinForm />
    </Suspense>
  );
}
