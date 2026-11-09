"use client";

import { useState } from "react";
import { Copy, Link2, Loader2, Plus, RefreshCcw, ShieldCheck, Trash2, UserCog, UserX, X } from "lucide-react";
import type { UserRole } from "@/lib/session";
import type { AdminUser } from "@/lib/admin-system";
import { BTN_GOLD, Field, INPUT, Panel, ROW_ACTION } from "@/components/admin/shared";

interface Props {
  users: AdminUser[];
  can: (key: string) => boolean;
  onChange: (users: AdminUser[]) => void;
  notify: (message: string) => void;
  reloadLogs: () => void;
  openPermissions: (userId: string) => void;
}

type StaffRole = "agent" | "moderator" | "reviewer" | "admin";

const ROLE_LABEL: Record<UserRole, string> = {
  user: "مستخدم",
  agent: "موظف/وسيط",
  moderator: "مشرف",
  reviewer: "مراجع مستندات",
  admin: "أدمن",
  super_admin: "مدير عام",
};

const ROLE_STYLE: Record<UserRole, string> = {
  user: "bg-sand-100 text-sand-700",
  agent: "bg-sky-50 text-sky-700",
  moderator: "bg-violet-50 text-violet-700",
  reviewer: "bg-cyan-50 text-cyan-700",
  admin: "bg-[rgba(201,146,42,0.14)] text-gold-700",
  super_admin: "bg-ocean-950 text-white",
};

interface Draft {
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
}

export default function AdminUsersTab({ users, can, onChange, notify, reloadLogs, openPermissions }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");

  const refresh = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/staff", { cache: "no-store" });
      const data = (await response.json()) as { users?: AdminUser[]; error?: string };
      if (!response.ok) throw new Error(data.error || "تعذر تحميل الفريق");
      onChange(data.users ?? []);
      notify("تم تحديث حسابات الفريق");
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر التحديث");
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    if (!draft || !draft.name.trim() || !draft.email.trim()) {
      notify("الاسم والبريد مطلوبان");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/staff", {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          draft.id
            ? { id: draft.id, name: draft.name, phone: draft.phone, role: draft.role }
            : draft
        ),
      });
      const data = (await response.json()) as { user?: AdminUser; inviteUrl?: string; error?: string };
      if (!response.ok || !data.user) throw new Error(data.error === "email_exists" ? "هذا البريد مستخدم بالفعل" : data.error || "تعذر الحفظ");
      onChange(
        draft.id
          ? users.map((item) => (item.id === data.user!.id ? data.user! : item))
          : [...users, data.user]
      );
      setDraft(null);
      if (data.inviteUrl) setInviteUrl(data.inviteUrl);
      notify(draft.id ? "تم تحديث بيانات الموظف" : "تم إنشاء الحساب وإصدار رابط الدعوة");
      reloadLogs();
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const update = async (user: AdminUser, patch: Record<string, unknown>) => {
    setBusyId(user.id);
    try {
      const response = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, ...patch }),
      });
      const data = (await response.json()) as { user?: AdminUser; inviteUrl?: string; error?: string };
      if (!response.ok || !data.user) throw new Error(data.error || "تعذر تنفيذ العملية");
      onChange(users.map((item) => (item.id === user.id ? data.user! : item)));
      if (data.inviteUrl) setInviteUrl(data.inviteUrl);
      notify(data.inviteUrl ? "تم إصدار رابط دعوة جديد" : "تم تحديث الحساب");
      reloadLogs();
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر تنفيذ العملية");
    } finally {
      setBusyId("");
    }
  };

  const remove = async (user: AdminUser) => {
    if (!window.confirm(`حذف حساب الموظف «${user.name}» نهائيًا؟`)) return;
    setBusyId(user.id);
    try {
      const response = await fetch(`/api/admin/staff?id=${encodeURIComponent(user.id)}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "تعذر الحذف");
      onChange(users.filter((item) => item.id !== user.id));
      notify("تم حذف حساب الموظف");
      reloadLogs();
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر الحذف");
    } finally {
      setBusyId("");
    }
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      notify("تم نسخ رابط الدعوة");
    } catch {
      notify("انسخ الرابط يدويًا من الحقل");
    }
  };

  return (
    <>
      <Panel
        title="فريق الإدارة وحسابات الدخول"
        desc="كل موظف يملك حساب دخول حقيقي وصلاحيات مستقلة. أرسل له رابط الدعوة مرة واحدة لإنشاء كلمة مروره."
        actions={
          <div className="flex gap-2">
            <button onClick={() => void refresh()} disabled={saving} className="inline-flex items-center gap-1 rounded-full border border-sand-200 px-3 py-2 text-xs font-bold text-sand-700"><RefreshCcw className="h-3.5 w-3.5" /> تحديث</button>
            <button onClick={() => setDraft({ name: "", email: "", phone: "", role: "reviewer" })} className={BTN_GOLD} disabled={!can("users.manage")}><Plus className="h-4 w-4" /> دعوة موظف</button>
          </div>
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-sand-200">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-sand-50 text-xs text-sand-700"><tr><th className="p-3 text-start">الموظف</th><th className="p-3 text-start">الدور</th><th className="p-3 text-start">حساب الدخول</th><th className="p-3 text-start">آخر دخول</th><th className="p-3 text-start">إجراءات</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-sand-200">
                  <td className="p-3"><p className="font-black text-ocean-950">{user.name}</p><p className="text-[11px] text-sand-600" dir="ltr">{user.email}</p><p className="text-[11px] text-sand-500" dir="ltr">{user.phone}</p></td>
                  <td className="p-3"><span className={`rounded-full px-2 py-1 text-[11px] font-black ${ROLE_STYLE[user.role]}`}>{ROLE_LABEL[user.role]}</span></td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-black ${user.status === "active" ? "bg-emerald-50 text-emerald-700" : user.status === "invited" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                      {user.status === "active" ? "نشط" : user.status === "invited" ? "بانتظار تفعيل الدعوة" : "موقوف"}
                    </span>
                    {user.inviteExpiresAt && <p className="mt-1 text-[10px] text-sand-500">تنتهي الدعوة: {new Date(user.inviteExpiresAt).toLocaleDateString("ar-EG")}</p>}
                  </td>
                  <td className="p-3 text-xs text-sand-600">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("ar-EG") : "لم يدخل بعد"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => openPermissions(user.id)} className={ROW_ACTION}><ShieldCheck className="h-3 w-3" /> الصلاحيات</button>
                      <button onClick={() => setDraft({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role as StaffRole })} className={ROW_ACTION} disabled={!can("users.manage")}><UserCog className="h-3 w-3" /> تعديل</button>
                      <button onClick={() => void update(user, { operation: "invite" })} className={ROW_ACTION} disabled={!can("users.manage") || busyId === user.id}><Link2 className="h-3 w-3" /> {user.status === "invited" ? "إعادة الدعوة" : "إعادة كلمة المرور"}</button>
                      {user.status !== "invited" && (
                        <button onClick={() => void update(user, { status: user.status === "active" ? "suspended" : "active" })} className={ROW_ACTION} disabled={!can("users.manage") || busyId === user.id}><UserX className="h-3 w-3" /> {user.status === "active" ? "إيقاف" : "تفعيل"}</button>
                      )}
                      <button onClick={() => void remove(user)} className={`${ROW_ACTION} border-rose-200 text-rose-700`} disabled={!can("users.manage") || busyId === user.id}><Trash2 className="h-3 w-3" /> حذف</button>
                      {busyId === user.id && <Loader2 className="h-4 w-4 animate-spin text-gold-600" />}
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={5} className="p-10 text-center text-sand-500">لا توجد حسابات موظفين بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>

      {draft && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ocean-950/60 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-black text-ocean-950">{draft.id ? "تعديل الموظف" : "دعوة موظف جديد"}</h3><button onClick={() => setDraft(null)}><X className="h-5 w-5" /></button></div>
            <div className="grid gap-3">
              <Field label="الاسم"><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={INPUT} /></Field>
              <Field label="البريد الإلكتروني"><input type="email" value={draft.email} disabled={Boolean(draft.id)} onChange={(event) => setDraft({ ...draft, email: event.target.value })} className={INPUT} dir="ltr" /></Field>
              <Field label="الهاتف"><input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} className={INPUT} dir="ltr" /></Field>
              <Field label="الدور"><select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as StaffRole })} className={INPUT} disabled={!can("users.roles")}><option value="reviewer">مراجع مستندات</option><option value="agent">موظف/وسيط</option><option value="moderator">مشرف</option><option value="admin">أدمن</option></select></Field>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setDraft(null)} className="rounded-full border border-sand-200 px-4 py-2 text-sm font-bold">إلغاء</button><button onClick={() => void saveDraft()} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-ocean-950 px-4 py-2 text-sm font-black text-white disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />} {draft.id ? "حفظ" : "إنشاء وإصدار الدعوة"}</button></div>
          </div>
        </div>
      )}

      {inviteUrl && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ocean-950/70 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between"><h3 className="text-lg font-black text-ocean-950">رابط دعوة الموظف</h3><button onClick={() => setInviteUrl("")}><X className="h-5 w-5" /></button></div>
            <p className="mt-2 text-sm leading-7 text-sand-600">أرسل هذا الرابط للموظف عبر وسيلة آمنة. الرابط صالح مرة واحدة ولمدة 7 أيام.</p>
            <textarea readOnly value={inviteUrl} className={`${INPUT} mt-4 min-h-24 text-left text-xs`} dir="ltr" />
            <button onClick={() => void copyInvite()} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-4 py-3 font-black text-ocean-950"><Copy className="h-4 w-4" /> نسخ رابط الدعوة</button>
          </div>
        </div>
      )}
    </>
  );
}
