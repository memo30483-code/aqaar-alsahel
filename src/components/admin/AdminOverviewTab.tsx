"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock3,
  Gift,
  LayoutList,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useCurrency } from "@/lib/currency";
import type { AdminListing, AdminLog, Offer } from "@/lib/admin-system";
import { STATUS_LABEL, STATUS_STYLE } from "@/components/admin/shared";

interface Props {
  listings: AdminListing[];
  offers: Offer[];
  logs: AdminLog[];
  permissionsCount: number;
  goTo: (tab: "listings" | "offers" | "logs" | "permissions") => void;
}

export default function AdminOverviewTab({
  listings,
  offers,
  logs,
  permissionsCount,
  goTo,
}: Props) {
  const { format } = useCurrency();

  const cards = [
    {
      label: "إجمالي الإعلانات",
      value: listings.length,
      Icon: LayoutList,
      tone: "text-ocean-800",
      tab: "listings" as const,
    },
    {
      label: "بانتظار المراجعة",
      value: listings.filter((row) => row.status === "pending").length,
      Icon: Clock3,
      tone: "text-amber-600",
      tab: "listings" as const,
    },
    {
      label: "العروض المحفوظة",
      value: offers.length,
      Icon: Gift,
      tone: "text-gold-600",
      tab: "offers" as const,
    },
    {
      label: "صلاحيات ممنوحة يدوياً",
      value: permissionsCount,
      Icon: ShieldCheck,
      tone: "text-emerald-600",
      tab: "permissions" as const,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => goTo(card.tab)}
            className="rounded-3xl border border-sand-200 bg-white p-4 text-start shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] transition hover:-translate-y-0.5 hover:border-gold-300/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10.5px] font-bold text-sand-600">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-black text-ocean-900">
                  {card.value}
                </p>
              </div>
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sand-50 ${card.tone}`}
              >
                <card.Icon className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-3xl border border-sand-200 bg-white/90 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-black text-ocean-900">أحدث الإعلانات</h2>
            <button
              onClick={() => goTo("listings")}
              className="inline-flex items-center gap-1 text-xs font-bold text-gold-600"
            >
              إدارة الكل <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </button>
          </div>
          <div className="space-y-2">
            {listings.slice(0, 6).map((listing) => (
              <Link
                key={listing.id}
                href={`/property/${listing.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-sand-200 p-3 transition hover:border-gold-400"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ocean-900">{listing.title}</p>
                  <p className="text-[11px] text-sand-600">
                    {listing.city} • {format(listing.price)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[listing.status]}`}
                >
                  {STATUS_LABEL[listing.status]}
                </span>
              </Link>
            ))}
            {listings.length === 0 && (
              <p className="rounded-2xl border border-dashed border-sand-200 p-6 text-center text-sm text-sand-600">
                لا توجد إعلانات بعد.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-sand-200 bg-white/90 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-black text-ocean-900">آخر النشاطات</h2>
            <button
              onClick={() => goTo("logs")}
              className="inline-flex items-center gap-1 text-xs font-bold text-gold-600"
            >
              السجل الكامل <ArrowRight className="h-3 w-3 rtl:rotate-180" />
            </button>
          </div>
          <div className="space-y-2">
            {logs.slice(0, 6).map((log) => (
              <div key={log.id} className="rounded-2xl border border-sand-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-ocean-900">{log.details}</p>
                  <span className="shrink-0 text-[10px] text-sand-500">
                    {new Date(log.timestamp).toLocaleDateString("ar-EG")}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-sand-600">بواسطة {log.performedByName}</p>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="flex items-center gap-2 rounded-2xl border border-dashed border-sand-200 p-6 text-center text-sm text-sand-600">
                <Check className="h-4 w-4 text-emerald-500" />
                لا توجد نشاطات مسجلة بعد — ابدأ بإدارة إعلان أو عرض.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-[rgba(201,146,42,0.28)] bg-[linear-gradient(135deg,rgba(201,146,42,0.12),rgba(255,255,255,0.9))] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-gold-600" />
            <div>
              <p className="text-sm font-black text-ocean-900">صفحة العروض الموسمية</p>
              <p className="mt-1 text-xs text-sand-700">
                فعّل الصفحة، حدد التوقيت، وستظهر كبانر عائم في الرئيسية مع رابط في الهيدر.
              </p>
            </div>
          </div>
          <button
            onClick={() => goTo("offers")}
            className="inline-flex items-center gap-2 rounded-full bg-ocean-950 px-4 py-2 text-xs font-bold text-white"
          >
            إدارة العروض <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </button>
        </div>
      </section>
    </div>
  );
}
