"use client";

import { Building2, Check, X } from "lucide-react";
import { getSession } from "@/lib/session";
import { addAdminLog, saveDevelopers, type AdminDeveloper } from "@/lib/admin-system";
import { Panel, ROW_ACTION } from "@/components/admin/shared";

interface Props {
  developers: AdminDeveloper[];
  onChange: (developers: AdminDeveloper[]) => void;
  notify: (message: string) => void;
  reloadLogs: () => void;
  canManage: boolean;
}

export default function AdminDevelopersTab({
  developers,
  onChange,
  notify,
  reloadLogs,
  canManage,
}: Props) {
  const session = typeof window !== "undefined" ? getSession() : null;

  const setVerified = (id: string, verified: boolean) => {
    const next = developers.map((developer) =>
      developer.id === id ? { ...developer, verified } : developer
    );
    onChange(next);
    saveDevelopers(next);
    const target = developers.find((developer) => developer.id === id);
    if (session) {
      addAdminLog({
        action: verified ? "developer.verified" : "developer.unverified",
        category: "site",
        performedBy: session.email,
        performedByName: session.name,
        performedByRole: session.role ?? "admin",
        details: `${verified ? "توثيق" : "إلغاء توثيق"} المطور: ${target?.company ?? id}`,
      });
      reloadLogs();
    }
    notify(verified ? "تم توثيق المطور" : "تم إلغاء التوثيق");
  };

  return (
    <Panel
      title="المطورون والشركاء"
      desc="توثيق شركات التطوير التي تظهر في سلايدر المشاريع."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {developers.map((developer) => (
          <div key={developer.id} className="rounded-2xl border border-sand-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-100 text-sand-600">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-ocean-900">{developer.company}</p>
                  <p className="text-[11px] text-sand-600">{developer.owner}</p>
                  <p className="text-[11px] text-sand-500">
                    {developer.city} • {developer.projects} مشاريع
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  developer.verified
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {developer.verified ? "موثّق" : "غير موثّق"}
              </span>
            </div>
            <button
              onClick={() => setVerified(developer.id, !developer.verified)}
              disabled={!canManage}
              className={`${ROW_ACTION} mt-3 w-full justify-center`}
            >
              {developer.verified ? (
                <>
                  <X className="h-3 w-3" /> إلغاء التوثيق
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" /> توثيق المطور
                </>
              )}
            </button>
          </div>
        ))}
        {developers.length === 0 && (
          <p className="rounded-2xl border border-dashed border-sand-200 p-8 text-center text-sm text-sand-600 md:col-span-2">
            لا توجد شركات مسجلة.
          </p>
        )}
      </div>
    </Panel>
  );
}
