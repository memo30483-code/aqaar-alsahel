"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** بانر إعلاني عائم أسفل الشاشة — يظهر بعد لحظة قصيرة وقابل للإغلاق */
export default function FeaturedAds() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`fixed inset-x-3 bottom-3 z-40 transition duration-500 sm:inset-x-auto sm:left-6 sm:w-[22rem] ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gray-950 p-4 shadow-2xl sm:p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/40 to-transparent blur-2xl" />

        <div className="relative flex items-start gap-3">
          <span className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 px-2.5 py-1 text-[11px] font-bold text-white">
            إعلان
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-blue-300">
              برعاية المطورين
            </p>
            <p className="mt-1 text-sm font-bold text-white">
              مشاريع المطورين المتميزة
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-400">
              وحدات بحرية في دمياط الجديدة — تقسيط يصل إلى 7 سنوات
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="إغلاق الإعلان"
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="relative mt-4 flex items-center gap-2">
          <Link
            href="/#properties"
            className="flex-1 rounded-full bg-white px-4 py-2.5 text-center text-sm font-bold text-gray-900 transition hover:bg-gray-100"
          >
            استكشف المشروع
          </Link>
          <Link
            href="/legal-consultational"
            className="rounded-full border border-white/15 px-4 py-2.5 text-sm font-bold text-gray-300 transition hover:bg-white/10 hover:text-white"
          >
            استشارة مجانية
          </Link>
        </div>
      </div>
    </div>
  );
}

/** مساحة إعلانية داخل شبكة العقارات في الصفحة الرئيسية */
export function FeaturedAdSlot({
  variant = "soft",
  className = "",
}: {
  variant?: "soft" | "bold";
  className?: string;
}) {
  const isBold = variant === "bold";

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${
        isBold
          ? "border-white/10 bg-gray-950"
          : "border-blue-100 bg-gradient-to-l from-blue-50 via-white to-white"
      } ${className}`}
    >
      <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent blur-2xl" />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                isBold
                  ? "bg-gradient-to-br from-blue-500 to-indigo-700 text-white"
                  : "bg-black text-white"
              }`}
            >
              إعلان مميز
            </span>
            <span
              className={`text-[11px] font-bold ${
                isBold ? "text-blue-300" : "text-blue-700"
              }`}
            >
              برعايات المطورين
            </span>
          </div>
          <p
            className={`mt-2 text-base font-bold ${
              isBold ? "text-white" : "text-gray-900"
            }`}
          >
            مشاريع المطورين المتميزة
          </p>
          <p
            className={`mt-1 text-sm ${
              isBold ? "text-gray-400" : "text-gray-600"
            }`}
          >
            شقق وشاليهات بأسعار مرحلة وخطط سداد مناسبة
          </p>
        </div>

        <Link
          href="/#properties"
          className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
            isBold
              ? "bg-white text-gray-900 hover:bg-gray-100"
              : "bg-black text-white hover:bg-gray-800"
          }`}
        >
          استكشف المشروع
        </Link>
      </div>
    </div>
  );
}
