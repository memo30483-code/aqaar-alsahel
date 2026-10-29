"use client";

import type { ResolvedSeasonTheme } from "@/lib/theme-season";

/**
 * زينة رمضان — طبقة فنية فوق الهيرو:
 * قمر ونجوم + خط فوانيس معلّقة + صومعة جامع + مدفع إفطار + انعكاسات الساحل.
 * كل العناصر تُرسم بمتغيّرات لوحة الثيم فتُواكب أي تعديل ألوان من الإدارة.
 */

const STARS: Array<{ x: number; y: number; r: number; delay: number }> = [
  { x: 64, y: 128, r: 5, delay: 0 },
  { x: 148, y: 176, r: 3.5, delay: 1.2 },
  { x: 226, y: 62, r: 4.5, delay: 2.1 },
  { x: 294, y: 148, r: 3, delay: 0.7 },
  { x: 372, y: 74, r: 5, delay: 1.7 },
  { x: 448, y: 156, r: 3.5, delay: 2.6 },
  { x: 502, y: 88, r: 4, delay: 0.4 },
];

/** فوانيس الهيرو — في المساحة الفارغة يسار النص */
const HERO_LANTERNS = [
  { x: 258, drop: 128, scale: 1 },
  { x: 366, drop: 168, scale: 0.92 },
  { x: 470, drop: 140, scale: 1.06 },
];

/** فوانيس خط الزينة أسفل الهيدر */
const GARLAND = [
  { drop: 34, scale: 0.9 },
  { drop: 58, scale: 1 },
  { drop: 42, scale: 0.85 },
  { drop: 66, scale: 1.05 },
  { drop: 40, scale: 0.9 },
  { drop: 60, scale: 1 },
  { drop: 36, scale: 0.88 },
];

function Star({ x, y, r, delay }: { x: number; y: number; r: number; delay: number }) {
  return (
    <path
      className="ramadan-star"
      style={{ animationDelay: `${delay}s` }}
      transform={`translate(${x} ${y}) scale(${r / 6})`}
      d="M0-6 1.7-1.7 6 0 1.7 1.7 0 6-1.7 1.7-6 0-1.7-1.7Z"
      fill="rgb(var(--gold-200))"
    />
  );
}

function Lantern({ x, drop, scale }: { x: number; drop: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${drop}) scale(${scale})`}>
      {/* سلك التعليق */}
      <path d={`M0 ${-drop} V0`} stroke="rgb(var(--gold-400) / .55)" strokeWidth="1.2" />
      {/* الهالة */}
      <circle className="ramadan-lantern-glow" cx="0" cy="34" r="34" fill="url(#ramadan-glow)" />
      {/* الجسم */}
      <path
        d="M0 0h0M-7 6h14l4 6v26l-6 10h-10l-6-10V12Z"
        fill="rgb(var(--gold-500))"
        fillOpacity=".92"
        stroke="rgb(var(--gold-200))"
        strokeWidth="1.6"
      />
      {/* القبّة */}
      <path d="M-9 6 0-2 9 6Z" fill="rgb(var(--gold-300))" />
      {/* الزجاج */}
      <path
        d="M-6 14h12v22l-6 8-6-8Z"
        fill="rgb(var(--gold-100))"
        fillOpacity=".78"
        stroke="rgb(var(--gold-300))"
        strokeWidth="1"
      />
      <path d="M0 16v24M-6 26h12" stroke="rgb(var(--gold-500) / .75)" strokeWidth="1.1" />
    </g>
  );
}

export default function RamadanDecorations({
  theme,
}: {
  theme: ResolvedSeasonTheme;
}) {
  if (!theme.active || theme.preset !== "ramadan") return null;
  const { motifs } = theme;

  return (
    <div className="ramadan-hero-art" aria-hidden="true">
      <svg viewBox="0 0 1240 640" preserveAspectRatio="xMidYMax slice">
        <defs>
          <radialGradient id="ramadan-glow">
            <stop offset="0%" stopColor="#f6dd9a" stopOpacity=".55" />
            <stop offset="70%" stopColor="#e7c05e" stopOpacity=".18" />
            <stop offset="100%" stopColor="#e7c05e" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ramadan-skyline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a2f27" stopOpacity=".92" />
            <stop offset="100%" stopColor="#04211d" stopOpacity=".98" />
          </linearGradient>
          <pattern id="ramadan-mashrabiya" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M10 0 20 10 10 20 0 10Z M0 0 20 20 M20 0 0 20"
              fill="none"
              stroke="rgb(var(--gold-300) / .5)"
              strokeWidth=".9"
            />
            <circle cx="10" cy="10" r="1.3" fill="rgb(var(--gold-200) / .55)" />
          </pattern>
          {/* قناع القمر — يعطي هلالاً نظيفاً فوق أي صورة */}
          <mask id="ramadan-crescent-cut">
            <circle cx="128" cy="84" r="46" fill="white" />
            <circle cx="158" cy="64" r="42" fill="black" />
          </mask>
        </defs>

        {/* ---------- نجوم ---------- */}
        {motifs.crescent && STARS.map((star) => <Star key={`${star.x}-${star.y}`} {...star} />)}

        {/* ---------- الهلال ---------- */}
        {motifs.crescent && (
          <g className="ramadan-crescent">
            <circle cx="128" cy="84" r="72" fill="url(#ramadan-glow)" />
            <circle
              cx="128"
              cy="84"
              r="46"
              fill="rgb(var(--gold-200))"
              mask="url(#ramadan-crescent-cut)"
            />
          </g>
        )}

        {/* ---------- خط الفوانيس المعلّقة ---------- */}
        {motifs.lanterns && (
          <g className="ramadan-lanterns">
            <path
              d="M0 40C120 96 220 34 380 62S480 30 560 58"
              fill="none"
              stroke="rgb(var(--gold-400) / .35)"
              strokeWidth="1.4"
            />
            {HERO_LANTERNS.map((item, index) => (
              <g
                key={`lantern-${index}`}
                className="ramadan-lantern-sway"
                style={{
                  transformOrigin: `${item.x}px 0px`,
                  animationDelay: `${index * -0.9}s`,
                }}
              >
                <Lantern x={item.x} drop={item.drop} scale={item.scale} />
              </g>
            ))}
          </g>
        )}

        {/* ---------- صومعة الجامع ---------- */}
        {motifs.mashrabiya && (
          <g className="ramadan-skyline">
            {/* القاعدة */}
            <path d="M0 640V540h1240v100Z" fill="url(#ramadan-skyline)" />
            {/* القبة الكبيرة */}
            <path
              d="M470 540c0-78 66-140 148-140s148 62 148 140Z"
              fill="url(#ramadan-skyline)"
              stroke="rgb(var(--gold-300) / .5)"
              strokeWidth="2"
            />
            <path d="M618 400v-26" stroke="rgb(var(--gold-200) / .8)" strokeWidth="3" />
            <circle cx="618" cy="368" r="6" fill="rgb(var(--gold-200) / .9)" />
            {/* قبتان صغيرتان */}
            <path d="M300 540c0-44 38-78 84-78s84 34 84 78Z" fill="url(#ramadan-skyline)" stroke="rgb(var(--gold-300) / .38)" strokeWidth="1.6" />
            <path d="M792 540c0-44 38-78 84-78s84 34 84 78Z" fill="url(#ramadan-skyline)" stroke="rgb(var(--gold-300) / .38)" strokeWidth="1.6" />
            {/* مآذن */}
            <path d="M404 540V372l16-22 16 22v168Z" fill="url(#ramadan-skyline)" stroke="rgb(var(--gold-300) / .45)" strokeWidth="1.6" />
            <path d="M812 540V372l16-22 16 22v168Z" fill="url(#ramadan-skyline)" stroke="rgb(var(--gold-300) / .45)" strokeWidth="1.6" />
            {/* فوانيس الجامع */}
            {[540, 580, 640, 700].map((x) => (
              <rect key={x} x={x} y="470" width="26" height="46" rx="12" fill="url(#ramadan-mashrabiya)" stroke="rgb(var(--gold-300) / .55)" strokeWidth="1.2" />
            ))}
            {/* بوابة */}
            <path d="M596 540v-46c0-14 10-24 22-24s22 10 22 24v46Z" fill="rgb(var(--gold-300) / .28)" stroke="rgb(var(--gold-200) / .5)" strokeWidth="1.2" />
          </g>
        )}

        {/* ---------- مدفع الإفطار ---------- */}
        {motifs.iftarCannon && (
          <g className="ramadan-iftar-cannon" transform="translate(112 512)" stroke="rgb(var(--gold-300) / .75)" strokeLinejoin="round">
            <path d="M0 20h52l-8 12H8Z" fill="url(#ramadan-skyline)" strokeWidth="1.4" />
            <path d="M14 18 46 2" stroke="rgb(var(--gold-200) / .85)" strokeWidth="10" strokeLinecap="round" />
            <path d="M14 18 46 2" stroke="#0a2f27" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="30" r="6" fill="url(#ramadan-skyline)" strokeWidth="1.4" />
            <circle cx="42" cy="30" r="6" fill="url(#ramadan-skyline)" strokeWidth="1.4" />
            <path d="M52 0c7-4 7-9 3-13m8 11c6-5 6-9 3-13" fill="none" stroke="rgb(var(--gold-100) / .8)" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        )}

        {/* ---------- انعكاسات الساحل ---------- */}
        {motifs.coastalReflections && (
          <g className="ramadan-water" fill="none" strokeLinecap="round">
            <path d="M0 588c130-12 240 14 360 0s190-8 296 6" stroke="rgb(var(--ocean-300) / .35)" strokeWidth="2.2" />
            <path d="M40 610c120-10 220 12 330 0s180-6 270 6" stroke="rgb(var(--gold-300) / .28)" strokeWidth="1.8" />
            <path d="M0 632h120m40-6h86m44 8h150m40-8h96" stroke="rgb(var(--ocean-200) / .28)" strokeWidth="1.2" />
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * زينة معلّقة أسفل الهيدر تظهر في كل الصفحات — إحساس «زقاق رمضان».
 * تُرسم بـ CSS فقط (سلك + جسم فانوس + هالة) وتتأرجح بلطف.
 */
export function RamadanGarland() {
  return (
    <div className="ramadan-garland" aria-hidden="true">
      {GARLAND.map((item, index) => (
        <span
          key={`garland-${index}`}
          className="ramadan-garland-lantern"
          style={{
            ["--drop" as string]: `${item.drop}px`,
            ["--scale" as string]: `${item.scale}`,
            animationDelay: `${index * -0.8}s`,
          }}
        />
      ))}
    </div>
  );
}
