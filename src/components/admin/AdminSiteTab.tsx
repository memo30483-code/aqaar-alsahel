"use client";

import { Eye, LayoutTemplate, Save } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  addAdminLog,
  saveSiteSettings,
  type BlockKey,
  type SiteSettings,
} from "@/lib/admin-system";
import { BTN_PRIMARY, Field, INPUT, Panel } from "@/components/admin/shared";

interface Props {
  settings: SiteSettings;
  can: (key: string) => boolean;
  onChange: (settings: SiteSettings) => void;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

const BLOCK_LABELS: Record<BlockKey, string> = {
  hero: "قسم الهيرو الرئيسي",
  verify_strip: "شريط التحقق والتوثيق",
  marquee: "الشريط المتحرك (إعلانات/أخبار)",
  featured_listings: "شبكة العقارات المميزة",
  projects_slider: "سلايدر المشاريع",
  ai_assistant: "المساعد العقاري الذكي",
  inline_ad: "الإعلان الداخلي بين العقارات",
  ad_band: "شريط الإعلانات العريض",
  market_panel: "لوحة السوق والخريطة",
  story_dossier: "قصة الموقع + ملف التحقق",
  manage_note: "شريط سياسة التواصل أسفل الصفحة",
};

export default function AdminSiteTab({ settings, can, onChange, notify, reloadLogs }: Props) {
  const session = typeof window !== "undefined" ? getSession() : null;
  const editable = can("site.settings") || can("site.blocks");

  const persist = () => {
    saveSiteSettings(settings);
    if (session) {
      addAdminLog({
        action: "site.settings.update",
        category: "site",
        performedBy: session.email,
        performedByName: session.name,
        performedByRole: session.role ?? "admin",
        details: "تم تحديث إعدادات الموقع العامة وبلوكات الصفحة الرئيسية",
      });
      reloadLogs();
    }
    notify("تم حفظ إعدادات الموقع");
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const next = [...settings.blocks];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((block, position) => ({ ...block, order: position + 1 }));
    onChange({ ...settings, blocks: reordered });
  };

  return (
    <div className="space-y-5">
      <Panel
        title="إعدادات الموقع العامة"
        desc="بيانات إدارة الموقع التي تظهر للزوار فقط — لا تُعرض بيانات المالك أو الوسيط."
        actions={
          <button onClick={persist} className={BTN_PRIMARY} disabled={!editable}>
            <Save className="h-4 w-4" /> حفظ
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="رقم تليفون إدارة الموقع" hint="يظهر في كل أزرار التواصل بالموقع.">
            <input
              value={settings.managementPhone}
              onChange={(event) => onChange({ ...settings, managementPhone: event.target.value })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
          <Field label="إيميل إدارة الموقع">
            <input
              value={settings.managementEmail}
              onChange={(event) => onChange({ ...settings, managementEmail: event.target.value })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
          <Field label="فيسبوك">
            <input
              value={settings.facebook ?? ""}
              onChange={(event) => onChange({ ...settings, facebook: event.target.value })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
          <Field label="إنستجرام">
            <input
              value={settings.instagram ?? ""}
              onChange={(event) => onChange({ ...settings, instagram: event.target.value })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
          <Field label="تيك توك">
            <input
              value={settings.tiktok ?? ""}
              onChange={(event) => onChange({ ...settings, tiktok: event.target.value })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
          <Field label="واتساب الإدارة">
            <input
              value={settings.whatsapp ?? ""}
              onChange={(event) => onChange({ ...settings, whatsapp: event.target.value })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
          <Field label="نص الفوتر (عربي)">
            <textarea
              rows={2}
              value={settings.footerTextAr ?? ""}
              onChange={(event) => onChange({ ...settings, footerTextAr: event.target.value })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
          <Field label="Footer text (English)">
            <textarea
              rows={2}
              value={settings.footerTextEn ?? ""}
              onChange={(event) => onChange({ ...settings, footerTextEn: event.target.value })}
              className={INPUT}
              disabled={!editable}
            />
          </Field>
        </div>
      </Panel>

      <Panel
        title="تحكم بلوكات الصفحة الرئيسية"
        desc="أوقف أي بلوك فيختفي فوراً من الصفحة الرئيسية، أو أعد ترتيبه."
        actions={
          <Link href="/" target="_blank" className="inline-flex items-center gap-1 text-xs font-bold text-gold-600">
            <Eye className="h-4 w-4" /> معاينة الرئيسية
          </Link>
        }
      >
        <div className="space-y-2">
          {settings.blocks.map((block, index) => (
            <div
              key={block.key}
              className="flex flex-col gap-3 rounded-2xl border border-sand-200 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sand-100 text-xs font-black text-sand-600">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-ocean-900">
                    {BLOCK_LABELS[block.key] ?? block.key}
                  </p>
                  <p className="text-[11px] text-sand-500">{block.key}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveBlock(index, -1)}
                  disabled={!can("site.blocks") || index === 0}
                  className="rounded-lg border border-sand-200 px-2 py-1 text-xs font-bold text-sand-700 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveBlock(index, 1)}
                  disabled={!can("site.blocks") || index === settings.blocks.length - 1}
                  className="rounded-lg border border-sand-200 px-2 py-1 text-xs font-bold text-sand-700 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  role="switch"
                  aria-checked={block.enabled}
                  onClick={() => {
                    const blocks = settings.blocks.map((item) =>
                      item.key === block.key ? { ...item, enabled: !item.enabled } : item
                    );
                    onChange({ ...settings, blocks });
                  }}
                  disabled={!can("site.blocks")}
                  className={`relative h-6 w-11 rounded-full transition ${
                    block.enabled ? "bg-emerald-500" : "bg-sand-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      block.enabled ? "start-[22px]" : "start-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-center gap-2 text-[11px] text-sand-600">
          <LayoutTemplate className="h-3.5 w-3.5" />
          التغييرات تُحفظ عند الضغط على «حفظ» بالأعلى.
        </p>
      </Panel>
    </div>
  );
}
