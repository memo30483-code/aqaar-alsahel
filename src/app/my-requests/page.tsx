"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BellRing,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Clock3,
  ExternalLink,
  Loader2,
  LockKeyhole,
  MapPin,
  Plus,
  Ruler,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import { useCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";
import {
  PROPERTY_REQUEST_NOTIFICATIONS_EVENT,
  PROPERTY_REQUEST_STATUS_LABEL,
  PROPERTY_REQUEST_STATUS_STYLE,
  propertyRequestSummary,
  type PropertyRequestBrief,
  type PropertyRequestStatus,
} from "@/lib/property-requests";

interface MatchItem {
  propertyId: string;
  score: number;
  reasons: string[];
  overBudget: boolean;
  priceOnRequest: boolean;
  title: string;
  city: string;
  district: string;
  type: string;
  area: number;
  rooms: number;
  bathrooms: number;
  price: number;
  image: string;
  alerted: boolean;
  unseen: boolean;
  sharedByAdmin: boolean;
}

interface RequestItem {
  id: string;
  reference: string;
  brief: PropertyRequestBrief;
  status: PropertyRequestStatus;
  createdAt: string;
  updatedAt: string;
  matches: MatchItem[];
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

export default function MyRequestsPage() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const { formatWithSymbol } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState<RequestItem[]>([]);

  const markVisibleAlerts = useCallback(async (items: RequestItem[]) => {
    const batches = items
      .map((item) => ({
        requestId: item.id,
        propertyIds: item.matches
          .filter((match) => match.unseen)
          .map((match) => match.propertyId),
      }))
      .filter((item) => item.propertyIds.length > 0);
    if (!batches.length) return;

    await Promise.allSettled(
      batches.map((batch) =>
        fetch("/api/property-requests/mine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch),
        })
      )
    );
    window.dispatchEvent(new CustomEvent(PROPERTY_REQUEST_NOTIFICATIONS_EVENT));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/property-requests/mine", {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        error?: string;
        requests?: RequestItem[];
      };
      if (response.status === 401) {
        setUnauthorized(true);
        setRequests([]);
        return;
      }
      if (!response.ok) throw new Error(data.error || "تعذر قراءة الطلبات");
      const items = Array.isArray(data.requests) ? data.requests : [];
      setUnauthorized(false);
      setRequests(items);
      void markVisibleAlerts(items);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "تعذر قراءة الطلبات"
      );
    } finally {
      setLoading(false);
    }
  }, [markVisibleAlerts]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center bg-sand-50">
        <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <section className="flex-1 bg-sand-50 px-4 py-14">
        <div className="mx-auto max-w-xl rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-sm">
          <LockKeyhole className="mx-auto h-12 w-12 text-gold-600" />
          <h1 className="mt-4 text-2xl font-black text-ocean-900">
            {ar ? "سجّل الدخول لعرض طلباتك" : "Sign in to view your requests"}
          </h1>
          <p className="mt-2 text-sm leading-7 text-sand-700">
            {ar
              ? "طلبات العقار والترشيحات مرتبطة بحسابك لحماية بياناتك."
              : "Property requests and matches are securely linked to your account."}
          </p>
          <Link
            href="/login?redirect=%2Fmy-requests"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ocean-900 px-6 py-3 text-sm font-black text-white"
          >
            {ar ? "تسجيل الدخول" : "Sign in"} <ChevronLeft className="h-4 w-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="flex-1 bg-sand-50">
      <section className="border-b border-sand-200 bg-white px-4 py-8 sm:py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-50 px-3 py-1.5 text-xs font-black text-gold-700">
              <BellRing className="h-4 w-4" />
              {ar ? "متابعة خاصة وآمنة" : "Private, secure tracking"}
            </span>
            <h1 className="mt-3 text-3xl font-black text-ocean-900">
              {ar ? "طلبات العقار الخاصة بي" : "My property requests"}
            </h1>
            <p className="mt-2 text-sm leading-7 text-sand-700">
              {ar
                ? "تابع حالة كل طلب وشاهد العقارات المطابقة من الإعلانات المعتمدة."
                : "Track each request and view matches from approved listings."}
            </p>
          </div>
          <Link
            href="/request-property"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean-900 px-5 py-3 text-sm font-black text-white"
          >
            <Plus className="h-4 w-4" />
            {ar ? "طلب عقار جديد" : "New request"}
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            <span className="flex items-center gap-2"><CircleAlert className="h-5 w-5" /> {error}</span>
            <button type="button" onClick={() => void load()} className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs">إعادة المحاولة</button>
          </div>
        )}

        {!error && requests.length === 0 && (
          <div className="rounded-3xl border border-dashed border-sand-300 bg-white p-10 text-center">
            <SearchCheck className="mx-auto h-12 w-12 text-sand-400" />
            <h2 className="mt-4 text-xl font-black text-ocean-900">
              {ar ? "لا توجد طلبات حتى الآن" : "No requests yet"}
            </h2>
            <p className="mt-2 text-sm text-sand-600">
              {ar
                ? "اكتب مواصفات عقارك وسنبدأ المطابقة فورًا."
                : "Tell us your requirements and matching starts immediately."}
            </p>
            <Link href="/request-property" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-3 text-sm font-black text-ocean-950">
              <Plus className="h-4 w-4" /> {ar ? "ابدأ الآن" : "Start now"}
            </Link>
          </div>
        )}

        {requests.map((item) => {
          const statusStyle = PROPERTY_REQUEST_STATUS_STYLE[item.status];
          const bestMatches = item.matches.slice(0, 8);
          return (
            <section key={item.id} className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-sm">
              <div className="border-b border-sand-200 bg-sand-50/70 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${statusStyle}`}>
                        {PROPERTY_REQUEST_STATUS_LABEL[item.status]}
                      </span>
                      <span dir="ltr" className="rounded-full border border-sand-200 bg-white px-3 py-1 text-[11px] font-black tracking-wide text-ocean-800">
                        {item.reference}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-black text-ocean-900">
                      {propertyRequestSummary(item.brief)}
                    </h2>
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-sand-600">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {ar ? "أُرسل في" : "Submitted"} {dateLabel(item.createdAt, locale)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-center">
                    <p className="text-2xl font-black text-violet-700">{item.matches.length}</p>
                    <p className="text-[10px] font-bold text-violet-600">{ar ? "عقار مطابق" : "matches"}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {bestMatches.length === 0 ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-black text-amber-900">
                        {ar ? "ما زلنا نبحث عن التطابق المناسب" : "We are still finding the right match"}
                      </p>
                      <p className="mt-1 text-xs leading-6 text-amber-800">
                        {ar
                          ? "سيظهر هنا أي إعلان معتمد يطابق مواصفاتك، وسيتواصل معك فريق الإدارة."
                          : "Any newly approved matching listing will appear here and our team will contact you."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-sm font-black text-ocean-900">
                        <Sparkles className="h-4 w-4 text-gold-600" />
                        {ar ? "أفضل الترشيحات" : "Top matches"}
                      </h3>
                      <p className="text-[11px] font-semibold text-sand-500">
                        {ar ? "النسبة تقريبية حسب المواصفات" : "Score is based on your specs"}
                      </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {bestMatches.map((match) => (
                        <article key={match.propertyId} className={`relative overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 hover:shadow-md ${match.alerted ? "border-gold-300" : "border-sand-200"}`}>
                          {match.alerted && (
                            <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-gold-500 px-2.5 py-1 text-[9px] font-black text-ocean-950 shadow">
                              <BellRing className="h-3 w-3" /> {match.sharedByAdmin ? "ترشيح الإدارة" : "تطابق جديد"}
                            </span>
                          )}
                          <div className="relative h-36 bg-sand-100">
                            {match.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={match.image} alt={match.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center"><Building2 className="h-10 w-10 text-sand-300" /></div>
                            )}
                            <span className="absolute bottom-2 left-2 rounded-full bg-ocean-950/90 px-2.5 py-1 text-[10px] font-black text-white">{match.score}% مطابق</span>
                          </div>
                          <div className="p-4">
                            <h4 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-ocean-900">{match.title}</h4>
                            <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-sand-600"><MapPin className="h-3.5 w-3.5 text-gold-600" /> {match.city}{match.district ? `، ${match.district}` : ""}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold text-sand-600">
                              <span>{match.type}</span><span>•</span><span className="inline-flex items-center gap-1"><Ruler className="h-3 w-3" /> {match.area} م²</span>{match.rooms > 0 && <><span>•</span><span>{match.rooms} غرف</span></>}
                            </div>
                            <p className="mt-3 text-sm font-black text-gold-700">{match.priceOnRequest ? "السعر لدى الإدارة" : formatWithSymbol(match.price)}</p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {match.reasons.slice(0, 2).map((reason) => <span key={reason} className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">{reason}</span>)}
                            </div>
                            <Link href={`/property/${encodeURIComponent(match.propertyId)}`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ocean-900 px-3 py-2 text-xs font-black text-ocean-900 transition hover:bg-ocean-900 hover:text-white">
                              {ar ? "عرض الإعلان" : "View listing"} <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-sand-50 px-4 py-3 text-[11px] font-semibold leading-6 text-sand-600">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  {ar ? "تظهر هنا الإعلانات المنشورة والمعتمدة فقط. كل تواصل وتنسيق معاينة يتم عبر إدارة المنصة." : "Only approved published listings appear here. All contact and viewing coordination is handled by platform management."}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
