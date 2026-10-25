"use client";

import { Headset, Mail, Phone, Clock3 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/* أيقونات تواصل اجتماعي مخصصة (ليست متوفرة في lucide-react) */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

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
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

/** الروابط الاجتماعية مع أنماط التحويم الخاصة بكل منصة */
const SOCIAL_LINKS = [
  { label: "WhatsApp", href: "https://wa.me/201001234567", icon: WhatsAppIcon, hover: "hover:bg-emerald-500/20 hover:text-emerald-300" },
  { label: "Facebook", href: "https://facebook.com", icon: FacebookIcon, hover: "hover:bg-blue-500/20 hover:text-blue-300" },
  { label: "X", href: "https://x.com", icon: XIcon, hover: "hover:bg-white/20 hover:text-white" },
  { label: "Instagram", href: "https://instagram.com", icon: InstagramIcon, hover: "hover:bg-pink-500/20 hover:text-pink-300" },
  { label: "YouTube", href: "https://youtube.com", icon: YouTubeIcon, hover: "hover:bg-red-500/20 hover:text-red-300" },
];

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-ocean-800/20 bg-ocean-950 text-ocean-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* شريط بيانات الدعم الفني وساعات العمل - السطر الرئيسي */}
        <section
          aria-labelledby="footer-support-title"
          className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
            <a
              href="tel:+201001234567"
              className="flex items-center gap-1.5 font-semibold text-white transition hover:text-gold-300"
              dir="ltr"
            >
              <Phone className="h-4 w-4 text-gold-300" />
              +20 100 123 4567
            </a>
            <a
              href="mailto:support@aqaar-alsahel.com"
              className="flex items-center gap-1.5 font-semibold text-white transition hover:text-gold-300"
              dir="ltr"
            >
              <Mail className="h-4 w-4 text-gold-300" />
              support@aqaar-alsahel.com
            </a>
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Clock3 className="h-4 w-4 text-gold-300" />
              {t("footer.support.hoursValue")}
            </span>
          </div>

          {/* أيقونات السوشيال ميديا */}
          <div className="flex items-center gap-1.5">
            {SOCIAL_LINKS.map(({ label, href, icon: Icon, hover }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-ocean-200 transition ${hover}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </section>

        {/* حقوق النشر */}
        <div className="border-t border-white/10 py-2 text-center text-xs text-ocean-400">
          {t("footer.rights", { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
}
