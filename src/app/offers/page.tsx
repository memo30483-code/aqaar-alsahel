"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Gift, Percent, Sparkles } from "lucide-react";
import { getActiveOffers, getOffersSettings, type Offer } from "@/lib/admin-system";
import { mockProperties } from "@/data/properties";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";

export default function OffersPage() {
  const { locale } = useI18n();
  const { format } = useCurrency();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [settings, setSettings] = useState(getOffersSettings());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(getOffersSettings());
    setOffers(getActiveOffers());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!settings.enabled || offers.length === 0) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,162,77,0.08),_transparent_55%)]">
        <section className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(201,162,77,0.12)] text-[#b8963b]">
            <Gift className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
            {locale === "ar" ? settings.pageTitleAr : settings.pageTitleEn}
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            {locale === "ar" ? settings.disabledMessageAr : settings.disabledMessageEn}
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#b8963b] to-[#d9b95c] px-6 py-3 text-sm font-bold text-white shadow-[0_20px_60px_-30px_rgba(184,150,59,0.9)] transition hover:-translate-y-0.5"
          >
            {locale === "ar" ? "العودة للرئيسية" : "Back to Home"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(201,162,77,0.08),_transparent_55%)]">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(201,162,77,0.4)] bg-white/80 px-3 py-1 text-xs font-bold text-[#b8963b]">
              <Sparkles className="h-4 w-4" />
              <span>{locale === "ar" ? "عروض حصرية" : "Exclusive Offers"}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">
              {locale === "ar" ? settings.pageTitleAr : settings.pageTitleEn}
            </h1>
            <p className="mt-2 text-base text-slate-600">
              {locale === "ar" ? settings.pageDescAr : settings.pageDescEn}
            </p>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => {
            const linkedProperty = offer.propertyId ? mockProperties.find(p => p.id === offer.propertyId) : null;
            const href = offer.type === "property_linked" && offer.propertyId ? `/property/${offer.propertyId}` : "#";
            
            return (
              <article
                key={offer.id}
                className="group relative overflow-hidden rounded-3xl border border-[rgba(201,162,77,0.25)] bg-white shadow-[0_40px_80px_-60px_rgba(15,23,42,0.9)] transition hover:-translate-y-1 hover:shadow-[0_60px_100px_-70px_rgba(184,150,59,0.8)]"
              >
                <div className="relative flex flex-col">
                  <div className="flex items-start justify-between gap-3 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#b8963b] to-[#d9b95c] text-white">
                        {offer.discountPercent ? <Percent className="h-6 w-6" /> : <Gift className="h-6 w-6" />}
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900">
                          {locale === "ar" ? offer.titleAr : offer.titleEn || offer.titleAr}
                        </h2>
                        {offer.badgeTextAr && (
                          <span className="mt-1 inline-flex rounded-full bg-[rgba(201,162,77,0.12)] px-2.5 py-0.5 text-xs font-bold text-[#b8963b]">
                            {locale === "ar" ? offer.badgeTextAr : offer.badgeTextEn || offer.badgeTextAr}
                          </span>
                        )}
                      </div>
                    </div>
                    {offer.discountPercent && (
                      <div className="rounded-2xl border border-[rgba(201,162,77,0.4)] px-3 py-2 text-center">
                        <p className="text-xs text-slate-500">{locale === "ar" ? "خصم" : "Discount"}</p>
                        <p className="text-lg font-black text-[#b8963b]">%{offer.discountPercent}</p>
                      </div>
                    )}
                  </div>

                  <div className="px-6 pb-4">
                    <p className="text-sm leading-relaxed text-slate-600">
                      {locale === "ar" ? offer.descriptionAr : offer.descriptionEn || offer.descriptionAr}
                    </p>
                  </div>

                  {(offer.oldPrice || offer.newPrice) && (
                    <div className="mx-6 mb-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      {offer.oldPrice && (
                        <span className="text-sm text-slate-400 line-through">{format(offer.oldPrice)}</span>
                      )}
                      {offer.newPrice && (
                        <span className="text-lg font-black text-slate-900">{format(offer.newPrice)}</span>
                      )}
                    </div>
                  )}

                  {linkedProperty && (
                    <div className="mx-6 mb-4 rounded-2xl border border-slate-100 p-4">
                      <p className="text-xs text-slate-500">{locale === "ar" ? "مرتبط بالعقار" : "Linked Property"}</p>
                      <p className="mt-1 font-bold text-slate-900">{linkedProperty.title}</p>
                      <p className="text-sm text-slate-600">{linkedProperty.city}</p>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 p-6">
                    <div className="text-xs text-slate-500">
                      {(offer.startDate || offer.endDate) && (
                        <span>
                          {offer.startDate && offer.endDate
                            ? `${offer.startDate} - ${offer.endDate}`
                            : offer.endDate
                            ? `${locale === "ar" ? "حتى" : "Until"} ${offer.endDate}`
                            : `${locale === "ar" ? "يبدأ" : "Starts"} ${offer.startDate}`}
                        </span>
                      )}
                    </div>
                    {offer.type === "property_linked" && offer.propertyId ? (
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-[#b8963b]"
                      >
                        {locale === "ar" ? "شوف العقار" : "View Property"}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-bold text-slate-700">
                        {locale === "ar" ? "عرض عام" : "General Offer"}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
