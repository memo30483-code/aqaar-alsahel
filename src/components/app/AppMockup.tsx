"use client";

import type { ReactNode } from "react";
import {
  Bell,
  Heart,
  Home,
  Map as MapIcon,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { useBranding } from "@/components/ThemeProvider";

const IMG = {
  villa:
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&q=80",
  beach:
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
  apartment:
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
  corniche:
    "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=700&q=80",
  modern:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
};

/** أيقونة التطبيق — من لوحة الإدارة أو الحرف الذهبي الافتراضي */
export function AppIcon({ size = 28 }: { size?: number }) {
  const branding = useBranding();
  if (branding.appIcon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={branding.appIcon}
        alt=""
        className="shrink-0 rounded-[9px] object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-[9px] bg-gradient-to-br from-gold-300 to-gold-500 font-black text-ocean-950 shadow-[0_4px_10px_-4px_rgba(201,146,42,0.9)]"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
      aria-hidden
    >
      F
    </span>
  );
}

export function PhoneFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      dir="rtl"
      /* بدون `relative` هنا كي تعمل كلاسات `absolute` التي تمرّرها الشاشات (تراكب الموبايلات) */
      className={`rounded-[42px] bg-gradient-to-b from-[#2a3150] to-[#0b1020] p-[7px] shadow-[0_44px_90px_-32px_rgba(0,0,0,0.9)] ring-1 ring-white/10 ${className}`}
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[36px] bg-[#f7f8fc]">
        <span
          aria-hidden
          className="absolute left-1/2 top-[9px] z-30 h-[18px] w-[72px] -translate-x-1/2 rounded-full bg-[#0b1020]"
        />
        {children}
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-4 pb-1 pt-3.5 text-[9px] font-extrabold text-[#20263c]">
      <span>9:41</span>
      <span className="flex items-center gap-[3px] opacity-60" aria-hidden>
        <i className="block h-[5px] w-[9px] rounded-[1px] bg-[#20263c]" />
        <i className="block h-[5px] w-[9px] rounded-[1px] bg-[#20263c]" />
        <i className="relative block h-[6px] w-[14px] rounded-[2px] bg-[#20263c]">
          <i className="absolute inset-[1px] left-[3px] rounded-[1px] bg-[#f7f8fc]" />
        </i>
      </span>
    </div>
  );
}

function TabBar({ active }: { active: "home" | "map" }) {
  const items = [
    { key: "home", label: "الرئيسية", Icon: Home },
    { key: "map", label: "الخريطة", Icon: MapIcon },
    { key: "saved", label: "المحفوظات", Icon: Heart },
    { key: "account", label: "حسابي", Icon: User },
  ] as const;
  return (
    <div className="mt-auto grid grid-cols-4 items-center border-t border-[#e7ebf4] bg-white px-1 pb-3 pt-2">
      {items.map(({ key, label, Icon }) => {
        const on = key === active;
        return (
          <div
            key={key}
            className={`relative grid justify-items-center gap-[3px] text-[7px] font-extrabold ${
              on ? "text-ocean-900" : "text-[#9aa3b8]"
            }`}
          >
            <Icon className="h-[14px] w-[14px]" strokeWidth={1.9} />
            {label}
            {on && (
              <span className="absolute -bottom-[5px] h-[2px] w-[14px] rounded-full bg-gold-400" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="absolute start-2 top-2 flex items-center gap-1 rounded-full bg-[#0c583e]/95 px-2 py-[3px] text-[7px] font-extrabold text-[#d9f7ea]">
      <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2.6} />
      موثّق
    </span>
  );
}

/** الشاشة الرئيسية للتطبيق */
export function PhoneHome({ className = "" }: { className?: string }) {
  return (
    <PhoneFrame className={className}>
      <StatusBar />
      <div className="flex items-center gap-2 px-3.5 pb-2 pt-1">
        <AppIcon size={26} />
        <div className="leading-none">
          <p className="font-heading text-[11px] font-black text-ocean-950">
            عقار FAMILY
          </p>
          <p className="mt-[3px] text-[7px] font-bold text-[#7b8499]">
            عقار موثّق… مش مجرد إعلان
          </p>
        </div>
        <span className="ms-auto grid h-6 w-6 place-items-center rounded-lg bg-[#eef0f6]">
          <Bell className="h-3 w-3 text-[#4a5470]" strokeWidth={1.9} />
        </span>
      </div>

      <span className="mx-3.5 inline-flex w-fit items-center gap-1 rounded-full bg-[#eef4ff] px-2 py-[3px] text-[7.5px] font-extrabold text-[#33507f]">
        <MapIcon className="h-2 w-2" /> راس البر، دمياط
      </span>

      <div className="mx-3.5 mt-2 flex items-center gap-1.5 rounded-[10px] border border-[#e4e8f2] bg-white px-2.5 py-2 text-[8px] font-semibold text-[#98a1b6] shadow-sm">
        <Search className="h-2.5 w-2.5" strokeWidth={2.2} />
        ابحث عن شقة، فيلا، شاليه…
      </div>

      <div className="mt-2 flex gap-1.5 overflow-hidden px-3.5">
        {["الكل", "شقق", "فيلات", "شاليهات", "محلات"].map((chip, index) => (
          <span
            key={chip}
            className={`whitespace-nowrap rounded-full px-2 py-[3px] text-[7px] font-extrabold ${
              index === 0 ? "bg-ocean-950 text-white" : "bg-[#eef0f6] text-[#5c6680]"
            }`}
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between px-3.5">
        <span className="text-[8.5px] font-black text-ocean-950">
          عقارات موثّقة قريبة منك
        </span>
        <span className="text-[7px] font-bold text-[#7b8499]">عرض الكل</span>
      </div>

      <div className="mx-3.5 mt-1.5 overflow-hidden rounded-[13px] border border-[#e9edf6] bg-white shadow-[0_10px_24px_-16px_rgba(16,23,48,0.4)]">
        <div className="relative h-[92px] bg-[#dfe4ef]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMG.villa} alt="" className="h-full w-full object-cover" />
          <VerifiedBadge />
          <span className="absolute bottom-1.5 end-1.5 rounded-md bg-ocean-950/90 px-2 py-[2px] text-[8px] font-black text-white">
            3,150,000 ج.م
          </span>
        </div>
        <div className="px-2.5 py-2">
          <p className="text-[9px] font-black text-ocean-950">
            فيلا مستقلة بحديقة — دمياط الجديدة
          </p>
          <p className="mt-1 text-[7.5px] font-semibold text-[#7b8499]">
            الحي الثاني · 240 م² · 4 غرف · 3 حمام
          </p>
        </div>
      </div>

      <div className="mx-3.5 mt-2 grid grid-cols-2 gap-2 pb-2">
        {[
          { img: IMG.beach, title: "شاليه على البحر", meta: "راس البر · 95 م²" },
          { img: IMG.apartment, title: "شقة 2 غرف", meta: "دمياط · 85 م²" },
        ].map((item) => (
          <div
            key={item.title}
            className="overflow-hidden rounded-[10px] border border-[#e9edf6] bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.img} alt="" className="h-[46px] w-full object-cover" />
            <div className="px-1.5 py-1.5">
              <p className="text-[7.5px] font-black text-ocean-950">{item.title}</p>
              <p className="mt-[2px] text-[6.5px] font-bold text-[#7b8499]">
                {item.meta}
              </p>
            </div>
          </div>
        ))}
      </div>

      <TabBar active="home" />
    </PhoneFrame>
  );
}

/** شاشة تفاصيل العقار */
export function PhoneDetail({ className = "" }: { className?: string }) {
  return (
    <PhoneFrame className={className}>
      <div className="relative h-[190px] shrink-0 bg-[#dfe4ef]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={IMG.corniche} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-x-3 top-8 flex justify-between">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-ocean-950/55 text-xs text-white backdrop-blur">
            ‹
          </span>
          <span className="grid h-7 w-7 place-items-center rounded-full bg-ocean-950/55 text-white backdrop-blur">
            <Heart className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="relative z-10 -mt-4 flex flex-1 flex-col rounded-t-[18px] bg-white px-3.5 pb-3 pt-3">
        <p className="text-[10px] font-black leading-5 text-ocean-950">
          شقة 3 غرف على كورنيش راس البر
        </p>
        <p className="mt-1 text-[7.5px] font-bold text-[#7b8499]">
          راس البر · شارع ٢٤ · الدور الثالث
        </p>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-[13px] font-black text-ocean-950">2,400,000 ج.م</span>
          <span className="text-[7px] font-bold text-[#7b8499]">قابل للتفاوض</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {[
            ["120 م²", "المساحة"],
            ["3", "غرف"],
            ["2", "حمام"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg bg-[#f4f6fb] py-1.5 text-center">
              <p className="text-[8.5px] font-black text-ocean-950">{value}</p>
              <p className="mt-[2px] text-[6.5px] font-bold text-[#7b8499]">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-start gap-1.5 rounded-[10px] border border-[#cfeee0] bg-[#effaf4] px-2 py-2">
          <ShieldCheck className="mt-[1px] h-3 w-3 shrink-0 text-emerald-600" />
          <div>
            <p className="text-[7.5px] font-black text-[#0f5f43]">المستندات مفحوصة</p>
            <p className="mt-[2px] text-[6.5px] font-bold leading-4 text-[#3d7a63]">
              تم التحقق من الملكية والتراخيص. التواصل عبر إدارة الموقع فقط.
            </p>
          </div>
        </div>
        <div className="mt-auto flex gap-1.5 pt-3">
          <span className="flex-1 rounded-[9px] bg-gradient-to-br from-gold-300 to-gold-500 py-2 text-center text-[8.5px] font-black text-[#241a06]">
            تواصل مع الإدارة
          </span>
          <span className="grid w-9 place-items-center rounded-[9px] bg-[#f0f2f8] text-[11px] text-[#4a5470]">
            ↗
          </span>
        </div>
      </div>
    </PhoneFrame>
  );
}

/** شاشة الخريطة */
export function PhoneMap({ className = "" }: { className?: string }) {
  return (
    <PhoneFrame className={className}>
      <StatusBar />
      <div className="relative mt-1 flex-1 overflow-hidden bg-[#e8eef2]">
        <span className="absolute inset-y-0 start-0 w-[38%] bg-gradient-to-br from-[#8fd0dd] to-[#5fb6c9]" />
        <span className="absolute inset-y-0 start-[32%] w-[12%] bg-[#f2e6c9]" />
        {[
          { top: 54, height: 12 },
          { top: 142, height: 9 },
          { top: 240, height: 14 },
        ].map((road) => (
          <span
            key={road.top}
            className="absolute inset-x-0 bg-white shadow-[0_0_0_1px_#dfe6ee]"
            style={{ top: road.top, height: road.height }}
          />
        ))}
        <span className="absolute inset-y-0 start-[132px] w-[11px] bg-white shadow-[0_0_0_1px_#dfe6ee]" />
        <span className="absolute inset-y-0 start-[214px] w-[8px] bg-white shadow-[0_0_0_1px_#dfe6ee]" />
        {[
          { top: 84, left: 108, gold: false },
          { top: 176, left: 196, gold: true },
          { top: 258, left: 84, gold: false },
          { top: 306, left: 224, gold: true },
        ].map((pin) => (
          <span
            key={`${pin.top}-${pin.left}`}
            className={`absolute h-[22px] w-[22px] rotate-[-45deg] rounded-[50%_50%_50%_0] border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.25)] ${
              pin.gold ? "bg-gold-600" : "bg-ocean-950"
            }`}
            style={{ top: pin.top, left: pin.left }}
          />
        ))}
        <div className="absolute inset-x-3 top-8 flex gap-1.5">
          <div className="flex-1 rounded-[9px] bg-white px-2 py-1.5 text-[7.5px] font-extrabold text-[#5c6680] shadow-md">
            ابحث في الخريطة
          </div>
          <div className="grid w-10 place-items-center rounded-[9px] bg-white text-[11px] text-[#33507f] shadow-md">
            ⌖
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 rounded-t-[16px] bg-white px-3 pb-3 pt-2 shadow-[0_-12px_30px_-18px_rgba(0,0,0,0.4)]">
          <span className="mx-auto mb-2 block h-1 w-8 rounded-full bg-[#e2e6ef]" />
          <p className="text-[8.5px] font-black text-ocean-950">
            ٤٢ عقار موثّق في راس البر
          </p>
          <p className="mt-1 text-[6.8px] font-bold text-[#7b8499]">
            حرّك الخريطة تشوف الأسعار في كل شارع
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#f7f8fc] p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMG.modern}
              alt=""
              className="h-8 w-11 rounded-md object-cover"
            />
            <div>
              <p className="text-[7px] font-black text-ocean-950">
                فيلا بحديقة — 3,150,000 ج.م
              </p>
              <p className="text-[6.5px] font-bold text-[#7b8499]">
                دمياط الجديدة · 240 م²
              </p>
            </div>
          </div>
        </div>
      </div>
      <TabBar active="map" />
    </PhoneFrame>
  );
}
