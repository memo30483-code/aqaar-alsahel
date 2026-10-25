"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Building2,
  Check,
  ChevronDown,
  Compass,
  Coins,
  Languages,
  MapPin,
  Menu,
  Plus,
  Scale,
  User,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CITY_KEYS } from "@/lib/i18n/cities";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";
import { getSession } from "@/lib/session";
import { MashrabiyaLayer } from "@/components/Ornaments";

/** نمط موحّد لروابط التنقّل الرئيسية */
const NAV_LINK =
  "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-ocean-700 transition duration-200 hover:bg-ocean-50 hover:text-ocean-900";

/** نمط موحّد لمشغّلات القوائم المنسدلة */
const TRIGGER =
  "flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium text-ocean-700 transition duration-200 hover:bg-ocean-50 hover:text-ocean-900";

/** نمط موحّد لمشغّلات التفضيلات المختصرة */
const PREF_TRIGGER =
  "flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-ocean-100 bg-white/70 px-2.5 py-2 text-ocean-700 transition duration-200 hover:border-ocean-200 hover:bg-white hover:text-ocean-900";

/** نمط موحّد لعناصر لوحات القوائم — ملموم، بشادوه ناعم وحدّ خفيف، ولا يمتد طولاً زائداً */
const PANEL =
  "absolute start-0 top-full z-[100] mt-2 max-h-72 min-w-[230px] overflow-y-auto overscroll-contain rounded-2xl border border-slate-100 bg-white/95 p-1.5 shadow-xl backdrop-blur-md";

/** نمط موحّد لعناصر القائمة داخل اللوحات */
const MENU_ITEM =
  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-ocean-50 hover:text-ocean-900";

/** مكوّن قائمة منسدلة عام: إغلاق بالنقر خارجها أو بمفتاح Escape */
function Dropdown({
  trigger,
  triggerClassName = TRIGGER,
  panelClassName = PANEL,
  ariaLabel,
  children,
}: {
  trigger: ReactNode;
  triggerClassName?: string;
  panelClassName?: string;
  ariaLabel?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className={`relative ${open ? "z-[100]" : "z-10"}`}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName}
      >
        {trigger}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <div className={panelClassName}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

export default function Header() {
  const { t, locale, setLocale } = useI18n();
  const { currency, setCurrency, live, updatedAt } = useCurrency();
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getSession()));
  }, []);

  /** في حالة عدم وجود جلسة نشطة نوجّه المستخدم للتسجيل ثم نعيده لصفحة إضافة العقار */
  const addPropertyHref = loggedIn
    ? "/add-property"
    : "/register?redirect=/add-property";

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const closeMobile = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 shadow-[0_10px_30px_-20px_rgba(7,34,49,0.55)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      {/* خلفية النقوش الإسلامية الهندسية (شفافة خفيفة جداً) */}
      <MashrabiyaLayer tone="light" className="opacity-[0.05]" />
      <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:py-3.5">
        {/* الشعار */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-800 text-lg font-bold text-white shadow-soft transition duration-200 group-hover:scale-105 group-hover:shadow-lg">
            ع
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tight text-ocean-900 sm:text-xl">
              {t("brand.name")}
            </span>
            <span className="mt-1 hidden text-[10px] font-medium text-ocean-500 sm:block">
              {t("brand.tagline")}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {/* قائمة المدن */}
          <Dropdown
            ariaLabel={t("nav.cities")}
            trigger={
              <>
                <MapPin className="h-4 w-4 text-ocean-500" />
                {t("nav.cities")}
              </>
            }
            panelClassName={`${PANEL} w-[260px]`}
          >
            {(close) => (
              <div className="space-y-0.5">
                <p className="px-2.5 pb-0.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-ocean-400">
                  {t("nav.sectionCities")}
                </p>
                <div className="grid grid-cols-1 gap-0.5">
                  {CITY_KEYS.map((key) => (
                    <Link key={key} href="/#properties" className={MENU_ITEM} onClick={close}>
                      <MapPin className="h-4 w-4 shrink-0 text-ocean-400" />
                      {t(key)}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </Dropdown>

          {/* قائمة الشركات العقارية */}
          <Dropdown
            ariaLabel={t("nav.companies")}
            trigger={
              <>
                <Building2 className="h-4 w-4 text-ocean-500" />
                {t("nav.companies")}
              </>
            }
            panelClassName={`${PANEL} w-[320px]`}
          >
            {(close) => (
              <div className="space-y-1">
                <p className="px-2.5 pb-0.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-ocean-400">
                  {t("companies.heading")}
                </p>
                <Link href="/#properties" className={MENU_ITEM} onClick={close}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ocean-50 text-ocean-600">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-gray-900">
                      {t("companies.developers")}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {t("companies.developersDesc")}
                    </span>
                  </span>
                </Link>
                <Link href="/#properties" className={MENU_ITEM} onClick={close}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ocean-50 text-ocean-600">
                    <Scale className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-gray-900">
                      {t("companies.brokers")}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {t("companies.brokersDesc")}
                    </span>
                  </span>
                </Link>
              </div>
            )}
          </Dropdown>

          <Link href="/market-guide" className={NAV_LINK}>
            <Compass className="h-4 w-4 text-ocean-500" />
            {t("nav.compass")}
          </Link>
          <Link href="/legal-consultational" className={NAV_LINK}>
            <Scale className="h-4 w-4 text-ocean-500" />
            {t("nav.legal")}
          </Link>

          {/* مبدّل اللغة */}
          <Dropdown
            ariaLabel={t("pref.language")}
            triggerClassName={PREF_TRIGGER}
            panelClassName={`${PANEL} w-[210px]`}
            trigger={
              <>
                <Languages className="h-4 w-4 text-ocean-500" />
                <span className="text-xs font-bold">
                  {locale === "ar" ? "ع" : "EN"}
                </span>
              </>
            }
          >
            {(close) => (
              <div className="space-y-0.5">
                {(
                  [
                    { code: "ar", label: t("pref.langAr") },
                    { code: "en", label: t("pref.langEn") },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => {
                      setLocale(option.code);
                      close();
                    }}
                    className={`${MENU_ITEM} ${
                      locale === option.code ? "bg-ocean-50 font-bold text-ocean-900" : ""
                    }`}
                  >
                    <span className="flex-1 text-start">{option.label}</span>
                    {locale === option.code && (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </Dropdown>

          {/* مبدّل الدولة والعملة */}
          <Dropdown
            ariaLabel={t("pref.currency")}
            triggerClassName={PREF_TRIGGER}
            panelClassName={`${PANEL} w-[280px]`}
            trigger={
              <>
                <Coins className="h-4 w-4 text-ocean-500" />
                <span className="text-xs font-bold">{currency}</span>
              </>
            }
          >
            {(close) => (
              <div className="space-y-0.5">
                <p className="px-2.5 pb-0.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-ocean-400">
                  {t("pref.country")} · {t("pref.currency")}
                </p>
                {CURRENCIES.map((item) => {
                  const active = item.code === currency;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setCurrency(item.code as CurrencyCode);
                        close();
                      }}
                      className={`${MENU_ITEM} ${
                        active ? "bg-ocean-50 font-bold text-ocean-900" : ""
                      }`}
                    >
                      <span className="flex-1 text-start">
                        {t(item.countryKey)}
                        <span className="ms-2 text-xs font-normal text-gray-400">
                          {item.symbol[locale]} · {item.code}
                        </span>
                      </span>
                      {active && <Check className="h-4 w-4 text-emerald-500" />}
                    </button>
                  );
                })}
                <div className="mt-1 border-t border-slate-100 px-2.5 pb-0.5 pt-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      live
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        live ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    {live ? t("pref.ratesLive") : t("pref.ratesFallback")}
                  </span>
                  {updatedLabel && (
                    <p className="mt-1 text-[10px] text-gray-400">
                      {t("pref.updatedAt")}: {updatedLabel}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Dropdown>

          <Link href="/login" className={NAV_LINK}>
            <User className="h-4 w-4 text-ocean-500" />
            {t("nav.login")}
          </Link>

          <Link
            href={addPropertyHref}
            className="mr-1 flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ocean-700/25 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ocean-700/40"
          >
            <Plus className="h-4 w-4" />
            {t("nav.addProperty")}
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-ocean-200/80 bg-white/70 text-ocean-800 transition hover:bg-ocean-50 xl:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={t("nav.menu")}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* القائمة الجانبية للموبايل والتابلت */}
      {open && (
        <div className="max-h-[calc(100vh-72px)] overflow-y-auto border-t border-white/60 bg-white/95 px-4 py-3 backdrop-blur-xl xl:hidden">
          <div className="flex flex-col gap-1">
            <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-ocean-400">
              {t("nav.sectionCities")}
            </p>
            {CITY_KEYS.map((key) => (
              <Link
                key={key}
                href="/#properties"
                className={NAV_LINK}
                onClick={closeMobile}
              >
                <MapPin className="h-4 w-4 text-ocean-400" />
                {t(key)}
              </Link>
            ))}

            <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-ocean-400">
              {t("nav.companies")}
            </p>
            <Link href="/#properties" className={NAV_LINK} onClick={closeMobile}>
              <Building2 className="h-4 w-4 text-ocean-500" />
              {t("companies.developers")}
            </Link>
            <Link href="/#properties" className={NAV_LINK} onClick={closeMobile}>
              <Scale className="h-4 w-4 text-ocean-500" />
              {t("companies.brokers")}
            </Link>

            <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-ocean-400">
              {t("nav.sectionSections")}
            </p>
            <Link href="/market-guide" className={NAV_LINK} onClick={closeMobile}>
              <Compass className="h-4 w-4 text-ocean-500" />
              {t("nav.compass")}
            </Link>
            <Link
              href="/legal-consultational"
              className={NAV_LINK}
              onClick={closeMobile}
            >
              <Scale className="h-4 w-4 text-ocean-500" />
              {t("nav.legal")}
            </Link>

            <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-ocean-400">
              {t("pref.language")} · {t("pref.currency")}
            </p>
            <div className="flex flex-wrap gap-1.5 px-1 pt-1">
              {(["ar", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    locale === code
                      ? "bg-black text-white"
                      : "border border-ocean-100 bg-white text-ocean-700 hover:bg-ocean-50"
                  }`}
                >
                  {code === "ar" ? t("pref.langAr") : t("pref.langEn")}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 px-1 pt-2">
              {CURRENCIES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setCurrency(item.code)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                    currency === item.code
                      ? "bg-black text-white"
                      : "border border-ocean-100 bg-white text-ocean-700 hover:bg-ocean-50"
                  }`}
                >
                  {item.code}
                </button>
              ))}
            </div>
            <p className="px-3 pt-2 text-[10px] text-gray-400">
              {live ? t("pref.ratesLive") : t("pref.ratesFallback")}
              {updatedLabel ? ` — ${t("pref.updatedAt")}: ${updatedLabel}` : ""}
            </p>

            <Link
              href="/login"
              className={`${NAV_LINK} mt-2`}
              onClick={closeMobile}
            >
              <User className="h-4 w-4 text-ocean-500" />
              {t("nav.login")}
            </Link>
            <Link
              href={addPropertyHref}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ocean-700/25"
              onClick={closeMobile}
            >
              <Plus className="h-4 w-4" />
              {t("nav.addProperty")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
