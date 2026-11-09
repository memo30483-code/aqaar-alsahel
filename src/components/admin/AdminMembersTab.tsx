"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock3, Loader2, RefreshCcw, Search, ShieldOff, UserCheck, UserX } from "lucide-react";
import type { AdminMemberAccount, MemberStatus } from "@/lib/auth/accounts";
import { INPUT, Panel } from "@/components/admin/shared";

interface Props {
  can: (key: string) => boolean;
  notify: (message: string) => void;
  onCountChange?: (count: number) => void;
}

const STATUS_LABEL: Record<MemberStatus, string> = {
  pending: "بانتظار الموافقة",
  approved: "مقبول",
  rejected: "مرفوض",
  suspended: "موقوف",
};

const STATUS_STYLE: Record<MemberStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-rose-50 text-rose-700",
  suspended: "bg-slate-100 text-slate-700",
};

export default function AdminMembersTab({ can, notify, onCountChange }: Props) {
  const [members, setMembers] = useState<AdminMemberAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | MemberStatus>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/members", { cache: "no-store" });
      const data = (await response.json()) as { members?: AdminMemberAccount[]; error?: string };
      if (!response.ok) throw new Error(data.error || "تعذر تحميل الأعضاء");
      const list = data.members ?? [];
      setMembers(list);
      onCountChange?.(list.filter((item) => item.status === "pending").length);
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر تحميل الأعضاء");
    } finally {
      setLoading(false);
    }
  }, [notify, onCountChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((member) => {
      if (status !== "all" && member.status !== status) return false;
      if (!q) return true;
      return `${member.name} ${member.email} ${member.phone} ${member.accountType}`
        .toLowerCase()
        .includes(q);
    });
  }, [members, query, status]);

  const changeStatus = async (member: AdminMemberAccount, next: MemberStatus) => {
    if (!can("members.approve") || savingId) return;
    const note = next === "approved" ? "" : window.prompt("ملاحظة القرار (اختياري):", member.statusNote ?? "");
    if (note === null) return;
    setSavingId(member.id);
    try {
      const response = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, status: next, note }),
      });
      const data = (await response.json()) as { member?: AdminMemberAccount; error?: string };
      if (!response.ok || !data.member) throw new Error(data.error || "تعذر حفظ القرار");
      setMembers((current) => current.map((item) => (item.id === member.id ? data.member! : item)));
      const pending = members.filter((item) => item.id !== member.id && item.status === "pending").length + (next === "pending" ? 1 : 0);
      onCountChange?.(pending);
      notify(`تم تغيير حالة العضو إلى «${STATUS_LABEL[next]}»`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر حفظ القرار");
    } finally {
      setSavingId("");
    }
  };

  return (
    <Panel
      title="أعضاء الموقع"
      desc="كل بيانات العملاء خاصة، ولا تظهر للموظف إلا بصلاحية مستقلة. الحسابات الجديدة تنتظر موافقة الإدارة افتراضيًا."
      actions={
        <button onClick={() => void load()} className="inline-flex items-center gap-1 rounded-full border border-sand-200 px-3 py-2 text-xs font-bold text-sand-700">
          <RefreshCcw className="h-3.5 w-3.5" /> تحديث
        </button>
      }
    >
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${INPUT} pe-10`} placeholder="بحث بالاسم أو البريد أو الهاتف" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={INPUT}>
          <option value="all">كل الحالات</option>
          <option value="pending">بانتظار الموافقة</option>
          <option value="approved">مقبول</option>
          <option value="rejected">مرفوض</option>
          <option value="suspended">موقوف</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sand-600"><Loader2 className="h-5 w-5 animate-spin" /> جاري التحميل…</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand-200">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-sand-50 text-xs text-sand-700">
              <tr>
                <th className="p-3 text-start">العضو</th>
                <th className="p-3 text-start">نوع الحساب</th>
                <th className="p-3 text-start">التسجيل</th>
                <th className="p-3 text-start">الحالة</th>
                <th className="p-3 text-start">القرار</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id} className="border-t border-sand-200 align-top">
                  <td className="p-3">
                    <p className="font-black text-ocean-950">{member.name}</p>
                    <p className="mt-1 text-xs text-sand-600" dir="ltr">{member.email}</p>
                    <p className="text-xs text-sand-500" dir="ltr">{member.phone}</p>
                  </td>
                  <td className="p-3 text-xs font-bold text-sand-700">{member.accountType}</td>
                  <td className="p-3 text-xs text-sand-600">{new Date(member.createdAt).toLocaleDateString("ar-EG")}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${STATUS_STYLE[member.status]}`}>{STATUS_LABEL[member.status]}</span>
                    {member.statusNote && <p className="mt-2 max-w-xs text-[11px] leading-5 text-sand-500">{member.statusNote}</p>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {member.status !== "approved" && (
                        <button disabled={!can("members.approve") || savingId === member.id} onClick={() => void changeStatus(member, "approved")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-black text-emerald-700 disabled:opacity-50">
                          <UserCheck className="h-3.5 w-3.5" /> قبول
                        </button>
                      )}
                      {member.status !== "rejected" && (
                        <button disabled={!can("members.approve") || savingId === member.id} onClick={() => void changeStatus(member, "rejected")} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[11px] font-black text-rose-700 disabled:opacity-50">
                          <UserX className="h-3.5 w-3.5" /> رفض
                        </button>
                      )}
                      {member.status === "approved" && (
                        <button disabled={!can("members.approve") || savingId === member.id} onClick={() => void changeStatus(member, "suspended")} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-black text-slate-700 disabled:opacity-50">
                          <ShieldOff className="h-3.5 w-3.5" /> إيقاف
                        </button>
                      )}
                      {(member.status === "rejected" || member.status === "suspended") && (
                        <button disabled={!can("members.approve") || savingId === member.id} onClick={() => void changeStatus(member, "pending")} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-black text-amber-700 disabled:opacity-50">
                          <Clock3 className="h-3.5 w-3.5" /> إعادة للمراجعة
                        </button>
                      )}
                      {savingId === member.id && <Loader2 className="h-4 w-4 animate-spin text-gold-600" />}
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={5} className="p-10 text-center text-sm text-sand-500"><Check className="mx-auto mb-2 h-6 w-6" /> لا توجد حسابات بهذه الحالة.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
