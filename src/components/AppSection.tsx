"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Heart,
  Map as MapIcon,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { PhoneMap } from "@/components/app/AppMockup";
import StoreButtons from "@/components/app/StoreButtons";
import {
  qrImageSrc,
  resolveAppSettings,
  type AppFeatureIcon,
} from "@/lib/app-settings";
import { useSiteSettings } from "@/lib/site-settings";

const ICONS: Record<AppFeatureIcon, LucideIcon> = {
  bell: Bell,
  map: MapIcon,
  heart: Heart,
  shield: ShieldCheck,
};

/** قسم التطبيق في الصفحة الرئيسية — يظهر فقط عند تفعيله من لوحة الإدارة */
export default function AppSection() {
  const site = useSiteSettings();
  const app = resolveAppSettings(site.app);
  if (!app.enabled) return null;

  return (
    <section
      id="app"
      className="relative scroll-mt-24 overflow-hidden border-y border-white/10 bg-[linear-gradient(180deg,#0c1226,#0a0f22)] py-14 text-white sm:py-16"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -end-32 top-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.18),transparent_62%)]"
      />
      <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <p className="flex items-center gap-2.5 text-xs font-bold text-gold-300">
            <span aria-hidden className="h-px w-8 bg-gold-400" />
            {app.eyebrowAr}
          </p>
          <h2 className="font-heading mt-3 text-2xl font-black leading-snug sm:text-[34px]">
            التطبيق اللي بيخليك{" "}
            <span className="text-gold-300">أقرب لعقارك</span>
          </h2>
          <p className="mt-3 max-w-[560px] text-[13.5px] font-medium leading-8 text-[#c6cee1]">
            {app.descriptionAr}
          </p>

          <div className="mt-6 grid max-w-[580px] gap-3 sm:grid-cols-2">
            {app.features.map((feature) => {
              const Icon = ICONS[feature.icon] ?? Bell;
              return (
                <div
                  key={feature.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-3.5"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-400/15">
                    <Icon className="h-4 w-4 text-gold-300" strokeWidth={1.9} />
                  </span>
                  <p className="mt-2.5 text-[12.5px] font-black">{feature.titleAr}</p>
                  <p className="mt-1 text-[11px] leading-6 text-[#9aa6c3]">
                    {feature.descAr}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StoreButtons app={app} />
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-3.5 py-2 text-[12px] font-black text-white transition hover:border-gold-400/60 hover:bg-white/5"
            >
              <Smartphone className="h-4 w-4 text-gold-300" />
              كل تفاصيل التطبيق
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-3.5">
            <span className="h-[78px] w-[78px] shrink-0 rounded-xl bg-white p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrImageSrc(app.qrUrl)}
                alt="رمز QR لفتح المنصة على الموبايل"
                className="h-full w-full rounded-md object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </span>
            <p className="max-w-[330px] text-[11px] leading-6 text-[#9aa6c3]">
              <b className="block text-[11.5px] font-black text-white">
                امسح الكود وجرّب المنصة على الموبايل
              </b>
              التطبيق نفسه هيتاح على App Store و Google Play — والكود بيودّي على نسخة
              الويب دلوقتي.
            </p>
          </div>
        </div>

        <div className="relative mx-auto flex justify-center">
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-10 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.22),transparent_65%)] blur-2xl"
          />
          <PhoneMap className="relative h-[520px] w-[250px]" />
        </div>
      </div>
    </section>
  );
}
