"use client";

import { PhoneDetail, PhoneHome } from "@/components/app/AppMockup";

/** موبايلان في الهيرو: الرئيسية أماماً + تفاصيل العقار خلفاً */
export default function AppShowcase({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto h-[500px] w-full max-w-[420px] ${className}`}>
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-16 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.26),transparent_66%)] blur-2xl"
      />
      <PhoneDetail className="absolute start-0 top-10 h-[470px] w-[228px] -rotate-[7deg] opacity-95 sm:w-[240px]" />
      <PhoneHome className="absolute end-0 top-0 z-10 h-[490px] w-[238px] sm:w-[250px]" />
    </div>
  );
}
