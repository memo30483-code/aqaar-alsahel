"use client";

import { useMemo, useState } from "react";
import { Headset, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CURRENCIES, useCurrency } from "@/lib/currency";
import { telHref, useSiteSettings } from "@/lib/site-settings";

interface Props {
  price: number;
  title: string;
}

export default function InstallmentCard({ price, title }: Props) {
  const { t, locale } = useI18n();
  const { formatWithSymbol } = useCurrency();
  const site = useSiteSettings();
  const egpSymbol = CURRENCIES[0].symbol[locale];

  const defaultDown = Math.round(price * 0.2);
  const [downPayment, setDownPayment] = useState(String(defaultDown));
  const [years, setYears] = useState("5");

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
    <aside className="sticky top-24 space-y-5 rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
      <div>
        <p className="text-xs font-semibold text-ocean-500">
          {t("property.totalPrice")}
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-ocean-900">
          {formatWithSymbol(price)}
        </p>
      </div>

      <div className="rounded-xl border border-ocean-100 bg-ocean-50/60 p-4">
        <h3 className="mb-3 text-sm font-bold text-ocean-900">
          {t("property.installments.title")}
        </h3>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ocean-600">
              {t("property.installments.down")} ({egpSymbol})
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
              {t("property.installments.years")}
            </span>
            <select
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="w-full rounded-xl border border-ocean-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-ocean-500 focus:ring-2 focus:ring-ocean-200"
            >
              {[1, 2, 3, 4, 5, 7, 10].map((y) => (
                <option key={y} value={y}>
                  {y}{" "}
                  {y === 1
                    ? t("property.years.one")
                    : t("property.years.many")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-ocean-100 pt-3">
          <span className="text-xs font-semibold text-ocean-600">
            {t("property.installments.monthly")}
          </span>
          <p className="text-xl font-extrabold text-ocean-700">
            {formatWithSymbol(Math.max(0, Math.round(installment)))}
          </p>
        </div>
        <p className="mt-1 text-[11px] text-ocean-400">
          {t("property.installments.formula")}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <a
          href={`${managementMail}&body=${encodeURIComponent(
            t("home.dossier.cta")
          )}`}
          className="flex items-center justify-center gap-2 rounded-xl bg-ocean-900 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-ocean-950"
        >
          <Headset className="h-5 w-5" />
          {t("home.dossier.cta")}
        </a>
        <a
          href={telHref(site.managementPhone)}
          className="flex items-center justify-center gap-2 rounded-xl border border-ocean-200 bg-white px-4 py-3.5 text-sm font-bold text-ocean-800 transition hover:bg-ocean-50"
          dir="ltr"
        >
          {site.managementPhone}
        </a>
      </div>

      <p className="flex items-start gap-1.5 rounded-xl border border-gold-200 bg-gold-50 px-3 py-2.5 text-[11px] font-bold leading-6 text-gold-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
        {t("home.listings.manage")}
      </p>
    </aside>
  );
}
