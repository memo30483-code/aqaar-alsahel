"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Building2,
  CalendarClock,
  Check,
  CircleAlert,
  ExternalLink,
  Eye,
  FileSearch,
  Filter,
  Flame,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCcw,
  Save,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  addAdminLog,
  saveSiteSettings,
  type AdminUser,
  type SiteSettings,
} from "@/lib/admin-system";
import { getSession } from "@/lib/session";
import {
  DEFAULT_PROPERTY_REQUEST_SETTINGS,
  PROPERTY_REQUEST_PRIORITY_LABEL,
  PROPERTY_REQUEST_PRIORITY_STYLE,
  PROPERTY_REQUEST_STATUSES,
  PROPERTY_REQUEST_STATUS_LABEL,
  PROPERTY_REQUEST_STATUS_STYLE,
  normalizePropertyRequestSettings,
  propertyRequestPublicTitle,
  propertyRequestSummary,
  type PropertyRequest,
  type PropertyRequestPriority,
  type PropertyRequestStatus,
  type PropertyRequestsSettings,
} from "@/lib/property-requests";
import AdminReviewPanel from "@/components/admin/AdminReviewPanel";
import { REVIEW_STAGE_LABEL, REVIEW_STAGE_STYLE, type ReviewRecord, type ReviewStage } from "@/lib/workflow";
import {
  BTN_GOLD,
  BTN_PRIMARY,
  Field,
  INPUT,
  Panel,
  ToggleRow,
} from "@/components/admin/shared";

interface Props {
  users: AdminUser[];
  settings: SiteSettings;
  can: (key: string) => boolean;
  onSettingsChange: (settings: SiteSettings) => void;
  onCountChange: (count: number) => void;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

interface AdminMatch {
  propertyId: string;
  score: number;
  reasons: string[];
  overBudget: boolean;
  priceOnRequest: boolean;
  title: string;
  city: string;
  district: string;
  type: string;
  area: number;
  rooms: number;
  bathrooms: number;
  price: number;
  image: string;
  sent: boolean;
}

interface DetailState {
  request: PropertyRequest;
  matches: AdminMatch[];
}

const SELECT = `${INPUT} appearance-none`;

function dateLabel(value: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function money(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "مرن";
  return new Intl.NumberFormat("ar-EG").format(value) + " ج.م";
}

function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function whatsappHref(item: PropertyRequest): string {
  const digits = item.phone.replace(/\D/g, "");
  const message = `أهلاً ${item.name}، معك إدارة عقار FAMILY بخصوص طلب العقار ${item.reference}: ${propertyRequestSummary(item.brief)}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

const TEXT_FIELDS: Array<{
  key: keyof PropertyRequestsSettings;
  label: string;
  rows?: number;
}> = [
  { key: "pageTitleAr", label: "عنوان صفحة الطلب — عربي" },
  { key: "pageTitleEn", label: "Page title — English" },
  { key: "pageSubtitleAr", label: "وصف صفحة الطلب — عربي", rows: 3 },
  { key: "pageSubtitleEn", label: "Page description — English", rows: 3 },
  { key: "ctaLabelAr", label: "نص زر الإرسال — عربي" },
  { key: "ctaLabelEn", label: "Submit button — English" },
  { key: "successNoteAr", label: "رسالة النجاح — عربي", rows: 3 },
  { key: "successNoteEn", label: "Success message — English", rows: 3 },
  { key: "directoryTitleAr", label: "عنوان صفحة العقارات المطلوبة — عربي" },
  { key: "directoryTitleEn", label: "Wanted page title — English" },
  { key: "directorySubtitleAr", label: "وصف صفحة العقارات المطلوبة — عربي", rows: 3 },
  { key: "directorySubtitleEn", label: "Wanted page description — English", rows: 3 },
  { key: "directoryEmptyAr", label: "رسالة عدم وجود طلبات منشورة — عربي", rows: 2 },
  { key: "directoryEmptyEn", label: "Empty directory message — English", rows: 2 },
  { key: "contactNoteAr", label: "تنويه الخصوصية — عربي", rows: 2 },
  { key: "contactNoteEn", label: "Privacy note — English", rows: 2 },
];

export default function AdminPropertyRequestsTab({
  users,
  settings,
  can,
  onSettingsChange,
  onCountChange,
  notify,
  reloadLogs,
}: Props) {
  const canManage = can("propertyRequests.manage");
  const session = typeof window !== "undefined" ? getSession() : null;
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewStages, setReviewStages] = useState<Record<string, ReviewStage>>({});
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyRequestStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | PropertyRequestPriority>("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<PropertyRequestsSettings>(() =>
    normalizePropertyRequestSettings(settings.propertyRequests)
  );

  useEffect(() => {
    setSettingsDraft(normalizePropertyRequestSettings(settings.propertyRequests));
  }, [settings.propertyRequests]);

  const log = useCallback(
    (action: string, detailsText: string, meta?: Record<string, unknown>) => {
      if (!session) return;
      addAdminLog({
        action,
        category: "propertyRequests",
        performedBy: session.email,
        performedByName: session.name,
        performedByRole: session.role ?? "admin",
        details: detailsText,
        meta,
      });
      reloadLogs();
    },
    [reloadLogs, session]
  );

  const loadList = useCallback(async (keepSelection = true) => {
    setLoading(true);
    setListError("");
    try {
      const response = await fetch("/api/admin/property-requests", {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        error?: string;
        requests?: PropertyRequest[];
      };
      if (!response.ok) throw new Error(data.error || "تعذر قراءة الطلبات");
      const items = Array.isArray(data.requests) ? data.requests : [];
      setRequests(items);
      onCountChange(items.filter((item) => item.status === "new").length);
      setSelectedId((current) => {
        if (keepSelection && current && items.some((item) => item.id === current)) {
          return current;
        }
        return items[0]?.id ?? null;
      });
    } catch (error) {
      setListError(error instanceof Error ? error.message : "تعذر قراءة الطلبات");
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(
        `/api/admin/property-requests/${encodeURIComponent(id)}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as {
        error?: string;
        request?: PropertyRequest;
        matches?: AdminMatch[];
      };
      if (!response.ok || !data.request) {
        throw new Error(data.error || "تعذر قراءة تفاصيل الطلب");
      }
      setDetail({
        request: data.request,
        matches: Array.isArray(data.matches) ? data.matches : [],
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر قراءة التفاصيل");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadList(false);
  }, [loadList]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
  }, [loadDetail, selectedId]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/review?scope=propertyRequests", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { records?: ReviewRecord[] };
        if (!cancelled) {
          setReviewStages(Object.fromEntries((data.records ?? []).map((item) => [item.itemId, item.stage])));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const updateLocal = useCallback((updated: PropertyRequest) => {
    setRequests((items) =>
      items.map((item) => (item.id === updated.id ? updated : item))
    );
    setDetail((current) =>
      current && current.request.id === updated.id
        ? { ...current, request: updated }
        : current
    );
  }, []);

  const patchRequest = async (
    patch: Record<string, unknown>,
    successMessage: string,
    logAction = "property_request.update"
  ): Promise<PropertyRequest | null> => {
    if (!detail || !canManage || saving) return null;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/property-requests/${encodeURIComponent(detail.request.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...patch,
            expectedVersion: detail.request.version,
          }),
        }
      );
      const data = (await response.json()) as {
        error?: string;
        request?: PropertyRequest;
      };
      if (!response.ok || !data.request) {
        throw new Error(data.error || "تعذر حفظ التعديل");
      }
      updateLocal(data.request);
      onCountChange(
        requests
          .map((item) => (item.id === data.request!.id ? data.request! : item))
          .filter((item) => item.status === "new").length
      );
      notify(successMessage);
      log(logAction, `${successMessage} — ${data.request.reference}`, {
        requestId: data.request.id,
        reference: data.request.reference,
      });
      return data.request;
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر حفظ التعديل");
      if (error instanceof Error && error.message.includes("جهاز آخر")) {
        void loadDetail(detail.request.id);
      }
      return null;
    } finally {
      setSaving(false);
    }
  };

  const recordContact = (channel: "الهاتف" | "واتساب" | "البريد") => {
    if (!detail || !canManage) return;
    const status = ["won", "closed"].includes(detail.request.status)
      ? detail.request.status
      : "contacted";
    void patchRequest(
      { status, contactText: `تواصلت الإدارة مع العميل عبر ${channel}.` },
      `تم تسجيل التواصل عبر ${channel}`,
      "property_request.contact"
    );
  };

  const toggleSent = async (propertyId: string) => {
    if (!detail) return;
    const already = detail.request.sentPropertyIds.includes(propertyId);
    const sentPropertyIds = already
      ? detail.request.sentPropertyIds.filter((id) => id !== propertyId)
      : [...detail.request.sentPropertyIds, propertyId];
    const updated = await patchRequest(
      {
        sentPropertyIds,
        ...(!already && ["new", "searching"].includes(detail.request.status)
          ? { status: "matched" }
          : {}),
      },
      already ? "تم إلغاء ترشيح العقار" : "تم إرسال الترشيح للعميل",
      already ? "property_request.match.remove" : "property_request.match.send"
    );
    if (updated) {
      setDetail((current) =>
        current
          ? {
              ...current,
              request: updated,
              matches: current.matches.map((match) =>
                match.propertyId === propertyId
                  ? { ...match, sent: !already }
                  : match
              ),
            }
          : current
      );
    }
  };

  const deleteSelected = async () => {
    if (!detail || !canManage || saving) return;
    if (!window.confirm(`حذف الطلب ${detail.request.reference} نهائيًا؟`)) return;
    setSaving(true);
    try {
      const response = await fetch(
        `/api/admin/property-requests/${encodeURIComponent(detail.request.id)}`,
        { method: "DELETE" }
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "تعذر حذف الطلب");
      log("property_request.delete", `حذف طلب ${detail.request.reference}`, {
        requestId: detail.request.id,
      });
      notify("تم حذف الطلب");
      setDetail(null);
      setSelectedId(null);
      await loadList(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر حذف الطلب");
    } finally {
      setSaving(false);
    }
  };

  const saveFeatureSettings = () => {
    if (!canManage) return;
    const next: SiteSettings = {
      ...settings,
      propertyRequests: settingsDraft,
    };
    if (!saveSiteSettings(next)) {
      notify("تعذر حفظ الإعدادات في المتصفح");
      return;
    }
    onSettingsChange(next);
    notify("تم حفظ إعدادات العقار المطلوب");
    log(
      "property_request.settings.update",
      "تحديث إعدادات ونصوص ميزة العقار المطلوب"
    );
  };

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
      if (!needle) return true;
      return [
        item.reference,
        item.name,
        item.phone,
        item.email,
        propertyRequestSummary(item.brief),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [priorityFilter, query, requests, statusFilter]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      new: requests.filter((item) => item.status === "new").length,
      active: requests.filter((item) =>
        ["searching", "matched", "contacted"].includes(item.status)
      ).length,
      won: requests.filter((item) => item.status === "won").length,
      hot: requests.filter((item) => item.priority === "hot").length,
      published: requests.filter((item) => item.published).length,
    }),
    [requests]
  );

  const staff = users.filter(
    (user) => user.active && ["agent", "moderator", "admin", "super_admin"].includes(user.role)
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { label: "إجمالي الطلبات", value: stats.total, Icon: FileSearch, color: "text-ocean-700 bg-ocean-50" },
          { label: "طلبات جديدة", value: stats.new, Icon: BellRing, color: "text-sky-700 bg-sky-50" },
          { label: "تحت المتابعة", value: stats.active, Icon: CalendarClock, color: "text-violet-700 bg-violet-50" },
          { label: "تم البيع", value: stats.won, Icon: Check, color: "text-emerald-700 bg-emerald-50" },
          { label: "طلبات عاجلة", value: stats.hot, Icon: Flame, color: "text-rose-700 bg-rose-50" },
          { label: "منشور للعامة", value: stats.published, Icon: Globe2, color: "text-emerald-700 bg-emerald-50" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon className="h-4 w-4" /></span>
            <p className="mt-3 text-2xl font-black text-ocean-900">{value}</p>
            <p className="mt-1 text-[11px] font-bold text-sand-600">{label}</p>
          </div>
        ))}
      </div>

      <Panel
        title="طلبات العقار والمطابقة"
        desc="بيانات العملاء خاصة بالإدارة. المطابقة تُحسب من الإعلانات المنشورة والمعتمدة فقط."
        actions={
          <>
            <button type="button" onClick={() => setSettingsOpen((value) => !value)} className={BTN_GOLD}>
              {settingsOpen ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
              {settingsOpen ? "إغلاق الإعدادات" : "إعدادات الميزة"}
            </button>
            <button type="button" onClick={() => void loadList()} className={BTN_PRIMARY} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> تحديث
            </button>
          </>
        }
      >
        {settingsOpen && (
          <div className="mb-6 rounded-3xl border border-gold-200 bg-gold-50/40 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black text-ocean-900">تحكم كامل في الخدمة والنصوص</h3>
                <p className="mt-1 text-[11px] leading-5 text-sand-600">التغييرات تظهر للزوار بعد الحفظ والمزامنة السحابية.</p>
              </div>
              <button type="button" onClick={saveFeatureSettings} className={BTN_PRIMARY} disabled={!canManage}>
                <Save className="h-4 w-4" /> حفظ الإعدادات
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ToggleRow title="تشغيل خدمة العقار المطلوب" hint="عند الإيقاف لا يقبل السيرفر طلبات جديدة." checked={settingsDraft.enabled} onChange={(enabled) => setSettingsDraft((current) => ({ ...current, enabled }))} disabled={!canManage} />
              <ToggleRow title="تشغيل صفحة العقارات المطلوبة المنشورة" hint="لا يظهر فيها أي طلب إلا بعد موافقة الأدمن على نشره." checked={settingsDraft.directoryEnabled} onChange={(directoryEnabled) => setSettingsDraft((current) => ({ ...current, directoryEnabled }))} disabled={!canManage} />
              <Field label="من يمكنه إرسال طلب؟" hint="الافتراضي: المسجلون فقط.">
                <select value={settingsDraft.audience} onChange={(event) => setSettingsDraft((current) => ({ ...current, audience: event.target.value === "open" ? "open" : "signed_in" }))} className={SELECT} disabled={!canManage}>
                  <option value="signed_in">المسجلون فقط</option>
                  <option value="open">أي زائر (مع ربط المسجل بحسابه)</option>
                </select>
              </Field>
              <div className="flex items-end">
                <button type="button" onClick={() => setSettingsDraft(DEFAULT_PROPERTY_REQUEST_SETTINGS)} className="rounded-xl border border-sand-200 bg-white px-4 py-2 text-xs font-bold text-sand-700" disabled={!canManage}>استعادة النصوص الافتراضية</button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {TEXT_FIELDS.map((field) => {
                const value = settingsDraft[field.key];
                return (
                  <Field key={field.key} label={field.label}>
                    {field.rows ? (
                      <textarea rows={field.rows} value={typeof value === "string" ? value : ""} onChange={(event) => setSettingsDraft((current) => ({ ...current, [field.key]: event.target.value }))} className={INPUT} disabled={!canManage} />
                    ) : (
                      <input value={typeof value === "string" ? value : ""} onChange={(event) => setSettingsDraft((current) => ({ ...current, [field.key]: event.target.value }))} className={INPUT} disabled={!canManage} />
                    )}
                  </Field>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_190px_170px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${INPUT} ps-9`} placeholder="ابحث بالاسم أو الهاتف أو الرقم المرجعي…" />
          </label>
          <label className="relative">
            <Filter className="pointer-events-none absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-sand-400" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | PropertyRequestStatus)} className={`${SELECT} ps-9`}>
              <option value="all">كل الحالات</option>
              {PROPERTY_REQUEST_STATUSES.map((status) => <option key={status} value={status}>{PROPERTY_REQUEST_STATUS_LABEL[status]}</option>)}
            </select>
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-sand-400" />
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as "all" | PropertyRequestPriority)} className={`${SELECT} ps-9`}>
              <option value="all">كل الأولويات</option>
              <option value="hot">عاجل</option><option value="warm">متوسط</option><option value="cold">عادي</option>
            </select>
          </label>
        </div>

        {listError && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"><CircleAlert className="h-5 w-5" /> {listError}</div>
        )}

        <div className="grid min-h-[560px] gap-4 lg:grid-cols-[330px_1fr]">
          <div className="max-h-[760px] space-y-2 overflow-y-auto rounded-2xl border border-sand-200 bg-sand-50/50 p-2">
            {loading && requests.length === 0 ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gold-600" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-xs font-bold text-sand-500"><FileSearch className="mx-auto mb-3 h-9 w-9 text-sand-300" />لا توجد طلبات مطابقة للفلتر.</div>
            ) : filtered.map((item) => (
              <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-3 text-start transition ${selectedId === item.id ? "border-gold-400 bg-white shadow-sm" : "border-transparent bg-white/70 hover:border-sand-300"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-ocean-900">{item.name}</p>
                    <p dir="ltr" className="mt-0.5 text-start text-[10px] font-bold tracking-wide text-sand-500">{item.reference}</p>
                  </div>
                  {item.status === "new" && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,.12)]" />}
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] font-semibold leading-5 text-sand-700">{propertyRequestSummary(item.brief)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${PROPERTY_REQUEST_STATUS_STYLE[item.status]}`}>{PROPERTY_REQUEST_STATUS_LABEL[item.status]}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${PROPERTY_REQUEST_PRIORITY_STYLE[item.priority]}`}>{PROPERTY_REQUEST_PRIORITY_LABEL[item.priority]}</span>
                  {item.published && <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700">منشور للعامة</span>}
                  {!item.published && <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black ${REVIEW_STAGE_STYLE[reviewStages[item.id] ?? "new"]}`}>{REVIEW_STAGE_LABEL[reviewStages[item.id] ?? "new"]}</span>}
                </div>
                <p className="mt-2 text-[9px] font-semibold text-sand-400">{dateLabel(item.createdAt)}</p>
              </button>
            ))}
          </div>

          <div className="min-w-0 rounded-2xl border border-sand-200 bg-white">
            {detailLoading ? (
              <div className="flex h-full min-h-[420px] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-gold-600" /></div>
            ) : !detail ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center"><Eye className="h-10 w-10 text-sand-300" /><p className="mt-3 text-sm font-black text-ocean-900">اختر طلبًا لعرض التفاصيل والمطابقات</p></div>
            ) : (
              <RequestDetail
                detail={detail}
                staff={staff}
                canManage={canManage}
                can={can}
                saving={saving}
                patchRequest={patchRequest}
                toggleSent={toggleSent}
                recordContact={recordContact}
                deleteSelected={deleteSelected}
                refresh={() => void loadDetail(detail.request.id)}
                notify={notify}
                onReviewDecision={(stage) => setReviewStages((current) => ({ ...current, [detail.request.id]: stage }))}
              />
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function RequestDetail({
  detail,
  staff,
  canManage,
  can,
  saving,
  patchRequest,
  toggleSent,
  recordContact,
  deleteSelected,
  refresh,
  notify,
  onReviewDecision,
}: {
  detail: DetailState;
  staff: AdminUser[];
  canManage: boolean;
  can: (key: string) => boolean;
  saving: boolean;
  patchRequest: (
    patch: Record<string, unknown>,
    success: string,
    action?: string
  ) => Promise<PropertyRequest | null>;
  toggleSent: (propertyId: string) => Promise<void>;
  recordContact: (channel: "الهاتف" | "واتساب" | "البريد") => void;
  deleteSelected: () => Promise<void>;
  refresh: () => void;
  notify: (message: string) => void;
  onReviewDecision: (stage: ReviewStage) => void;
}) {
  const item = detail.request;
  const [notes, setNotes] = useState(item.adminNotes);
  const [publicTitleAr, setPublicTitleAr] = useState(
    item.publicTitleAr || propertyRequestPublicTitle(item.brief)
  );
  const [publicTitleEn, setPublicTitleEn] = useState(item.publicTitleEn);
  const [publicDescriptionAr, setPublicDescriptionAr] = useState(
    item.publicDescriptionAr
  );
  const [publicDescriptionEn, setPublicDescriptionEn] = useState(
    item.publicDescriptionEn
  );

  useEffect(() => setNotes(item.adminNotes), [item.adminNotes, item.id]);
  useEffect(() => {
    setPublicTitleAr(item.publicTitleAr || propertyRequestPublicTitle(item.brief));
    setPublicTitleEn(item.publicTitleEn);
    setPublicDescriptionAr(item.publicDescriptionAr);
    setPublicDescriptionEn(item.publicDescriptionEn);
  }, [item]);

  return (
    <div>
      <header className="border-b border-sand-200 bg-sand-50/60 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span dir="ltr" className="rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-[10px] font-black tracking-wide text-gold-800">{item.reference}</span>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${PROPERTY_REQUEST_STATUS_STYLE[item.status]}`}>{PROPERTY_REQUEST_STATUS_LABEL[item.status]}</span>
            </div>
            <h2 className="mt-3 text-xl font-black text-ocean-900">{item.name}</h2>
            <p className="mt-1 text-xs font-semibold text-sand-600">{propertyRequestSummary(item.brief)}</p>
          </div>
          <button type="button" onClick={() => void deleteSelected()} disabled={!canManage || saving} className="inline-flex items-center gap-1.5 self-start rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 disabled:opacity-40"><Trash2 className="h-3.5 w-3.5" /> حذف</button>
        </div>
      </header>

      <div className="space-y-5 p-4 sm:p-5">
        <AdminReviewPanel
          scope="propertyRequests"
          itemId={item.id}
          can={can}
          notify={notify}
          onDecision={(stage) => {
            onReviewDecision(stage);
            refresh();
          }}
        />

        {can("owner.contact.view") ? <section>
          <h3 className="mb-3 text-xs font-black text-ocean-900">التواصل مع مقدم الطلب</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <a href={phoneHref(item.phone)} onClick={() => recordContact("الهاتف")} className="flex items-center gap-2 rounded-xl border border-sand-200 bg-white p-3 text-xs font-bold text-ocean-800 transition hover:border-gold-300"><Phone className="h-4 w-4 text-sky-600" /><span className="min-w-0 truncate" dir="ltr">{item.phone || "لا يوجد رقم"}</span></a>
            <a href={whatsappHref(item)} target="_blank" rel="noopener noreferrer" onClick={() => recordContact("واتساب")} className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800"><MessageCircle className="h-4 w-4" /> واتساب مباشر</a>
            <a href={`mailto:${item.email}?subject=${encodeURIComponent(`طلب عقار ${item.reference}`)}`} onClick={() => recordContact("البريد")} className="flex items-center gap-2 rounded-xl border border-sand-200 bg-white p-3 text-xs font-bold text-ocean-800"><Mail className="h-4 w-4 text-violet-600" /><span className="min-w-0 truncate" dir="ltr">{item.email}</span></a>
          </div>
        </section> : (
          <p className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-xs font-bold text-sky-800">بيانات مقدم الطلب محجوبة عن هذا الحساب. يستطيع الأدمن منح صلاحية «عرض بيانات مقدم الطلب» عند الحاجة.</p>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <Field label="الحالة">
            <select value={item.status} onChange={(event) => void patchRequest({ status: event.target.value }, "تم تحديث حالة الطلب")} className={SELECT} disabled={!canManage || saving}>
              {PROPERTY_REQUEST_STATUSES.map((status) => <option key={status} value={status}>{PROPERTY_REQUEST_STATUS_LABEL[status]}</option>)}
            </select>
          </Field>
          <Field label="الأولوية">
            <select value={item.priority} onChange={(event) => void patchRequest({ priority: event.target.value }, "تم تحديث أولوية الطلب")} className={SELECT} disabled={!canManage || saving}>
              <option value="hot">عاجل</option><option value="warm">متوسط</option><option value="cold">عادي</option>
            </select>
          </Field>
          <Field label="المسئول عن المتابعة">
            <select value={item.assignedTo ?? ""} onChange={(event) => { const user = staff.find((entry) => entry.id === event.target.value); void patchRequest({ assignedTo: user?.id ?? "", assignedToName: user?.name ?? "" }, "تم إسناد الطلب"); }} className={SELECT} disabled={!canManage || saving}>
              <option value="">غير مسند</option>{staff.map((user) => <option key={user.id} value={user.id}>{user.name} — {user.role}</option>)}
            </select>
          </Field>
        </section>

        <section className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
          <h3 className="flex items-center gap-2 text-xs font-black text-ocean-900"><Building2 className="h-4 w-4 text-gold-600" /> المواصفات المطلوبة</h3>
          <div className="mt-3 grid gap-3 text-[11px] sm:grid-cols-2 lg:grid-cols-3">
            <Spec label="الغرض" value={item.brief.purpose === "بيع" ? "شراء" : "إيجار"} />
            <Spec label="النوع" value={item.brief.types.join("، ") || "مرن"} />
            <Spec label="المدينة" value={item.brief.cities.join("، ") || "مرن"} />
            <Spec label="المنطقة" value={item.brief.districts.join("، ") || "مرن"} />
            <Spec label="الميزانية" value={`${money(item.brief.priceMin)} — ${money(item.brief.priceMax)}`} />
            <Spec label="المساحة" value={`${item.brief.areaMin ?? "—"} — ${item.brief.areaMax ?? "—"} م²`} />
            <Spec label="الغرف / الحمامات" value={`${item.brief.roomsMin ?? "مرن"} / ${item.brief.bathroomsMin ?? "مرن"}`} />
            <Spec label="التشطيب" value={item.brief.finishes.join("، ") || "مرن"} />
            <Spec label="الاستلام" value={item.brief.delivery || "مرن"} />
            {item.brief.saleReason && <Spec label="نوع فرصة البيع" value={item.brief.saleReason} />}
          </div>
          {item.brief.notes && <div className="mt-3 rounded-xl bg-white p-3 text-xs font-semibold leading-6 text-sand-700"><b className="text-ocean-900">ملاحظات العميل:</b> {item.brief.notes}</div>}
        </section>

        <section className={`rounded-2xl border p-4 ${item.published ? "border-emerald-300 bg-emerald-50/40" : "border-gold-200 bg-gold-50/35"}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-xs font-black text-ocean-900"><Globe2 className="h-4 w-4 text-emerald-600" /> النشر في صفحة «عقار مطلوب»</h3>
              <p className="mt-1 text-[10px] leading-5 text-sand-600">لن تظهر أي بيانات شخصية. تُنشر المواصفات والنص العام فقط بعد موافقتك.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.published && <Link href="/wanted-properties" target="_blank" className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[10px] font-black text-emerald-700"><Eye className="h-3.5 w-3.5" /> معاينة</Link>}
              <button
                type="button"
                disabled={!can("propertyRequests.publish") || saving}
                onClick={() => void patchRequest({
                  published: !item.published,
                  publicTitleAr,
                  publicTitleEn,
                  publicDescriptionAr,
                  publicDescriptionEn,
                }, item.published ? "تم إيقاف نشر الطلب" : "تم اعتماد ونشر الطلب للعامة", item.published ? "property_request.unpublish" : "property_request.publish")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black text-white disabled:opacity-50 ${item.published ? "bg-rose-600" : "bg-emerald-600"}`}
              >
                <Globe2 className="h-3.5 w-3.5" /> {item.published ? "إلغاء النشر" : "السماح بالنشر"}
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="العنوان العام — عربي">
              <input value={publicTitleAr} onChange={(event) => setPublicTitleAr(event.target.value)} className={INPUT} maxLength={180} disabled={!canManage} />
            </Field>
            <Field label="Public title — English">
              <input value={publicTitleEn} onChange={(event) => setPublicTitleEn(event.target.value)} className={INPUT} maxLength={180} disabled={!canManage} />
            </Field>
            <Field label="وصف عام اختياري — عربي" hint="لا تنسخ رقم الهاتف أو اسم العميل هنا.">
              <textarea rows={3} value={publicDescriptionAr} onChange={(event) => setPublicDescriptionAr(event.target.value)} className={INPUT} maxLength={1200} disabled={!canManage} />
            </Field>
            <Field label="Public description — English">
              <textarea rows={3} value={publicDescriptionEn} onChange={(event) => setPublicDescriptionEn(event.target.value)} className={INPUT} maxLength={1200} disabled={!canManage} />
            </Field>
          </div>
          <button type="button" onClick={() => void patchRequest({ publicTitleAr, publicTitleEn, publicDescriptionAr, publicDescriptionEn }, "تم حفظ نص النشر العام", "property_request.public_copy")} className={`${BTN_PRIMARY} mt-3`} disabled={!canManage || saving}><Save className="h-3.5 w-3.5" /> حفظ نص النشر</button>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-xs font-black text-ocean-900"><FileSearch className="h-4 w-4 text-gold-600" /> المطابقة الذكية ({detail.matches.length})</h3>
              <p className="mt-1 text-[10px] text-sand-500">اضغط «إرسال للعميل» ليظهر كتوصية مميزة ويرسل تنبيهًا داخل حسابه.</p>
            </div>
          </div>
          {detail.matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sand-300 p-6 text-center text-xs font-bold text-sand-500">لا توجد إعلانات منشورة تطابق الشروط حاليًا.</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {detail.matches.map((match) => (
                <article key={match.propertyId} className={`overflow-hidden rounded-2xl border ${match.sent ? "border-emerald-300 bg-emerald-50/30" : "border-sand-200 bg-white"}`}>
                  <div className="flex gap-3 p-3">
                    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                      {match.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={match.image} alt={match.title} className="h-full w-full object-cover" />
                      ) : <div className="flex h-full items-center justify-center"><Building2 className="h-7 w-7 text-sand-300" /></div>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2"><h4 className="line-clamp-2 text-xs font-black leading-5 text-ocean-900">{match.title}</h4><span className="shrink-0 rounded-full bg-violet-50 px-2 py-1 text-[9px] font-black text-violet-700">{match.score}%</span></div>
                      <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-sand-600"><MapPin className="h-3 w-3 text-gold-600" />{match.city}، {match.district}</p>
                      <p className="mt-1 text-[10px] font-bold text-gold-700">{match.priceOnRequest ? "السعر لدى الإدارة" : money(match.price)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 px-3 pb-2">{match.reasons.map((reason) => <span key={reason} className="rounded-full bg-sand-100 px-2 py-1 text-[8.5px] font-bold text-sand-700">{reason}</span>)}</div>
                  <div className="flex gap-2 border-t border-sand-200 p-2.5">
                    <button type="button" onClick={() => void toggleSent(match.propertyId)} disabled={!canManage || saving} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black disabled:opacity-50 ${match.sent ? "bg-emerald-600 text-white" : "bg-ocean-950 text-white"}`}>{match.sent ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}{match.sent ? "تم الإرسال — إلغاء" : "إرسال للعميل"}</button>
                    <Link href={`/property/${encodeURIComponent(match.propertyId)}`} target="_blank" className="inline-flex items-center justify-center rounded-xl border border-sand-200 px-3 text-ocean-800"><ExternalLink className="h-3.5 w-3.5" /></Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-black text-ocean-900">ملاحظات داخلية</h3><button type="button" onClick={() => void patchRequest({ adminNotes: notes }, "تم حفظ الملاحظات الداخلية")} className={BTN_PRIMARY} disabled={!canManage || saving || notes === item.adminNotes}><Save className="h-3.5 w-3.5" /> حفظ</button></div>
          <textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} className={`${INPUT} mt-2`} placeholder="لا تظهر هذه الملاحظات للعميل…" disabled={!canManage} />
        </section>

        <section>
          <h3 className="mb-3 text-xs font-black text-ocean-900">سجل المتابعة</h3>
          <div className="space-y-2">
            {[...item.history].reverse().map((event) => (
              <div key={event.id} className="flex gap-3 rounded-xl border border-sand-100 bg-sand-50/60 p-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-500" /><div><p className="text-[11px] font-bold leading-5 text-ocean-800">{event.text}</p><p className="mt-1 text-[9px] font-semibold text-sand-500">{event.by} • {dateLabel(event.at)}</p></div></div>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-[10px] font-semibold leading-5 text-sky-800"><UserRound className="h-4 w-4 shrink-0" /> بيانات مقدم الطلب لا تظهر في أي صفحة عامة، والتواصل يتم من خلال الإدارة فقط.</div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return <div><p className="font-bold text-sand-500">{label}</p><p className="mt-1 font-black text-ocean-900">{value}</p></div>;
}
