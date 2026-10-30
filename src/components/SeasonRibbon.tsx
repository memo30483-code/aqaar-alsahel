"use client";

import { usePathname } from "next/navigation";
import { useSeasonTheme } from "@/components/ThemeProvider";
import {
  seasonScene,
  shouldShowSeasonRibbon,
  type SeasonScene,
} from "@/lib/theme-season";

/**
 * شريط زخرفي موسمي رفيع أسفل الهيدر — يظهر في كل الصفحات الداخلية.
 * - الرئيسية مستثناة لأن الهيرو فيه المشهد الكامل (`SeasonDecorations`).
 * - لوحة التحكم وصفحات الدخول مستثناة حتى لا تُشتّت أثناء العمل.
 * - لا يغطي أي محتوى: عنصر في تدفّق الصفحة بارتفاع ثابت صغير.
 */

/** عدد الزخارف في الشريط — يتوزّع بالتساوي على العرض */
const MOTIF_COUNT = 14;

function Motif({ scene, index }: { scene: SeasonScene; index: number }) {
  const even = index % 2 === 0;

  switch (scene) {
    case "winter":
      return even ? (
        /* ندفة ثلج */
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M10 3v14M4 6.5l12 7M16 6.5l-12 7" />
          <circle cx="10" cy="10" r="1.6" fill="currentColor" stroke="none" />
        </svg>
      ) : (
        /* دلاية ثلج */
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 3h10l-5 13Z" fillOpacity=".8" />
          <path d="M2 3h5l-2.5 8Z" fillOpacity=".45" />
          <path d="M13 3h5l-2.5 8Z" fillOpacity=".45" />
        </svg>
      );

    case "spring":
      return even ? (
        /* زهرة */
        <svg viewBox="0 0 20 20" fill="currentColor">
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="10"
              cy="6.2"
              rx="2.5"
              ry="3.4"
              transform={`rotate(${angle} 10 10)`}
              fillOpacity=".75"
            />
          ))}
          <circle cx="10" cy="10" r="1.6" fill="rgb(var(--gold-400))" />
        </svg>
      ) : (
        /* ورقة صغيرة */
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <path d="M5 15C5 8 11 5 16 5c0 6-5 11-11 10Z" fill="currentColor" fillOpacity=".35" />
          <path d="M5 15c3-4 6-6 9-8" />
        </svg>
      );

    case "summer":
      return even ? (
        /* شمس */
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="10" cy="10" r="3.6" fill="currentColor" stroke="none" fillOpacity=".75" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1={10 + Math.cos((angle * Math.PI) / 180) * 5.6}
              y1={10 + Math.sin((angle * Math.PI) / 180) * 5.6}
              x2={10 + Math.cos((angle * Math.PI) / 180) * 8}
              y2={10 + Math.sin((angle * Math.PI) / 180) * 8}
            />
          ))}
        </svg>
      ) : (
        /* موجة */
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 8c3-4 5 4 8 0s5 4 8 0" />
          <path d="M2 13c3-4 5 4 8 0s5 4 8 0" opacity=".55" />
        </svg>
      );

    case "fall":
      return even ? (
        /* ورقة خريف */
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M4 16C4 8 11 4 17 4c0 7-6 12-13 12Z" fillOpacity=".8" />
          <path d="M4 16c4-4 7-6 10-8" stroke="rgb(var(--sand-100))" strokeWidth="1.1" fill="none" />
        </svg>
      ) : (
        /* ورقة صغيرة مائلة */
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 5c6 0 10 4 10 10-6 0-10-4-10-10Z" fillOpacity=".55" />
        </svg>
      );

    case "october":
      return even ? (
        /* شريط احتفالي */
        <svg viewBox="0 0 20 20" fill="currentColor">
          <rect x="6" y="3" width="3.4" height="10" rx="1.2" transform="rotate(-18 7.7 8)" fillOpacity=".8" />
          <rect x="11" y="7" width="3.4" height="10" rx="1.2" transform="rotate(22 12.7 12)" fillOpacity=".55" />
        </svg>
      ) : (
        /* نقطة */
        <svg viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="10" r="2.6" fillOpacity=".55" />
        </svg>
      );

    case "eid-fitr":
    case "eid-adha":
      return even ? (
        /* نجمة */
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2.5 11.9 8.1 17.5 10 11.9 11.9 10 17.5 8.1 11.9 2.5 10 8.1 8.1Z" fillOpacity=".8" />
        </svg>
      ) : (
        /* هلال */
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.4 2.8a7.6 7.6 0 1 0 3.4 14.1 8 8 0 0 1-3.4-14.1Z" fillOpacity=".75" />
        </svg>
      );

    default:
      return null;
  }
}

export default function SeasonRibbon() {
  const theme = useSeasonTheme();
  const pathname = usePathname() || "/";
  const scene = seasonScene(theme.preset, theme.active);

  if (!scene) return null;
  if (!shouldShowSeasonRibbon(theme.preset, theme.active, pathname)) return null;

  return (
    <div className="season-ribbon" data-scene={scene} aria-hidden="true">
      <span className="season-ribbon-line" />
      {Array.from({ length: MOTIF_COUNT }, (_, index) => (
        <span
          key={`ribbon-${index}`}
          className="season-ribbon-motif"
          style={{ animationDelay: `${(index % 5) * -1.1}s` }}
        >
          <Motif scene={scene} index={index} />
        </span>
      ))}
    </div>
  );
}
