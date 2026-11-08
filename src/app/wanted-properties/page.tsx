"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  FileSearch,
  Loader2,
  MapPin,
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings, whatsappHref } from "@/lib/site-settings";
import {
  DEFAULT_PROPERTY_REQUEST_SETTINGS,
  normalizePropertyRequestSettings,
  type PropertyRequestsSettings,
} from "@/lib/property-requests";

interface WantedBrief {
  purpose: "بيع" | "إيجار";
  types: string[];
  cities: string[];
  districts: string[];
  priceMin: number | null;
  priceMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  roomsMin: number | null;
  bathroomsMin: number | null;
  finishes: string[];
  saleReason: string;
  delivery: string;
}

interface WantedRequest {
  id: string;
  reference: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  brief: WantedBrief;
  publishedAt: string;
}

const INPUT =
  "h-11 w-full rounded-xl border border-sand-200 bg-white px-3 text-xs font-bold text-ocean-900 outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-200/50";

function money(value: number | null, locale: "ar" | "en"): string {
  if (value === null) return locale === "ar" ? "مرن" : "Flexible";
  return `${new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(value)} ${
    locale === "ar" ? "ج.م" : "EGP"
  }`;
}

function dateLabel(value: string, locale: "ar" | "en"): string {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function WantedPropertiesPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const site = useSiteSettings();
  const [settings, setSettings] = useState<PropertyRequestsSettings>(
    DEFAULT_PROPERTY_REQUEST_SETTINGS
  );
  const [requests, setRequests] = useState<WantedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [purpose, setPurpose] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/wanted-properties", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as {
          error?: string;
          settings?: PropertyRequestsSettings;
          requests?: WantedRequest[];
        };
        if (!response.ok) throw new Error(data.error || "تعذر قراءة الطلبات");
        if (cancelled) return;
        setSettings(normalizePropertyRequestSettings(data.settings));
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "تعذر قراءة العقارات المطلوبة"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(requests.flatMap((item) => item.brief.cities))),
    [requests]
  );
  const types = useMemo(
    () => Array.from(new Set(requests.flatMap((item) => item.brief.types))),
    [requests]
  );
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return requests.filter((item) => {
      if (city && !item.brief.cities.includes(city)) return false;
      if (type && !item.brief.types.includes(type)) return false;
      if (purpose && item.brief.purpose !== purpose) return false;
      if (!needle) return true;
      return [
        item.titleAr,
        item.titleEn,
        item.descriptionAr,
        item.descriptionEn,
        ...item.brief.cities,
        ...item.brief.districts,
        ...item.brief.types,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [city, purpose, query, requests, type]);

  const pageSettings = settings;
  const title = ar
    ? pageSettings.directoryTitleAr
    : pageSettings.directoryTitleEn;
  const subtitle = ar
    ? pageSettings.directorySubtitleAr
    : pageSettings.directorySubtitleEn;
  const managementNumber =
    site.whatsapp?.trim() || site.managementPhone?.trim() || "";

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center bg-sand-50">
        <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-sand-50">
      <section className="border-b border-sand-200 bg-[radial-gradient(circle_at_12%_15%,rgba(201,146,42,.2),transparent_34%),linear-gradient(135deg,#10172c,#1d3657)] px-4 py-10 text-white sm:py-14">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-white/10 px-3 py-1.5 text-xs font-black text-gold-200">
              <FileSearch className="h-4 w-4" />
              {ar ? "عقار مطلوب" : "Wanted property"}
            </span>
            <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-8 text-sand-200">
              {subtitle}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-2 text-[11px] font-bold text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              {ar
                ? "لا تظهر أسماء العملاء أو أرقامهم — التواصل عبر الإدارة فقط"
                : "Buyer names and numbers stay private — contact is through management only"}
            </p>
          </div>
          <Link
            href="/request-property"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gold-500 px-5 py-3 text-sm font-black text-ocean-950 transition hover:bg-gold-400"
          >
            <FileSearch className="h-4 w-4" />
            {ar ? "أضف طلب عقارك" : "Add your property request"}
          </Link>
        </div>
      </section>

      <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
        {!pageSettings.directoryEnabled ? (
          <div className="rounded-3xl border border-sand-200 bg-white p-10 text-center">
            <FileSearch className="mx-auto h-12 w-12 text-sand-300" />
            <h2 className="mt-4 text-xl font-black text-ocean-900">
              {ar ? "الصفحة متوقفة مؤقتًا" : "This page is temporarily unavailable"}
            </h2>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-sand-200 bg-white p-4 shadow-sm">
              <div className="grid gap-3 md:grid-cols-4">
                <label className="relative md:col-span-1">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-600" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${INPUT} ps-9`} placeholder={ar ? "ابحث في الطلبات…" : "Search requests…"} />
                </label>
                <select value={city} onChange={(event) => setCity(event.target.value)} className={INPUT}>
                  <option value="">{ar ? "كل المدن" : "All cities"}</option>
                  {cities.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select value={type} onChange={(event) => setType(event.target.value)} className={INPUT}>
                  <option value="">{ar ? "كل الأنواع" : "All types"}</option>
                  {types.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <select value={purpose} onChange={(event) => setPurpose(event.target.value)} className={INPUT}>
                  <option value="">{ar ? "شراء أو إيجار" : "Buy or rent"}</option>
                  <option value="بيع">{ar ? "مطلوب للشراء" : "Wanted to buy"}</option>
                  <option value="إيجار">{ar ? "مطلوب للإيجار" : "Wanted to rent"}</option>
                </select>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-sand-600">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {ar ? `${filtered.length} طلب منشور` : `${filtered.length} published requests`}
              </p>
            </section>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center text-sm font-bold text-rose-700">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-sand-300 bg-white p-10 text-center">
                <FileSearch className="mx-auto h-12 w-12 text-sand-300" />
                <p className="mt-4 text-sm font-bold leading-7 text-sand-600">
                  {ar ? pageSettings.directoryEmptyAr : pageSettings.directoryEmptyEn}
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => {
                  const brief = item.brief;
                  const displayTitle = ar
                    ? item.titleAr
                    : item.titleEn || item.titleAr;
                  const displayDescription = ar
                    ? item.descriptionAr
                    : item.descriptionEn || item.descriptionAr;
                  const message = ar
                    ? `لدي عقار قد يطابق الطلب ${item.reference}: ${displayTitle}`
                    : `I may have a property matching request ${item.reference}: ${displayTitle}`;
                  return (
                    <article key={item.id} className="flex flex-col overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-md">
                      <div className="border-b border-sand-200 bg-sand-50/70 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-200 bg-gold-50 px-2.5 py-1 text-[10px] font-black text-gold-800">
                            <BadgeCheck className="h-3.5 w-3.5" /> {ar ? "معتمد للنشر" : "Approved"}
                          </span>
                          <span dir="ltr" className="text-[9px] font-bold tracking-wide text-sand-400">{item.reference}</span>
                        </div>
                        <h2 className="mt-3 text-lg font-black leading-7 text-ocean-900">{displayTitle}</h2>
                        {displayDescription && <p className="mt-2 line-clamp-3 text-xs font-semibold leading-6 text-sand-700">{displayDescription}</p>}
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <Spec Icon={MapPin} label={ar ? "المدينة" : "City"} value={[...brief.cities, ...brief.districts].join("، ") || "—"} />
                          <Spec Icon={Building2} label={ar ? "النوع" : "Type"} value={brief.types.join("، ") || "—"} />
                          <Spec Icon={Ruler} label={ar ? "المساحة" : "Area"} value={`${brief.areaMin ?? "—"} — ${brief.areaMax ?? "—"} م²`} />
                          <Spec Icon={BedDouble} label={ar ? "الغرف" : "Rooms"} value={brief.roomsMin ? `${brief.roomsMin}+` : ar ? "مرن" : "Flexible"} />
                          <Spec Icon={Bath} label={ar ? "الحمامات" : "Bathrooms"} value={brief.bathroomsMin ? `${brief.bathroomsMin}+` : ar ? "مرن" : "Flexible"} />
                          <Spec Icon={CalendarDays} label={ar ? "الاستلام" : "Delivery"} value={brief.delivery || (ar ? "مرن" : "Flexible")} />
                        </div>
                        <div className="mt-4 rounded-2xl border border-gold-200 bg-gold-50/60 p-3">
                          <p className="text-[10px] font-bold text-gold-700">{ar ? "الميزانية" : "Budget"}</p>
                          <p className="mt-1 text-sm font-black text-ocean-900">{money(brief.priceMin, locale)} — {money(brief.priceMax, locale)}</p>
                        </div>
                        {brief.finishes.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{brief.finishes.map((finish) => <span key={finish} className="rounded-full bg-sand-100 px-2.5 py-1 text-[9px] font-bold text-sand-700">{finish}</span>)}</div>}
                        <p className="mt-4 flex items-center gap-1.5 text-[9px] font-semibold text-sand-400"><CalendarDays className="h-3 w-3" /> {dateLabel(item.publishedAt, locale)}</p>
                        {managementNumber && (
                          <a href={whatsappHref(managementNumber, message)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-xs font-black text-white shadow-sm transition hover:bg-[#1fbd5a]">
                            <WhatsAppIcon className="h-4 w-4" />
                            {ar ? "لدي عقار مطابق — تواصل مع الإدارة" : "I have a match — contact management"}
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Spec({
  Icon,
  label,
  value,
}: {
  Icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-sand-50 p-2.5">
      <p className="flex items-center gap-1 text-[9px] font-bold text-sand-500"><Icon className="h-3 w-3 text-gold-600" />{label}</p>
      <p className="mt-1 font-black leading-5 text-ocean-900">{value}</p>
    </div>
  );
}
