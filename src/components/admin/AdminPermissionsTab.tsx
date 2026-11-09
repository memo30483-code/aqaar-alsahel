"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, RotateCcw, Save, ShieldCheck } from "lucide-react";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  type AdminPermissionSet,
  type AdminUser,
} from "@/lib/admin-system";
import { BTN_PRIMARY, Panel } from "@/components/admin/shared";

interface Props {
  users: AdminUser[];
  can: (key: string) => boolean;
  selectedUserId: string | null;
  onSelect: (userId: string) => void;
  notify: (message: string) => void;
  reloadLogs: () => void;
  onPermissionsChange?: () => void;
}

interface PermissionDraft {
  granted: string[];
  revoked: string[];
}

const CATEGORY_LABEL: Record<string, string> = {
  listings: "الإعلانات",
  users: "فريق الإدارة",
  members: "أعضاء الموقع",
  workflow: "المراجعة والموافقات",
  offers: "العروض",
  site: "الموقع",
  banners: "البنرات",
  logs: "السجلات",
  professionals: "المهنيون",
  crm: "العملاء والفرص",
  reviews: "التقييمات",
  propertyRequests: "طلبات العقار",
  settings: "إعدادات عامة",
};

export default function AdminPermissionsTab({ users, can, selectedUserId, onSelect, notify, reloadLogs, onPermissionsChange }: Props) {
  const [sets, setSets] = useState<AdminPermissionSet[]>([]);
  const [draft, setDraft] = useState<Record<string, PermissionDraft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const manageable = users.filter((user) => user.role !== "super_admin");
  const activeId = selectedUserId ?? manageable[0]?.id ?? null;
  const activeUser = users.find((user) => user.id === activeId) ?? null;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/admin/staff", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as { permissionSets?: AdminPermissionSet[]; error?: string };
        if (!response.ok) throw new Error(data.error || "تعذر تحميل الصلاحيات");
        if (!cancelled) setSets(data.permissionSets ?? []);
      })
      .catch((error) => notify(error instanceof Error ? error.message : "تعذر تحميل الصلاحيات"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [notify]);

  const current: PermissionDraft = useMemo(() => {
    if (!activeId) return { granted: [], revoked: [] };
    if (draft[activeId]) return draft[activeId];
    const entry = sets.find((item) => item.adminId === activeId);
    return { granted: entry?.permissions ?? [], revoked: entry?.revoked ?? [] };
  }, [activeId, draft, sets]);

  const effective = useMemo(() => {
    if (!activeUser) return [];
    const defaults = DEFAULT_ROLE_PERMISSIONS[activeUser.role] ?? [];
    const revoked = new Set(current.revoked);
    return Array.from(new Set([...defaults, ...current.granted])).filter((key) => !revoked.has(key));
  }, [activeUser, current]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof ALL_PERMISSIONS>();
    ALL_PERMISSIONS.forEach((permission) => map.set(permission.category, [...(map.get(permission.category) ?? []), permission]));
    return Array.from(map.entries());
  }, []);

  const toggle = (key: string) => {
    if (!activeId || !can("users.roles")) return;
    const granted = new Set(current.granted);
    const revoked = new Set(current.revoked);
    if (effective.includes(key)) {
      granted.delete(key);
      revoked.add(key);
    } else {
      granted.add(key);
      revoked.delete(key);
    }
    setDraft((state) => ({
      ...state,
      [activeId]: {
        granted: Array.from(granted),
        revoked: Array.from(revoked),
      },
    }));
  };

  const reset = () => {
    if (!activeId) return;
    setDraft((state) => ({ ...state, [activeId]: { granted: [], revoked: [] } }));
    notify("تمت استعادة صلاحيات الدور افتراضيًا — اضغط حفظ لتأكيدها");
  };

  const save = async () => {
    if (!activeId || !can("users.roles") || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeId, operation: "permissions", permissions: current.granted, revoked: current.revoked }),
      });
      const data = (await response.json()) as { permissionSet?: AdminPermissionSet; error?: string };
      if (!response.ok || !data.permissionSet) throw new Error(data.error || "تعذر حفظ الصلاحيات");
      setSets((items) => [...items.filter((item) => item.adminId !== activeId), data.permissionSet!]);
      setDraft((state) => {
        const next = { ...state };
        delete next[activeId];
        return next;
      });
      notify("تم حفظ صلاحيات الموظف على السيرفر");
      reloadLogs();
      onPermissionsChange?.();
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title="صلاحيات الموظفين"
      desc="الصلاحيات تُفحص على السيرفر عند كل عملية؛ إخفاء الزر وحده لا يُعد حماية. يمكنك منح صلاحية أو سحبها حتى لو كانت ضمن الدور."
      actions={<div className="flex gap-2"><button onClick={reset} className="inline-flex items-center gap-1 rounded-full border border-sand-200 px-3 py-2 text-xs font-bold"><RotateCcw className="h-3.5 w-3.5" /> صلاحيات الدور</button><button onClick={() => void save()} disabled={!can("users.roles") || !activeId || saving} className={BTN_PRIMARY}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ</button></div>}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {manageable.map((user) => <button key={user.id} onClick={() => onSelect(user.id)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${activeId === user.id ? "bg-ocean-950 text-white" : "border border-sand-200 text-sand-700"}`}>{user.name}<span className="ms-1 opacity-60">({user.role})</span></button>)}
      </div>
      {loading ? <div className="flex items-center justify-center gap-2 py-16 text-sand-600"><Loader2 className="h-5 w-5 animate-spin" /> تحميل الصلاحيات…</div> : !activeUser ? <p className="rounded-2xl border border-dashed border-sand-200 p-8 text-center text-sand-500">لا يوجد موظفون قابلون للتخصيص.</p> : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-2xl bg-gold-50 p-3 text-xs font-bold text-gold-700"><ShieldCheck className="h-4 w-4" /> {effective.length} من {ALL_PERMISSIONS.length} صلاحية فعالة للموظف {activeUser.name}</div>
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h3 className="mb-2 text-xs font-black text-sand-600">{CATEGORY_LABEL[category] ?? category}</h3>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {items.map((permission) => {
                  const checked = effective.includes(permission.key);
                  return <button key={permission.key} onClick={() => toggle(permission.key)} disabled={!can("users.roles")} className={`flex items-center gap-2 rounded-xl border p-2.5 text-start text-xs font-bold ${checked ? "border-gold-400 bg-gold-50 text-ocean-950" : "border-sand-200 text-sand-600"} disabled:opacity-60`}><span className={`flex h-4 w-4 items-center justify-center rounded border ${checked ? "border-gold-400 bg-gold-500 text-white" : "border-sand-300"}`}>{checked && <Check className="h-3 w-3" />}</span>{permission.labelAr}</button>;
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </Panel>
  );
}
