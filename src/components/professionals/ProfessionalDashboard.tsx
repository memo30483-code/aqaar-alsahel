"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BadgeCheck,
  BellRing,
  Briefcase,
  Building2,
  Check,
  Eye,
  Film,
  ImagePlus,
  Lock,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { useActiveCities } from "@/lib/cities-store";
import { isValidReelUrl } from "@/lib/embed";
import {
  PROJECT_TYPES,
  resolveProjectTypeId,
  type ProjectTypeId,
} from "@/lib/projects-taxonomy";
import { readCompressedImage } from "@/lib/image-upload";
import { getSession, hasAdminAccess, type Session } from "@/lib/session";
import {
  addProfessionalProject,
  addProfessionalReel,
  MAX_PROJECTS_PER_PROFESSIONAL,
  PROFESSIONAL_KIND_META,
  PROJECT_STATUS_META,
  removeProfessionalProject,
  removeProfessionalReel,
  setProfessionalProjectStatus,
  updateProfessional,
  updateProfessionalProject,
  useProfessionalsState,
  professionalOwnedBySession,
  type ProfessionalProject,
  type ProfessionalProjectInput,
  type ProfessionalRecord,
  type ProjectEvent,
} from "@/lib/professionals-store";

const FIELD =
  "w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-ocean-900 outline-none transition placeholder:font-medium placeholder:text-sand-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60";
const LABEL = "mb-1.5 block text-[11px] font-extrabold text-sand-700";
const CARD =
  "rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]";
const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 px-4 py-2.5 text-[11.5px] font-black text-ocean-950 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60";
const BTN_GHOST =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-[11.5px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60";

/** تسميات أحداث المشروع في الخط الزمني */
const EVENT_LABEL: Record<ProjectEvent["action"], string> = {
  created: "إنشاء",
  edited: "تعديل",
  draft: "حفظ كمسودة",
  submitted: "إرسال للمراجعة",
  approved: "اعتماد",
  rejected: "رفض",
  archived: "أرشفة",
  featured: "تمييز",
  unfeatured: "إلغاء تمييز",
};

type Tab = "profile" | "projects" | "reels";

export default function ProfessionalDashboard() {
  const { t, locale } = useI18n();
  const ar = locale === "ar";
  const { records, ready: recordsReady } = useProfessionalsState();
  const [session, setSession] = useState<Session | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");
  const [adminSelectedId, setAdminSelectedId] = useState("");

  useEffect(() => {
    setSession(getSession());
    setMounted(true);
  }, []);

  const isAdmin = hasAdminAccess(session);

  const professional = useMemo(() => {
    if (!session) return null;
    if (isAdmin) {
      return (
        records.find((record) => record.id === adminSelectedId) ??
        records[0] ??
        null
      );
    }
    /* الملكية تُحدَّد برمز الجلسة، لا بالبريد — منعاً لانتحال ملف أي مهني */
    return records.find((record) => professionalOwnedBySession(record, session)) ?? null;
  }, [records, session, isAdmin, adminSelectedId]);

  if (!mounted || !recordsReady) {
    return (
      <div className="grid min-h-[50vh] place-items-center bg-sand-50">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-gold-300 border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <EmptyState
        icon={<Lock className="h-6 w-6" />}
        title={t("prof.dash.notProfessionalTitle")}
        desc={t("prof.dash.notProfessionalDesc")}
      >
        <Link href="/login?redirect=%2Fprofessional" className={BTN_PRIMARY}>
          {t("prof.dash.login")}
        </Link>
        <Link href="/join" className={BTN_GHOST}>
          {t("prof.dash.join")}
        </Link>
      </EmptyState>
    );
  }

  if (!professional) {
    return (
      <EmptyState
        icon={<Building2 className="h-6 w-6" />}
        title={t("prof.dash.notProfessionalTitle")}
        desc={t("prof.dash.notProfessionalDesc")}
      >
        <Link href="/join" className={BTN_PRIMARY}>
          {t("prof.dash.join")}
        </Link>
      </EmptyState>
    );
  }

  const kind = professional.kind;
  const meta = PROFESSIONAL_KIND_META[kind];
  const isLawyer = kind === "lawyer";
  /* تبويب المشاريع غير متاح للمحامي — نعرض الملف بدل شاشة فارغة */
  const visibleTab: Tab = isLawyer && tab === "projects" ? "profile" : tab;
  const publicHref = `${meta.path}/${professional.id}`;

  return (
    <div className="bg-sand-50">
      <section className="relative overflow-hidden theme-hero">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.24),transparent_65%)]"
        />
        <div className="relative mx-auto w-full max-w-[1180px] px-4 py-9 sm:px-6">
          <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-300">
            <span aria-hidden className="h-px w-6 bg-gold-400/70" />
            {t("prof.dash.title")}
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[24px] font-black text-white sm:text-[30px]">
                {t("prof.dash.welcome", {
                  name: professional.companyAr || professional.nameAr,
                })}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[9.5px] font-bold text-white/70">
                  {ar ? meta.labelAr : meta.labelEn}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold ${
                    professional.status === "approved"
                      ? "border border-emerald-300/40 bg-emerald-400/15 text-emerald-200"
                      : "border border-amber-300/40 bg-amber-400/15 text-amber-200"
                  }`}
                >
                  {professional.status === "approved"
                    ? t("prof.card.verified")
                    : t("prof.dash.notApproved")}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <label className="min-w-[220px]">
                  <span className="mb-1 block text-[10px] font-bold text-white/60">
                    {t("prof.dash.adminHint")}
                  </span>
                  <select
                    value={professional.id}
                    onChange={(event) => setAdminSelectedId(event.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-bold text-white outline-none"
                  >
                    {records.map((record) => (
                      <option
                        key={record.id}
                        value={record.id}
                        className="text-ocean-900"
                      >
                        {record.companyAr || record.nameAr} —{" "}
                        {PROFESSIONAL_KIND_META[record.kind].singularAr}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {professional.status === "approved" && (
                <Link
                  href={publicHref}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-[10.5px] font-bold text-white transition hover:bg-white/15"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {t("prof.dash.viewPublic")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-sand-200 bg-white p-1.5">
          {(
            [
              { id: "profile", label: t("prof.dash.tab.profile"), Icon: Building2 },
              ...(isLawyer
                ? []
                : [
                    {
                      id: "projects" as const,
                      label: t("prof.dash.tab.projects"),
                      Icon: Briefcase,
                    },
                  ]),
              { id: "reels", label: t("prof.dash.tab.reels"), Icon: Film },
            ] as { id: Tab; label: string; Icon: typeof Building2 }[]
          ).map((item) => {
            const active = visibleTab === item.id;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11.5px] font-extrabold transition ${
                  active
                    ? "bg-ocean-950 text-white"
                    : "text-ocean-700 hover:bg-sand-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {professional.status !== "approved" && (
          <p className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] font-bold leading-6 text-amber-800">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            {t("prof.dash.notApproved")}
          </p>
        )}

        <div className="mt-4">
          {visibleTab === "profile" && (
            <ProfileEditor
              key={`${professional.id}-profile`}
              record={professional}
              isLawyer={isLawyer}
              t={t}
              locale={locale}
            />
          )}
          {visibleTab === "projects" && !isLawyer && (
            <ProjectsManager
              key={`${professional.id}-projects`}
              record={professional}
              t={t}
              locale={locale}
            />
          )}
          {visibleTab === "reels" && (
            <ReelsManager
              key={`${professional.id}-reels`}
              record={professional}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  desc,
  children,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-sand-50">
      <section className="mx-auto w-full max-w-[720px] px-4 py-20 text-center sm:px-6">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-gold-600 shadow-sm">
          {icon}
        </span>
        <h1 className="mt-4 text-[22px] font-black text-ocean-900">{title}</h1>
        <p className="mx-auto mt-2 max-w-md text-[12px] leading-7 text-sand-600">
          {desc}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>
      </section>
    </div>
  );
}

function ImageField({
  label,
  value,
  onChange,
  t,
  rounded = "rounded-2xl",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  t: ReturnType<typeof useI18n>["t"];
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setFailed(false);
    try {
      const dataUrl = await readCompressedImage(file);
      onChange(dataUrl);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className={LABEL}>{label}</span>
      {failed && (
        <p className="mb-1 text-[10px] font-bold text-rose-600">
          تعذّرت قراءة الصورة — جرّب صورة أخرى (JPG أو PNG).
        </p>
      )}
      <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-sand-300 bg-sand-50/60 p-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className={`h-14 w-14 shrink-0 border border-sand-200 bg-white object-cover ${rounded}`}
          />
        ) : (
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-gold-600 shadow-sm">
            <ImagePlus className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-sand-500">
            {t("join.field.imageHint")}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <label className="cursor-pointer rounded-lg bg-ocean-950 px-3 py-1.5 text-[10.5px] font-bold text-white transition hover:bg-ocean-900">
              {value ? t("prof.dash.replace") : t("prof.dash.upload")}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={pick}
              />
            </label>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-lg border border-rose-200 bg-white p-1.5 text-rose-600 transition hover:bg-rose-50"
                aria-label={t("prof.dash.remove")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileEditor({
  record,
  isLawyer,
  t,
  locale,
}: {
  record: ProfessionalRecord;
  isLawyer: boolean;
  t: ReturnType<typeof useI18n>["t"];
  locale: "ar" | "en";
}) {
  const cities = useActiveCities();
  const [company, setCompany] = useState(record.companyAr ?? "");
  const [name, setName] = useState(record.nameAr);
  const [title, setTitle] = useState(record.titleAr ?? "");
  const [city, setCity] = useState(record.cityAr ?? "");
  const [coverage, setCoverage] = useState((record.coverageAr ?? []).join("، "));
  const [specialties, setSpecialties] = useState(
    (record.specialtiesAr ?? []).join("، ")
  );
  const [bio, setBio] = useState(record.bioAr ?? "");
  const [website, setWebsite] = useState(record.website ?? "");
  const [logo, setLogo] = useState(record.logoUrl ?? "");
  const [photo, setPhoto] = useState(record.photoUrl ?? "");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(t("join.error.required"));
      return;
    }
    const result = updateProfessional(record.id, {
      nameAr: name,
      companyAr: company,
      titleAr: title,
      cityAr: city,
      coverageAr: coverage,
      specialtiesAr: specialties,
      bioAr: bio,
      website,
      logoUrl: logo,
      photoUrl: photo,
    });
    if (!result.ok) {
      setError(result.error);
      setNotice("");
      return;
    }
    setError("");
    setNotice(t("prof.dash.saved"));
  };

  return (
    <form onSubmit={save} className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[14px] font-black text-ocean-900">
          <Pencil className="h-4 w-4 text-gold-600" />
          {t("prof.dash.tab.profile")}
        </h2>
        {record.verified && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9.5px] font-extrabold text-emerald-700">
            <BadgeCheck className="h-3 w-3" />
            {t("prof.card.verified")}
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <ImageField
          label={t("prof.dash.logo")}
          value={logo}
          onChange={setLogo}
          t={t}
        />
        {isLawyer && (
          <ImageField
            label={t("prof.dash.photo")}
            value={photo}
            onChange={setPhoto}
            t={t}
            rounded="rounded-full"
          />
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>{t("join.field.name")} *</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className={LABEL}>{t("join.field.company")}</span>
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
        <label className="block sm:col-span-2">
          <span className={LABEL}>{t("join.field.bio")}</span>
          <textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={3}
            className={FIELD}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>{t("join.field.email")}</span>
          <input
            value={record.email ?? ""}
            readOnly
            dir="ltr"
            className={`${FIELD} cursor-not-allowed bg-sand-50 text-sand-500`}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>{t("join.field.website")}</span>
          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            dir="ltr"
            placeholder="https://"
            className={FIELD}
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-3 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          {notice}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="submit" className={BTN_PRIMARY}>
          {t("prof.dash.save")}
        </button>
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-sand-500">
          <Lock className="h-3 w-3 text-gold-500" />
          {t("prof.profile.contactNote")}
        </p>
      </div>
    </form>
  );
}

function ProjectsManager({
  record,
  t,
  locale,
}: {
  record: ProfessionalRecord;
  t: ReturnType<typeof useI18n>["t"];
  locale: "ar" | "en";
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProfessionalProject | null>(null);
  const [notice, setNotice] = useState("");

  const startAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const startEdit = (project: ProfessionalProject) => {
    setEditing(project);
    setOpen(true);
  };

  /** إرسال مسودة/مرفوض للمراجعة من جديد */
  const sendForReview = (project: ProfessionalProject) => {
    setProfessionalProjectStatus(record.id, project.id, "pending");
    setNotice(t("prof.dash.projectSent"));
  };

  const remove = (project: ProfessionalProject) => {
    if (!window.confirm(t("prof.dash.deleteConfirm"))) return;
    removeProfessionalProject(record.id, project.id);
    setNotice(t("prof.dash.projectDeleted"));
  };

  const reviewUpdates = useMemo(() => {
    const items: { project: ProfessionalProject; event: ProjectEvent }[] = [];
    for (const project of record.projects) {
      const reviews = (project.history ?? []).filter(
        (event) => event.action === "approved" || event.action === "rejected"
      );
      const last = reviews[reviews.length - 1];
      if (last) items.push({ project, event: last });
    }
    return items.sort((a, b) => b.event.at.localeCompare(a.event.at)).slice(0, 4);
  }, [record.projects]);

  const atLimit = record.projects.length >= MAX_PROJECTS_PER_PROFESSIONAL;

  return (
    <div className="space-y-4">
      <div className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-[14px] font-black text-ocean-900">
            <Briefcase className="h-4 w-4 text-gold-600" />
            {t("prof.dash.tab.projects")}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-sand-200 bg-sand-50 px-2.5 py-1 text-[10px] font-bold text-sand-600">
              {t("prof.dash.limit", {
                count: record.projects.length,
                max: MAX_PROJECTS_PER_PROFESSIONAL,
              })}
            </span>
            <button
              type="button"
              onClick={startAdd}
              className={BTN_PRIMARY}
              disabled={atLimit}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("prof.dash.addProject")}
            </button>
          </div>
        </div>
        <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-5 text-sand-500">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-gold-500" />
          {t("prof.dash.pendingNote")}
        </p>
        {notice && (
          <p className="mt-2 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            {notice}
          </p>
        )}
      </div>

      {reviewUpdates.length > 0 && (
        <div className="rounded-3xl border border-gold-200 bg-gold-50/60 p-4">
          <h3 className="flex items-center gap-1.5 text-[12px] font-black text-ocean-900">
            <BellRing className="h-3.5 w-3.5 text-gold-600" />
            {t("prof.dash.reviewResults")}
          </h3>
          <ul className="mt-2.5 space-y-1.5">
            {reviewUpdates.map(({ project, event }) => (
              <li
                key={`${project.id}-${event.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold-200/70 bg-white px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                      event.action === "approved"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {event.action === "approved" ? "اعتُمد" : "رُفض"}
                  </span>
                  <span className="truncate text-[11px] font-bold text-ocean-900">
                    {project.titleAr}
                  </span>
                  {event.note && (
                    <span className="truncate text-[10px] font-semibold text-sand-600">
                      — {event.note}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[9.5px] font-semibold text-sand-500">
                  {new Date(event.at).toLocaleDateString("ar-EG")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open && (
        <ProjectForm
          key={editing?.id ?? "new"}
          recordId={record.id}
          initial={editing}
          t={t}
          locale={locale}
          onDone={(message) => {
            setOpen(false);
            setEditing(null);
            setNotice(message);
          }}
          onCancel={() => {
            setOpen(false);
            setEditing(null);
          }}
        />
      )}

      {record.projects.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-sand-300 bg-white px-4 py-10 text-center text-[11.5px] font-semibold text-sand-500">
          {t("prof.dash.noProjects")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...record.projects]
            .sort((a, b) => a.order - b.order)
            .map((project) => {
              const status = PROJECT_STATUS_META[project.status];
              return (
                <article key={project.id} className={CARD}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[12.5px] font-black text-ocean-900">
                      {project.titleAr}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${status.className}`}
                    >
                      {locale === "ar" ? status.labelAr : status.labelEn}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-sand-500">
                    {project.cityAr || "—"}
                    {project.typeAr ? ` · ${project.typeAr}` : ""}
                  </p>
                  {project.descriptionAr && (
                    <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-5 text-sand-700">
                      {project.descriptionAr}
                    </p>
                  )}
                  {project.status === "rejected" && project.reviewNote && (
                    <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-700">
                      {t("prof.dash.reviewNote")}: {project.reviewNote}
                    </p>
                  )}

                  {(project.history?.length ?? 0) > 0 && (
                    <details className="mt-2 rounded-xl border border-sand-200 bg-sand-50/60 px-2.5 py-1.5">
                      <summary className="cursor-pointer text-[10px] font-bold text-sand-700">
                        {t("prof.dash.timeline")} ({project.history?.length})
                      </summary>
                      <ul className="mt-1.5 space-y-1">
                        {[...(project.history ?? [])]
                          .slice(-6)
                          .reverse()
                          .map((event) => (
                            <li
                              key={event.id}
                              className="flex items-center justify-between gap-2 text-[9.5px] font-semibold text-sand-600"
                            >
                              <span className="truncate">
                                {EVENT_LABEL[event.action]}
                                {event.note ? ` — ${event.note}` : ""}
                                {event.by ? ` · ${event.by}` : ""}
                              </span>
                              <span className="shrink-0">
                                {new Date(event.at).toLocaleDateString("ar-EG")}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </details>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {(project.status === "draft" || project.status === "rejected") && (
                      <button
                        type="button"
                        onClick={() => sendForReview(project)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-bold text-amber-700 transition hover:bg-amber-100"
                      >
                        {t("prof.dash.sendForReview")}
                      </button>
                    )}
                    {project.status === "approved" && (
                      <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        {t("prof.project.details")}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(project)}
                      className="inline-flex items-center gap-1 rounded-lg border border-sand-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-ocean-800 transition hover:border-gold-300"
                    >
                      <Pencil className="h-3 w-3" />
                      {t("prof.dash.editProject")}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(project)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      {t("prof.dash.deleteProject")}
                    </button>
                  </div>
                </article>
              );
            })}
        </div>
      )}
    </div>
  );
}

function ProjectForm({
  recordId,
  initial,
  t,
  locale,
  onDone,
  onCancel,
}: {
  recordId: string;
  initial: ProfessionalProject | null;
  t: ReturnType<typeof useI18n>["t"];
  locale: "ar" | "en";
  onDone: (message: string) => void;
  onCancel: () => void;
}) {
  const cities = useActiveCities();
  const [title, setTitle] = useState(initial?.titleAr ?? "");
  const [description, setDescription] = useState(initial?.descriptionAr ?? "");
  const [city, setCity] = useState(initial?.cityAr ?? "");
  const [typeId, setTypeId] = useState<ProjectTypeId | "">(
    initial?.typeId ?? resolveProjectTypeId(initial?.typeAr) ?? ""
  );
  const [purpose, setPurpose] = useState<ProfessionalProjectInput["purpose"]>(
    initial?.purpose ?? "sale"
  );
  const [price, setPrice] = useState(initial?.priceFrom ?? "");
  const [delivery, setDelivery] = useState(initial?.deliveryAr ?? "");
  const [area, setArea] = useState(initial?.areaFrom ?? "");
  const [units, setUnits] = useState(
    typeof initial?.unitsCount === "number" ? String(initial.unitsCount) : ""
  );
  const [cover, setCover] = useState(initial?.coverUrl ?? "");
  const [gallery, setGallery] = useState((initial?.gallery ?? []).join("\n"));
  const [video, setVideo] = useState(initial?.videoUrl ?? "");
  const [features, setFeatures] = useState((initial?.featuresAr ?? []).join("، "));
  const [paymentPlan, setPaymentPlan] = useState(initial?.paymentPlanAr ?? "");
  const [error, setError] = useState("");

  const persist = (asDraft: boolean) => {
    if (!title.trim()) {
      setError(t("join.error.required"));
      return;
    }
    if (video.trim() && !isValidReelUrl(video)) {
      setError(t("join.reel.invalid"));
      return;
    }
    const input: ProfessionalProjectInput = {
      titleAr: title,
      descriptionAr: description,
      cityAr: city,
      typeId: typeId || undefined,
      purpose,
      priceFrom: price,
      deliveryAr: delivery,
      areaFrom: area,
      unitsCount: units ? Number(units) : undefined,
      coverUrl: cover,
      gallery: gallery
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean),
      videoUrl: video.trim() || undefined,
      featuresAr: features
        .split(/[،,]/)
        .map((item) => item.trim())
        .filter(Boolean),
      paymentPlanAr: paymentPlan.trim() || undefined,
    };
    const result = initial
      ? updateProfessionalProject(recordId, initial.id, input, { asDraft })
      : addProfessionalProject(recordId, input, { asDraft });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDone(asDraft ? t("prof.dash.draftSaved") : t("prof.dash.projectSent"));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    persist(false);
  };

  return (
    <form onSubmit={submit} className={CARD}>
      <h3 className="text-[13px] font-black text-ocean-900">
        {initial ? t("prof.dash.editProject") : t("prof.dash.addProject")}
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={LABEL}>{t("prof.dash.projectTitle")} *</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>{t("prof.dash.projectDesc")}</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className={LABEL}>{t("prof.dash.projectCity")}</span>
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
          <span className={LABEL}>{t("prof.dash.projectType")}</span>
          <select
            value={typeId}
            onChange={(event) => setTypeId(event.target.value as ProjectTypeId | "")}
            className={FIELD}
          >
            <option value="">—</option>
            {PROJECT_TYPES.map((item) => (
              <option key={item.id} value={item.id}>
                {locale === "en" ? item.en : item.ar}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={LABEL}>{t("prof.dash.projectPurpose")}</span>
          <select
            value={purpose ?? "sale"}
            onChange={(event) =>
              setPurpose(event.target.value as ProfessionalProjectInput["purpose"])
            }
            className={FIELD}
          >
            <option value="sale">{t("prof.profile.purpose.sale")}</option>
            <option value="rent">{t("prof.profile.purpose.rent")}</option>
            <option value="marketing">
              {t("prof.profile.purpose.marketing")}
            </option>
            <option value="project">{t("prof.profile.purpose.project")}</option>
          </select>
        </label>
        <label className="block">
          <span className={LABEL}>{t("prof.dash.projectPrice")}</span>
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className={LABEL}>{t("prof.dash.projectDelivery")}</span>
          <input
            value={delivery}
            onChange={(event) => setDelivery(event.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className={LABEL}>{t("prof.dash.projectArea")}</span>
          <input
            value={area}
            onChange={(event) => setArea(event.target.value)}
            inputMode="numeric"
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className={LABEL}>{t("prof.dash.projectUnits")}</span>
          <input
            value={units}
            onChange={(event) =>
              setUnits(event.target.value.replace(/[^0-9]/g, ""))
            }
            inputMode="numeric"
            className={FIELD}
          />
        </label>
        <div className="sm:col-span-2">
          <ImageField
            label={t("prof.dash.projectCover")}
            value={cover}
            onChange={setCover}
            t={t}
          />
        </div>
        <label className="block sm:col-span-2">
          <span className={LABEL}>
            {t("prof.project.gallery")} — {t("prof.dash.galleryHint")}
          </span>
          <textarea
            value={gallery}
            onChange={(event) => setGallery(event.target.value)}
            rows={3}
            className={`${FIELD} font-mono text-[10.5px]`}
            dir="ltr"
            placeholder={"https://…\nhttps://…"}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>{t("prof.project.video")} — {t("prof.dash.videoHint")}</span>
          <input
            value={video}
            onChange={(event) => setVideo(event.target.value)}
            className={`${FIELD} text-[11px]`}
            dir="ltr"
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>{t("prof.project.features")} — {t("prof.dash.featuresHint")}</span>
          <input
            value={features}
            onChange={(event) => setFeatures(event.target.value)}
            className={FIELD}
            placeholder="مسبح، جيم، أمن 24 ساعة"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>{t("prof.project.paymentPlan")}</span>
          <input
            value={paymentPlan}
            onChange={(event) => setPaymentPlan(event.target.value)}
            className={FIELD}
            placeholder="20% مقدم وتقسيط حتى 7 سنوات"
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="submit" className={BTN_PRIMARY}>
          {initial ? t("prof.dash.saveProject") : t("prof.dash.submitProject")}
        </button>
        <button type="button" onClick={() => persist(true)} className={BTN_GHOST}>
          {t("prof.dash.saveDraft")}
        </button>
        <button type="button" onClick={onCancel} className={BTN_GHOST}>
          {t("prof.dash.cancel")}
        </button>
      </div>
    </form>
  );
}

function ReelsManager({
  record,
  t,
}: {
  record: ProfessionalRecord;
  t: ReturnType<typeof useI18n>["t"];
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const add = () => {
    if (!url.trim()) return;
    if (!isValidReelUrl(url)) {
      setError(t("join.reel.invalid"));
      return;
    }
    const result = addProfessionalReel(record.id, { titleAr: title, url });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setTitle("");
    setUrl("");
    setError("");
    setNotice(t("prof.dash.reelAdded"));
  };

  const remove = (reelId: string) => {
    if (!window.confirm(t("prof.dash.deleteConfirm"))) return;
    removeProfessionalReel(record.id, reelId);
    setNotice(t("prof.dash.reelDeleted"));
  };

  return (
    <div className={CARD}>
      <h2 className="flex items-center gap-2 text-[14px] font-black text-ocean-900">
        <Film className="h-4 w-4 text-gold-600" />
        {t("prof.dash.tab.reels")}
      </h2>
      <p className="mt-1.5 text-[10.5px] leading-6 text-sand-600">
        {t("prof.dash.reelsHint")}
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("prof.dash.reelTitle")}
          className={FIELD}
        />
        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder={t("prof.dash.reelUrl")}
          dir="ltr"
          className={FIELD}
        />
        <button type="button" onClick={add} className={BTN_PRIMARY}>
          <Plus className="h-3.5 w-3.5" />
          {t("prof.dash.addReel")}
        </button>
      </div>

      {error && (
        <p className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
          {error}
        </p>
      )}
      {notice && (
        <p className="mt-2 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">
          <Check className="h-3.5 w-3.5" />
          {notice}
        </p>
      )}

      {record.reels.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 px-4 py-6 text-center text-[11px] font-semibold text-sand-500">
          {t("prof.profile.reelsEmpty")}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {record.reels.map((reel) => (
            <li
              key={reel.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-sand-200 bg-sand-50/60 px-3 py-2.5"
            >
              <span className="min-w-0">
                <span className="block text-[11.5px] font-black text-ocean-900">
                  {reel.titleAr}
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
                onClick={() => remove(reel.id)}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 className="h-3 w-3" />
                {t("prof.dash.remove")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
