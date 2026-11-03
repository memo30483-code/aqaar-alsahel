"use client";

import Link from "next/link";
import type { AppSettings } from "@/lib/app-settings";
import { storeHref } from "@/lib/app-settings";

function IosIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5">
      <path d="M16.365 1.43c0 1.14-.417 2.2-1.25 3.04-.833.84-1.9 1.33-3.03 1.24-.02-1.1.43-2.2 1.24-3.02.81-.83 1.98-1.35 3.04-1.26zM20.5 17.2c-.53 1.22-.78 1.76-1.46 2.84-.95 1.5-2.29 3.36-3.95 3.37-1.47.02-1.85-.96-3.85-.95-2 0-2.42.97-3.89.95-1.66-.02-2.93-1.7-3.88-3.2-2.66-4.2-2.94-9.13-1.3-11.75 1.17-1.86 3.01-2.95 4.74-2.95 1.76 0 2.87.97 4.33.97 1.41 0 2.27-.97 4.31-.97 1.54 0 3.17.84 4.33 2.29-3.8 2.09-3.19 7.52.62 9.4z" />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
      <path fill="#48c1f0" d="M3.6 1.8 14 12 3.6 22.2c-.4-.2-.6-.7-.6-1.2V3c0-.5.2-1 .6-1.2z" />
      <path fill="#f9d34e" d="m17.2 8.8-3.2 3.2L3.6 1.8c.2-.1.5-.2.8-.2.3 0 .6.1.9.3l11.9 6.9z" />
      <path fill="#ef5350" d="m17.2 15.2-11.9 7c-.3.1-.6.2-.9.2-.3 0-.6-.1-.8-.2l10.4-10.2 3.2 3.2z" />
      <path fill="#66bb6a" d="m21 13.2-3.8 2.2-3.2-3.4 3.2-3.2L21 10.8c.6.3 1 .9 1 1.6 0 .3-.4.6-1 .8z" />
    </svg>
  );
}

const STORE =
  "group flex min-w-[150px] items-center gap-2.5 rounded-xl border px-3.5 py-2 transition";
const STORE_DARK =
  "border-white/15 bg-[#0b1020] text-white hover:border-gold-400/60 hover:bg-[#0f1730]";
const STORE_LIGHT =
  "border-sand-200 bg-white text-ocean-950 hover:border-gold-400 hover:bg-sand-50";

export default function StoreButtons({
  app,
  tone = "dark",
  compact = false,
}: {
  app: AppSettings;
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  const items = [
    { key: "ios" as const, top: "قريبًا على", bottom: "App Store", Icon: IosIcon, href: storeHref(app, "ios") },
    { key: "android" as const, top: "قريبًا على", bottom: "Google Play", Icon: AndroidIcon, href: storeHref(app, "android") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {items.map(({ key, top, bottom, Icon, href }) => {
        const live = app.status === "live" && href;
        const label = live ? "حمّل الآن من" : top;
        const body = (
          <>
            <Icon />
            <span className="text-start leading-tight">
              <span className="block text-[9.5px] font-semibold opacity-70">{label}</span>
              <span className={`block font-black ${compact ? "text-[12px]" : "text-[13.5px]"}`}>
                {bottom}
              </span>
            </span>
          </>
        );
        const className = `${STORE} ${tone === "dark" ? STORE_DARK : STORE_LIGHT}`;
        return live ? (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {body}
          </a>
        ) : (
          <Link key={key} href="/app#interest" className={className}>
            {body}
          </Link>
        );
      })}
    </div>
  );
}
