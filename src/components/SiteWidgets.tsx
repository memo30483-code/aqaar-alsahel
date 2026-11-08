"use client";

import { usePathname } from "next/navigation";
import FeaturedAds from "./FeaturedAds";
import AssistantWidget from "./AssistantWidget";
import OffersFloatingBanner from "./OffersFloatingBanner";
import WhatsAppWidget from "./WhatsAppWidget";

/**
 * العناصر العائمة تظهر في صفحات الزوار فقط.
 * كانت تُرسم فوق لوحة التحكم وصفحات الدخول والتسجيل فتعطل الواجهة.
 */
const HIDDEN_PREFIXES = ["/admin", "/login", "/register", "/join"];

export default function SiteWidgets() {
  const pathname = usePathname();
  const hidden = HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return (
    <>
      <WhatsAppWidget />
      {!hidden && (
        <>
          <FeaturedAds />
          <AssistantWidget />
          <OffersFloatingBanner />
        </>
      )}
    </>
  );
}
