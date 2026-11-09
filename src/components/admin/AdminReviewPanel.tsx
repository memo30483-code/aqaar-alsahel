"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, FileCheck2, Loader2, RefreshCcw, RotateCcw, Send, ShieldCheck, XCircle } from "lucide-react";
import {
  DOCUMENT_CHECK_LABEL,
  REVIEW_SCOPE_LABEL,
  REVIEW_STAGE_LABEL,
  REVIEW_STAGE_STYLE,
  type DocumentCheckStatus,
  type ReviewDocumentCheck,
  type ReviewRecord,
  type ReviewScope,
  type WorkflowSettings,
} from "@/lib/workflow";
import type { AdminUser } from "@/lib/admin-system";

interface ReviewDocument {
  key: string;
  label: string;
}

interface Props {
  scope: ReviewScope;
  itemId: string;
  can: (key: string) => boolean;
  documents?: ReviewDocument[];
  notify: (message: string) => void;
  onDecision?: (stage: ReviewRecord["stage"]) => void;
}

const EMPTY_DOCUMENTS: ReviewDocument[] = [];

export default function AdminReviewPanel({ scope, itemId, can, documents = EMPTY_DOCUMENTS, notify, onDecision }: Props) {
  const [record, setRecord] = useState<ReviewRecord | null>(null);
  const [checks, setChecks] = useState<ReviewDocumentCheck[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workflowEnabled, setWorkflowEnabled] = useState(true);
  const [staff, setStaff] = useState<AdminUser[]>([]);
  const [assignee, setAssignee] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [response, workflowResponse] = await Promise.all([
        fetch(`/api/admin/review?scope=${scope}&itemId=${encodeURIComponent(itemId)}`, { cache: "no-store" }),
        fetch("/api/admin/workflow", { cache: "no-store" }),
      ]);
      const data = (await response.json()) as { record?: ReviewRecord; error?: string };
      if (!response.ok || !data.record) throw new Error(data.error || "تعذر تحميل المراجعة");
      if (workflowResponse.ok) {
        const workflowData = (await workflowResponse.json()) as { settings?: WorkflowSettings };
        setWorkflowEnabled(workflowData.settings?.[scope].enabled ?? true);
      }
      setRecord(data.record);
      setNotes(data.record.notes ?? "");
      const saved = new Map((data.record.documents ?? []).map((item) => [item.key, item]));
      setChecks(documents.map((item) => saved.get(item.key) ?? { ...item, status: "unclear" }));
      setAssignee(data.record.assignedTo ?? "");
      if (can("review.assign")) {
        void fetch("/api/admin/staff", { cache: "no-store" })
          .then(async (staffResponse) => {
            if (!staffResponse.ok) return;
            const staffData = (await staffResponse.json()) as { users?: AdminUser[] };
            setStaff((staffData.users ?? []).filter((item) => item.active));
          })
          .catch(() => undefined);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر تحميل المراجعة");
    } finally {
      setLoading(false);
    }
  }, [can, documents, itemId, notify, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (action: "start" | "submit" | "approve" | "reject" | "return" | "reopen") => {
    if (!record || saving) return;
    let decisionNote = "";
    if (action === "reject" || action === "return") {
      const value = window.prompt(action === "reject" ? "سبب الرفض:" : "ما المطلوب استكماله من العميل؟", "");
      if (value === null) return;
      if (!value.trim()) {
        notify("اكتب سبب القرار أولًا");
        return;
      }
      decisionNote = value;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          itemId,
          action,
          notes,
          decisionNote,
          documents: checks,
          expectedVersion: record.version,
        }),
      });
      const data = (await response.json()) as { record?: ReviewRecord; error?: string; message?: string };
      if (!response.ok || !data.record) throw new Error(data.message || data.error || "تعذر تنفيذ الإجراء");
      setRecord(data.record);
      setNotes(data.record.notes ?? notes);
      notify(
        action === "submit"
          ? "تمت المراجعة وتحويل الطلب تلقائيًا إلى الأدمن"
          : action === "approve"
            ? "تمت الموافقة النهائية والنشر"
            : action === "reject"
              ? "تم رفض الطلب"
              : action === "return"
                ? "تمت إعادة الطلب للاستكمال"
                : "تم تحديث مرحلة المراجعة"
      );
      onDecision?.(data.record.stage);
      window.dispatchEvent(new Event("aqaar:workflow-updated"));
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر تنفيذ الإجراء");
    } finally {
      setSaving(false);
    }
  };

  const setCheck = (key: string, status: DocumentCheckStatus) => {
    setChecks((items) => items.map((item) => (item.key === key ? { ...item, status } : item)));
  };

  const assignReview = async () => {
    if (!record || saving || !can("review.assign")) return;
    const user = staff.find((item) => item.id === assignee);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope,
          itemId,
          action: "assign",
          assignedTo: user?.id ?? "",
          assignedToName: user?.name ?? "",
          expectedVersion: record.version,
        }),
      });
      const data = (await response.json()) as { record?: ReviewRecord; message?: string; error?: string };
      if (!response.ok || !data.record) throw new Error(data.message || data.error || "تعذر الإسناد");
      setRecord(data.record);
      notify(user ? `تم إسناد المراجعة إلى ${user.name}` : "تم إلغاء إسناد المراجعة");
      window.dispatchEvent(new Event("aqaar:workflow-updated"));
    } catch (error) {
      notify(error instanceof Error ? error.message : "تعذر الإسناد");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !record) {
    return <div className="flex items-center justify-center gap-2 rounded-2xl border border-sand-200 bg-sand-50 py-8 text-sm text-sand-600"><Loader2 className="h-4 w-4 animate-spin" /> تحميل مسار المراجعة…</div>;
  }

  const canReview = can(`${scope}.review`);
  const canPublish = can(`${scope}.publish`);
  const reviewOpen = record.stage === "new" || record.stage === "returned" || record.stage === "in_review";

  return (
    <section className="rounded-2xl border-2 border-ocean-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-black text-gold-700"><ShieldCheck className="h-4 w-4" /> مسار مراجعة {REVIEW_SCOPE_LABEL[scope]}</p>
          <h3 className="mt-1 font-black text-ocean-950">مراجعة مستقلة ثم موافقة نهائية</h3>
          {(record.reviewerName || record.assignedToName) && <p className="mt-1 text-[11px] text-sand-500">المراجع: {record.reviewerName || record.assignedToName}</p>}
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${REVIEW_STAGE_STYLE[record.stage]}`}>{REVIEW_STAGE_LABEL[record.stage]}</span>
      </div>

      {can("review.assign") && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-sand-200 bg-sand-50 p-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-[11px] font-black text-sand-700">
            إسناد المراجعة إلى
            <select value={assignee} onChange={(event) => setAssignee(event.target.value)} className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-3 py-2 text-xs">
              <option value="">غير مسند</option>
              {staff.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.role}</option>)}
            </select>
          </label>
          <button onClick={() => void assignReview()} disabled={saving || assignee === (record.assignedTo ?? "")} className="rounded-lg bg-ocean-950 px-4 py-2 text-xs font-black text-white disabled:opacity-40">حفظ الإسناد</button>
        </div>
      )}

      {record.decisionNote && <p className="mt-3 rounded-xl bg-sand-50 p-3 text-xs leading-6 text-sand-700"><strong>ملاحظة القرار:</strong> {record.decisionNote}</p>}

      {reviewOpen && canReview && (
        <div className="mt-4 space-y-3">
          {record.stage !== "in_review" && (
            <button onClick={() => void act("start")} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-ocean-950 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><FileCheck2 className="h-4 w-4" /> بدء مراجعة المستندات والتفاصيل</button>
          )}
          {(record.stage === "in_review" || record.stage === "new" || record.stage === "returned") && (
            <>
              {checks.length > 0 && (
                <div className="space-y-2 rounded-xl border border-sand-200 bg-sand-50 p-3">
                  <p className="text-xs font-black text-ocean-950">نتيجة فحص كل مستند</p>
                  {checks.map((check) => (
                    <div key={check.key} className="flex flex-col gap-2 rounded-xl bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-bold text-sand-700">{check.label || check.key}</span>
                      <div className="flex gap-1">
                        {(["ok", "unclear", "rejected"] as DocumentCheckStatus[]).map((value) => (
                          <button key={value} onClick={() => setCheck(check.key, value)} type="button" className={`rounded-lg px-2 py-1 text-[10px] font-black ${check.status === value ? value === "ok" ? "bg-emerald-500 text-white" : value === "rejected" ? "bg-rose-500 text-white" : "bg-amber-400 text-ocean-950" : "border border-sand-200 text-sand-600"}`}>{DOCUMENT_CHECK_LABEL[value]}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-24 w-full rounded-xl border border-sand-200 p-3 text-xs outline-none focus:border-gold-400" placeholder="ملاحظات المراجع الداخلية — لا تظهر للزائر" />
              <button onClick={() => void act("submit")} disabled={saving || checks.some((item) => item.status !== "ok")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /> تمت المراجعة وسلامة المستندات — تحويل للأدمن</button>
            </>
          )}
        </div>
      )}

      {!workflowEnabled && reviewOpen && canPublish && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-bold text-emerald-800">مرحلة المراجعة متوقفة من إعدادات الأدمن؛ يمكن اتخاذ قرار النشر مباشرة.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => void act("approve")} disabled={saving} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> موافقة ونشر مباشر</button>
            <button onClick={() => void act("reject")} disabled={saving} className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><XCircle className="h-4 w-4" /> رفض</button>
          </div>
        </div>
      )}

      {record.stage === "awaiting_admin" && (
        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3">
          <p className="text-xs font-black text-violet-800">اكتملت مراجعة الموظف، والطلب جاهز لقرار الأدمن النهائي.</p>
          {record.notes && <p className="mt-2 text-xs leading-6 text-violet-700">ملاحظات المراجع: {record.notes}</p>}
          {canPublish && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => void act("approve")} disabled={saving} className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> موافقة نهائية ونشر</button>
              <button onClick={() => void act("return")} disabled={saving} className="inline-flex items-center gap-1 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-ocean-950 disabled:opacity-50"><RefreshCcw className="h-4 w-4" /> إعادة للاستكمال</button>
              <button onClick={() => void act("reject")} disabled={saving} className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><XCircle className="h-4 w-4" /> رفض نهائي</button>
            </div>
          )}
        </div>
      )}

      {(record.stage === "approved" || record.stage === "rejected") && canPublish && (
        <button onClick={() => void act("reopen")} disabled={saving} className="mt-4 inline-flex items-center gap-1 rounded-xl border border-sand-200 px-3 py-2 text-xs font-black text-sand-700 disabled:opacity-50"><RotateCcw className="h-4 w-4" /> إعادة فتح المراجعة</button>
      )}
      {saving && <p className="mt-3 flex items-center gap-2 text-xs font-bold text-sand-500"><Loader2 className="h-4 w-4 animate-spin" /> جارٍ حفظ القرار على السيرفر…</p>}
    </section>
  );
}
