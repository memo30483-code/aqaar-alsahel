"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/session";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  addAdminLog,
  getAdminPermissions,
  saveAdminPermissions,
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
}

const CATEGORY_LABEL: Record<string, string> = {
  listings: "الإعلانات",
  users: "المستخدمون",
  offers: "العروض",
  site: "الموقع",
  banners: "البنرات",
  logs: "السجلات",
  settings: "إعدادات عامة",
};

export default function AdminPermissionsTab({
  users,
  can,
  selectedUserId,
  onSelect,
  notify,
  reloadLogs,
}: Props) {
  const session = typeof window !== "undefined" ? getSession() : null;
  const editable = can("users.roles");
  const manageable = users.filter((user) => user.role !== "super_admin");
  const activeId = selectedUserId ?? manageable[0]?.id ?? null;
  const activeUser = users.find((user) => user.id === activeId) ?? null;

  const [draft, setDraft] = useState<Record<string, string[]>>({});

  const permissions = useMemo(() => {
    if (!activeId) return [];
    if (draft[activeId]) return draft[activeId];
    const custom = getAdminPermissions(activeId);
    const roleDefaults = activeUser ? DEFAULT_ROLE_PERMISSIONS[activeUser.role] ?? [] : [];
    return Array.from(new Set([...roleDefaults, ...custom]));
  }, [activeId, draft, activeUser]);

  const toggle = (key: string) => {
    if (!activeId) return;
    const next = permissions.includes(key)
      ? permissions.filter((item) => item !== key)
      : [...permissions, key];
    setDraft((current) => ({ ...current, [activeId]: next }));
  };

  const grouped = useMemo(() => {
    const map = new Map<string, typeof ALL_PERMISSIONS>();
    ALL_PERMISSIONS.forEach((permission) => {
      const list = map.get(permission.category) ?? [];
      list.push(permission);
      map.set(permission.category, list);
    });
    return Array.from(map.entries());
  }, []);

  const save = () => {
    if (!activeId || !session) return;
    saveAdminPermissions(activeId, permissions, session.email);
    addAdminLog({
      action: "permissions.update",
      category: "users",
      performedBy: session.email,
      performedByName: session.name,
      performedByRole: session.role ?? "admin",
      details: `تحديث صلاحيات ${activeUser?.name ?? activeId} (${permissions.length} صلاحية)`,
    });
    reloadLogs();
    notify("تم حفظ الصلاحيات المخصصة");
  };

  const resetToRole = () => {
    if (!activeId || !activeUser) return;
    setDraft((current) => ({
      ...current,
      [activeId]: DEFAULT_ROLE_PERMISSIONS[activeUser.role] ?? [],
    }));
    notify("تمت استعادة صلاحيات الدور الافتراضية (لم تُحفظ بعد)");
  };

  return (
    <Panel
      title="الصلاحيات المخصصة"
      desc="حدد يدوياً ما يستطيع كل أدمن فعله — الصلاحيات الممنوحة هنا تُضاف فوق صلاحيات دوره."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={resetToRole} className="inline-flex items-center gap-1 rounded-full border border-sand-200 px-3 py-2 text-xs font-bold text-sand-700">
            <RotateCcw className="h-3.5 w-3.5" /> صلاحيات الدور
          </button>
          <button onClick={save} className={BTN_PRIMARY} disabled={!editable || !activeId}>
            <Save className="h-4 w-4" /> حفظ الصلاحيات
          </button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {manageable.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelect(user.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              activeId === user.id
                ? "bg-ocean-950 text-white"
                : "border border-sand-200 bg-white text-sand-700 hover:border-gold-400"
            }`}
          >
            {user.name}
            <span className="ms-1 opacity-60">({user.role})</span>
          </button>
        ))}
      </div>

      {!activeUser && (
        <p className="rounded-2xl border border-dashed border-sand-200 p-8 text-center text-sm text-sand-600">
          لا يوجد مستخدمون قابلون للتخصيص. المدير العام يملك كل الصلاحيات دائماً.
        </p>
      )}

      {activeUser && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-2xl bg-[rgba(201,146,42,0.08)] p-3 text-xs text-[#8a6d2f]">
            <ShieldCheck className="h-4 w-4" />
            <span>
              صلاحيات {activeUser.name} — {permissions.length} من {ALL_PERMISSIONS.length} صلاحية
            </span>
          </div>
          {grouped.map(([category, items]) => (
            <div key={category}>
              <h4 className="mb-2 text-xs font-black text-sand-600">
                {CATEGORY_LABEL[category] ?? category}
              </h4>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {items.map((permission) => {
                  const checked = permissions.includes(permission.key);
                  return (
                    <button
                      key={permission.id}
                      onClick={() => toggle(permission.key)}
                      disabled={!editable}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-start text-xs transition ${
                        checked
                          ? "border-gold-400 bg-[rgba(201,146,42,0.08)] text-ocean-900"
                          : "border-sand-200 bg-white text-sand-700 hover:border-sand-300"
                      } ${!editable ? "opacity-60" : ""}`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked ? "border-gold-400 bg-gold-500 text-white" : "border-sand-300"
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="font-semibold">{permission.labelAr}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!editable && (
            <p className="text-[11px] text-rose-600">
              تحتاج صلاحية «تحديد الأدوار يدوياً» لتعديل الصلاحيات.
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}
