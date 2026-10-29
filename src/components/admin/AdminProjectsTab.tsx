"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  ExternalLink,
  Search,
  Star,
  X,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { addAdminLog } from "@/lib/admin-system";
import {
  PROJECT_STATUS_META,
  setProfessionalProjectFeatured,
  setProfessionalProjectStatus,
  useProfessionals,
  type ProfessionalProject,
  type ProfessionalProjectStatus,
  type ProfessionalRecord,
} from "@/lib/professionals-store";
import {
  PROJECT_TYPES,
  resolveProjectTypeId,
  type ProjectTypeId,
} from "@/lib/projects-taxonomy";
import { BTN_PRIMARY, INPUT, Panel, ROW_ACTION } from "@/components/admin/shared";

interface Props {
  can: (key: string) => boolean;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

interface Row {
  record: ProfessionalRecord;
  project: ProfessionalProject;
}

const STATUS_FILTERS: { key: ProfessionalProjectStatus | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "قيد المراجعة" },
  { key: "approved", label: "منشور" },
  { key: "draft", label: "مسودة" },
  { key: "rejected", label: "مرفوض" },
  { key: "archived", label: "مؤرشف" },
];

const EVENT_LABEL: Record<string, string> = {
  created: "إنشاء",
  edited: "تعديل",
  draft: "مسودة",
  submitted: "إرسال للمراجعة",
  approved: "اعتماد",
  rejected: "رفض",
  archived: "أرشفة",
  featured: "تمييز",
  unfeatured: "إلغاء تمييز",
};

export default function AdminProjectsTab({ can, notify, reloadLogs }: Props) {
  const session = typeof window !== "undefined" ? getSession() : null;
  const records = useProfessionals();
  const canManage = can("professionals.manage");

  const [status, setStatus] = useState<ProfessionalProjectStatus | "all">("pending");
  const [typeId, setTypeId] = useState<ProjectTypeId | "">("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  /** كل المشاريع مع صاحبها */
  const rows = useMemo<Row[]>(() => {
    return records.flatMap((record) =>
      record.projects.map((project) => ({ record, project }))
    );
  }, [records]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: rows.length };
    for (const row of rows) {
      base[row.project.status] = (base[row.project.status] ?? 0) + 1;
    }
    return base;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ record, project }) => {
      if (status !== "all" && project.status !== status) return false;
      if (
        typeId &&
        (project.typeId ?? resolveProjectTypeId(project.typeAr)) !== typeId
      ) {
        return false;
      }
      if (!q) return true;
      const hay = `${project.titleAr} ${project.cityAr ?? ""} ${
        record.companyAr ?? record.nameAr
      }`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, status, typeId, query]);

  const selectedRows = useMemo(
    () => visible.filter(({ record, project }) => selected[`${record.id}:${project.id}`]),
    [visible, selected]
  );

  const log = (action: string, details: string, meta?: Record<string, unknown>) => {
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

  const decide = (
    row: Row,
    next: ProfessionalProjectStatus,
    note?: string
  ) => {
    const actor = { name: session?.name, role: session?.role };
    setProfessionalProjectStatus(row.record.id, row.project.id, next, note, actor);
    log(
      `project.${next}`,
      `${next === "approved" ? "اعتماد" : next === "rejected" ? "رفض" : "تحديث"} مشروع «${row.project.titleAr}» — ${row.record.companyAr || row.record.nameAr}`,
      { projectId: row.project.id, professionalId: row.record.id, note }
    );
    notify(
      next === "approved"
        ? `تم اعتماد «${row.project.titleAr}» ونشره`
        : next === "rejected"
          ? `تم رفض «${row.project.titleAr}»`
          : `تم تحديث حالة «${row.project.titleAr}»`
    );
  };

  const bulkApprove = () => {
    const pending = selectedRows.filter((row) => row.project.status !== "approved");
    if (pending.length === 0) {
      notify("لا يوجد مشاريع محددة قابلة للاعتماد");
      return;
    }
    for (const row of pending) {
      setProfessionalProjectStatus(row.record.id, row.project.id, "approved", undefined, {
        name: session?.name,
        role: session?.role,
      });
    }
    log("project.bulkApprove", `اعتماد ${pending.length} مشروعاً دفعة واحدة`, {
      count: pending.length,
    });
    setSelected({});
    notify(`تم اعتماد ${pending.length} مشروعاً`);
  };

  const toggleFeature = (row: Row) => {
    const next = !row.project.featured;
    setProfessionalProjectFeatured(row.record.id, row.project.id, next, {
      name: session?.name,
      role: session?.role,
    });
    log(
      next ? "project.featured" : "project.unfeatured",
      `${next ? "تمييز" : "إلغاء تمييز"} مشروع «${row.project.titleAr}»`,
      { projectId: row.project.id }
    );
    notify(next ? "تم تمييز المشروع" : "تم إلغاء التمييز");
  };

  return (
    <Panel
      title="المشاريع والعروض"
      desc="كل مشاريع المطورين والمسوقين في مكان واحد — اعتماد، رفض، تمييز، ومعاينة الصفحة قبل النشر."
      actions={
        <button
          type="button"
          onClick={bulkApprove}
          disabled={!canManage || selectedRows.length === 0}
          className={BTN_PRIMARY}
        >
          <Check className="h-4 w-4" /> اعتماد المحدد ({selectedRows.length})
        </button>
      }
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setStatus(item.key)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              status === item.key
                ? "bg-ocean-950 text-white"
                : "border border-sand-200 bg-white text-sand-700 hover:border-gold-300"
            }`}
          >
            {item.label}
            <span className="ms-1 opacity-60">{counts[item.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="بحث بالمشروع أو الجهة"
            className={`${INPUT} pe-9 sm:w-72`}
          />
        </div>
        <select
          value={typeId}
          onChange={(event) => setTypeId(event.target.value as ProjectTypeId | "")}
          className={`${INPUT} sm:w-44`}
        >
          <option value="">كل الأنواع</option>
          {PROJECT_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.ar}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sand-200 p-10 text-center text-sm text-sand-600">
          لا توجد مشاريع مطابقة للفلاتر الحالية.
        </p>
      ) : (
        <div className="space-y-2.5">
          {visible.map((row) => {
            const key = `${row.record.id}:${row.project.id}`;
            const meta = PROJECT_STATUS_META[row.project.status];
            const provider = row.record.companyAr || row.record.nameAr;
            const typeLabel =
              row.project.typeId
                ? PROJECT_TYPES.find((type) => type.id === row.project.typeId)?.ar
                : row.project.typeAr;
            return (
              <article
                key={key}
                className="rounded-2xl border border-sand-200 bg-white p-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 gap-2.5">
                    <input
                      type="checkbox"
                      checked={Boolean(selected[key])}
                      onChange={(event) =>
                        setSelected((prev) => ({ ...prev, [key]: event.target.checked }))
                      }
                      className="mt-1 h-4 w-4 shrink-0 accent-gold-500"
                      aria-label={`تحديد ${row.project.titleAr}`}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-[12.5px] font-black text-ocean-900">
                          {row.project.titleAr}
                        </p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${meta.className}`}>
                          {meta.labelAr}
                        </span>
                        {row.project.featured && (
                          <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[9px] font-extrabold text-gold-700">
                            مميز
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] font-semibold text-sand-500">
                        {provider}
                        {typeLabel ? ` · ${typeLabel}` : ""}
                        {row.project.cityAr ? ` · ${row.project.cityAr}` : ""}
                        {row.project.priceFrom ? ` · ${row.project.priceFrom}` : ""}
                      </p>
                      {row.project.reviewNote && (
                        <p className="mt-1.5 rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                          ملاحظة: {row.project.reviewNote}
                        </p>
                      )}
                      {(() => {
                        const history = row.project.history ?? [];
                        const last = history[history.length - 1];
                        if (!last) return null;
                        return (
                          <p className="mt-1 text-[9px] font-semibold text-sand-500">
                            آخر إجراء: {EVENT_LABEL[last.action] ?? last.action}
                            {last.by ? ` · ${last.by}` : ""}
                            {" · "}
                            {new Date(last.at).toLocaleDateString("ar-EG")}
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <a
                      href={`/projects/${row.project.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={ROW_ACTION}
                      title="معاينة صفحة المشروع"
                    >
                      <ExternalLink className="h-3 w-3" /> معاينة
                    </a>
                    {row.project.status !== "approved" && (
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => decide(row, "approved")}
                        className={`${ROW_ACTION} border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50`}
                      >
                        <Check className="h-3 w-3" /> اعتماد
                      </button>
                    )}
                    {row.project.status !== "rejected" && (
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => {
                          const note = window.prompt(
                            `سبب رفض «${row.project.titleAr}» (يظهر للمهني):`,
                            row.project.reviewNote ?? ""
                          );
                          if (note === null) return;
                          decide(row, "rejected", note.trim() || undefined);
                        }}
                        className={`${ROW_ACTION} border-rose-200 text-rose-700 hover:border-rose-300 hover:bg-rose-50`}
                      >
                        <X className="h-3 w-3" /> رفض
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() => toggleFeature(row)}
                      className={`${ROW_ACTION} ${row.project.featured ? "border-gold-300 text-gold-700" : ""}`}
                    >
                      <Star className="h-3 w-3" />
                      {row.project.featured ? "إلغاء التمييز" : "تمييز"}
                    </button>
                    {row.project.status === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[9.5px] font-bold text-amber-700">
                        <BadgeCheck className="h-3 w-3" /> بانتظار قرار
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
