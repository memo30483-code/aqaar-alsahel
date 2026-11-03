"use client";

import Link from "next/link";
import { ArrowLeft, BadgeCheck, Smartphone } from "lucide-react";
import { AppIcon } from "@/components/app/AppMockup";
import {
  APP_STATUS_LABEL,
  resolveAppSettings,
} from "@/lib/app-settings";
import { useSiteSettings } from "@/lib/site-settings";

/**
 * تنويه مختصر بالتطبيق قرب نهاية الرئيسية.
 * التفاصيل والصور والمزايا الكاملة موجودة في صفحة /app حتى تظل الرئيسية عقارية.
 */
export default function AppSection() {
  const site = useSiteSettings();
  const app = resolveAppSettings(site.app);
  if (!app.enabled) return null;

  return (
    <section id="app" className="scroll-mt-24 border-y border-sand-200 bg-white py-8">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-ocean-950 px-5 py-5 text-white shadow-[0_20px_50px_-30px_rgba(20,26,51,0.8)] sm:px-7">
          <span
            aria-hidden
            className="pointer-events-none absolute -end-20 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.2),transparent_66%)]"
          />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <AppIcon size={50} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10.5px] font-bold text-gold-300">
                  {app.eyebrowAr}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold text-[#c7d0e3]">
                  <BadgeCheck className="h-2.5 w-2.5 text-gold-300" />
                  {APP_STATUS_LABEL[app.status]}
                </span>
              </div>
              <h2 className="font-heading mt-1 text-lg font-black sm:text-xl">
                {app.titleAr} <span className="text-gold-300">{app.subtitleAr}</span>
              </h2>
              <p className="mt-1 max-w-[720px] text-[11px] font-medium leading-6 text-[#b9c3d9] sm:text-[11.5px]">
                {app.descriptionAr}
              </p>
            </div>

            <Link
              href="/app"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-gold-300/50 bg-gold-400/10 px-4 py-2.5 text-[11.5px] font-black text-gold-200 transition hover:bg-gold-400/20 sm:self-center"
            >
              <Smartphone className="h-4 w-4" />
              تفاصيل التطبيق
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
