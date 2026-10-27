"use client";

import { Megaphone, Plus, Save, Trash2 } from "lucide-react";
import { getSession } from "@/lib/session";
import { addAdminLog, saveMarqueeItems, type MarqueeItem } from "@/lib/admin-system";
import { BTN_PRIMARY, INPUT, Panel } from "@/components/admin/shared";

interface Props {
  items: MarqueeItem[];
  can: (key: string) => boolean;
  onChange: (items: MarqueeItem[]) => void;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

const TYPE_LABEL: Record<MarqueeItem["type"], string> = {
  partner: "شريك نجاح",
  news: "خبر",
  ad: "إعلان مدفوع",
};

export default function AdminMarqueeTab({
  items,
  can,
  onChange,
  notify,
  reloadLogs,
}: Props) {
  const session = typeof window !== "undefined" ? getSession() : null;
  const editable = can("banners.manage");

  const update = (index: number, patch: Partial<MarqueeItem>) => {
    onChange(items.map((item, position) => (position === index ? { ...item, ...patch } : item)));
  };

  const persist = () => {
    saveMarqueeItems(items);
    if (session) {
      addAdminLog({
        action: "marquee.update",
        category: "banners",
        performedBy: session.email,
        performedByName: session.name,
        performedByRole: session.role ?? "admin",
        details: "تم تحديث عناصر الشريط المتحرك",
      });
      reloadLogs();
    }
    notify("تم حفظ الشريط المتحرك");
  };

  return (
    <Panel
      title="البنرات والشريط المتحرك"
      desc="أخبار، شركاء نجاح، وإعلانات — كل عنصر يُوسم كـ«إعلان» تلقائياً عند اختيار نوعه."
      actions={
        <button onClick={persist} className={BTN_PRIMARY} disabled={!editable}>
          <Save className="h-4 w-4" /> حفظ
        </button>
      }
    >
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="grid gap-3 rounded-2xl border border-sand-200 p-4 md:grid-cols-[auto_1fr_1fr_auto_auto]"
          >
            <button
              role="switch"
              aria-checked={item.enabled}
              onClick={() => update(index, { enabled: !item.enabled })}
              disabled={!editable}
              className={`mt-6 h-6 w-11 rounded-full transition ${
                item.enabled ? "bg-emerald-500" : "bg-sand-300"
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition-all ${
                  item.enabled ? "ms-[22px]" : "ms-0.5"
                }`}
              />
            </button>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-sand-600">النص العربي</span>
              <input
                value={item.textAr}
                onChange={(event) => update(index, { textAr: event.target.value })}
                className={INPUT}
                disabled={!editable}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-sand-600">English text</span>
              <input
                value={item.textEn}
                onChange={(event) => update(index, { textEn: event.target.value })}
                className={INPUT}
                disabled={!editable}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-sand-600">النوع</span>
              <select
                value={item.type}
                onChange={(event) =>
                  update(index, { type: event.target.value as MarqueeItem["type"] })
                }
                className={INPUT}
                disabled={!editable}
              >
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => onChange(items.filter((_, position) => position !== index))}
              disabled={!editable}
              className="mt-6 flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50"
              aria-label="حذف العنصر"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-2xl border border-dashed border-sand-200 p-8 text-center text-sm text-sand-600">
            لا توجد عناصر. أضف عنصراً ليظهر الشريط المتحرك في الرئيسية.
          </p>
        )}
      </div>

      <button
        onClick={() =>
          onChange([
            ...items,
            {
              id: `m-${Date.now()}`,
              textAr: "عنصر جديد",
              textEn: "New item",
              type: "news",
              enabled: true,
              order: items.length + 1,
            },
          ])
        }
        disabled={!editable}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-sand-300 py-2.5 text-sm font-bold text-sand-700 transition hover:border-gold-400 hover:text-gold-600"
      >
        <Plus className="h-4 w-4" /> إضافة عنصر
      </button>

      <p className="mt-3 flex items-center gap-2 text-[11px] text-sand-600">
        <Megaphone className="h-3.5 w-3.5" />
        العناصر من نوع «إعلان مدفوع» تظهر بوسم «إعلان» للزائر.
      </p>
    </Panel>
  );
}
