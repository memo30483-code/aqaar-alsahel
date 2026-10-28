"use client";

import { useMemo, useState } from "react";
import { Download, ListChecks, Search } from "lucide-react";
import type { AdminLog } from "@/lib/admin-system";
import { INPUT, Panel } from "@/components/admin/shared";

interface Props {
  logs: AdminLog[];
}

const CATEGORY_LABEL: Record<AdminLog["category"], string> = {
  listings: "الإعلانات",
  users: "المستخدمون",
  offers: "العروض",
  site: "الموقع",
  banners: "البنرات",
  auth: "الدخول",
  professionals: "المهنيون",
  settings: "الإعدادات",
};

export default function AdminLogsTab({ logs }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | AdminLog["category"]>("all");

  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        if (category !== "all" && log.category !== category) return false;
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return (
          log.details.toLowerCase().includes(q) ||
          log.performedByName.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q)
        );
      }),
    [logs, query, category]
  );

  const exportCsv = () => {
    const rows = [
      ["التاريخ", "القسم", "الإجراء", "التفاصيل", "بواسطة", "الدور"],
      ...filtered.map((log) => [
        new Date(log.timestamp).toLocaleString("ar-EG"),
        CATEGORY_LABEL[log.category],
        log.action,
        log.details,
        log.performedByName,
        log.performedByRole,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aqaar-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Panel
      title="سجل النشاطات"
      desc="كل إجراء حساس مسجّل بالاسم والتوقيت — موافقة، رفض، حذف، تفعيل عروض، تغيير صلاحيات."
      actions={
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1 rounded-full border border-sand-200 px-3 py-2 text-xs font-bold text-sand-700"
        >
          <Download className="h-3.5 w-3.5" /> تصدير CSV
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="بحث في السجل"
            className={`${INPUT} pe-9 sm:w-72`}
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as typeof category)}
          className={`${INPUT} sm:w-44`}
        >
          <option value="all">كل الأقسام</option>
          {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-[560px] space-y-2 overflow-y-auto">
        {filtered.map((log) => (
          <div key={log.id} className="rounded-2xl border border-sand-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-bold text-sand-700">
                  {CATEGORY_LABEL[log.category]}
                </span>
                <p className="text-sm font-bold text-ocean-900">{log.details}</p>
              </div>
              <p className="text-[11px] text-sand-500">
                {new Date(log.timestamp).toLocaleString("ar-EG")}
              </p>
            </div>
            <p className="mt-1 text-[11px] text-sand-600">
              بواسطة {log.performedByName} • {log.action}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-sand-200 p-10 text-center text-sm text-sand-600">
            <ListChecks className="h-6 w-6 text-sand-400" />
            لا توجد نشاطات مطابقة.
          </p>
        )}
      </div>
    </Panel>
  );
}
