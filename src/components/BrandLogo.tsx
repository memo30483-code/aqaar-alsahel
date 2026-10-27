"use client";

import { useI18n } from "@/lib/i18n";

/** الشعار الرسمي لعقار FAMILY: بلاطة نيلية + سقف ذهبي + ثلاثة أقواس عائلية */
export function BrandMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <span
      className={`relative inline-grid place-items-center rounded-[14px] bg-gradient-to-br from-ocean-800 to-ocean-950 shadow-[0_6px_16px_rgba(30,38,73,0.22)] ${className}`}
      aria-hidden
    >
      <span className="pointer-events-none absolute inset-[3px] rounded-[11px] border border-gold-400/35" />
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="relative z-10 h-[64%] w-[64%]"
      >
        <path
          d="M9 31.5 32 13l23 18.5"
          stroke="#e8c364"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17 50V32a4.2 4.2 0 0 1 8.4 0v18"
          stroke="#e8c364"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M27.8 50V38.5a4.2 4.2 0 0 1 8.4 0V50"
          stroke="#e8c364"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M38.6 50V32a4.2 4.2 0 0 1 8.4 0v18"
          stroke="#e8c364"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M15 50.5h34"
          stroke="#e8c364"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

interface Props {
  /** "light" للنص الغامق على خلفية فاتحة، و"dark" للنص الفاتح على خلفية داكنة */
  tone?: "light" | "dark";
  showTagline?: boolean;
  markClassName?: string;
  className?: string;
}

export default function BrandLogo({
  tone = "light",
  showTagline = true,
  markClassName,
  className = "",
}: Props) {
  const { t } = useI18n();
  const words = t("brand.name").split(" ");
  const first = words[0];
  const rest = words.slice(1).join(" ");

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <BrandMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span
          className={`text-lg font-black tracking-tight sm:text-xl ${
            tone === "dark" ? "text-white" : "text-ocean-900"
          }`}
        >
          {first}
          {rest && (
            <>
              {" "}
              <span className="ms-1 text-[0.62em] font-black tracking-[0.16em] text-gold-500 sm:text-[0.6em]">
                {rest}
              </span>
            </>
          )}
        </span>
        {showTagline && (
          <span
            className={`mt-1.5 hidden text-[10px] font-semibold tracking-wide sm:block ${
              tone === "dark" ? "text-sand-300" : "text-sand-700"
            }`}
          >
            {t("brand.tagline")}
          </span>
        )}
      </span>
    </span>
  );
}
