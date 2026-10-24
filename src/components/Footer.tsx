"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-ocean-800/20 bg-ocean-950 text-ocean-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-lg font-bold text-white">{t("brand.name")}</p>
          <p className="mt-1 text-sm text-ocean-300">{t("footer.tagline")}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/" className="hover:text-white">
            {t("footer.home")}
          </Link>
          <Link href="/market-guide" className="hover:text-white">
            {t("nav.compass")}
          </Link>
          <Link href="/add-property" className="hover:text-white">
            {t("footer.addProperty")}
          </Link>
          <Link href="/register" className="hover:text-white">
            {t("nav.login")}
          </Link>
          <Link href="/legal-consultational" className="hover:text-white">
            {t("nav.legal")}
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-ocean-400">
        {t("footer.rights", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
