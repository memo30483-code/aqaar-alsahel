"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";

interface Props {
  price: number;
  whatsapp: string;
  title: string;
}

export default function InstallmentCard({ price, whatsapp, title }: Props) {
  const defaultDown = Math.round(price * 0.2);
  const [downPayment, setDownPayment] = useState(String(defaultDown));
  const [years, setYears] = useState("5");

  const installment = useMemo(() => {
    const down = Number(downPayment) || 0;
    const y = Number(years) || 0;
    if (y <= 0 || down >= price) return 0;
    return (price - down) / (y * 12);
  }, [downPayment, years, price]);

  const phoneDisplay = whatsapp.startsWith("20")
    ? `+${whatsapp}`
    : whatsapp;
  const telHref = `tel:+${whatsapp.replace(/^\+/, "")}`;
  const waHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    `مرحباً، مهتم بعقار: ${title}`
  )}`;

  return (
    <aside className="sticky top-24 space-y-5 rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
      <div>
        <p className="text-xs font-semibold text-ocean-500">السعر الإجمالي</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-ocean-900">
          {formatPrice(price)}
          <span className="mr-1 text-base font-bold text-ocean-600">ج.م</span>
        </p>
      </div>

      <div className="rounded-xl border border-ocean-100 bg-ocean-50/60 p-4">
        <h3 className="mb-3 text-sm font-bold text-ocean-900">حاسبة الأقساط</h3>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ocean-600">
              المقدم (ج.م)
            </span>
            <input
              type="number"
              min={0}
              max={price}
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              className="w-full rounded-xl border border-ocean-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-200"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ocean-600">
              عدد السنوات
            </span>
            <select
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full rounded-xl border border-ocean-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-200"
            >
              {[1, 2, 3, 4, 5, 7, 10].map((y) => (
                <option key={y} value={y}>
                  {y} {y === 1 ? "سنة" : "سنوات"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-ocean-100 pt-3">
          <span className="text-xs font-semibold text-ocean-600">
            القسط الشهري
          </span>
          <p className="text-xl font-extrabold text-ocean-700">
            {formatPrice(Math.max(0, Math.round(installment)))}
            <span className="mr-1 text-xs font-bold">ج.م</span>
          </p>
        </div>
        <p className="mt-1 text-[11px] text-ocean-400">
          (السعر − المقدم) ÷ (السنوات × 12)
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1ebe57]"
        >
          <WhatsAppIcon />
          تواصل واتساب
        </a>
        <a
          href={telHref}
          className="flex items-center justify-center gap-2 rounded-xl border border-ocean-200 bg-white px-4 py-3.5 text-sm font-bold text-ocean-800 transition hover:bg-ocean-50"
        >
          <PhoneIcon />
          اتصال {phoneDisplay}
        </a>
      </div>
    </aside>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}
