"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GitBranch,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  StickyNote,
  Tag,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { addAdminLog, type AdminUser } from "@/lib/admin-system";
import { getSession } from "@/lib/session";
import {
  CRM_ACTIVITY_LABEL,
  CRM_SOURCE_LABEL,
  CRM_STAGE_LABEL,
  CRM_STAGE_STYLE,
  CRM_STAGES,
  type CrmActivityKind,
  type CrmLead,
  type CrmSource,
  type CrmStage,
  type CrmTask,
} from "@/lib/crm-types";
import {
  addCrmActivity,
  addCrmTask,
  assignCrmLead,
  changeCrmStage,
  createCrmLead,
  deleteCrmLead,
  deleteCrmTask,
  hasCrmStore,
  importInquiryLeads,
  importLocalCrmLeads,
  toggleCrmTask,
  updateCrmLead,
  useCrmLeads,
} from "@/lib/crm-store";
import { BTN_GOLD, BTN_PRIMARY, INPUT, Panel, ROW_ACTION } from "@/components/admin/shared";

interface Props {
  users: AdminUser[];
  can: (key: string) => boolean;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

const SOURCE_OPTIONS: { value: CrmSource; label: string }[] = (
  Object.keys(CRM_SOURCE_LABEL) as CrmSource[]
).map((value) => ({ value, label: CRM_SOURCE_LABEL[value] }));

const dateTimeFmt = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function money(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "—";
  }
  return `${value.toLocaleString("ar-EG")} ج.م`;
}

function relative(value?: string): string {
  if (!value) return "—";
  const stamp = Date.parse(value);
  if (!Number.isFinite(stamp)) return "—";
  const diff = Math.max(0, Date.now() - stamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return dateFmt.format(new Date(stamp));
}

function nextTask(lead: CrmLead): CrmTask | undefined {
  return lead.tasks
    .filter((task) => !task.done)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt))[0];
}

function isOverdue(task: CrmTask): boolean {
  return !task.done && Date.parse(task.dueAt) < Date.now();
}

function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return `20${digits}`;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
}

function toLocalInput(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultTaskDue(): string {
  return toLocalInput(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

function activityIcon(kind: CrmActivityKind) {
  if (kind === "call") return Phone;
  if (kind === "whatsapp") return MessageCircle;
  if (kind === "meeting") return CalendarClock;
  if (kind === "email") return Mail;
  if (kind === "stage") return GitBranch;
  return StickyNote;
}

export default function AdminCrmTab({ users, can, notify, reloadLogs }: Props) {
  const leads = useCrmLeads();
  const session = typeof window !== "undefined" ? getSession() : null;
  const actor = session?.name || session?.email || "الإدارة";
  const canManage = can("crm.manage");
  const canAssign = can("crm.assign");

  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | CrmStage>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | CrmSource>("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [view, setView] = useState<"board" | "list">("board");
  const [createOpen, setCreateOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const log = (action: string, details: string) => {
    addAdminLog({
      action,
      category: "crm",
      performedBy: session?.email || "admin",
      performedByName: actor,
      performedByRole: session?.role || "admin",
      details,
    });
    reloadLogs();
  };

  /* أول فتح فقط: نسحب الطلبات القديمة حتى لا تظهر الشاشة فارغة */
  useEffect(() => {
    if (!hasCrmStore()) {
      importLocalCrmLeads();
    }
  }, []);

  const activeLead = useMemo(
    () => leads.find((lead) => lead.id === activeId) ?? null,
    [leads, activeId]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads
      .filter((lead) => {
        if (stageFilter !== "all" && lead.stage !== stageFilter) return false;
        if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
        if (assigneeFilter !== "all") {
          if (assigneeFilter === "none" && lead.assignedTo) return false;
          if (
            assigneeFilter !== "none" &&
            lead.assignedTo !== assigneeFilter
          ) {
            return false;
          }
        }
        if (overdueOnly && !lead.tasks.some(isOverdue)) return false;
        if (!needle) return true;
        return [
          lead.name,
          lead.phone,
          lead.email,
          lead.interest,
          lead.city,
          lead.assignedToName,
          lead.reference,
          ...lead.tags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [leads, query, stageFilter, sourceFilter, assigneeFilter, overdueOnly]);

  const stats = useMemo(() => {
    const total = leads.length;
    const won = leads.filter((lead) => lead.stage === "won").length;
    const active = leads.filter((lead) =>
      ["contacted", "viewing", "negotiation"].includes(lead.stage)
    ).length;
    const overdue = leads.reduce(
      (count, lead) => count + lead.tasks.filter(isOverdue).length,
      0
    );
    return {
      total,
      fresh: leads.filter((lead) => lead.stage === "new").length,
      active,
      won,
      overdue,
      conversion: total ? Math.round((won / total) * 100) : 0,
    };
  }, [leads]);

  const runImport = async () => {
    setImporting(true);
    let added = 0;
    try {
      added += importLocalCrmLeads();
      const response = await fetch("/api/admin/inquiries", {
        cache: "no-store",
      });
      if (response.ok) {
        const data = (await response.json()) as {
          rows?: Parameters<typeof importInquiryLeads>[0];
        };
        added += importInquiryLeads(data.rows ?? []);
      }
      notify(
        added > 0
          ? `تمت إضافة ${added} عميل جديد إلى صندوق العملاء`
          : "كل الطلبات الحالية موجودة بالفعل في الـCRM"
      );
      if (added > 0) log("استيراد العملاء", `تمت إضافة ${added} عميل`);
    } catch {
      notify("تعذر استيراد بعض الطلبات — حاول مرة أخرى");
    } finally {
      setImporting(false);
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      notify("لا توجد بيانات للتصدير");
      return;
    }
    const headers = [
      "الاسم",
      "الهاتف",
      "البريد",
      "المصدر",
      "المرحلة",
      "الاهتمام",
      "المدينة",
      "الميزانية",
      "المسؤول",
      "الوسوم",
      "آخر تواصل",
      "المهمة القادمة",
      "ملاحظات",
      "تاريخ الإضافة",
    ];
    const rows = filtered.map((lead) => {
      const task = nextTask(lead);
      return [
        lead.name,
        lead.phone,
        lead.email ?? "",
        CRM_SOURCE_LABEL[lead.source],
        CRM_STAGE_LABEL[lead.stage],
        lead.interest ?? "",
        lead.city ?? "",
        lead.budget ?? "",
        lead.assignedToName ?? "",
        lead.tags.join(" / "),
        relative(lead.updatedAt),
        task ? `${task.title} — ${dateTimeFmt.format(new Date(task.dueAt))}` : "",
        lead.notes ?? "",
        dateFmt.format(new Date(lead.createdAt)),
      ];
    });
    const escapeCell = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aqaar-crm-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify(`تم تصدير ${filtered.length} عميل إلى ملف Excel/CSV`);
  };

  const moveLead = (id: string, stage: CrmStage) => {
    if (!canManage) {
      notify("لا تملك صلاحية تعديل مرحلة العميل");
      return;
    }
    if (changeCrmStage(id, stage, actor)) {
      notify(`تم نقل العميل إلى «${CRM_STAGE_LABEL[stage]}»`);
      log("تغيير مرحلة عميل", `المرحلة الجديدة: ${CRM_STAGE_LABEL[stage]}`);
    }
  };

  return (
    <div className="space-y-4">
      <Panel
        title="العملاء والفرص"
        desc="كل طلب واستفسار في مكان واحد: مراحل المتابعة، سجل التواصل، المهام، وإسناد الموظفين."
        actions={
          <>
            <button
              type="button"
              onClick={runImport}
              disabled={importing}
              className={BTN_PRIMARY}
            >
              <RefreshCw
                className={`h-4 w-4 ${importing ? "animate-spin" : ""}`}
              />
              {importing ? "جارٍ الاستيراد..." : "استيراد الطلبات"}
            </button>
            <button type="button" onClick={exportCsv} className={BTN_PRIMARY}>
              <Download className="h-4 w-4" /> تصدير CSV
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className={BTN_GOLD}
              >
                <UserPlus className="h-4 w-4" /> عميل جديد
              </button>
            )}
          </>
        }
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="إجمالي العملاء"
            value={stats.total}
            Icon={Users}
            tone="text-ocean-700 bg-ocean-50 border-ocean-100"
          />
          <StatCard
            label="عملاء جدد"
            value={stats.fresh}
            Icon={Plus}
            tone="text-sky-700 bg-sky-50 border-sky-100"
          />
          <StatCard
            label="قيد المتابعة"
            value={stats.active}
            Icon={Clock}
            tone="text-amber-700 bg-amber-50 border-amber-100"
          />
          <StatCard
            label="تم البيع/الإيجار"
            value={stats.won}
            Icon={CheckCircle2}
            tone="text-emerald-700 bg-emerald-50 border-emerald-100"
          />
          <StatCard
            label="مهام متأخرة"
            value={stats.overdue}
            Icon={AlertTriangle}
            tone="text-rose-700 bg-rose-50 border-rose-100"
          />
          <StatCard
            label="نسبة التحويل"
            value={`${stats.conversion}%`}
            Icon={TrendingUp}
            tone="text-gold-700 bg-gold-50 border-gold-100"
          />
        </div>

        {stats.overdue > 0 && !overdueOnly && (
          <button
            type="button"
            onClick={() => setOverdueOnly(true)}
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-start text-[12px] font-bold text-rose-700 transition hover:bg-rose-100/70"
          >
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              لديك {stats.overdue} مهمة متابعة متأخرة — اضغط لعرض العملاء
            </span>
            <span className="text-[11px]">عرض المتأخر فقط</span>
          </button>
        )}

        <div className="mt-4 flex flex-col gap-2.5 rounded-2xl border border-sand-200 bg-sand-50/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث بالاسم أو الهاتف أو العقار..."
                className={`${INPUT} ps-9`}
              />
            </label>
            <select
              value={stageFilter}
              onChange={(event) =>
                setStageFilter(event.target.value as "all" | CrmStage)
              }
              className={`${INPUT} w-auto min-w-[130px]`}
            >
              <option value="all">كل المراحل</option>
              {CRM_STAGES.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.label}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(event) =>
                setSourceFilter(event.target.value as "all" | CrmSource)
              }
              className={`${INPUT} w-auto min-w-[130px]`}
            >
              <option value="all">كل المصادر</option>
              {SOURCE_OPTIONS.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
            <select
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value)}
              className={`${INPUT} w-auto min-w-[140px]`}
            >
              <option value="all">كل المسؤولين</option>
              <option value="none">بدون مسؤول</option>
              {users
                .filter((user) => user.active)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={() => setOverdueOnly((value) => !value)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11.5px] font-bold transition ${
                overdueOnly
                  ? "border-rose-300 bg-rose-50 text-rose-700"
                  : "border-sand-200 bg-white text-sand-700 hover:bg-sand-50"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" /> متأخر فقط
            </button>
            <div className="ms-auto inline-flex rounded-xl border border-sand-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setView("board")}
                aria-pressed={view === "board"}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                  view === "board"
                    ? "bg-ocean-950 text-white"
                    : "text-sand-600 hover:bg-sand-50"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> لوحة
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                  view === "list"
                    ? "bg-ocean-950 text-white"
                    : "text-sand-600 hover:bg-sand-50"
                }`}
              >
                <List className="h-3.5 w-3.5" /> قائمة
              </button>
            </div>
          </div>
          <p className="text-[10.5px] font-semibold text-sand-500">
            {filtered.length} من {leads.length} عميل — اسحب البطاقة بين الأعمدة
            لتغيير المرحلة، أو افتح العميل لمتابعة التفاصيل.
          </p>
        </div>

        {leads.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-sand-300 bg-sand-50/60 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gold-600 shadow-sm">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="mt-3 text-[16px] font-black text-ocean-900">
              صندوق العملاء فاضي دلوقتي
            </h3>
            <p className="mx-auto mt-1 max-w-md text-[11.5px] leading-6 text-sand-600">
              أي طلب عقار جديد هيظهر هنا تلقائيًا. تقدر كمان تستورد الطلبات
              القديمة أو تضيف عميل يدويًا.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={runImport} className={BTN_PRIMARY}>
                <Upload className="h-4 w-4" /> استيراد الطلبات الحالية
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className={BTN_GOLD}
                >
                  <UserPlus className="h-4 w-4" /> إضافة أول عميل
                </button>
              )}
            </div>
          </div>
        ) : view === "board" ? (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {CRM_STAGES.map((stage) => {
              const items = filtered.filter((lead) => lead.stage === stage.key);
              return (
                <div
                  key={stage.key}
                  className="w-[268px] shrink-0 rounded-2xl border border-sand-200 bg-sand-50/70"
                  onDragOver={(event) => {
                    if (canManage) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const id =
                      event.dataTransfer.getData("text/plain") || draggingId;
                    setDraggingId(null);
                    if (id) moveLead(id, stage.key);
                  }}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-sand-200 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={`h-2.5 w-2.5 rounded-full ${stage.dot}`}
                      />
                      <span className="text-[12px] font-black text-ocean-900">
                        {stage.label}
                      </span>
                    </div>
                    <span className="rounded-full border border-sand-200 bg-white px-2 py-0.5 text-[10px] font-bold text-sand-600">
                      {items.length}
                    </span>
                  </div>
                  <div className="min-h-[120px] space-y-2 p-2">
                    {items.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        canManage={canManage}
                        dragging={draggingId === lead.id}
                        onOpen={() => setActiveId(lead.id)}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", lead.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDraggingId(lead.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        onStageChange={(next) => moveLead(lead.id, next)}
                      />
                    ))}
                    {items.length === 0 && (
                      <p className="px-2 py-6 text-center text-[10.5px] font-semibold text-sand-400">
                        لا يوجد عملاء
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-sand-200">
            <table className="w-full min-w-[980px] border-collapse text-start">
              <thead className="bg-sand-50">
                <tr className="text-[10.5px] font-black text-sand-600">
                  {[
                    "العميل",
                    "المصدر",
                    "الاهتمام",
                    "المرحلة",
                    "المسؤول",
                    "آخر تواصل",
                    "المهمة القادمة",
                    "",
                  ].map((head) => (
                    <th key={head} className="px-3 py-2.5 text-start">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const task = nextTask(lead);
                  return (
                    <tr
                      key={lead.id}
                      className="border-t border-sand-100 text-[11.5px] transition hover:bg-gold-50/30"
                    >
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveId(lead.id)}
                          className="text-start"
                        >
                          <span className="block font-black text-ocean-900">
                            {lead.name}
                          </span>
                          <span
                            className="block text-[10px] font-semibold text-sand-500"
                            dir="ltr"
                          >
                            {lead.phone || "—"}
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-full border border-sand-200 bg-white px-2 py-0.5 text-[9.5px] font-bold text-sand-600">
                          {CRM_SOURCE_LABEL[lead.source]}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-3 py-2.5">
                        <span className="line-clamp-2 font-semibold text-sand-700">
                          {lead.interest || "—"}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-sand-500">
                          {lead.city || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {canManage ? (
                          <select
                            value={lead.stage}
                            onChange={(event) =>
                              moveLead(lead.id, event.target.value as CrmStage)
                            }
                            className={`rounded-full border px-2 py-1 text-[10px] font-bold outline-none ${CRM_STAGE_STYLE[lead.stage]}`}
                          >
                            {CRM_STAGES.map((stage) => (
                              <option key={stage.key} value={stage.key}>
                                {stage.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`rounded-full border px-2 py-1 text-[10px] font-bold ${CRM_STAGE_STYLE[lead.stage]}`}
                          >
                            {CRM_STAGE_LABEL[lead.stage]}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-sand-700">
                        {lead.assignedToName || "بدون"}
                      </td>
                      <td className="px-3 py-2.5 text-sand-600">
                        {relative(lead.updatedAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        {task ? (
                          <span
                            className={`font-semibold ${
                              isOverdue(task) ? "text-rose-600" : "text-sand-700"
                            }`}
                          >
                            {task.title}
                            <span className="block text-[9.5px] text-sand-500">
                              {dateTimeFmt.format(new Date(task.dueAt))}
                            </span>
                          </span>
                        ) : (
                          <span className="text-sand-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveId(lead.id)}
                          className={ROW_ACTION}
                        >
                          فتح
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-3 py-8 text-center text-[12px] font-semibold text-sand-500"
                    >
                      لا توجد نتائج مطابقة للبحث أو الفلاتر
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {createOpen && (
        <CreateLeadModal
          users={users}
          canAssign={canAssign}
          actor={actor}
          onClose={() => setCreateOpen(false)}
          onCreated={(lead) => {
            setCreateOpen(false);
            setActiveId(lead.id);
            notify(`تمت إضافة العميل «${lead.name}»`);
            log("إضافة عميل", `تمت إضافة العميل «${lead.name}»`);
          }}
        />
      )}

      {activeLead && (
        <LeadDetailModal
          lead={activeLead}
          users={users}
          canManage={canManage}
          canAssign={canAssign}
          actor={actor}
          onClose={() => setActiveId(null)}
          onNotify={notify}
          onLog={log}
          onDeleted={() => {
            setActiveId(null);
            notify("تم حذف العميل");
            log("حذف عميل", `تم حذف العميل «${activeLead.name}»`);
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number | string;
  Icon: typeof Users;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border p-3 ${tone}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold opacity-80">{label}</span>
        <Icon className="h-3.5 w-3.5 opacity-70" />
      </div>
      <p className="mt-1.5 text-xl font-black leading-none">{value}</p>
    </div>
  );
}

function LeadCard({
  lead,
  canManage,
  dragging,
  onOpen,
  onDragStart,
  onDragEnd,
  onStageChange,
}: {
  lead: CrmLead;
  canManage: boolean;
  dragging: boolean;
  onOpen: () => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onStageChange: (stage: CrmStage) => void;
}) {
  const task = nextTask(lead);
  return (
    <div
      draggable={canManage}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={`cursor-pointer rounded-2xl border bg-white p-2.5 shadow-[0_14px_30px_-26px_rgba(20,26,51,0.55)] transition hover:-translate-y-0.5 hover:border-gold-300 ${
        dragging ? "border-gold-400 opacity-60" : "border-sand-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-black text-ocean-900">
            {lead.name}
          </p>
          <p
            className="mt-0.5 truncate text-[10px] font-semibold text-sand-500"
            dir="ltr"
          >
            {lead.phone || "بدون رقم"}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-sand-200 bg-sand-50 px-1.5 py-0.5 text-[8.5px] font-bold text-sand-600">
          {CRM_SOURCE_LABEL[lead.source]}
        </span>
      </div>

      {lead.interest && (
        <p className="mt-1.5 line-clamp-2 text-[10.5px] font-semibold leading-5 text-sand-700">
          {lead.interest}
        </p>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        {lead.city && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-sand-50 px-1.5 py-0.5 text-[8.5px] font-bold text-sand-600">
            <MapPin className="h-2.5 w-2.5" /> {lead.city}
          </span>
        )}
        {typeof lead.budget === "number" && lead.budget > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-gold-50 px-1.5 py-0.5 text-[8.5px] font-bold text-gold-700">
            <Wallet className="h-2.5 w-2.5" /> {money(lead.budget)}
          </span>
        )}
      </div>

      {task && (
        <p
          className={`mt-2 flex items-center gap-1 rounded-lg px-1.5 py-1 text-[9px] font-bold ${
            isOverdue(task)
              ? "bg-rose-50 text-rose-600"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          <CalendarClock className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{task.title}</span>
          <span className="ms-auto shrink-0 opacity-80">
            {dateTimeFmt.format(new Date(task.dueAt))}
          </span>
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-1 border-t border-dashed border-sand-100 pt-1.5">
        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-sand-500">
          {lead.assignedToName ? (
            <>
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ocean-950 text-[7px] font-black text-white">
                {initials(lead.assignedToName)}
              </span>
              {lead.assignedToName}
            </>
          ) : (
            <>
              <UserCheck className="h-3 w-3" /> بدون مسؤول
            </>
          )}
        </span>
        <span className="text-[8.5px] font-semibold text-sand-400">
          {relative(lead.updatedAt)}
        </span>
      </div>

      {canManage && (
        <select
          value={lead.stage}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onStageChange(event.target.value as CrmStage)}
          aria-label="تغيير مرحلة العميل"
          className="mt-1.5 w-full rounded-lg border border-sand-200 bg-sand-50/60 px-1.5 py-1 text-[9px] font-bold text-sand-600 outline-none focus:border-gold-400"
        >
          {CRM_STAGES.map((stage) => (
            <option key={stage.key} value={stage.key}>
              نقل إلى: {stage.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function CreateLeadModal({
  users,
  canAssign,
  actor,
  onClose,
  onCreated,
}: {
  users: AdminUser[];
  canAssign: boolean;
  actor: string;
  onClose: () => void;
  onCreated: (lead: CrmLead) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<CrmSource>("manual");
  const [interest, setInterest] = useState("");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [stage, setStage] = useState<CrmStage>("new");
  const [assignedTo, setAssignedTo] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (!name.trim()) {
      setError("اسم العميل مطلوب");
      return;
    }
    const assignee = users.find((user) => user.id === assignedTo);
    const lead = createCrmLead({
      name,
      phone,
      email,
      source,
      interest,
      city,
      budget: budget.trim() ? Number(budget) : undefined,
      stage,
      assignedTo: canAssign ? assignedTo || undefined : undefined,
      assignedToName: canAssign ? assignee?.name : undefined,
      tags: tags.split(/[,،]/),
      notes,
      createdBy: actor,
    });
    if (!lead) {
      setError("تعذر حفظ العميل — تحقق من البيانات وحاول مرة أخرى");
      return;
    }
    onCreated(lead);
  };

  return (
    <ModalShell onClose={onClose} label="إضافة عميل جديد" width="max-w-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-sand-200 px-5 py-4">
        <div>
          <h3 className="text-[16px] font-black text-ocean-900">
            إضافة عميل جديد
          </h3>
          <p className="mt-0.5 text-[10.5px] font-semibold text-sand-500">
            بيانات العميل تظهر للإدارة فقط.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="rounded-xl p-1.5 text-sand-500 transition hover:bg-sand-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
            الاسم *
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="اسم العميل"
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
            الهاتف
          </span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="01xxxxxxxxx"
            dir="ltr"
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
            البريد الإلكتروني
          </span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            dir="ltr"
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
            المصدر
          </span>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as CrmSource)}
            className={INPUT}
          >
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
            العميل مهتم بإيه؟
          </span>
          <input
            value={interest}
            onChange={(event) => setInterest(event.target.value)}
            placeholder="مثال: شقة 3 غرف في دمياط الجديدة"
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
            المدينة
          </span>
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="دمياط الجديدة"
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
            الميزانية (ج.م)
          </span>
          <input
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
            inputMode="numeric"
            placeholder="1500000"
            dir="ltr"
            className={INPUT}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
            المرحلة
          </span>
          <select
            value={stage}
            onChange={(event) => setStage(event.target.value as CrmStage)}
            className={INPUT}
          >
            {CRM_STAGES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {canAssign && (
          <label className="block">
            <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
              المسؤول
            </span>
            <select
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
              className={INPUT}
            >
              <option value="">بدون مسؤول</option>
              {users
                .filter((user) => user.active)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
            وسوم (افصل بينها بفاصلة)
          </span>
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="مثال: شقة، استثمار، مستعجل"
            className={INPUT}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
            ملاحظات
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            className={INPUT}
            placeholder="أي تفاصيل تساعد فريق المتابعة..."
          />
        </label>

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] font-bold text-rose-700 sm:col-span-2">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-sand-200 bg-sand-50/50 px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-sand-200 bg-white px-4 py-2 text-[11.5px] font-bold text-sand-700 transition hover:bg-sand-50"
        >
          إلغاء
        </button>
        <button type="button" onClick={submit} className={BTN_GOLD}>
          <UserPlus className="h-4 w-4" /> حفظ العميل
        </button>
      </div>
    </ModalShell>
  );
}

function LeadDetailModal({
  lead,
  users,
  canManage,
  canAssign,
  actor,
  onClose,
  onNotify,
  onLog,
  onDeleted,
}: {
  lead: CrmLead;
  users: AdminUser[];
  canManage: boolean;
  canAssign: boolean;
  actor: string;
  onClose: () => void;
  onNotify: (message: string) => void;
  onLog: (action: string, details: string) => void;
  onDeleted: () => void;
}) {
  const [note, setNote] = useState("");
  const [noteKind, setNoteKind] = useState<CrmActivityKind>("note");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState(defaultTaskDue);
  const [tagsText, setTagsText] = useState(lead.tags.join(", "));
  const [notesText, setNotesText] = useState(lead.notes ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    setNote("");
    setNoteKind("note");
    setTaskTitle("");
    setTaskDue(defaultTaskDue());
    setTagsText(lead.tags.join(", "));
    setNotesText(lead.notes ?? "");
    setError("");
    // إعادة التهيئة عند الانتقال لعميل آخر فقط، حتى لا تُمحى الكتابة أثناء التحديث
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  const stage = CRM_STAGE_LABEL[lead.stage];
  const digits = waNumber(lead.phone);

  const saveNote = () => {
    if (!note.trim()) {
      setError("اكتب نص الملاحظة أو سجل التواصل أولًا");
      return;
    }
    if (addCrmActivity(lead.id, noteKind, note, actor)) {
      setNote("");
      setError("");
      onNotify("تمت إضافة السجل");
      onLog(
        "تسجيل تواصل",
        `${CRM_ACTIVITY_LABEL[noteKind]} مع العميل «${lead.name}»`
      );
    }
  };

  const saveTask = () => {
    if (!taskTitle.trim()) {
      setError("اكتب عنوان المهمة");
      return;
    }
    const due = taskDue ? new Date(taskDue) : new Date();
    const iso = Number.isFinite(due.getTime())
      ? due.toISOString()
      : new Date().toISOString();
    if (addCrmTask(lead.id, taskTitle, iso, actor)) {
      setTaskTitle("");
      setTaskDue(defaultTaskDue());
      setError("");
      onNotify("تمت إضافة المهمة");
      onLog("إضافة مهمة", `مهمة متابعة للعميل «${lead.name}»`);
    }
  };

  const saveTags = () => {
    const tags = tagsText
      .split(/[,،]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (updateCrmLead(lead.id, { tags })) {
      onNotify("تم حفظ الوسوم");
    }
  };

  const saveNotes = () => {
    if (updateCrmLead(lead.id, { notes: notesText.trim() || undefined })) {
      onNotify("تم حفظ الملاحظات");
    }
  };

  const removeLead = () => {
    if (!canManage) return;
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف العميل «${lead.name}»؟ لا يمكن التراجع.`
    );
    if (!confirmed) return;
    if (deleteCrmLead(lead.id)) onDeleted();
  };

  const assigned = users.find((user) => user.id === lead.assignedTo);

  return (
    <ModalShell onClose={onClose} label={`ملف العميل ${lead.name}`} width="max-w-4xl">
      <div className="sticky top-0 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-sand-200 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-800 to-ocean-950 text-[13px] font-black text-gold-300">
            {initials(lead.name)}
          </span>
          <div>
            <h3 className="text-[18px] font-black leading-7 text-ocean-900">
              {lead.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full border px-2 py-0.5 text-[9.5px] font-bold ${CRM_STAGE_STYLE[lead.stage]}`}
              >
                {stage}
              </span>
              <span className="rounded-full border border-sand-200 bg-sand-50 px-2 py-0.5 text-[9.5px] font-bold text-sand-600">
                {CRM_SOURCE_LABEL[lead.source]}
              </span>
              {lead.reference && (
                <span className="rounded-full border border-sand-200 bg-white px-2 py-0.5 text-[9.5px] font-bold text-sand-500">
                  {lead.reference}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="rounded-xl p-1.5 text-sand-500 transition hover:bg-sand-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-sand-200 bg-white p-4">
            <h4 className="text-[12px] font-black text-ocean-900">
              مرحلة المتابعة
            </h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CRM_STAGES.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  disabled={!canManage}
                  onClick={() => {
                    if (!canManage || item.key === lead.stage) return;
                    if (changeCrmStage(lead.id, item.key, actor)) {
                      onNotify(`تم نقل العميل إلى «${item.label}»`);
                      onLog(
                        "تغيير مرحلة عميل",
                        `«${lead.name}» → ${item.label}`
                      );
                    }
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition ${
                    item.key === lead.stage
                      ? item.chip
                      : "border-sand-200 bg-white text-sand-600 hover:border-gold-300 hover:bg-gold-50/40 disabled:cursor-not-allowed disabled:opacity-60"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {canAssign && (
              <label className="mt-3 block">
                <span className="mb-1 block text-[10.5px] font-extrabold text-sand-600">
                  المسؤول عن المتابعة
                </span>
                <select
                  value={lead.assignedTo ?? ""}
                  onChange={(event) => {
                    const userId = event.target.value;
                    const user = users.find((item) => item.id === userId);
                    if (
                      assignCrmLead(
                        lead.id,
                        userId || undefined,
                        user?.name,
                        actor
                      )
                    ) {
                      onNotify(
                        user ? `تم إسناد العميل إلى ${user.name}` : "تم إلغاء الإسناد"
                      );
                      onLog(
                        "إسناد عميل",
                        user
                          ? `«${lead.name}» → ${user.name}`
                          : `إلغاء إسناد «${lead.name}»`
                      );
                    }
                  }}
                  className={INPUT}
                >
                  <option value="">بدون مسؤول</option>
                  {users
                    .filter((user) => user.active)
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
          </section>

          <section className="rounded-2xl border border-sand-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[12px] font-black text-ocean-900">
                سجل التواصل
              </h4>
              <span className="text-[10px] font-bold text-sand-500">
                {lead.activities.length} سجل
              </span>
            </div>

            {canManage && (
              <div className="mt-3 space-y-2 rounded-2xl bg-sand-50/60 p-3">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      "note",
                      "call",
                      "whatsapp",
                      "meeting",
                      "email",
                    ] as CrmActivityKind[]
                  ).map((kind) => {
                    const Icon = activityIcon(kind);
                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => setNoteKind(kind)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9.5px] font-bold transition ${
                          noteKind === kind
                            ? "border-ocean-900 bg-ocean-950 text-white"
                            : "border-sand-200 bg-white text-sand-600 hover:bg-sand-50"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {CRM_ACTIVITY_LABEL[kind]}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") saveNote();
                    }}
                    placeholder="اكتب ما حدث في المكالمة أو الملاحظة..."
                    className={INPUT}
                  />
                  <button
                    type="button"
                    onClick={saveNote}
                    className={`${BTN_PRIMARY} shrink-0`}
                  >
                    <Plus className="h-4 w-4" /> إضافة
                  </button>
                </div>
              </div>
            )}

            <ol className="mt-3 space-y-3">
              {lead.activities.map((entry) => {
                const Icon = activityIcon(entry.kind);
                return (
                  <li key={entry.id} className="flex gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sand-200 bg-sand-50 text-sand-600">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 border-b border-dashed border-sand-100 pb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10.5px] font-black text-ocean-900">
                          {CRM_ACTIVITY_LABEL[entry.kind]}
                        </span>
                        <span className="text-[9.5px] font-semibold text-sand-500">
                          {dateTimeFmt.format(new Date(entry.at))} · {entry.by}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-semibold leading-5 text-sand-700">
                        {entry.kind === "stage" && entry.fromStage && entry.toStage
                          ? `من «${CRM_STAGE_LABEL[entry.fromStage]}» إلى «${CRM_STAGE_LABEL[entry.toStage]}»`
                          : entry.text}
                      </p>
                    </div>
                  </li>
                );
              })}
              {lead.activities.length === 0 && (
                <li className="rounded-xl bg-sand-50 px-3 py-4 text-center text-[10.5px] font-semibold text-sand-500">
                  لا يوجد سجل تواصل بعد
                </li>
              )}
            </ol>
          </section>

          <section className="rounded-2xl border border-sand-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[12px] font-black text-ocean-900">
                المهام والتذكيرات
              </h4>
              <span className="text-[10px] font-bold text-sand-500">
                {lead.tasks.filter((task) => !task.done).length} مفتوحة
              </span>
            </div>

            {canManage && (
              <div className="mt-3 flex flex-col gap-2 rounded-2xl bg-sand-50/60 p-3 sm:flex-row">
                <input
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="مثال: متابعة سعر الشقة"
                  className={INPUT}
                />
                <input
                  type="datetime-local"
                  value={taskDue}
                  onChange={(event) => setTaskDue(event.target.value)}
                  className={`${INPUT} shrink-0 sm:w-[190px]`}
                />
                <button
                  type="button"
                  onClick={saveTask}
                  className={`${BTN_PRIMARY} shrink-0`}
                >
                  <Plus className="h-4 w-4" /> مهمة
                </button>
              </div>
            )}

            <ul className="mt-3 space-y-2">
              {lead.tasks
                .slice()
                .sort((a, b) => {
                  if (a.done !== b.done) return a.done ? 1 : -1;
                  return a.dueAt.localeCompare(b.dueAt);
                })
                .map((task) => (
                  <li
                    key={task.id}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                      task.done
                        ? "border-sand-100 bg-sand-50/40"
                        : isOverdue(task)
                          ? "border-rose-200 bg-rose-50/60"
                          : "border-sand-200 bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={!canManage}
                      onClick={() =>
                        toggleCrmTask(lead.id, task.id, !task.done)
                      }
                      aria-label={task.done ? "إعادة فتح المهمة" : "إنجاز المهمة"}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        task.done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-sand-300 bg-white text-transparent hover:border-emerald-400"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[11px] font-bold ${
                          task.done
                            ? "text-sand-400 line-through"
                            : "text-ocean-900"
                        }`}
                      >
                        {task.title}
                      </p>
                      <p
                        className={`text-[9.5px] font-semibold ${
                          isOverdue(task) ? "text-rose-600" : "text-sand-500"
                        }`}
                      >
                        {dateTimeFmt.format(new Date(task.dueAt))}
                        {isOverdue(task) ? " · متأخرة" : ""}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => deleteCrmTask(lead.id, task.id)}
                        aria-label="حذف المهمة"
                        className="rounded-lg p-1 text-sand-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              {lead.tasks.length === 0 && (
                <li className="rounded-xl bg-sand-50 px-3 py-4 text-center text-[10.5px] font-semibold text-sand-500">
                  لا توجد مهام — أضف تذكير متابعة حتى لا يضيع العميل
                </li>
              )}
            </ul>
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-sand-200 bg-white p-4">
            <h4 className="text-[12px] font-black text-ocean-900">
              بيانات التواصل
            </h4>
            <dl className="mt-2 space-y-2 text-[11px]">
              <InfoRow
                Icon={Phone}
                label="الهاتف"
                value={lead.phone || "—"}
                ltr
              />
              <InfoRow
                Icon={Mail}
                label="البريد"
                value={lead.email || "—"}
                ltr
              />
              <InfoRow
                Icon={MapPin}
                label="المدينة"
                value={lead.city || "—"}
              />
              <InfoRow
                Icon={Wallet}
                label="الميزانية"
                value={money(lead.budget)}
              />
              <InfoRow
                Icon={FileText}
                label="الاهتمام"
                value={lead.interest || "—"}
              />
              <InfoRow
                Icon={UserCheck}
                label="المسؤول"
                value={assigned?.name || lead.assignedToName || "بدون"}
              />
              <InfoRow
                Icon={Clock}
                label="أضيف في"
                value={dateFmt.format(new Date(lead.createdAt))}
              />
            </dl>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {digits && (
                <>
                  <a
                    href={`tel:+${digits}`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-ocean-200 bg-ocean-50 px-2 py-1.5 text-[10px] font-bold text-ocean-800 transition hover:bg-ocean-100"
                  >
                    <Phone className="h-3 w-3" /> اتصال
                  </a>
                  <a
                    href={`https://wa.me/${digits}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[10px] font-bold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <MessageCircle className="h-3 w-3" /> واتساب
                  </a>
                </>
              )}
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-sand-200 bg-sand-50 px-2 py-1.5 text-[10px] font-bold text-sand-700 transition hover:bg-sand-100"
                >
                  <Mail className="h-3 w-3" /> بريد
                </a>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-sand-200 bg-white p-4">
            <h4 className="flex items-center gap-1.5 text-[12px] font-black text-ocean-900">
              <Tag className="h-3.5 w-3.5" /> الوسوم
            </h4>
            {canManage ? (
              <div className="mt-2 space-y-2">
                <input
                  value={tagsText}
                  onChange={(event) => setTagsText(event.target.value)}
                  placeholder="شقة، استثمار، مستعجل"
                  className={INPUT}
                />
                <button
                  type="button"
                  onClick={saveTags}
                  className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3 py-1.5 text-[10.5px] font-bold text-sand-700 transition hover:bg-sand-100"
                >
                  حفظ الوسوم
                </button>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1">
                {lead.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-sand-50 px-2 py-0.5 text-[9.5px] font-bold text-sand-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-sand-200 bg-white p-4">
            <h4 className="text-[12px] font-black text-ocean-900">ملاحظات</h4>
            {canManage ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={notesText}
                  onChange={(event) => setNotesText(event.target.value)}
                  rows={4}
                  className={INPUT}
                  placeholder="تفاصيل ثابتة عن العميل..."
                />
                <button
                  type="button"
                  onClick={saveNotes}
                  className="w-full rounded-xl border border-sand-200 bg-sand-50 px-3 py-1.5 text-[10.5px] font-bold text-sand-700 transition hover:bg-sand-100"
                >
                  حفظ الملاحظات
                </button>
              </div>
            ) : (
              <p className="mt-2 text-[11px] leading-6 text-sand-700">
                {lead.notes || "لا توجد ملاحظات"}
              </p>
            )}
          </section>

          {canManage && (
            <button
              type="button"
              onClick={removeLead}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[10.5px] font-bold text-rose-700 transition hover:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" /> حذف العميل نهائيًا
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mx-5 mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] font-bold text-rose-700">
          {error}
        </p>
      )}
    </ModalShell>
  );
}

function InfoRow({
  Icon,
  label,
  value,
  ltr,
}: {
  Icon: typeof Phone;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2 border-b border-dashed border-sand-100 pb-1.5 last:border-0">
      <dt className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-sand-500">
        <Icon className="h-3 w-3" /> {label}
      </dt>
      <dd
        className={`text-end font-bold text-ocean-900 ${ltr ? "text-[10.5px]" : "text-[10.5px]"}`}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

function ModalShell({
  children,
  onClose,
  label,
  width,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
  width: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-ocean-950/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`mx-auto my-3 w-full ${width} overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-2xl`}
      >
        {children}
      </div>
    </div>
  );
}
