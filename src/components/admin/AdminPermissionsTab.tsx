"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/session";
import {
  ALL_PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  addAdminLog,
  getAdminPermissions,
  getRevokedPermissions,
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
  /** إشعار الأب بتغيّر الصلاحيات حتى يُحدّث التبويبات والعدّادات */
  onPermissionsChange?: () => void;
}

interface PermissionDraft {
  granted: string[];
  revoked: string[];
}

const CATEGORY_LABEL: Record<string, string> = {
  listings: "الإعلانات",
  users: "المستخدمون",
  offers: "العروض",
  site: "الموقع",
  banners: "البنرات",
  logs: "السجلات",
  professionals: "المهنيون",
  settings: "إعدادات عامة",
};

export default function AdminPermissionsTab({
  users,
  can,
  selectedUserId,
  onSelect,
  notify,
  reloadLogs,
  onPermissionsChange,
}: Props) {
  const session = typeof window !== "undefined" ? getSession() : null;
  const editable = can("users.roles");
  const manageable = users.filter((user) => user.role !== "super_admin");
  const activeId = selectedUserId ?? manageable[0]?.id ?? null;
  const activeUser = users.find((user) => user.id === activeId) ?? null;

  const [draft, setDraft] = useState<Record<string, PermissionDraft>>({});

  /** المخصصات المحفوظة: ممنوح صراحةً ومسحوب صراحةً (وليس القائمة النهائية) */
  const current: PermissionDraft = useMemo(() => {
    if (!activeId) return { granted: [], revoked: [] };
    if (draft[activeId]) return draft[activeId];
    return {
      granted: getAdminPermissions(activeId),
      revoked: getRevokedPermissions(activeId),
    };
  }, [activeId, draft]);

  /** القائمة الفعلية = صلاحيات الدور + الممنوح − المسحوب */
  const effective = useMemo(() => {
    if (!activeId || !activeUser) return [];
    const defaults = DEFAULT_ROLE_PERMISSIONS[activeUser.role] ?? [];
    const revoked = new Set(current.revoked);
    return Array.from(new Set([...defaults, ...current.granted])).filter(
      (key) => !revoked.has(key)
    );
  }, [activeId, activeUser, current]);

  const toggle = (key: string) => {
    if (!activeId) return;
    const granted = new Set(current.granted);
    const revoked = new Set(current.revoked);
    if (effective.includes(key)) {
      /* السحب يُسجّل صراحةً حتى لا تعيده صلاحيات الدور */
      revoked.add(key);
      granted.delete(key);
    } else {
      granted.add(key);
      revoked.delete(key);
    }
    setDraft((state) => ({
      ...state,
      [activeId]: { granted: Array.from(granted), revoked: Array.from(revoked) },
    }));
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
    if (!saveAdminPermissions(activeId, current.granted, session.email, current.revoked)) {
      notify("تعذّر حفظ الصلاحيات — مساحة التخزين في المتصفح ممتلئة");
      return;
    }
    addAdminLog({
      action: "permissions.update",
      category: "users",
      performedBy: session.email,
      performedByName: session.name,
      performedByRole: session.role ?? "admin",
      details: `تحديث صلاحيات ${activeUser?.name ?? activeId} (${effective.length} صلاحية فعّالة)`,
    });
    reloadLogs();
    onPermissionsChange?.();
    notify("تم حفظ الصلاحيات المخصصة");
  };

  const resetToRole = () => {
    if (!activeId || !activeUser) return;
    setDraft((state) => ({ ...state, [activeId]: { granted: [], revoked: [] } }));
    notify("تمت استعادة صلاحيات الدور الافتراضية (لم تُحفظ بعد)");
  };

  return (
    <Panel
      title="الصلاحيات المخصصة"
      desc="حدد يدوياً ما يستطيع كل أدمن فعله — يمكنك منح صلاحية إضافية أو سحب صلاحية من صلاحيات دوره."
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
              صلاحيات {activeUser.name} — {effective.length} من {ALL_PERMISSIONS.length} صلاحية فعّالة
              {current.revoked.length > 0 && ` (${current.revoked.length} مسحوبة يدوياً)`}
            </span>
          </div>
          {grouped.map(([category, items]) => (
            <div key={category}>
              <h4 className="mb-2 text-xs font-black text-sand-600">
                {CATEGORY_LABEL[category] ?? category}
              </h4>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {items.map((permission) => {
                  const checked = effective.includes(permission.key);
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
