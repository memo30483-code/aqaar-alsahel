"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Headset,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { telHref, useSiteSettings } from "@/lib/site-settings";

export interface DocSection {
  /** معرّف القسم — يُستخدم لروابط الفهرس */
  id: string;
  title: string;
  /** فقرات القسم — كل فقرة سطر مستقل */
  body: string[];
}

interface Props {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: DocSection[];
  noteTitle: string;
  noteBody: string;
  contactTitle: string;
  contactBody: string;
  tocTitle: string;
  related: { label: string; href: string }[];
}

/**
 * قالب موحّد للصفحات المعلوماتية/القانونية (الخصوصية، الشروط…)
 * بهوية عقار FAMILY: هيرو نيلي + كروت رملية + عنوان صغير ذهبي.
 */
export default function LegalDocPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
  noteTitle,
  noteBody,
  contactTitle,
  contactBody,
  tocTitle,
  related,
}: Props) {
  const site = useSiteSettings();

  return (
    <div className="bg-sand-50">
      {/* ====================== HERO ====================== */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#141a33_0%,#242e5c_58%,#141a33_100%)]">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.24),transparent_65%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-gold-400 to-transparent"
        />

        <div className="relative mx-auto w-full max-w-[1100px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-300">
            <span aria-hidden className="h-px w-6 bg-gold-400/70" />
            {eyebrow}
          </p>

          <h1 className="mt-3 text-[26px] font-black leading-[44px] tracking-tight text-white sm:text-[36px] sm:leading-[52px]">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[12.5px] leading-8 text-white/70">
            {intro}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold text-white/75">
              <CalendarDays className="h-3.5 w-3.5 text-gold-300" />
              <span dir="ltr">{updated}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/70">
              <ShieldCheck className="h-3.5 w-3.5 text-gold-300" />
              عقار FAMILY
            </span>
          </div>
        </div>
      </section>

      {/* ====================== BODY ====================== */}
      <div className="mx-auto w-full max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-3.5">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-28 rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#141a33,#2d3875)] text-[11px] font-black text-gold-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="mt-1 text-[14.5px] font-black leading-6 text-ocean-900">
                    {section.title}
                  </h2>
                </div>

                <div className="mt-3 space-y-2.5 ps-0 sm:ps-11">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[12px] leading-7 text-sand-800"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            {/* ملاحظة الثقة */}
            <section className="flex items-start gap-3 rounded-3xl border border-gold-300/60 bg-[linear-gradient(135deg,rgba(201,146,42,0.12),rgba(255,255,255,0.92)_55%)] p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-gold-600 shadow-sm">
                <Lock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[12.5px] font-black text-ocean-900">
                  {noteTitle}
                </p>
                <p className="mt-1 text-[11px] leading-6 text-sand-800">
                  {noteBody}
                </p>
              </div>
            </section>
          </div>

          {/* ---------- SIDEBAR ---------- */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-3xl border border-sand-200 bg-white p-4">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-gold-600">
                <span aria-hidden className="h-px w-5 bg-gold-400/70" />
                {tocTitle}
              </p>
              <ol className="mt-3 space-y-1">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="flex items-start gap-2 rounded-xl px-2 py-1.5 text-[11.5px] font-semibold leading-5 text-sand-800 transition hover:bg-gold-50/60 hover:text-gold-700"
                    >
                      <span className="mt-0.5 text-[10px] font-black text-sand-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>

              {related.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-sand-200 pt-3">
                  {related.map((link) => (
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
              )}
            </section>

            {/* التواصل مع الإدارة */}
            <section className="relative overflow-hidden rounded-3xl border border-ocean-900/10 bg-ocean-950 p-5 text-white">
              <span
                aria-hidden
                className="pointer-events-none absolute -end-12 -top-14 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.24),transparent_65%)]"
              />
              <div className="relative">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold-300">
                  <Headset className="h-4 w-4" />
                </span>
                <p className="mt-3 text-[12.5px] font-black">{contactTitle}</p>
                <p className="mt-1.5 text-[10.5px] leading-6 text-white/70">
                  {contactBody}
                </p>

                <div className="mt-3 space-y-1.5">
                  <a
                    href={telHref(site.managementPhone)}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-white/15"
                    dir="ltr"
                  >
                    <Phone className="h-3.5 w-3.5 text-gold-300" />
                    {site.managementPhone}
                  </a>
                  <a
                    href={`mailto:${site.managementEmail}`}
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-white/15"
                    dir="ltr"
                  >
                    <Mail className="h-3.5 w-3.5 text-gold-300" />
                    {site.managementEmail}
                  </a>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
