"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Clock3,
  ExternalLink,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCompanies, usePrimaryCompany, type CompanyRecord } from "@/lib/company-store";
import { telHref } from "@/lib/site-settings";
import BrandLogo from "@/components/BrandLogo";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-600">
      <span aria-hidden className="h-px w-6 bg-gold-400/70" />
      {children}
    </span>
  );
}

function InfoRow({
  Icon,
  label,
  children,
  ltr,
}: {
  Icon: typeof Phone;
  label: string;
  children: React.ReactNode;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-sand-200 bg-sand-50/50 px-3 py-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" />
      <div className="min-w-0">
        <p className="text-[9.5px] font-black uppercase tracking-wide text-sand-500">
          {label}
        </p>
        <p
          className="mt-0.5 break-words text-[12px] font-bold text-ocean-900"
          dir={ltr ? "ltr" : undefined}
        >
          {children}
        </p>
      </div>
    </div>
  );
}

function CompanyCard({ company }: { company: CompanyRecord }) {
  const { locale } = useI18n();
  const ar = locale === "ar";

  const legalName = ar ? company.legalNameAr : company.legalNameEn || company.legalNameAr;
  const address = ar ? company.addressAr : company.addressEn || company.addressAr;
  const hours = ar
    ? company.workingHoursAr
    : company.workingHoursEn || company.workingHoursAr;
  const about = ar ? company.aboutAr : company.aboutEn || company.aboutAr;

  const socials = [
    { label: "Facebook", href: company.facebook },
    { label: "Instagram", href: company.instagram },
    { label: "X", href: company.x },
    { label: "LinkedIn", href: company.linkedin },
    { label: "YouTube", href: company.youtube },
    { label: "TikTok", href: company.tiktok },
  ].filter((item) => Boolean(item.href));

  return (
    <article className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 bg-sand-50/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-ocean-800 to-ocean-950 text-gold-300">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[15px] font-black text-ocean-900">{legalName}</h2>
            <p className="mt-0.5 text-[11px] font-bold text-sand-500">
              {(ar ? company.tradeNameAr : company.tradeNameEn) || company.tradeNameAr}
            </p>
          </div>
        </div>
        {company.primary && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-300 bg-gold-50 px-3 py-1 text-[10.5px] font-black text-gold-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            {ar ? "الشركة المالكة للمنصة" : "Platform owner"}
          </span>
        )}
      </header>

      <div className="space-y-4 p-5">
        {about && (
          <p className="text-[12px] leading-7 text-sand-800">{about}</p>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
          <InfoRow Icon={FileText} label={ar ? "الاسم القانوني" : "Legal name"}>
            {legalName}
          </InfoRow>
          <InfoRow Icon={Building2} label={ar ? "الاسم التجاري" : "Trade name"}>
            {(ar ? company.tradeNameAr : company.tradeNameEn) || "—"}
          </InfoRow>
          <InfoRow
            Icon={ShieldCheck}
            label={ar ? "السجل التجاري" : "Commercial register"}
            ltr
          >
            {company.commercialRegister || "—"}
          </InfoRow>
          <InfoRow Icon={BadgeCheck} label={ar ? "البطاقة الضريبية" : "Tax card"} ltr>
            {company.taxCard || "—"}
          </InfoRow>
          {address && (
            <InfoRow Icon={MapPin} label={ar ? "العنوان" : "Address"}>
              {address}
            </InfoRow>
          )}
          {hours && (
            <InfoRow Icon={Clock3} label={ar ? "أوقات العمل" : "Working hours"}>
              {hours}
            </InfoRow>
          )}
        </div>

        {(company.phones.length > 0 ||
          company.emails.length > 0 ||
          company.website) && (
          <div>
            <Eyebrow>{ar ? "التواصل مع الشركة" : "Company contact"}</Eyebrow>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {company.phones.map((phone) => (
                <a
                  key={phone}
                  href={telHref(phone)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-[11px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
                  dir="ltr"
                >
                  <Phone className="h-3 w-3 text-gold-600" />
                  {phone}
                </a>
              ))}
              {company.emails.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-[11px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
                  dir="ltr"
                >
                  <Mail className="h-3 w-3 text-gold-600" />
                  {email}
                </a>
              ))}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-3 py-1.5 text-[11px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
                  dir="ltr"
                >
                  <Globe className="h-3 w-3 text-gold-600" />
                  {company.website}
                </a>
              )}
            </div>
          </div>
        )}

        {socials.length > 0 && (
          <div>
            <Eyebrow>{ar ? "حسابات رسمية" : "Official accounts"}</Eyebrow>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {socials.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white px-3 py-1.5 text-[11px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/60"
                >
                  {item.label}
                  <ExternalLink className="h-3 w-3 text-gold-600" />
                </a>
              ))}
            </div>
          </div>
        )}

        {company.licenses.length > 0 && (
          <div>
            <Eyebrow>{ar ? "التراخيص والسجلات" : "Licenses & records"}</Eyebrow>
            <div className="mt-2.5 space-y-2">
              {company.licenses.map((license) => (
                <div
                  key={license.id}
                  className="rounded-2xl border border-sand-200 bg-sand-50/50 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[12px] font-black text-ocean-900">
                      <FileText className="h-3.5 w-3.5 text-gold-600" />
                      {license.name}
                    </p>
                    {license.url && (
                      <a
                        href={license.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-gold-700 hover:underline"
                      >
                        {ar ? "عرض المستند" : "View document"}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-semibold text-sand-600">
                    <span dir="ltr">{license.number || "—"}</span>
                    {license.issuer && <span>{license.issuer}</span>}
                    {license.issuedAt && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-gold-500" />
                        {license.issuedAt}
                      </span>
                    )}
                    {license.expiresAt && (
                      <span>
                        {ar ? "ينتهي" : "Expires"}: {license.expiresAt}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function CompanyContent() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const primary = usePrimaryCompany();
  const companies = useCompanies();
  const others = companies.filter(
    (company) => company.active && company.id !== primary?.id
  );

  return (
    <div className="bg-sand-50">
      {/* Hero */}
      <section className="relative overflow-hidden theme-hero">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.24),transparent_65%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-400 to-transparent"
        />
        <div className="relative mx-auto w-full max-w-[1100px] px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-wrap items-center gap-3">
            <BrandLogo tone="dark" showTagline={false} />
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold text-white/75">
              {ar ? "بيانات الكيان المالك" : "Owner entity data"}
            </span>
          </div>
          <h1 className="mt-5 text-[26px] font-black leading-[44px] text-white sm:text-[34px]">
            {ar ? "بيانات الشركة المالكة" : "Company information"}
          </h1>
          <p className="mt-3 max-w-2xl text-[12.5px] leading-8 text-white/70">
            {ar
              ? "الكيان القانوني الذي يملك ويشغّل منصة عقار FAMILY — السجل التجاري والبطاقة الضريبية والتراخيص وبيانات التواصل الرسمية."
              : "The legal entity that owns and operates Aqaar FAMILY — commercial register, tax card, licenses, and official contact details."}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            {primary ? (
              <CompanyCard company={primary} />
            ) : (
              <div className="rounded-3xl border border-dashed border-sand-300 bg-white p-8 text-center">
                <p className="text-[13px] font-black text-ocean-900">
                  {ar ? "بيانات الشركة غير متاحة حالياً" : "Company data is not available"}
                </p>
                <p className="mt-1 text-[11.5px] text-sand-600">
                  {ar
                    ? "سيتم نشر بيانات الكيان المالك بعد اعتمادها من الإدارة."
                    : "The owner entity details will be published once approved by management."}
                </p>
              </div>
            )}

            {others.length > 0 && (
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-gold-600">
                  <span aria-hidden className="h-px w-6 bg-gold-400/70" />
                  {ar ? "كيانات مرتبطة" : "Related entities"}
                </p>
                {others.map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-3xl border border-gold-300/60 bg-[linear-gradient(135deg,rgba(201,146,42,0.12),rgba(255,255,255,0.92)_55%)] p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gold-600 shadow-sm">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[12.5px] font-black text-ocean-900">
                {ar ? "شفافية الكيان المالك" : "Owner entity transparency"}
              </p>
              <p className="mt-1.5 text-[11px] leading-6 text-sand-800">
                {ar
                  ? "نعرض بيانات الشركة المالكة والتراخيص الرسمية فقط. لا تُعرض أبداً بيانات الملاك الأفراد أو مستنداتهم، وكل التواصل بشأن الإعلانات يتم عبر إدارة المنصة."
                  : "We only publish the owner company's details and official licenses. Individual owners' data and documents are never shown, and all listing communication goes through platform management."}
              </p>
            </section>

            <section className="rounded-3xl border border-sand-200 bg-white p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-600">
                {ar ? "روابط مهمة" : "Important links"}
              </p>
              <div className="mt-2.5 space-y-1">
                {[
                  { label: ar ? "الشروط والأحكام" : "Terms & conditions", href: "/terms" },
                  { label: ar ? "سياسة الخصوصية" : "Privacy policy", href: "/privacy" },
                  { label: ar ? "خريطة الموقع" : "Sitemap", href: "/sitemap" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-[11.5px] font-bold text-ocean-800 transition hover:bg-sand-50 hover:text-gold-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-gold-500" />
                      {link.label}
                    </span>
                    <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
