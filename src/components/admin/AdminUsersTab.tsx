"use client";

import { useState } from "react";
import { Plus, ShieldCheck, Trash2, UserCog, UserX, X } from "lucide-react";
import { getSession, type UserRole } from "@/lib/session";
import {
  addAdminLog,
  saveUsers,
  type AdminUser,
} from "@/lib/admin-system";
import { BTN_GOLD, Field, INPUT, Panel, ROW_ACTION } from "@/components/admin/shared";

interface Props {
  users: AdminUser[];
  can: (key: string) => boolean;
  onChange: (users: AdminUser[]) => void;
  notify: (message: string) => void;
  reloadLogs: () => void;
  openPermissions: (userId: string) => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
  user: "مستخدم",
  agent: "وسيط عقاري",
  moderator: "مشرف",
  admin: "أدمن",
  super_admin: "مدير عام",
};

const ROLE_STYLE: Record<UserRole, string> = {
  user: "bg-sand-100 text-sand-700",
  agent: "bg-sky-50 text-sky-700",
  moderator: "bg-violet-50 text-violet-700",
  admin: "bg-[rgba(201,146,42,0.14)] text-gold-700",
  super_admin: "bg-ocean-950 text-white",
};

export default function AdminUsersTab({
  users,
  can,
  onChange,
  notify,
  reloadLogs,
  openPermissions,
}: Props) {
  const session = typeof window !== "undefined" ? getSession() : null;
  const editableRoles = can("users.roles");
  const editableUsers = can("users.manage");
  const [draft, setDraft] = useState<Partial<AdminUser> | null>(null);

  const apply = (next: AdminUser[], details: string) => {
    onChange(next);
    saveUsers(next);
    if (session) {
      addAdminLog({
        action: "users.update",
        category: "users",
        performedBy: session.email,
        performedByName: session.name,
        performedByRole: session.role ?? "admin",
        details,
      });
      reloadLogs();
    }
    notify(details);
  };

  const saveDraft = () => {
    if (!draft?.name?.trim() || !draft.email?.trim()) {
      notify("الاسم والبريد مطلوبان");
      return;
    }
    if (draft.id) {
      apply(
        users.map((user) => (user.id === draft.id ? { ...user, ...draft } as AdminUser : user)),
        `تعديل بيانات المستخدم: ${draft.name}`
      );
    } else {
      const newUser: AdminUser = {
        id: `u-${Date.now()}`,
        name: draft.name,
        email: draft.email,
        phone: draft.phone ?? "",
        role: (draft.role as UserRole) ?? "moderator",
        active: true,
        joinedAt: new Date().toISOString().slice(0, 10),
      };
      apply([...users, newUser], `إضافة مستخدم جديد: ${newUser.name}`);
    }
    setDraft(null);
  };

  return (
    <Panel
      title="المستخدمون والأدوار"
      desc="حدد دور كل مستخدم، أوقف الحساب، أو امنحه صلاحيات مخصصة يدوياً."
      actions={
        <button
          onClick={() => setDraft({ role: "moderator" })}
          className={BTN_GOLD}
          disabled={!editableUsers}
        >
          <Plus className="h-4 w-4" /> إضافة مستخدم
        </button>
      }
    >
      <div className="overflow-x-auto rounded-2xl border border-sand-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-sand-50 text-xs text-sand-700">
            <tr>
              <th className="p-3 text-start font-bold">المستخدم</th>
              <th className="p-3 text-start font-bold">الدور</th>
              <th className="p-3 text-start font-bold">الحالة</th>
              <th className="p-3 text-start font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-sand-200">
                <td className="p-3">
                  <p className="font-bold text-ocean-900">{user.name}</p>
                  <p className="text-[11px] text-sand-600">{user.email}</p>
                  <p className="text-[11px] text-sand-500">انضم: {user.joinedAt}</p>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ROLE_STYLE[user.role]}`}>
                      {ROLE_LABEL[user.role]}
                    </span>
                    <select
                      value={user.role}
                      disabled={!editableRoles}
                      onChange={(event) =>
                        apply(
                          users.map((row) =>
                            row.id === user.id ? { ...row, role: event.target.value as UserRole } : row
                          ),
                          `تغيير دور ${user.name} إلى ${ROLE_LABEL[event.target.value as UserRole]}`
                        )
                      }
                      className="rounded-lg border border-sand-200 px-2 py-1 text-[11px]"
                    >
                      {Object.entries(ROLE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="p-3">
                  <button
                    onClick={() =>
                      apply(
                        users.map((row) =>
                          row.id === user.id ? { ...row, active: !row.active } : row
                        ),
                        `${user.active ? "إيقاف" : "تفعيل"} حساب ${user.name}`
                      )
                    }
                    disabled={!editableUsers}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      user.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {user.active ? "نشط" : "موقوف"}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => openPermissions(user.id)} className={ROW_ACTION}>
                      <ShieldCheck className="h-3 w-3" /> الصلاحيات
                    </button>
                    <button onClick={() => setDraft(user)} className={ROW_ACTION} disabled={!editableUsers}>
                      <UserCog className="h-3 w-3" /> تعديل
                    </button>
                    {user.role !== "super_admin" && (
                      <button
                        onClick={() => {
                          if (confirm(`حذف المستخدم «${user.name}»؟`)) {
                            apply(
                              users.filter((row) => row.id !== user.id),
                              `حذف المستخدم: ${user.name}`
                            );
                          }
                        }}
                        disabled={!editableUsers}
                        className={`${ROW_ACTION} border-red-200 text-red-700`}
                      >
                        <Trash2 className="h-3 w-3" /> حذف
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ocean-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-ocean-900">
                {draft.id ? "تعديل مستخدم" : "إضافة مستخدم جديد"}
              </h3>
              <button onClick={() => setDraft(null)}>
                <X className="h-5 w-5 text-sand-600" />
              </button>
            </div>
            <div className="grid gap-3">
              <Field label="الاسم">
                <input
                  value={draft.name ?? ""}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  className={INPUT}
                />
              </Field>
              <Field label="البريد الإلكتروني">
                <input
                  value={draft.email ?? ""}
                  onChange={(event) => setDraft({ ...draft, email: event.target.value })}
                  className={INPUT}
                />
              </Field>
              <Field label="الهاتف">
                <input
                  value={draft.phone ?? ""}
                  onChange={(event) => setDraft({ ...draft, phone: event.target.value })}
                  className={INPUT}
                />
              </Field>
              <Field label="الدور">
                <select
                  value={draft.role ?? "moderator"}
                  onChange={(event) => setDraft({ ...draft, role: event.target.value as UserRole })}
                  className={INPUT}
                >
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDraft(null)}
                className="rounded-full border border-sand-200 px-4 py-2 text-sm font-bold text-sand-700"
              >
                إلغاء
              </button>
              <button onClick={saveDraft} className="rounded-full bg-ocean-950 px-4 py-2 text-sm font-bold text-white">
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {!editableUsers && (
        <p className="mt-3 flex items-center gap-2 text-[11px] text-rose-600">
          <UserX className="h-3.5 w-3.5" /> لا تملك صلاحية إدارة المستخدمين.
        </p>
      )}
    </Panel>
  );
}
