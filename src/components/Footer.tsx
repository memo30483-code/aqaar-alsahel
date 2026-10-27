"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Clock3, Mail, MapPin, Phone, Send, ShieldCheck } from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { CITY_KEYS } from "@/lib/i18n/cities";
import BrandLogo from "@/components/BrandLogo";
import { telHref, useSiteSettings } from "@/lib/site-settings";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com", icon: FacebookIcon },
  { label: "X", href: "https://x.com", icon: XIcon },
  { label: "Instagram", href: "https://instagram.com", icon: InstagramIcon },
  { label: "YouTube", href: "https://youtube.com", icon: YouTubeIcon },
];

const QUICK_LINKS: { key: MessageKey; href: string }[] = [
  { key: "home.listings.heading", href: "/#properties" },
  { key: "home.projects.title", href: "/#projects" },
  { key: "nav.compass", href: "/market-guide" },
  { key: "nav.legal", href: "/legal-consultational" },
  { key: "nav.addProperty", href: "/add-property" },
];

/** فوتر غامق بثلاثة أعمدة + نشرة بريدية + ملاحظة «كل التواصل عبر الإدارة» */
export default function Footer() {
  const { t } = useI18n();
  const site = useSiteSettings();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="relative overflow-hidden border-t border-gold-500/25 bg-[#0f1428] text-sand-200">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-56 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.18),transparent_62%)]"
      />
      <div className="relative mx-auto w-full max-w-[1240px] px-4 pb-0 pt-14 sm:px-6">
        <div className="grid gap-10 pb-10 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1.1fr] lg:gap-12">
          {/* الهوية + نبذة + سوشيال */}
          <div>
            <Link href="/" aria-label={t("brand.name")} className="inline-flex">
              <BrandLogo tone="dark" />
            </Link>
            <p className="mt-4 max-w-[330px] text-xs leading-7 text-[#98a1b8]">
              {t("footer.about")}
            </p>
            <div className="mt-4 flex gap-2">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-[#c9d0e2] transition hover:border-gold-400/40 hover:bg-gold-400/15 hover:text-gold-200"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* روابط سريعة */}
          <nav aria-label={t("footer.quickLinks")}>
            <h2 className="mb-4 text-xs font-extrabold tracking-wide text-gold-300">
              {t("footer.quickLinks")}
            </h2>
            <ul className="flex flex-col gap-3 text-xs font-medium text-[#aab2c7]">
              {QUICK_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <Link href={href} className="transition hover:text-gold-200">
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* المدن الست */}
          <nav aria-label={t("footer.cities")}>
            <h2 className="mb-4 text-xs font-extrabold tracking-wide text-gold-300">
              {t("footer.cities")}
            </h2>
            <ul className="flex flex-col gap-3 text-xs font-medium text-[#aab2c7]">
              {CITY_KEYS.map((key) => (
                <li key={key}>
                  <Link
                    href="/#properties"
                    className="inline-flex items-center gap-1.5 transition hover:text-gold-200"
                  >
                    <MapPin className="h-3 w-3 text-gold-500/70" />
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* النشرة البريدية + التواصل */}
          <div>
            <h2 className="mb-4 text-xs font-extrabold tracking-wide text-gold-300">
              {t("footer.newsletter.title")}
            </h2>
            <p className="text-xs leading-6 text-[#98a1b8]">
              {t("footer.newsletter.desc")}
            </p>
            <form onSubmit={handleSubscribe} className="mt-3.5">
              <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/[0.06]">
                <label htmlFor="footer-newsletter" className="sr-only">
                  {t("footer.newsletter.placeholder")}
                </label>
                <input
                  id="footer-newsletter"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("footer.newsletter.placeholder")}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#7f89a2]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 bg-gold-500 px-3.5 text-[11px] font-extrabold text-white transition hover:bg-gold-600"
                >
                  {t("footer.newsletter.cta")}
                </button>
              </div>
              {subscribed && (
                <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                  <Check className="h-3 w-3" />
                  {t("footer.newsletter.success")}
                </p>
              )}
            </form>

            <div className="mt-5 space-y-2 text-[11px] text-[#8d97b0]">
              <a
                href={telHref(site.managementPhone)}
                className="flex items-center gap-2 transition hover:text-gold-200"
                dir="ltr"
              >
                <Phone className="h-3.5 w-3.5 text-gold-400" />
                {site.managementPhone}
              </a>
              <a
                href={`mailto:${site.managementEmail}`}
                className="flex items-center gap-2 transition hover:text-gold-200"
                dir="ltr"
              >
                <Mail className="h-3.5 w-3.5 text-gold-400" />
                {site.managementEmail}
              </a>
              <p className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-gold-400" />
                {t("footer.support.hoursValue")}
              </p>
              <p className="flex items-center gap-1.5 pt-1 font-bold text-gold-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("footer.managementNote")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.08] py-5 text-[10.5px] text-[#7d879f] sm:flex-row">
          <span>{t("footer.rights", { year: new Date().getFullYear() })}</span>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/#properties" className="transition hover:text-gold-200">
              {t("footer.links.privacy")}
            </Link>
            <Link href="/#properties" className="transition hover:text-gold-200">
              {t("footer.links.terms")}
            </Link>
            <Link href="/add-property" className="transition hover:text-gold-200">
              {t("footer.links.advertise")}
            </Link>
            <span className="inline-flex items-center gap-1">
              <Send className="h-3 w-3 text-gold-500" />
              {t("footer.links.sitemap")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
