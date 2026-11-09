"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Infinity as InfinityIcon, Loader2, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import type { AdminUser } from "@/lib/admin-system";
import {
  DEFAULT_WORKFLOW_SETTINGS,
  REVIEW_SCOPE_LABEL,
  isDelegationActive,
  type MembersMode,
  type PublishActorMode,
  type ReviewActorMode,
  type ReviewScope,
  type WorkflowDelegation,
  type WorkflowSettings,
} from "@/lib/workflow";
import { Field, INPUT, Panel } from "@/components/admin/shared";

interface Props {
  users: AdminUser[];
  can: (key: string) => boolean;
  notify: (message: string) => void;
}

const ACTOR_LABEL: Record<ReviewActorMode, string> = {
  admin: "الأدمن فقط",
  staff: "الموظفون المصرح لهم",
  any: "الأدمن أو الموظفون المصرح لهم",
};

const PUBLISH_LABEL: Record<PublishActorMode, string> = {
  admin: "الأدمن فقط",
  staff: "الموظفون المصرح لهم",
  any: "الأدمن أو الموظفون المصرح لهم",
  auto: "نشر تلقائي",
};

const SCOPES: ReviewScope[] = ["listings", "propertyRequests", "professionals"];

export default function AdminWorkflowTab({ users, can, notify }: Props) {
  const [settings, setSettings] = useState<WorkflowSettings>(DEFAULT_WORKFLOW_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [scope, setScope] = useState<ReviewScope | "members">("listings");
  const [action, setAction] = useState<WorkflowDelegation["action"]>("review");
  const [expiryMode, setExpiryMode] = useState<"open" | "temporary">("open");
  const [expiresAt, setExpiresAt] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/workflow", { cache: "no-store" });
      const data = (await response.json()) as { settings?: WorkflowSettings; error?: string };
      if (!response.ok || !data.settings) throw new Error(data.error || "تعذر تحميل الإعدادات");
      setSettings(data.settings);
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateScope = (key: ReviewScope, patch: Partial<WorkflowSettings[ReviewScope]>) => {
    setSettings((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  };

  const save = async () => {
    if (!can("workflow.manage") || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/workflow", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = (await response.json()) as { settings?: WorkflowSettings; error?: string };
      if (!response.ok || !data.settings) throw new Error(data.error || "تعذر حفظ الإعدادات");
      setSettings(data.settings);
      notify("تم حفظ سياسة المراجعة والموافقات");
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const onScopeChange = (next: ReviewScope | "members") => {
    setScope(next);
    setAction(next === "members" ? "approve_member" : "review");
  };

  const addDelegation = () => {
    const staff = users.find((item) => item.id === staffId);
    if (!staff) {
      notify("اختر الموظف أولًا");
      return;
    }
    if (expiryMode === "temporary" && (!expiresAt || Date.parse(expiresAt) <= Date.now())) {
      notify("اختر تاريخ انتهاء مستقبليًا للتفويض المؤقت");
      return;
    }
    const delegation: WorkflowDelegation = {
      id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `dlg-${Date.now()}`,
      staffId: staff.id,
      staffName: staff.name,
      scope,
      action: scope === "members" ? "approve_member" : action === "approve_member" ? "review" : action,
      expiresAt: expiryMode === "open" ? null : new Date(expiresAt).toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: "admin",
    };
    setSettings((current) => ({ ...current, delegations: [delegation, ...current.delegations.filter((item) => !(item.staffId === delegation.staffId && item.scope === delegation.scope && item.action === delegation.action))] }));
    setExpiresAt("");
    notify("تمت إضافة التفويض — اضغط حفظ لتفعيله");
  };

  if (loading) {
    return <div className="flex items-center justify-center gap-2 rounded-3xl border border-sand-200 bg-white py-20 text-sand-600"><Loader2 className="h-5 w-5 animate-spin" /> جاري تحميل سياسة الموافقات…</div>;
  }

  return (
    <div className="space-y-5">
      <Panel
        title="سياسة التسجيل والموافقات"
        desc="الإعداد الافتراضي: العضو يحتاج موافقة، وكل نوع يمر بمراجع مستندات ثم أدمن مختلف للموافقة النهائية."
        actions={
          <button onClick={() => void save()} disabled={!can("workflow.manage") || saving} className="inline-flex items-center gap-2 rounded-full bg-ocean-950 px-4 py-2 text-xs font-black text-white disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ كل الإعدادات
          </button>
        }
      >
        <div className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
          <Field label="تسجيل أعضاء الموقع">
            <select
              value={settings.members.mode}
              onChange={(event) => setSettings((current) => ({ ...current, members: { ...current.members, mode: event.target.value as MembersMode } }))}
              className={INPUT}
              disabled={!can("workflow.manage")}
            >
              <option value="approval">مفتوح مع انتظار موافقة الإدارة (الافتراضي)</option>
              <option value="open">مفتوح وقبول تلقائي</option>
              <option value="closed">إيقاف التسجيل مؤقتًا</option>
            </select>
          </Field>
          <div className="mt-3 max-w-md">
            <Field label="مَن يوافق على الأعضاء؟">
              <select
                value={settings.members.approveBy}
                onChange={(event) => setSettings((current) => ({ ...current, members: { ...current.members, approveBy: event.target.value as ReviewActorMode } }))}
                className={INPUT}
                disabled={!can("workflow.manage")}
              >
                {Object.entries(ACTOR_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {SCOPES.map((key) => {
            const policy = settings[key];
            return (
              <section key={key} className="rounded-2xl border border-sand-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-gold-600" />
                    <h3 className="font-black text-ocean-950">{REVIEW_SCOPE_LABEL[key]}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateScope(key, { enabled: !policy.enabled })}
                    disabled={!can("workflow.manage")}
                    className={`rounded-full px-3 py-1 text-[11px] font-black ${policy.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {policy.enabled ? "المراجعة مفعّلة" : "النشر المباشر"}
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  <Field label="مرحلة مراجعة المستندات">
                    <select value={policy.reviewBy} onChange={(event) => updateScope(key, { reviewBy: event.target.value as ReviewActorMode })} className={INPUT} disabled={!can("workflow.manage") || !policy.enabled}>
                      {Object.entries(ACTOR_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                  <Field label="الموافقة النهائية والنشر">
                    <select value={policy.publishBy} onChange={(event) => updateScope(key, { publishBy: event.target.value as PublishActorMode })} className={INPUT} disabled={!can("workflow.manage")}>
                      {Object.entries(PUBLISH_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                  <label className="flex items-start gap-2 rounded-xl bg-sand-50 p-3 text-xs font-bold text-sand-700">
                    <input type="checkbox" checked={policy.twoPerson} onChange={(event) => updateScope(key, { twoPerson: event.target.checked })} disabled={!can("workflow.manage") || !policy.enabled} className="mt-0.5 h-4 w-4 accent-gold-500" />
                    <span>تفعيل قاعدة «من راجع لا يوافق»</span>
                  </label>
                </div>
              </section>
            );
          })}
        </div>
      </Panel>

      <Panel title="التفويضات" desc="يمكن منح موظف صلاحية استثنائية بشكل مفتوح أو حتى تاريخ انتهاء محدد.">
        <div className="grid gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="الموظف">
            <select value={staffId} onChange={(event) => setStaffId(event.target.value)} className={INPUT}>
              <option value="">اختر الموظف</option>
              {users.filter((item) => item.active && item.role !== "super_admin").map((item) => <option key={item.id} value={item.id}>{item.name} — {item.role}</option>)}
            </select>
          </Field>
          <Field label="النطاق">
            <select value={scope} onChange={(event) => onScopeChange(event.target.value as ReviewScope | "members")} className={INPUT}>
              {SCOPES.map((item) => <option key={item} value={item}>{REVIEW_SCOPE_LABEL[item]}</option>)}
              <option value="members">أعضاء الموقع</option>
            </select>
          </Field>
          <Field label="نوع التفويض">
            <select value={scope === "members" ? "approve_member" : action} onChange={(event) => setAction(event.target.value as WorkflowDelegation["action"])} className={INPUT} disabled={scope === "members"}>
              {scope === "members" ? <option value="approve_member">الموافقة على الأعضاء</option> : <><option value="review">مراجعة المستندات</option><option value="publish">الموافقة النهائية والنشر</option></>}
            </select>
          </Field>
          <Field label="المدة">
            <select value={expiryMode} onChange={(event) => setExpiryMode(event.target.value as typeof expiryMode)} className={INPUT}>
              <option value="open">مفتوح بدون تاريخ</option>
              <option value="temporary">مؤقت حتى تاريخ</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button type="button" onClick={addDelegation} disabled={!can("workflow.manage")} className="flex w-full items-center justify-center gap-1 rounded-xl bg-gold-400 px-4 py-3 text-xs font-black text-ocean-950 disabled:opacity-50"><Plus className="h-4 w-4" /> إضافة التفويض</button>
          </div>
          {expiryMode === "temporary" && (
            <div className="md:col-span-2 xl:col-span-5">
              <Field label="ينتهي في">
                <input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className={INPUT} />
              </Field>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {settings.delegations.map((delegation) => {
            const active = isDelegationActive(delegation);
            return (
              <div key={delegation.id} className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${active ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-slate-50 opacity-70"}`}>
                <div>
                  <p className="font-black text-ocean-950">{delegation.staffName}</p>
                  <p className="mt-1 text-xs text-sand-600">
                    {delegation.scope === "members" ? "أعضاء الموقع" : REVIEW_SCOPE_LABEL[delegation.scope]} • {delegation.action === "review" ? "مراجعة" : delegation.action === "publish" ? "موافقة نهائية ونشر" : "اعتماد أعضاء"}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-sand-500">
                    {delegation.expiresAt ? <><CalendarClock className="h-3.5 w-3.5" /> حتى {new Date(delegation.expiresAt).toLocaleString("ar-EG")}</> : <><InfinityIcon className="h-3.5 w-3.5" /> تفويض مفتوح بدون تاريخ انتهاء</>}
                    {!active && " — منتهي"}
                  </p>
                </div>
                <button onClick={() => setSettings((current) => ({ ...current, delegations: current.delegations.filter((item) => item.id !== delegation.id) }))} disabled={!can("workflow.manage")} className="inline-flex items-center justify-center gap-1 rounded-full border border-rose-200 px-3 py-2 text-xs font-black text-rose-700 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /> إلغاء التفويض</button>
              </div>
            );
          })}
          {!settings.delegations.length && <p className="rounded-2xl border border-dashed border-sand-200 p-8 text-center text-sm text-sand-500">لا توجد تفويضات حاليًا.</p>}
        </div>
      </Panel>
    </div>
  );
}
