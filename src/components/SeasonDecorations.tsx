"use client";

import type { ComponentType } from "react";
import {
  seasonScene,
  type ResolvedSeasonTheme,
  type SeasonScene,
} from "@/lib/theme-season";

/**
 * زخارف المواسم (غير رمضان) — طبقة فنية فوق صورة الهيرو:
 * - شتاء: تلال ثلج + أشجار صنوبر + ثلج متساقط + هالة قمر بارد.
 * - ربيع: أغصان مزهرة + بتلات متساقطة + ضوء دافئ.
 * - صيف: شمس مشعّة + موجات حرارة + ذرّات ضوء صاعدة.
 * - خريف: أغصان + أوراق متساقطة + وهج نحاسي.
 * - أكتوبر: شرائط احتفالية + وهج أحمر.
 * - العيدان: هلال + نجوم + شرارات احتفال.
 *
 * كل العناصر تُرسم بمتغيّرات لوحة الثيم (gold/sand/ocean) فتُواكب أي تعديل ألوان
 * من لوحة الإدارة. الحركات كلها CSS وتتوقف مع `prefers-reduced-motion`.
 */

/* ============ بيانات ثابتة (بلا عشوائية) حتى لا يختلف الخادم عن المتصفح ============ */

const SNOWFLAKES = [
  { x: 52, y: -40, r: 2.8, drift: 26, delay: 0, duration: 12 },
  { x: 138, y: 120, r: 2.1, drift: -18, delay: 2.4, duration: 14 },
  { x: 214, y: 300, r: 3.2, drift: 20, delay: 5.1, duration: 11 },
  { x: 286, y: 40, r: 2.4, drift: -24, delay: 1.2, duration: 15 },
  { x: 352, y: 220, r: 1.9, drift: 16, delay: 6.3, duration: 13 },
  { x: 430, y: -10, r: 3.4, drift: 28, delay: 3.6, duration: 12 },
  { x: 512, y: 160, r: 2.2, drift: -20, delay: 0.8, duration: 16 },
  { x: 596, y: 340, r: 2.9, drift: 18, delay: 4.4, duration: 10 },
  { x: 668, y: 60, r: 2, drift: -26, delay: 7.2, duration: 14 },
  { x: 742, y: 260, r: 3.1, drift: 22, delay: 2, duration: 12 },
  { x: 818, y: -30, r: 2.5, drift: -16, delay: 5.8, duration: 15 },
  { x: 894, y: 190, r: 1.8, drift: 24, delay: 1.6, duration: 13 },
  { x: 968, y: 380, r: 3, drift: -22, delay: 6.9, duration: 11 },
  { x: 1044, y: 110, r: 2.3, drift: 20, delay: 3.1, duration: 16 },
  { x: 1122, y: 300, r: 2.7, drift: -18, delay: 0.4, duration: 12 },
  { x: 1198, y: 30, r: 2, drift: 26, delay: 4.9, duration: 14 },
];

const PETALS = [
  { x: 96, y: -20, drift: 34, spin: 300, delay: 0, duration: 13, scale: 1 },
  { x: 188, y: 90, drift: -26, spin: 240, delay: 2.2, duration: 15, scale: 0.85 },
  { x: 274, y: 240, drift: 30, spin: 340, delay: 4.6, duration: 12, scale: 1.1 },
  { x: 356, y: 30, drift: -32, spin: 280, delay: 1.4, duration: 16, scale: 0.9 },
  { x: 448, y: 180, drift: 24, spin: 320, delay: 6.1, duration: 14, scale: 1.05 },
  { x: 540, y: -40, drift: -28, spin: 260, delay: 3.3, duration: 11, scale: 0.8 },
  { x: 632, y: 140, drift: 32, spin: 300, delay: 0.6, duration: 15, scale: 1 },
  { x: 724, y: 300, drift: -24, spin: 340, delay: 5.4, duration: 13, scale: 0.95 },
  { x: 812, y: 60, drift: 28, spin: 280, delay: 2.8, duration: 16, scale: 1.15 },
  { x: 904, y: 210, drift: -30, spin: 320, delay: 7, duration: 12, scale: 0.85 },
  { x: 996, y: -10, drift: 26, spin: 260, delay: 4.1, duration: 14, scale: 1 },
  { x: 1088, y: 170, drift: -22, spin: 300, delay: 1.9, duration: 15, scale: 0.9 },
  { x: 1176, y: 330, drift: 30, spin: 340, delay: 5.9, duration: 13, scale: 1.05 },
];

const AUTUMN_LEAVES = [
  { x: 74, y: -30, drift: 40, spin: 260, delay: 0, duration: 12, scale: 1 },
  { x: 162, y: 110, drift: -34, spin: 300, delay: 2.6, duration: 15, scale: 0.85 },
  { x: 252, y: 260, drift: 36, spin: 240, delay: 5.2, duration: 11, scale: 1.15 },
  { x: 340, y: 40, drift: -30, spin: 280, delay: 1.1, duration: 14, scale: 0.95 },
  { x: 428, y: 190, drift: 32, spin: 320, delay: 6.6, duration: 13, scale: 1.05 },
  { x: 518, y: -20, drift: -36, spin: 260, delay: 3.4, duration: 16, scale: 0.8 },
  { x: 606, y: 150, drift: 34, spin: 300, delay: 0.5, duration: 12, scale: 1 },
  { x: 696, y: 320, drift: -28, spin: 240, delay: 5.7, duration: 15, scale: 0.9 },
  { x: 786, y: 70, drift: 30, spin: 280, delay: 2.1, duration: 13, scale: 1.1 },
  { x: 876, y: 220, drift: -32, spin: 320, delay: 7.1, duration: 11, scale: 0.85 },
  { x: 966, y: -40, drift: 36, spin: 260, delay: 4.3, duration: 16, scale: 1 },
  { x: 1056, y: 180, drift: -24, spin: 300, delay: 1.7, duration: 14, scale: 0.95 },
  { x: 1148, y: 340, drift: 32, spin: 240, delay: 6.2, duration: 12, scale: 1.05 },
];

const CONFETTI = [
  { x: 88, y: -30, drift: 30, spin: 420, delay: 0, duration: 11, color: "#c04040" },
  { x: 176, y: 130, drift: -24, spin: 380, delay: 2.3, duration: 14, color: "#e0b050" },
  { x: 264, y: 280, drift: 26, spin: 460, delay: 4.8, duration: 10, color: "#f2e2c4" },
  { x: 352, y: 40, drift: -28, spin: 400, delay: 1.2, duration: 13, color: "#c04040" },
  { x: 440, y: 200, drift: 22, spin: 440, delay: 6.4, duration: 12, color: "#e0b050" },
  { x: 528, y: -10, drift: -26, spin: 380, delay: 3.1, duration: 15, color: "#f2e2c4" },
  { x: 616, y: 160, drift: 28, spin: 420, delay: 0.7, duration: 11, color: "#c04040" },
  { x: 704, y: 320, drift: -22, spin: 460, delay: 5.5, duration: 14, color: "#e0b050" },
  { x: 792, y: 60, drift: 24, spin: 400, delay: 2.6, duration: 13, color: "#f2e2c4" },
  { x: 880, y: 230, drift: -30, spin: 440, delay: 7, duration: 10, color: "#c04040" },
  { x: 968, y: -20, drift: 26, spin: 380, delay: 4, duration: 15, color: "#e0b050" },
  { x: 1056, y: 190, drift: -20, spin: 420, delay: 1.6, duration: 12, color: "#f2e2c4" },
  { x: 1144, y: 340, drift: 28, spin: 460, delay: 5.9, duration: 11, color: "#c04040" },
];

const MOTES = [
  { x: 120, y: 520, drift: 18, delay: 0, duration: 9 },
  { x: 208, y: 470, drift: -14, delay: 1.8, duration: 11 },
  { x: 296, y: 540, drift: 22, delay: 3.6, duration: 8 },
  { x: 384, y: 500, drift: -18, delay: 5.2, duration: 10 },
  { x: 472, y: 560, drift: 16, delay: 0.9, duration: 12 },
  { x: 560, y: 480, drift: -22, delay: 2.7, duration: 9 },
  { x: 648, y: 530, drift: 20, delay: 4.4, duration: 11 },
  { x: 736, y: 490, drift: -16, delay: 6.1, duration: 8 },
  { x: 824, y: 555, drift: 18, delay: 1.3, duration: 10 },
  { x: 912, y: 505, drift: -20, delay: 3.9, duration: 12 },
  { x: 1000, y: 545, drift: 14, delay: 5.7, duration: 9 },
  { x: 1088, y: 495, drift: -18, delay: 2.1, duration: 11 },
];

/** مواضع الأزهار على الأغصان (ربيع) */
const BLOSSOMS = [
  { x: 178, y: 436, s: 1.15, rot: -18 },
  { x: 222, y: 418, s: 0.9, rot: 22 },
  { x: 276, y: 398, s: 1.05, rot: 8 },
  { x: 312, y: 372, s: 0.85, rot: -26 },
  { x: 340, y: 350, s: 1.2, rot: 14 },
  { x: 104, y: 522, s: 1, rot: 30 },
  { x: 146, y: 500, s: 0.88, rot: -12 },
  { x: 198, y: 470, s: 1.1, rot: 18 },
  { x: 240, y: 442, s: 0.92, rot: -22 },
  { x: 272, y: 384, s: 1.05, rot: 6 },
  { x: 326, y: 312, s: 1.15, rot: -16 },
  { x: 300, y: 346, s: 0.8, rot: 24 },
  { x: 60, y: 566, s: 0.95, rot: 12 },
  { x: 120, y: 494, s: 0.85, rot: -28 },
];

/** أوراق ثابتة على الأغصان (خريف) */
const BRANCH_LEAVES = [
  { x: 176, y: 436, s: 1.1, rot: 20, color: "rgb(var(--gold-500))" },
  { x: 226, y: 416, s: 0.9, rot: -24, color: "rgb(var(--gold-600))" },
  { x: 282, y: 396, s: 1, rot: 12, color: "rgb(var(--gold-400))" },
  { x: 316, y: 370, s: 0.85, rot: -18, color: "rgb(var(--gold-600))" },
  { x: 340, y: 348, s: 1.15, rot: 26, color: "rgb(var(--gold-500))" },
  { x: 106, y: 520, s: 1, rot: -14, color: "rgb(var(--gold-400))" },
  { x: 152, y: 498, s: 0.9, rot: 22, color: "rgb(var(--gold-600))" },
  { x: 200, y: 466, s: 1.05, rot: -20, color: "rgb(var(--gold-500))" },
  { x: 274, y: 384, s: 1, rot: 16, color: "rgb(var(--gold-400))" },
  { x: 328, y: 314, s: 1.1, rot: -22, color: "rgb(var(--gold-600))" },
];

/** نجوم العيد — في المساحة الحرة يسار النص والشريط السفلي */
const EID_STARS = [
  { x: 72, y: 150, r: 5, delay: 0 },
  { x: 128, y: 240, r: 3.6, delay: 1.1 },
  { x: 196, y: 176, r: 4.4, delay: 2.3 },
  { x: 250, y: 268, r: 3, delay: 0.6 },
  { x: 288, y: 150, r: 4.8, delay: 1.7 },
  { x: 322, y: 244, r: 3.4, delay: 2.8 },
  { x: 420, y: 540, r: 4.1, delay: 0.3 },
  { x: 700, y: 560, r: 3.2, delay: 2 },
  { x: 980, y: 545, r: 4.6, delay: 1.4 },
];

/** شرارات احتفال العيد — في الشريط السفلي تحت النص */
const EID_BURSTS = [
  { x: 200, y: 520 },
  { x: 640, y: 570 },
  { x: 1000, y: 540 },
];

const SUN_RAYS = Array.from({ length: 12 }, (_, index) => index * 30);

/* ============ عناصر مرسومة ============ */

function Snowfall() {
  return (
    <g>
      {SNOWFLAKES.map((flake, index) => (
        <circle
          key={`snow-${index}`}
          className="season-particle season-snowflake"
          cx={flake.x}
          cy={flake.y}
          r={flake.r}
          fill="#ffffff"
          fillOpacity=".9"
          style={{
            ["--drift" as string]: `${flake.drift}px`,
            ["--spin" as string]: "0deg",
            ["--p-opacity" as string]: "0.9",
            animationDelay: `${flake.delay}s`,
            animationDuration: `${flake.duration}s`,
          }}
        />
      ))}
    </g>
  );
}

function Pine({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-4 0h8v40h-8Z" fill="rgb(var(--ocean-950) / .85)" />
      <path
        d="M0-126 44-52H-44Z"
        fill="rgb(var(--ocean-950) / .88)"
        stroke="rgb(var(--sand-200) / .35)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M0-92 56-8H-56Z"
        fill="rgb(var(--ocean-950) / .92)"
        stroke="rgb(var(--sand-200) / .3)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M0-126 28-80H-28Z" fill="#ffffff" fillOpacity=".34" />
      <path d="M-40-40 0-96 40-40Z" fill="#ffffff" fillOpacity=".16" />
    </g>
  );
}

function Blossom({ x, y, s, rot }: { x: number; y: number; s: number; rot: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="0"
          cy="-5.4"
          rx="4.4"
          ry="6.2"
          transform={`rotate(${angle})`}
          fill="#f7d9e6"
          fillOpacity=".92"
        />
      ))}
      <circle r="2.4" fill="rgb(var(--gold-300))" fillOpacity=".95" />
    </g>
  );
}

function Leaf({
  color,
  opacity = 0.95,
}: {
  color: string;
  opacity?: number;
}) {
  return (
    <path
      d="M0 0C7-9 19-12 27-6 25 5 12 11 0 8-2 5-2 3 0 0Z"
      fill={color}
      fillOpacity={opacity}
      stroke="rgb(var(--ocean-950) / .18)"
      strokeWidth="0.8"
    />
  );
}

/* ============ المشاهد ============ */

function WinterScene() {
  return (
    <g>
      <circle cx="168" cy="100" r="170" fill="url(#season-frost-glow)" />
      <circle cx="168" cy="100" r="30" fill="rgb(var(--sand-50))" fillOpacity=".85" />
      {/* تلال ثلجية */}
      <path
        d="M0 640v-70c118-24 208-8 316 10s212 26 332 4 248-30 356-8 152 22 236 12v52Z"
        fill="rgb(var(--sand-100))"
        fillOpacity=".9"
      />
      <path
        d="M0 640v-34c142-16 240 4 350 14s232 8 342-8 258-20 338-2 130 12 210 6v24Z"
        fill="#ffffff"
        fillOpacity=".5"
      />
      <g className="season-art-detail">
        <Pine x={92} y={562} scale={1.05} />
        <Pine x={196} y={574} scale={0.78} />
        <Pine x={286} y={566} scale={0.92} />
      </g>
      <Snowfall />
    </g>
  );
}

function SpringScene() {
  return (
    <g>
      <circle cx="240" cy="90" r="230" fill="url(#season-warm-glow)" />
      <g
        className="season-art-detail"
        stroke="rgb(var(--ocean-800))"
        strokeWidth="3.4"
        fill="none"
        strokeLinecap="round"
        opacity=".6"
      >
        <path d="M-30 640C70 570 100 480 178 436S300 400 340 350" />
        <path d="M104 522c40-26 66-16 94-50s34-66 74-88" />
        <path d="M292 408c24-34 12-68 34-96" />
        <path d="M-20 470c60-14 96-46 128-92" />
      </g>
      {BLOSSOMS.map((blossom, index) => (
        <Blossom key={`blossom-${index}`} {...blossom} />
      ))}
      {PETALS.map((petal, index) => (
        <g
          key={`petal-${index}`}
          className="season-particle season-petal"
          style={{
            ["--drift" as string]: `${petal.drift}px`,
            ["--spin" as string]: `${petal.spin}deg`,
            ["--p-opacity" as string]: "0.85",
            animationDelay: `${petal.delay}s`,
            animationDuration: `${petal.duration}s`,
          }}
        >
          <ellipse
            cx={petal.x}
            cy={petal.y}
            rx={5.6 * petal.scale}
            ry={8.4 * petal.scale}
            fill="#f7d9e6"
            fillOpacity=".88"
          />
        </g>
      ))}
    </g>
  );
}

function SummerScene() {
  return (
    <g>
      <circle cx="150" cy="86" r="200" fill="url(#season-sun-glow)" />
      <g
        className="season-sun-rays"
        stroke="rgb(var(--gold-200) / .55)"
        strokeWidth="2.6"
        strokeLinecap="round"
      >
        {SUN_RAYS.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1={150 + Math.cos(rad) * 64}
              y1={86 + Math.sin(rad) * 64}
              x2={150 + Math.cos(rad) * 108}
              y2={86 + Math.sin(rad) * 108}
            />
          );
        })}
      </g>
      <circle cx="150" cy="86" r="44" fill="rgb(var(--gold-200))" fillOpacity=".9" />
      <circle cx="150" cy="86" r="30" fill="#fff4cf" fillOpacity=".55" />
      {/* تموّج حراري فوق الأرض */}
      <g className="season-heat" fill="none" stroke="rgb(var(--gold-100) / .3)" strokeWidth="2">
        <path d="M0 596c96-16 190 14 284 0s190-12 284 4 190 12 284-2 190-14 284 2" />
        <path d="M0 618c96-16 190 14 284 0s190-12 284 4 190 12 284-2 190-14 284 2" />
        <path d="M0 636c96-14 190 12 284 0s190-10 284 4 190 10 284-2 190-12 284 2" />
      </g>
      {MOTES.map((mote, index) => (
        <circle
          key={`mote-${index}`}
          className="season-particle season-particle--rise"
          cx={mote.x}
          cy={mote.y}
          r="2.6"
          fill="#ffe9a8"
          fillOpacity=".85"
          style={{
            ["--drift" as string]: `${mote.drift}px`,
            ["--p-opacity" as string]: "0.7",
            animationDelay: `${mote.delay}s`,
            animationDuration: `${mote.duration}s`,
          }}
        />
      ))}
    </g>
  );
}

function FallScene() {
  return (
    <g>
      <circle cx="220" cy="80" r="230" fill="url(#season-ember-glow)" />
      <g
        className="season-art-detail"
        stroke="rgb(var(--ocean-900))"
        strokeWidth="3.6"
        fill="none"
        strokeLinecap="round"
        opacity=".62"
      >
        <path d="M-30 640C64 580 108 504 172 462S284 418 332 372" />
        <path d="M108 520c42-24 68-12 98-46s34-62 76-84" />
        <path d="M292 412c28-34 18-68 46-96" />
      </g>
      {BRANCH_LEAVES.map((leaf, index) => (
        <g
          key={`branch-leaf-${index}`}
          transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rot}) scale(${leaf.s})`}
        >
          <Leaf color={leaf.color} />
        </g>
      ))}
      {AUTUMN_LEAVES.map((leaf, index) => (
        <g
          key={`falling-leaf-${index}`}
          className="season-particle season-leaf"
          style={{
            ["--drift" as string]: `${leaf.drift}px`,
            ["--spin" as string]: `${leaf.spin}deg`,
            ["--p-opacity" as string]: "0.9",
            animationDelay: `${leaf.delay}s`,
            animationDuration: `${leaf.duration}s`,
          }}
        >
          <g transform={`translate(${leaf.x} ${leaf.y}) scale(${leaf.scale})`}>
            <Leaf color="rgb(var(--gold-500))" />
          </g>
        </g>
      ))}
    </g>
  );
}

function OctoberScene() {
  return (
    <g>
      <circle cx="1000" cy="560" r="230" fill="url(#season-october-glow)" />
      <g className="season-art-detail" opacity=".45" fill="none" strokeLinecap="round">
        <path
          d="M120 640c-40-90 20-150 96-150s120 66 96 150"
          stroke="#e0b050"
          strokeWidth="6"
        />
        <path
          d="M236 640c-28-62 14-104 66-104s92 46 66 104"
          stroke="#c04040"
          strokeWidth="5"
        />
        <path d="M880 640c-30-66 14-112 72-112s100 50 72 112" stroke="#e0b050" strokeWidth="5" />
      </g>
      {CONFETTI.map((piece, index) => (
        <rect
          key={`confetti-${index}`}
          className="season-particle season-confetti"
          x={piece.x}
          y={piece.y}
          width="9"
          height="20"
          rx="2.5"
          fill={piece.color}
          fillOpacity=".9"
          style={{
            ["--drift" as string]: `${piece.drift}px`,
            ["--spin" as string]: `${piece.spin}deg`,
            ["--p-opacity" as string]: "0.9",
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </g>
  );
}

function EidScene() {
  return (
    <g>
      <circle cx="168" cy="100" r="200" fill="url(#season-eid-glow)" />
      <g className="season-eid-crescent">
        <circle
          cx="168"
          cy="100"
          r="52"
          fill="rgb(var(--gold-200))"
          mask="url(#season-crescent-cut)"
        />
      </g>
      {EID_STARS.map((star, index) => (
        <path
          key={`eid-star-${index}`}
          className="season-twinkle"
          style={{ animationDelay: `${star.delay}s` }}
          transform={`translate(${star.x} ${star.y}) scale(${star.r / 6})`}
          d="M0-6 1.7-1.7 6 0 1.7 1.7 0 6-1.7 1.7-6 0-1.7-1.7Z"
          fill="rgb(var(--gold-200))"
        />
      ))}
      {/* شرارات احتفال */}
      <g
        className="season-art-detail"
        fill="none"
        stroke="rgb(var(--gold-300) / .45)"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        {EID_BURSTS.map((burst) => (
          <g key={`${burst.x}-${burst.y}`} transform={`translate(${burst.x} ${burst.y})`}>
            {SUN_RAYS.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              return (
                <line
                  key={deg}
                  x1={Math.cos(rad) * 10}
                  y1={Math.sin(rad) * 10}
                  x2={Math.cos(rad) * 30}
                  y2={Math.sin(rad) * 30}
                />
              );
            })}
          </g>
        ))}
      </g>
    </g>
  );
}

const SCENES: Record<SeasonScene, ComponentType> = {
  winter: WinterScene,
  spring: SpringScene,
  summer: SummerScene,
  fall: FallScene,
  october: OctoberScene,
  "eid-fitr": EidScene,
  "eid-adha": EidScene,
};

export default function SeasonDecorations({
  theme,
}: {
  theme: ResolvedSeasonTheme;
}) {
  const scene = seasonScene(theme.preset, theme.active);
  if (!scene) return null;
  const Scene = SCENES[scene];

  return (
    <div className="season-hero-art" data-scene={scene} aria-hidden="true">
      <svg viewBox="0 0 1240 640" preserveAspectRatio="xMidYMax slice">
        <defs>
          <radialGradient id="season-frost-glow">
            <stop offset="0%" stopColor="#e8f4ff" stopOpacity=".55" />
            <stop offset="65%" stopColor="#b8cce0" stopOpacity=".16" />
            <stop offset="100%" stopColor="#b8cce0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="season-sun-glow">
            <stop offset="0%" stopColor="#ffe9a8" stopOpacity=".6" />
            <stop offset="60%" stopColor="#e8c97a" stopOpacity=".18" />
            <stop offset="100%" stopColor="#e8c97a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="season-warm-glow">
            <stop offset="0%" stopColor="#f6d7e4" stopOpacity=".45" />
            <stop offset="100%" stopColor="#f6d7e4" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="season-ember-glow">
            <stop offset="0%" stopColor="#f0b060" stopOpacity=".42" />
            <stop offset="100%" stopColor="#c68a4a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="season-eid-glow">
            <stop offset="0%" stopColor="#ffe6a8" stopOpacity=".55" />
            <stop offset="100%" stopColor="#eec26e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="season-october-glow">
            <stop offset="0%" stopColor="#f06a6a" stopOpacity=".4" />
            <stop offset="100%" stopColor="#c04040" stopOpacity="0" />
          </radialGradient>
          {/* قناع الهلال — يعطي هلالاً نظيفاً فوق أي صورة */}
          <mask id="season-crescent-cut">
            <circle cx="168" cy="100" r="52" fill="white" />
            <circle cx="200" cy="78" r="48" fill="black" />
          </mask>
        </defs>
        <Scene />
      </svg>
    </div>
  );
}
