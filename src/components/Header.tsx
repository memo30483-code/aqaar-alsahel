"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  Compass,
  Coins,
  Languages,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Scale,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cityLabel } from "@/lib/i18n/cities";
import { useActiveCities } from "@/lib/cities-store";
import { CURRENCIES, useCurrency, type CurrencyCode } from "@/lib/currency";
import {
  clearSession,
  getSession,
  hasAdminAccess,
  type Session,
} from "@/lib/session";
import BrandLogo from "@/components/BrandLogo";
import OffersHeaderLink from "@/components/OffersHeaderLink";

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
  const cities = useActiveCities();
  const { currency, setCurrency, live, updatedAt } = useCurrency();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  /** تحديث حالة الجلسة بعد الدخول/الخروج أو تغيير الصفحة */
  useEffect(() => {
    setSession(getSession());
  }, [pathname]);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setOpen(false);
    router.push("/");
  };

  /** اسمع حالة الدخول في الوقت المناسب؛ التحقق عند النقر كانوني أمانًا أكثر */
  const handleAddPropertyClick = () => {
    const session = getSession();
    if (session) {
      router.push("/add-property");
    } else {
      router.push("/login?redirect=/add-property");
    }
  };

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const closeMobile = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-sand-200 bg-white/90 shadow-[0_10px_30px_-24px_rgba(20,26,51,0.45)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
      {/* خط ذهبي علوي رفيع — توقيع الهوية */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-gold-600 via-gold-300 to-gold-200"
      />
      {/* خلفية النقوش الإسلامية الهندسية (شفافة خفيفة جداً) */}
      <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:py-3.5">
        {/* الشعار */}
        <Link
          href="/"
          aria-label={t("brand.name")}
          className="group flex shrink-0 items-center gap-2.5"
        >
          <BrandLogo markClassName="h-10 w-10 transition duration-200 group-hover:scale-105" />
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
                  {cities.map((city) => (
                    <Link key={city.id} href="/#properties" className={MENU_ITEM} onClick={close}>
                      <MapPin className="h-4 w-4 shrink-0 text-ocean-400" />
                      {cityLabel(city.nameAr, t, locale)}
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
                <Link href="/developers" className={MENU_ITEM} onClick={close}>
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
                <Link href="/brokers" className={MENU_ITEM} onClick={close}>
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
                <Link href="/login?redirect=%2Fjoin" className={MENU_ITEM} onClick={close}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold text-gray-900">
                      {t("companies.join")}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {t("companies.joinDesc")}
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

          <OffersHeaderLink />

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

          {session ? (
            <Dropdown
              ariaLabel={t("nav.account")}
              trigger={
                <>
                  <User className="h-4 w-4 text-ocean-500" />
                  <span className="max-w-[9rem] truncate">
                    {session.name.split(" ")[0] || t("nav.account")}
                  </span>
                </>
              }
              panelClassName={`${PANEL} w-[250px]`}
            >
              {(close) => (
                <div className="space-y-0.5">
                  <p className="truncate px-2.5 pb-1 pt-1 text-[11px] font-bold text-ocean-400">
                    {session.email}
                  </p>
                  {hasAdminAccess(session) && (
                    <Link
                      href="/admin"
                      className={MENU_ITEM}
                      onClick={close}
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0 text-gold-600" />
                      {t("nav.adminPanel")}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      handleLogout();
                    }}
                    className={`${MENU_ITEM} w-full text-rose-700 hover:bg-rose-50`}
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </Dropdown>
          ) : (
            <Link href="/login" className={NAV_LINK}>
              <User className="h-4 w-4 text-ocean-500" />
              {t("nav.login")}
            </Link>
          )}

          <button
            type="button"
            onClick={handleAddPropertyClick}
            className="mr-1 flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ocean-700/25 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-ocean-700/40"
          >
            <Plus className="h-4 w-4" />
            {t("nav.addProperty")}
          </button>
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
            {cities.map((city) => (
              <Link
                key={city.id}
                href="/#properties"
                className={NAV_LINK}
                onClick={closeMobile}
              >
                <MapPin className="h-4 w-4 text-ocean-400" />
                {cityLabel(city.nameAr, t, locale)}
              </Link>
            ))}

            <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-ocean-400">
              {t("nav.companies")}
            </p>
            <Link href="/developers" className={NAV_LINK} onClick={closeMobile}>
              <Building2 className="h-4 w-4 text-ocean-500" />
              {t("companies.developers")}
            </Link>
            <Link href="/brokers" className={NAV_LINK} onClick={closeMobile}>
              <Scale className="h-4 w-4 text-ocean-500" />
              {t("companies.brokers")}
            </Link>
            <Link
              href="/login?redirect=%2Fjoin"
              className={NAV_LINK}
              onClick={closeMobile}
            >
              <BadgeCheck className="h-4 w-4 text-gold-500" />
              {t("companies.join")}
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

            <div className="px-1 py-1">
              <OffersHeaderLink />
            </div>

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

            {session ? (
              <>
                <p className="truncate px-3 pt-2 text-[11px] font-bold text-ocean-500">
                  {session.email}
                </p>
                {hasAdminAccess(session) && (
                  <Link
                    href="/admin"
                    className={NAV_LINK}
                    onClick={closeMobile}
                  >
                    <ShieldCheck className="h-4 w-4 text-gold-600" />
                    {t("nav.adminPanel")}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${NAV_LINK} text-rose-700 hover:bg-rose-50`}
                >
                  <LogOut className="h-4 w-4" />
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className={`${NAV_LINK} mt-2`}
                onClick={closeMobile}
              >
                <User className="h-4 w-4 text-ocean-500" />
                {t("nav.login")}
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                handleAddPropertyClick();
                closeMobile();
              }}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-ocean-700/25"
            >
              <Plus className="h-4 w-4" />
              {t("nav.addProperty")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
