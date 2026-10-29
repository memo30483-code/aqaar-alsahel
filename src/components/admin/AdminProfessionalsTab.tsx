"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Star,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import {
  addProfessionalReel,
  moveProfessional,
  PROJECT_STATUS_META,
  removeProfessional,
  removeProfessionalProject,
  removeProfessionalReel,
  removeProfessionalRequest,
  setProfessionalProjectStatus,
  setProfessionalPublishPolicy,
  setProfessionalRequestStatus,
  setProfessionalStatus,
  setProfessionalVerified,
  toggleProfessionalFeatured,
  updateProfessional,
  useProfessionalRequests,
  useProfessionals,
  PROFESSIONAL_KIND_META,
  STATUS_META,
  type ProfessionalKind,
  type ProfessionalProject,
  type ProfessionalRecord,
} from "@/lib/professionals-store";
import { addAdminLog } from "@/lib/admin-system";
import { getSession } from "@/lib/session";
import { toEmbedUrl } from "@/lib/embed";
import {
  BTN_PRIMARY,
  Field,
  INPUT,
  Panel,
  ROW_ACTION,
} from "@/components/admin/shared";

interface Props {
  can: (key: string) => boolean;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

type ViewKey = ProfessionalKind | "requests";

const VIEWS: { key: ViewKey; label: string; Icon: typeof Building2 }[] = [
  { key: "developer", label: "المطورون", Icon: Building2 },
  { key: "marketer", label: "المسوقون", Icon: Users },
  { key: "lawyer", label: "المحامون", Icon: Scale },
  { key: "requests", label: "طلبات التواصل", Icon: Phone },
];

interface EditorState {
  id: string;
  nameAr: string;
  companyAr: string;
  titleAr: string;
  cityAr: string;
  coverageAr: string;
  specialtiesAr: string;
  phone: string;
  email: string;
  website: string;
  bioAr: string;
  licenseNumber: string;
  yearsExperience: string;
  projectsCount: string;
}

function editorFrom(record: ProfessionalRecord): EditorState {
  return {
    id: record.id,
    nameAr: record.nameAr,
    companyAr: record.companyAr ?? "",
    titleAr: record.titleAr ?? "",
    cityAr: record.cityAr ?? "",
    coverageAr: (record.coverageAr ?? []).join("، "),
    specialtiesAr: (record.specialtiesAr ?? []).join("، "),
    phone: record.phone,
    email: record.email ?? "",
    website: record.website ?? "",
    bioAr: record.bioAr ?? "",
    licenseNumber: record.licenseNumber ?? "",
    yearsExperience:
      typeof record.yearsExperience === "number" ? String(record.yearsExperience) : "",
    projectsCount:
      typeof record.projectsCount === "number" ? String(record.projectsCount) : "",
  };
}

export default function AdminProfessionalsTab({ can, notify, reloadLogs }: Props) {
  const records = useProfessionals();
  const requests = useProfessionalRequests();
  const canManage = can("professionals.manage");

  const [view, setView] = useState<ViewKey>("developer");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [docsFor, setDocsFor] = useState<ProfessionalRecord | null>(null);
  const [reelsFor, setReelsFor] = useState<string | null>(null);
  const [projectsFor, setProjectsFor] = useState<string | null>(null);
  const [projectRejectId, setProjectRejectId] = useState<string | null>(null);
  const [projectRejectNote, setProjectRejectNote] = useState("");
  const [rejectFor, setRejectFor] = useState<ProfessionalRecord | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [deleteFor, setDeleteFor] = useState<ProfessionalRecord | null>(null);
  const [reelTitle, setReelTitle] = useState("");
  const [reelUrl, setReelUrl] = useState("");
  const [reelError, setReelError] = useState("");

  const session = typeof window !== "undefined" ? getSession() : null;

  const log = (
    action: string,
    details: string,
    meta?: Record<string, unknown>
  ) => {
    if (!session) return;
    addAdminLog({
      action,
      category: "professionals",
      performedBy: session.email,
      performedByName: session.name,
      performedByRole: session.role ?? "admin",
      details,
      meta,
    });
    reloadLogs();
  };

  const list = useMemo(() => {
    if (view === "requests") return [];
    const needle = query.trim().toLowerCase();
    return records
      .filter((record) => record.kind === view)
      .filter((record) => (statusFilter === "all" ? true : record.status === statusFilter))
      .filter((record) => {
        if (!needle) return true;
        return [record.nameAr, record.companyAr, record.phone, record.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => a.order - b.order);
  }, [records, view, query, statusFilter]);

  const pendingCount = records.filter((record) => record.status === "pending").length;
  const pendingProjectsCount = records.reduce(
    (sum, record) =>
      sum + record.projects.filter((project) => project.status === "pending").length,
    0
  );
  const newRequests = requests.filter((request) => request.status === "new").length;
  const reelsTarget = records.find((record) => record.id === reelsFor) ?? null;
  const projectsTarget = records.find((record) => record.id === projectsFor) ?? null;

  const counts = useMemo(() => {
    const base: Record<string, number> = {};
    records.forEach((record) => {
      base[record.kind] = (base[record.kind] ?? 0) + 1;
    });
    return base;
  }, [records]);

  const approve = (record: ProfessionalRecord) => {
    setProfessionalStatus(record.id, "approved");
    log("professional.approve", `تم اعتماد ${record.companyAr || record.nameAr}`, {
      id: record.id,
      kind: record.kind,
    });
    notify(`تم اعتماد «${record.companyAr || record.nameAr}» ونشره في الدليل`);
  };

  const reject = () => {
    if (!rejectFor) return;
    setProfessionalStatus(rejectFor.id, "rejected", rejectNote.trim() || undefined);
    log(
      "professional.reject",
      `تم رفض ${rejectFor.companyAr || rejectFor.nameAr}${rejectNote ? ` — ${rejectNote}` : ""}`,
      { id: rejectFor.id }
    );
    notify(`تم رفض «${rejectFor.companyAr || rejectFor.nameAr}»`);
    setRejectFor(null);
    setRejectNote("");
  };

  const archive = (record: ProfessionalRecord) => {
    setProfessionalStatus(record.id, "archived");
    log("professional.archive", `تم أرشفة ${record.companyAr || record.nameAr}`, {
      id: record.id,
    });
    notify(`تم أرشفة «${record.companyAr || record.nameAr}»`);
  };

  const restore = (record: ProfessionalRecord) => {
    setProfessionalStatus(record.id, "pending");
    log("professional.restore", `تمت إعادة ${record.companyAr || record.nameAr} للمراجعة`, {
      id: record.id,
    });
    notify(`أُعيد «${record.companyAr || record.nameAr}» إلى قائمة المراجعة`);
  };

  const confirmDelete = () => {
    if (!deleteFor) return;
    removeProfessional(deleteFor.id);
    log("professional.delete", `تم حذف ${deleteFor.companyAr || deleteFor.nameAr} نهائياً`, {
      id: deleteFor.id,
    });
    notify(`تم حذف «${deleteFor.companyAr || deleteFor.nameAr}» نهائياً`);
    setDeleteFor(null);
  };

  const toggleVerified = (record: ProfessionalRecord) => {
    setProfessionalVerified(record.id, !record.verified);
    log(
      "professional.verify",
      `${record.verified ? "سحب" : "منح"} شارة التوثيق لـ ${record.companyAr || record.nameAr}`,
      { id: record.id, verified: !record.verified }
    );
    notify(record.verified ? "تم سحب شارة التوثيق" : "تم منح شارة التوثيق");
  };

  const toggleFeatured = (record: ProfessionalRecord) => {
    toggleProfessionalFeatured(record.id);
    log(
      "professional.feature",
      `${record.featured ? "إلغاء تمييز" : "تمييز"} ${record.companyAr || record.nameAr}`,
      { id: record.id }
    );
    notify(record.featured ? "تم إلغاء التمييز" : "تم تمييز السجل");
  };

  /** السماح للمهني بالنشر المباشر أو إلزامه بمراجعة الإدارة */
  const togglePublishPolicy = (record: ProfessionalRecord) => {
    const next = record.publishPolicy === "auto" ? "review" : "auto";
    if (!setProfessionalPublishPolicy(record.id, next)) {
      notify("تعذّر الحفظ — مساحة التخزين في المتصفح ممتلئة");
      return;
    }
    log(
      "professional.publishPolicy",
      `${next === "auto" ? "تفعيل النشر المباشر لـ" : "إلزام المراجعة لـ"} ${record.companyAr || record.nameAr}`,
      { id: record.id, policy: next }
    );
    notify(
      next === "auto"
        ? "تم تفعيل النشر المباشر — مشاريعه الجديدة تُنشر فوراً"
        : "تم إلزامه بمراجعة الإدارة قبل نشر أي مشروع"
    );
  };

  const move = (record: ProfessionalRecord, direction: "up" | "down") => {
    moveProfessional(record.id, direction);
    log("professional.reorder", `تغيير ترتيب ${record.companyAr || record.nameAr}`, {
      id: record.id,
      direction,
    });
  };

  const saveEditor = () => {
    if (!editor) return;
    const result = updateProfessional(editor.id, {
      nameAr: editor.nameAr,
      companyAr: editor.companyAr,
      titleAr: editor.titleAr,
      cityAr: editor.cityAr,
      coverageAr: editor.coverageAr,
      specialtiesAr: editor.specialtiesAr,
      phone: editor.phone,
      email: editor.email,
      website: editor.website,
      bioAr: editor.bioAr,
      licenseNumber: editor.licenseNumber,
      yearsExperience: editor.yearsExperience ? Number(editor.yearsExperience) : undefined,
      projectsCount: editor.projectsCount ? Number(editor.projectsCount) : undefined,
    });
    if (!result.ok) {
      notify(result.error);
      return;
    }
    log("professional.edit", `تعديل بيانات ${result.record.companyAr || result.record.nameAr}`, {
      id: result.record.id,
    });
    notify("تم حفظ بيانات السجل");
    setEditor(null);
  };

  const addReel = () => {
    if (!reelsTarget) return;
    if (!reelUrl.trim()) return;
    const result = addProfessionalReel(reelsTarget.id, {
      titleAr: reelTitle,
      url: reelUrl,
    });
    if (!result.ok) {
      setReelError(result.error);
      return;
    }
    log("professional.reel.add", `إضافة فيديو لـ ${reelsTarget.companyAr || reelsTarget.nameAr}`, {
      id: reelsTarget.id,
      url: result.reel.url,
    });
    notify("تمت إضافة الفيديو");
    setReelTitle("");
    setReelUrl("");
    setReelError("");
  };

  const deleteReel = (record: ProfessionalRecord, reelId: string) => {
    removeProfessionalReel(record.id, reelId);
    log("professional.reel.remove", `حذف فيديو من ${record.companyAr || record.nameAr}`, {
      id: record.id,
      reelId,
    });
    notify("تم حذف الفيديو");
  };

  const approveProject = (record: ProfessionalRecord, project: ProfessionalProject) => {
    setProfessionalProjectStatus(record.id, project.id, "approved");
    log(
      "professional.project.approve",
      `اعتماد مشروع «${project.titleAr}» لـ ${record.companyAr || record.nameAr}`,
      { id: record.id, projectId: project.id }
    );
    notify(`تم اعتماد «${project.titleAr}» ونشره في صفحة المهني`);
  };

  const rejectProject = (record: ProfessionalRecord, project: ProfessionalProject) => {
    setProfessionalProjectStatus(
      record.id,
      project.id,
      "rejected",
      projectRejectNote.trim() || undefined
    );
    log(
      "professional.project.reject",
      `رفض مشروع «${project.titleAr}» لـ ${record.companyAr || record.nameAr}`,
      { id: record.id, projectId: project.id, note: projectRejectNote }
    );
    notify(`تم رفض «${project.titleAr}»`);
    setProjectRejectId(null);
    setProjectRejectNote("");
  };

  const deleteProject = (record: ProfessionalRecord, project: ProfessionalProject) => {
    if (!window.confirm(`حذف «${project.titleAr}» نهائياً؟`)) return;
    removeProfessionalProject(record.id, project.id);
    log(
      "professional.project.delete",
      `حذف مشروع «${project.titleAr}» لـ ${record.companyAr || record.nameAr}`,
      { id: record.id, projectId: project.id }
    );
    notify("تم حذف المشروع نهائياً");
  };

  /* نُحدّث نسخة العرض بعد أي تعديل عبر السجل */
  const freshReelsTarget = records.find((record) => record.id === reelsFor) ?? null;

  return (
    <div className="space-y-5">
      <Panel
        title="دليل المهنيين"
        desc="اعتماد المطورين والمسوقين والمحامين بعد مراجعة المستندات، وإدارة الريلز وطلبات التواصل. لا يظهر أي سجل للزوار قبل الاعتماد."
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-black text-amber-700">
              {pendingCount} قيد المراجعة
            </span>
            {pendingProjectsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-black text-rose-700">
                {pendingProjectsCount} مشروع بانتظار الاعتماد
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ocean-900/10 bg-sand-50 px-3 py-1.5 text-[11px] font-black text-ocean-800">
              {newRequests} طلب تواصل جديد
            </span>
          </>
        }
      >
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-sand-200 bg-sand-50/70 p-1.5">
          {VIEWS.map((item) => {
            const Icon = item.Icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11.5px] font-bold transition ${
                  active
                    ? "bg-ocean-950 text-white shadow-sm"
                    : "text-sand-700 hover:bg-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                {item.key !== "requests" && (
                  <span
                    className={`rounded-full px-1.5 text-[9.5px] font-black ${
                      active ? "bg-white/15 text-white" : "bg-sand-200 text-sand-700"
                    }`}
                  >
                    {counts[item.key] ?? 0}
                  </span>
                )}
                {item.key === "requests" && newRequests > 0 && (
                  <span className="rounded-full bg-rose-500 px-1.5 text-[9.5px] font-black text-white">
                    {newRequests}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {view !== "requests" && (
          <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_190px]">
            <label className="relative block">
              <span className="sr-only">بحث</span>
              <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sand-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث بالاسم أو الشركة أو الهاتف…"
                className={`${INPUT} ps-9`}
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={INPUT}
            >
              <option value="all">كل الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">معتمد ومنشور</option>
              <option value="rejected">مرفوض</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>
        )}
      </Panel>

      {view === "requests" ? (
        <Panel title="طلبات التواصل" desc="كل طلب يمر عبر الإدارة، ولا تُعرض بيانات الجهة مباشرة للزوار.">
          {requests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 p-6 text-center text-[12px] font-bold text-sand-500">
              لا توجد طلبات تواصل بعد.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {requests.map((request) => (
                <li
                  key={request.id}
                  className="rounded-2xl border border-sand-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-black text-ocean-900">
                        {request.name}
                        <span className="ms-2 text-[10.5px] font-bold text-sand-500">
                          {request.phone}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[10.5px] font-semibold text-sand-600">
                        بخصوص: {request.professionalName} ·{" "}
                        {PROFESSIONAL_KIND_META[request.kind].singularAr}
                      </p>
                      {request.email && (
                        <p className="mt-0.5 text-[10.5px] text-sand-500" dir="ltr">
                          {request.email}
                        </p>
                      )}
                      <p className="mt-2 whitespace-pre-line rounded-xl bg-sand-50 px-3 py-2 text-[11px] leading-6 text-sand-800">
                        {request.message}
                      </p>
                      <p className="mt-1.5 text-[9.5px] font-semibold text-sand-400">
                        {new Date(request.createdAt).toLocaleString("ar-EG")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[9.5px] font-extrabold ${
                          request.status === "new"
                            ? "border border-amber-200 bg-amber-50 text-amber-700"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {request.status === "new" ? "جديد" : "تم التعامل"}
                      </span>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setProfessionalRequestStatus(
                                request.id,
                                request.status === "new" ? "handled" : "new"
                              );
                              log(
                                "professional.request.status",
                                `تغيير حالة طلب ${request.name}`,
                                { id: request.id }
                              );
                            }}
                            className={ROW_ACTION}
                          >
                            <Check className="h-3 w-3" />
                            {request.status === "new" ? "تم التعامل" : "إرجاع كجديد"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              removeProfessionalRequest(request.id);
                              log("professional.request.delete", `حذف طلب ${request.name}`, {
                                id: request.id,
                              });
                              notify("تم حذف الطلب");
                            }}
                            className={`${ROW_ACTION} text-rose-600 hover:border-rose-300 hover:bg-rose-50`}
                            aria-label="حذف الطلب"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : (
        <Panel
          title={PROFESSIONAL_KIND_META[view].labelAr}
          desc="الاعتماد يمنح شارة التوثيق تلقائياً بعد مراجعة المستندات. يمكن سحبها يدوياً في أي وقت."
        >
          {list.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 p-6 text-center text-[12px] font-bold text-sand-500">
              لا توجد سجلات مطابقة.
            </p>
          ) : (
            <ul className="space-y-3">
              {list.map((record) => {
                const status = STATUS_META[record.status];
                const editing = editor?.id === record.id;
                return (
                  <li
                    key={record.id}
                    className="rounded-2xl border border-sand-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-[13px] font-black text-ocean-900">
                            {record.companyAr || record.nameAr}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9.5px] font-extrabold ${status.className}`}
                          >
                            {status.labelAr}
                          </span>
                          {record.verified && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9.5px] font-extrabold text-emerald-700">
                              <BadgeCheck className="h-2.5 w-2.5" /> موثّق
                            </span>
                          )}
                          {record.featured && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-gold-300/70 bg-gold-50 px-2 py-0.5 text-[9.5px] font-extrabold text-gold-700">
                              <Star className="h-2.5 w-2.5" /> مميّز
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] font-semibold text-sand-500">
                          {record.nameAr}
                          {record.titleAr ? ` · ${record.titleAr}` : ""}
                        </p>
                        <p className="mt-1 text-[10.5px] font-semibold text-sand-500" dir="ltr">
                          {record.phone}
                          {record.email ? ` · ${record.email}` : ""}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-bold text-sand-600">
                          <span>{record.documents.length} مستند</span>
                          <span>·</span>
                          <span>{record.reels.length} فيديو</span>
                          {record.cityAr && (
                            <>
                              <span>·</span>
                              <span>{record.cityAr}</span>
                            </>
                          )}
                        </div>
                        {record.reviewNote && (
                          <p className="mt-1.5 rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                            ملاحظة المراجعة: {record.reviewNote}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {record.status !== "approved" && (
                          <button
                            type="button"
                            disabled={!canManage}
                            onClick={() => approve(record)}
                            className={`${ROW_ACTION} border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50`}
                          >
                            <Check className="h-3 w-3" /> اعتماد
                          </button>
                        )}
                        {record.status !== "rejected" && (
                          <button
                            type="button"
                            disabled={!canManage}
                            onClick={() => {
                              setRejectFor(record);
                              setRejectNote("");
                            }}
                            className={`${ROW_ACTION} border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50`}
                          >
                            <X className="h-3 w-3" /> رفض
                          </button>
                        )}
                        {record.status !== "archived" ? (
                          <button
                            type="button"
                            disabled={!canManage}
                            onClick={() => archive(record)}
                            className={ROW_ACTION}
                          >
                            <Archive className="h-3 w-3" /> أرشفة
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={!canManage}
                            onClick={() => restore(record)}
                            className={ROW_ACTION}
                          >
                            <RotateCcw className="h-3 w-3" /> إعادة للمراجعة
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => toggleVerified(record)}
                          className={`${ROW_ACTION} ${
                            record.verified
                              ? "border-emerald-200 text-emerald-700"
                              : ""
                          }`}
                        >
                          <BadgeCheck className="h-3 w-3" />
                          {record.verified ? "سحب التوثيق" : "توثيق"}
                        </button>
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => toggleFeatured(record)}
                          className={`${ROW_ACTION} ${
                            record.featured ? "border-gold-300 text-gold-700" : ""
                          }`}
                        >
                          <Star className="h-3 w-3" />
                          {record.featured ? "إلغاء التمييز" : "تمييز"}
                        </button>
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => togglePublishPolicy(record)}
                          title="هل ينشر هذا المهني مشاريعه مباشرة أم بعد مراجعة الإدارة؟"
                          className={`${ROW_ACTION} ${
                            record.publishPolicy === "auto"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : ""
                          }`}
                        >
                          <UploadCloud className="h-3 w-3" />
                          {record.publishPolicy === "auto" ? "نشر مباشر: مفعّل" : "نشر بعد مراجعة"}
                        </button>
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => setDocsFor(record)}
                          className={ROW_ACTION}
                        >
                          <FileText className="h-3 w-3" /> المستندات
                        </button>
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => {
                            setReelsFor(record.id);
                            setReelTitle("");
                            setReelUrl("");
                            setReelError("");
                          }}
                          className={ROW_ACTION}
                        >
                          <Film className="h-3 w-3" /> الفيديوهات
                        </button>
                        {record.kind !== "lawyer" && (
                          <button
                            type="button"
                            disabled={!canManage}
                            onClick={() => {
                              setProjectsFor(record.id);
                              setProjectRejectId(null);
                              setProjectRejectNote("");
                            }}
                            className={ROW_ACTION}
                          >
                            <Briefcase className="h-3 w-3" /> المشاريع
                            {record.projects.filter((project) => project.status === "pending")
                              .length > 0 && (
                              <span className="rounded-full bg-rose-500 px-1.5 text-[9px] font-black text-white">
                                {
                                  record.projects.filter(
                                    (project) => project.status === "pending"
                                  ).length
                                }
                              </span>
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() =>
                            setEditor(editing ? null : editorFrom(record))
                          }
                          className={ROW_ACTION}
                        >
                          <Pencil className="h-3 w-3" /> تحرير
                        </button>
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => move(record, "up")}
                          className={ROW_ACTION}
                          aria-label="تحريك لأعلى"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => move(record, "down")}
                          className={ROW_ACTION}
                          aria-label="تحريك لأسفل"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => setDeleteFor(record)}
                          className={`${ROW_ACTION} text-rose-600 hover:border-rose-300 hover:bg-rose-50`}
                          aria-label="حذف نهائي"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {editing && editor && (
                      <div className="mt-3 rounded-2xl border border-gold-200 bg-gold-50/40 p-3">
                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                          <Field label="اسم المسؤول">
                            <input
                              value={editor.nameAr}
                              onChange={(event) =>
                                setEditor({ ...editor, nameAr: event.target.value })
                              }
                              className={INPUT}
                            />
                          </Field>
                          <Field label="اسم الشركة / المكتب">
                            <input
                              value={editor.companyAr}
                              onChange={(event) =>
                                setEditor({ ...editor, companyAr: event.target.value })
                              }
                              className={INPUT}
                            />
                          </Field>
                          <Field label="التخصص / المسمى">
                            <input
                              value={editor.titleAr}
                              onChange={(event) =>
                                setEditor({ ...editor, titleAr: event.target.value })
                              }
                              className={INPUT}
                            />
                          </Field>
                          <Field label="المدينة">
                            <input
                              value={editor.cityAr}
                              onChange={(event) =>
                                setEditor({ ...editor, cityAr: event.target.value })
                              }
                              className={INPUT}
                            />
                          </Field>
                          <Field label="نطاق التغطية" hint="مدن مفصولة بفاصلة">
                            <input
                              value={editor.coverageAr}
                              onChange={(event) =>
                                setEditor({ ...editor, coverageAr: event.target.value })
                              }
                              className={INPUT}
                            />
                          </Field>
                          <Field label="التخصصات" hint="مفصولة بفاصلة">
                            <input
                              value={editor.specialtiesAr}
                              onChange={(event) =>
                                setEditor({ ...editor, specialtiesAr: event.target.value })
                              }
                              className={INPUT}
                            />
                          </Field>
                          <Field label="الهاتف">
                            <input
                              value={editor.phone}
                              onChange={(event) =>
                                setEditor({ ...editor, phone: event.target.value })
                              }
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                          <Field label="البريد الإلكتروني">
                            <input
                              value={editor.email}
                              onChange={(event) =>
                                setEditor({ ...editor, email: event.target.value })
                              }
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                          <Field label="الموقع الإلكتروني">
                            <input
                              value={editor.website}
                              onChange={(event) =>
                                setEditor({ ...editor, website: event.target.value })
                              }
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                          <Field label="رقم السجل / الكارنيه">
                            <input
                              value={editor.licenseNumber}
                              onChange={(event) =>
                                setEditor({ ...editor, licenseNumber: event.target.value })
                              }
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                          <Field label="سنوات الخبرة">
                            <input
                              value={editor.yearsExperience}
                              onChange={(event) =>
                                setEditor({
                                  ...editor,
                                  yearsExperience: event.target.value.replace(/[^0-9]/g, ""),
                                })
                              }
                              inputMode="numeric"
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                          <Field label="عدد المشروعات">
                            <input
                              value={editor.projectsCount}
                              onChange={(event) =>
                                setEditor({
                                  ...editor,
                                  projectsCount: event.target.value.replace(/[^0-9]/g, ""),
                                })
                              }
                              inputMode="numeric"
                              dir="ltr"
                              className={INPUT}
                            />
                          </Field>
                          <div className="sm:col-span-2 lg:col-span-3">
                            <Field label="نبذة">
                              <textarea
                                value={editor.bioAr}
                                onChange={(event) =>
                                  setEditor({ ...editor, bioAr: event.target.value })
                                }
                                rows={3}
                                className={INPUT}
                              />
                            </Field>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={saveEditor} className={BTN_PRIMARY}>
                            <Check className="h-3.5 w-3.5" /> حفظ التعديلات
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditor(null)}
                            className={ROW_ACTION}
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}

      {/* ===================== المستندات ===================== */}
      {docsFor && (
        <Modal
          title={`مستندات ${docsFor.companyAr || docsFor.nameAr}`}
          onClose={() => setDocsFor(null)}
        >
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10.5px] font-bold leading-5 text-amber-800">
            هذه المستندات للإدارة فقط ولا تُعرض للزوار أو للجهات الأخرى.
          </p>
          {docsFor.documents.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-sand-300 bg-sand-50/60 p-4 text-center text-[11.5px] font-bold text-sand-500">
              لا توجد مستندات مرفوعة لهذا السجل.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {docsFor.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-sand-200 bg-white p-3"
                >
                  {doc.dataUrl ? (
                    <a
                      href={doc.dataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-sand-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doc.dataUrl}
                        alt={doc.label}
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ) : (
                    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-sand-200 bg-sand-50 text-sand-400">
                      <FileText className="h-5 w-5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-black text-ocean-900">{doc.label}</p>
                    <p className="mt-0.5 truncate text-[10px] font-semibold text-sand-500" dir="ltr">
                      {doc.fileName || "—"}
                    </p>
                    {doc.uploadedAt && (
                      <p className="text-[9.5px] text-sand-400">
                        {new Date(doc.uploadedAt).toLocaleDateString("ar-EG")}
                      </p>
                    )}
                  </div>
                  {doc.dataUrl && (
                    <a
                      href={doc.dataUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={ROW_ACTION}
                    >
                      <Eye className="h-3 w-3" /> عرض
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          {docsFor.licenses.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-600">
                التراخيص
              </p>
              <ul className="mt-2 space-y-1.5">
                {docsFor.licenses.map((license) => (
                  <li
                    key={license.id}
                    className="rounded-xl border border-sand-200 bg-sand-50/60 px-3 py-2 text-[11px] font-bold text-ocean-900"
                  >
                    {license.name}
                    {license.number ? ` — ${license.number}` : ""}
                    {license.issuer ? ` · ${license.issuer}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Modal>
      )}

      {/* ===================== المشاريع والعروض ===================== */}
      {projectsTarget && (
        <Modal
          title={`مشاريع وعروض ${projectsTarget.companyAr || projectsTarget.nameAr}`}
          onClose={() => {
            setProjectsFor(null);
            setProjectRejectId(null);
            setProjectRejectNote("");
          }}
        >
          <p className="rounded-xl border border-sand-200 bg-sand-50/70 px-3 py-2 text-[10.5px] font-semibold leading-5 text-sand-600">
            كل مشروع ينشره المهني يبقى «قيد المراجعة» حتى تعتمده هنا. الاعتماد مستقل عن
            اعتماد الملف نفسه، والتعديل من المهني يعيد المشروع للمراجعة.
          </p>

          {projectsTarget.projects.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-sand-300 bg-sand-50/60 p-4 text-center text-[11.5px] font-bold text-sand-500">
              لم يضف هذا المهني أي مشاريع أو عروض بعد.
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {[...projectsTarget.projects]
                .sort((a, b) => a.order - b.order)
                .map((project) => {
                  const meta = PROJECT_STATUS_META[project.status];
                  return (
                    <li
                      key={project.id}
                      className="rounded-2xl border border-sand-200 bg-white p-3.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-[12.5px] font-black text-ocean-900">
                              {project.titleAr}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${meta.className}`}
                            >
                              {meta.labelAr}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[10px] font-semibold text-sand-500">
                            {project.cityAr || "—"}
                            {project.typeAr ? ` · ${project.typeAr}` : ""}
                            {project.priceFrom ? ` · يبدأ من ${project.priceFrom}` : ""}
                          </p>
                          {project.descriptionAr && (
                            <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-5 text-sand-700">
                              {project.descriptionAr}
                            </p>
                          )}
                          {project.reviewNote && (
                            <p className="mt-1.5 rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                              ملاحظة الرفض: {project.reviewNote}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <a
                            href={`/projects/${project.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className={ROW_ACTION}
                            title="معاينة صفحة المشروع"
                          >
                            <ExternalLink className="h-3 w-3" /> معاينة
                          </a>
                          {project.status !== "approved" && (
                            <button
                              type="button"
                              disabled={!canManage}
                              onClick={() => approveProject(projectsTarget, project)}
                              className={`${ROW_ACTION} border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50`}
                            >
                              <Check className="h-3 w-3" /> اعتماد
                            </button>
                          )}
                          {project.status !== "rejected" && (
                            <button
                              type="button"
                              disabled={!canManage}
                              onClick={() => {
                                setProjectRejectId(project.id);
                                setProjectRejectNote("");
                              }}
                              className={`${ROW_ACTION} border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50`}
                            >
                              <X className="h-3 w-3" /> رفض
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={!canManage}
                            onClick={() => deleteProject(projectsTarget, project)}
                            className={`${ROW_ACTION} text-rose-600 hover:border-rose-300 hover:bg-rose-50`}
                            aria-label="حذف المشروع"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {projectRejectId === project.id && (
                        <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50/60 p-2.5">
                          <Field label="سبب الرفض (يظهر للمهني)">
                            <textarea
                              value={projectRejectNote}
                              onChange={(event) => setProjectRejectNote(event.target.value)}
                              rows={2}
                              className={INPUT}
                            />
                          </Field>
                          <div className="mt-2 flex gap-1.5">
                            <button
                              type="button"
                              disabled={!canManage}
                              onClick={() => rejectProject(projectsTarget, project)}
                              className={`${ROW_ACTION} border-rose-300 text-rose-700 hover:bg-rose-100`}
                            >
                              تأكيد الرفض
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProjectRejectId(null);
                                setProjectRejectNote("");
                              }}
                              className={ROW_ACTION}
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}
        </Modal>
      )}

      {/* ===================== الريلز ===================== */}
      {freshReelsTarget && (
        <Modal
          title={`فيديوهات ${freshReelsTarget.companyAr || freshReelsTarget.nameAr}`}
          onClose={() => setReelsFor(null)}
        >
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <input
              value={reelTitle}
              onChange={(event) => setReelTitle(event.target.value)}
              placeholder="عنوان الفيديو"
              className={INPUT}
            />
            <input
              value={reelUrl}
              onChange={(event) => setReelUrl(event.target.value)}
              placeholder="رابط يوتيوب أو إنستجرام"
              dir="ltr"
              className={INPUT}
            />
            <button type="button" onClick={addReel} className={BTN_PRIMARY}>
              <Plus className="h-3.5 w-3.5" /> إضافة
            </button>
          </div>
          {reelError && (
            <p className="mt-2 text-[10.5px] font-bold text-rose-600">{reelError}</p>
          )}
          {freshReelsTarget.reels.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-sand-300 bg-sand-50/60 p-4 text-center text-[11.5px] font-bold text-sand-500">
              لا توجد فيديوهات بعد.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {freshReelsTarget.reels.map((reel) => (
                <li
                  key={reel.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sand-200 bg-white p-3"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-ocean-900">{reel.titleAr}</p>
                    <a
                      href={reel.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold text-ocean-600 hover:text-gold-700"
                      dir="ltr"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      {reel.url}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {toEmbedUrl(reel.url) && (
                      <a
                        href={toEmbedUrl(reel.url) as string}
                        target="_blank"
                        rel="noreferrer"
                        className={ROW_ACTION}
                      >
                        <Eye className="h-3 w-3" /> معاينة
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteReel(freshReelsTarget, reel.id)}
                      className={`${ROW_ACTION} text-rose-600 hover:border-rose-300 hover:bg-rose-50`}
                      aria-label="حذف الفيديو"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {/* ===================== الرفض ===================== */}
      {rejectFor && (
        <Modal
          title={`رفض ${rejectFor.companyAr || rejectFor.nameAr}`}
          onClose={() => setRejectFor(null)}
        >
          <Field label="سبب الرفض (يظهر للمستخدم)" hint="اختياري — يُحفظ مع السجل">
            <textarea
              value={rejectNote}
              onChange={(event) => setRejectNote(event.target.value)}
              rows={3}
              className={INPUT}
            />
          </Field>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={reject}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-[12px] font-black text-white transition hover:bg-rose-700"
            >
              <X className="h-3.5 w-3.5" /> تأكيد الرفض
            </button>
            <button
              type="button"
              onClick={() => setRejectFor(null)}
              className={ROW_ACTION}
            >
              إلغاء
            </button>
          </div>
        </Modal>
      )}

      {/* ===================== الحذف ===================== */}
      {deleteFor && (
        <Modal
          title={`حذف «${deleteFor.companyAr || deleteFor.nameAr}»`}
          onClose={() => setDeleteFor(null)}
        >
          <p className="text-[12px] leading-7 text-sand-700">
            سيُحذف السجل وكل مستنداته وفيديوهاته نهائياً ولا يمكن استعادته. إن أردت
            الاحتفاظ بالبيانات للرجوع إليها استخدم «أرشفة» بدلاً من الحذف.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={confirmDelete}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-[12px] font-black text-white transition hover:bg-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5" /> حذف نهائي
            </button>
            <button
              type="button"
              onClick={() => setDeleteFor(null)}
              className={ROW_ACTION}
            >
              إلغاء
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ocean-950/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-6 w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-sand-200 bg-sand-50/70 px-5 py-4">
          <h3 className="text-[13px] font-black text-ocean-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-sand-200 bg-white p-1.5 text-sand-600 transition hover:text-ocean-900"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[72vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
