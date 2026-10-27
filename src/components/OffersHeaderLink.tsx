"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { getOffersSettings, isOffersPageAvailable } from "@/lib/admin-system";
import { useI18n } from "@/lib/i18n";

export default function OffersHeaderLink() {
  const { locale } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const settings = getOffersSettings();
    if (!settings.enabled || !settings.showInHeader) return;
    setShow(isOffersPageAvailable());
  }, []);

  if (!show) return null;

  return (
    <Link
      href="/offers"
      className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,162,77,0.4)] bg-[rgba(201,162,77,0.08)] px-3 py-1 text-xs font-bold text-[#b8963b] transition hover:bg-[rgba(201,162,77,0.16)]"
    >
      <Gift className="h-3.5 w-3.5" />
      {locale === "ar" ? "العروض والتخفيضات" : "Offers & Discounts"}
    </Link>
  );
}
