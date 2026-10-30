"use client";

import { useEffect, useMemo, useState } from "react";
import { Headset, Phone, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { telHref, useSiteSettings } from "@/lib/site-settings";

interface Props {
  price: number;
  title: string;
  /** السعر تحدده إدارة المنصة */
  priceByAdmin?: boolean;
  /** قابلية التفاوض على السعر */
  negotiable?: boolean;
}

export default function InstallmentCard({
  price,
  title,
  priceByAdmin = false,
  negotiable,
}: Props) {
  const { t } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const site = useSiteSettings();

  const defaultDown = Math.round(price * 0.2);
  const [downPayment, setDownPayment] = useState(String(defaultDown));
  const [years, setYears] = useState("5");

  /* التنقل بين عقارين يعيد استخدام المكوّن — نعيد ضبط المقدم مع السعر الجديد */
  useEffect(() => {
    setDownPayment(String(Math.round(price * 0.2)));
  }, [price]);

  const installment = useMemo(() => {
    const down = Number(downPayment) || 0;
    const y = Number(years) || 0;
    if (y <= 0 || down >= price) return 0;
    return (price - down) / (y * 12);
  }, [downPayment, years, price]);

  const managementMail = `mailto:${site.managementEmail}?subject=${encodeURIComponent(
    title
  )}`;

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      {/* ===== السعر ===== */}
      <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_26px_70px_-60px_rgba(20,26,51,0.55)]">
        <div className="relative overflow-hidden theme-hero p-5 text-white">
          <span
            aria-hidden
            className="pointer-events-none absolute -end-14 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.28),transparent_65%)]"
          />
          <div className="relative">
            <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.16em] text-gold-300">
              <span aria-hidden className="h-px w-5 bg-gold-400/70" />
              {t("property.totalPrice")}
            </p>
            <p className="mt-2 text-[27px] font-black leading-tight tracking-tight">
              {priceByAdmin ? (
                <span className="text-[17px] leading-7">
                  {t("property.priceByAdmin")}
                </span>
              ) : (
                formatWithSymbol(price)
              )}
            </p>
            {priceByAdmin ? (
              <p className="mt-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[10.5px] font-semibold leading-5 text-white/85">
                {t("property.priceByAdminHint")}
              </p>
            ) : (
              negotiable !== undefined && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/85">
                  <ShieldCheck className="h-3 w-3 text-gold-300" />
                  {negotiable
                    ? t("property.negotiable")
                    : t("property.nonNegotiable")}
                </p>
              )
            )}
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/85">
              <ShieldCheck className="h-3 w-3 text-gold-300" />
              {t("home.listings.manage")}
            </p>
          </div>
        </div>

        {/* ===== حاسبة الأقساط — تختفي لو السعر تحدده الإدارة ===== */}
        {!priceByAdmin && (
          <div className="p-5">
            <h3 className="text-[13px] font-black text-ocean-900">
              {t("property.installments.title")}
            </h3>
            <div className="mt-3 space-y-2.5">
              <label className="block">
                <span className="mb-1 block text-[10.5px] font-bold text-sand-700">
                  {t("property.installments.down")}
                </span>
                <input
                  type="number"
                  min={0}
                  max={price}
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className="w-full rounded-xl border border-sand-200 bg-sand-50/60 px-3 py-2.5 text-[13px] font-semibold text-ocean-900 outline-none transition focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200/60"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10.5px] font-bold text-sand-700">
                  {t("property.installments.years")}
                </span>
                <select
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="w-full rounded-xl border border-sand-200 bg-sand-50/60 px-3 py-2.5 text-[13px] font-semibold text-ocean-900 outline-none transition focus:border-gold-400 focus:bg-white focus:ring-2 focus:ring-gold-200/60"
                >
                  {[1, 2, 3, 4, 5, 7, 10].map((y) => (
                    <option key={y} value={y}>
                      {y} {y === 1 ? t("property.years.one") : t("property.years.many")}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex items-end justify-between rounded-2xl border border-gold-200/70 bg-gold-50/60 px-3 py-2.5">
              <span className="text-[10.5px] font-bold text-gold-800">
                {t("property.installments.monthly")}
              </span>
              <p className="text-[17px] font-black text-ocean-900">
                {formatWithSymbol(Math.max(0, Math.round(installment)))}
              </p>
            </div>
            <p className="mt-1.5 text-[10px] font-medium text-sand-600">
              {t("property.installments.formula")}
            </p>
          </div>
        )}
      </div>

      {/* ===== التواصل ===== */}
      <div className="rounded-3xl border border-sand-200 bg-white p-4 shadow-[0_26px_70px_-60px_rgba(20,26,51,0.5)]">
        <div className="flex flex-col gap-2">
          <a
            href={`${managementMail}&body=${encodeURIComponent(t("home.dossier.cta"))}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 px-4 py-3 text-[12.5px] font-black text-ocean-950 shadow-[0_16px_34px_-22px_rgba(201,146,42,0.9)] transition hover:-translate-y-0.5"
          >
            <Headset className="h-4 w-4" />
            {t("home.dossier.cta")}
          </a>
          <a
            href={telHref(site.managementPhone)}
            className="flex items-center justify-center gap-2 rounded-xl border border-sand-200 bg-sand-50/60 px-4 py-2.5 text-[12px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
            dir="ltr"
          >
            <Phone className="h-3.5 w-3.5 text-gold-600" />
            {site.managementPhone}
          </a>
        </div>

        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-sand-50 px-3 py-2.5 text-[10px] font-bold leading-5 text-sand-800">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
          بيانات المالك والمستندات محجوبة — التواصل والمعاينة عبر إدارة الموقع فقط.
        </p>
      </div>
    </aside>
  );
}
