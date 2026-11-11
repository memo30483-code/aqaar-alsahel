"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Cloud, CloudOff, Download, Loader2, RefreshCw, Upload } from "lucide-react";
import { collectCloudSnapshot } from "@/lib/cloud/snapshot";
import { applyRemoteValue, retryCloudPush } from "@/lib/cloud/push";
import { BTN_PRIMARY, Panel } from "@/components/admin/shared";

interface Props {
  notify: (message: string) => void;
}

interface CloudStatus {
  enabled: boolean;
  configured: boolean;
}

/**
 * لوحة المزامنة السحابية.
 * تتيح للأدمن رفع كل المحتوى الحالي إلى قاعدة البيانات، أو جلب آخر نسخة منها.
 */
export default function AdminCloudPanel({ notify }: Props) {
  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [busy, setBusy] = useState<"push" | "pull" | null>(null);
  const [pushState, setPushState] = useState<
    "idle" | "saving" | "saved" | "error" | "offline"
  >("idle");

  const check = useCallback(async () => {
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      const data = (await response.json()) as CloudStatus;
      setStatus({ enabled: Boolean(data.enabled), configured: Boolean(data.configured) });
    } catch {
      setStatus({ enabled: false, configured: false });
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  useEffect(() => {
    const current = window.__AQAAR_PUSH_STATE__;
    if (current) setPushState(current);
    const onPushState = (event: Event) => {
      const state = (event as CustomEvent<string>).detail;
      if (
        state === "idle" ||
        state === "saving" ||
        state === "saved" ||
        state === "error" ||
        state === "offline"
      ) {
        setPushState(state);
      }
    };
    window.addEventListener("aqaar:push-state", onPushState);
    return () => window.removeEventListener("aqaar:push-state", onPushState);
  }, []);

  const pushAll = async () => {
    setBusy("push");
    try {
      const entries = collectCloudSnapshot();

      if (!entries.length) {
        notify("لا يوجد محتوى محلي لرفعه بعد");
        return;
      }

      const response = await fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        saved?: Record<string, string>;
        values?: Record<string, unknown>;
      };
      if (!response.ok || !data.ok) {
        notify(data.error ?? "تعذّر رفع البيانات للسحابة");
        return;
      }
      for (const [key, value] of Object.entries(data.values ?? {})) {
        const updatedAt = data.saved?.[key];
        if (updatedAt) applyRemoteValue(key, value, updatedAt);
      }
      notify(`تم رفع ${entries.length} عنصرًا إلى السحابة وستظهر لكل الزوار`);
    } catch {
      notify("تعذّر الاتصال بالسحابة");
    } finally {
      setBusy(null);
    }
  };

  const pullAll = async () => {
    setBusy("pull");
    try {
      const response = await fetch("/api/state?all=1", { cache: "no-store" });
      const data = (await response.json()) as {
        rows?: Record<string, { value: unknown; updated_at: string }>;
        error?: string;
      };
      if (!response.ok || !data.rows) {
        notify(data.error ?? "تعذّر جلب البيانات من السحابة");
        return;
      }
      const rows = Object.entries(data.rows);
      if (!rows.length) {
        notify("السحابة فارغة — ارفع المحتوى الحالي أولًا");
        return;
      }
      for (const [key, row] of rows) {
        applyRemoteValue(key, row.value, row.updated_at);
      }
      notify(`تم جلب ${rows.length} عنصرًا — سيُحدَّث العرض الآن`);
      setTimeout(() => window.location.reload(), 700);
    } catch {
      notify("تعذّر الاتصال بالسحابة");
    } finally {
      setBusy(null);
    }
  };

  const online = status?.enabled === true;

  return (
    <Panel
      title="المزامنة السحابية"
      desc="محتوى الموقع محفوظ في قاعدة بيانات Supabase، فأي تعديل تحفظه يظهر لكل الزوار على كل الأجهزة."
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
            online
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {online ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
          {online ? "متصل بقاعدة البيانات" : "غير مضبوط بعد"}
        </span>

        <button
          type="button"
          onClick={() => void check()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sand-300 px-3 py-1.5 text-[11px] font-bold text-ocean-800 hover:bg-sand-50"
        >
          <RefreshCw className="h-3 w-3" />
          فحص الاتصال
        </button>
      </div>

      <div
        className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[11px] font-bold ${
          pushState === "error" || pushState === "offline"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : pushState === "saving"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          {pushState === "saving" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : pushState === "error" || pushState === "offline" ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {pushState === "saving"
            ? "جارٍ حفظ التعديلات…"
            : pushState === "error"
              ? "فشل حفظ بعض التعديلات"
              : pushState === "offline"
                ? "الجلسة غير متصلة بالمزامنة"
                : pushState === "saved"
                  ? "كل التعديلات محفوظة"
                  : "لا توجد تعديلات معلقة"}
        </span>
        {(pushState === "error" || pushState === "offline") && (
          <button
            type="button"
            onClick={retryCloudPush}
            className="rounded-lg border border-current/20 bg-white px-2.5 py-1 text-[10px] font-black"
          >
            إعادة المحاولة
          </button>
        )}
      </div>

      {!online && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-6 text-amber-800">
          أضف <code className="font-mono">SUPABASE_URL</code> و
          <code className="font-mono"> SUPABASE_SERVICE_ROLE_KEY</code> في إعدادات
          البيئة على Vercel، ثم أعد النشر. حتى ذلك الحين يعمل الموقع
          بالنسخة المحلية في متصفحك فقط.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void pushAll()}
          disabled={!online || busy !== null}
          className={`${BTN_PRIMARY} disabled:opacity-50`}
        >
          <Upload className="h-4 w-4" />
          {busy === "push" ? "جارٍ الرفع..." : "رفع كل المحتوى الحالي"}
        </button>
        <button
          type="button"
          onClick={() => void pullAll()}
          disabled={!online || busy !== null}
          className="inline-flex items-center gap-2 rounded-xl border border-sand-300 px-4 py-2.5 text-sm font-bold text-ocean-800 transition hover:bg-sand-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {busy === "pull" ? "جارٍ الجلب..." : "جلب آخر نسخة"}
        </button>
      </div>
    </Panel>
  );
}
