"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";
import { useSeasonTheme } from "@/components/ThemeProvider";

type ChatMessage = { id: number; role: "bot" | "user"; text: string };

/** الحدث العام الذي يفتح المحادثة من أي زر في الصفحة (مثل «اسأل المساعد الذكي») */
export const OPEN_AI_EVENT = "aqaar:open-ai";

const SUGGESTIONS: MessageKey[] = [
  "home.ai.chip1",
  "home.ai.chip2",
  "home.ai.chip3",
  "home.ai.chip4",
];

/** حجم شخصية المساعد (البيت المتحرك) بالبكسل */
const MASCOT = 64;
/** المسافة الآمنة حول الشاشة */
const EDGE = 12;
/** أعلى نقطة مسموح بيها (تحت الهيدر الثابت) */
const TOP_SAFE = 88;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** ردّ محلي بسيط وفق نية السؤال — لا يتصل بأي خدمة خارجية */
function buildReply(input: string): MessageKey {
  const text = input.toLowerCase();
  const has = (...words: string[]) => words.some((word) => text.includes(word));

  if (has("توثيق", "مستند", "ورق", "قانون", "verify", "document", "legal")) {
    return "home.ai.reply.verify";
  }
  if (has("تواصل", "معاينة", "رقم", "واتس", "contact", "viewing", "whatsapp")) {
    return "home.ai.reply.contact";
  }
  if (has("سعر", "ميزانية", "مليون", "متر", "price", "budget", "million")) {
    return "home.ai.reply.price";
  }
  if (has("شقة", "فيلا", "شاليه", "محل", "أرض", "flat", "villa", "chalet", "shop")) {
    return "home.ai.reply.search";
  }
  return "home.ai.reply.fallback";
}

/** مستطيلات العناصر العائمة (بانر الإعلان/العروض) التي لا نقف فوقها */
function getForbiddenRects(): Array<{ left: number; top: number; right: number; bottom: number }> {
  if (typeof window === "undefined") return [];
  return Array.from(document.querySelectorAll<HTMLElement>("[data-floating-banner]"))
    .map((element) => {
      const styles = window.getComputedStyle(element);
      if (styles.display === "none" || styles.visibility === "hidden") return null;
      if (Number(styles.opacity) < 0.15) return null;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return {
        left: rect.left - 16,
        top: rect.top - 16,
        right: rect.right + 16,
        bottom: rect.bottom + 16,
      };
    })
    .filter((rect): rect is NonNullable<typeof rect> => rect !== null);
}

/** نقطة عشوائية داخل الشاشة بعيدة عن البانرات وعن الموضع الحالي */
function randomSpot(current: { x: number; y: number }): { x: number; y: number } {
  const width = document.documentElement.clientWidth;
  const height = document.documentElement.clientHeight;
  const minX = EDGE;
  const maxX = Math.max(minX, width - MASCOT - EDGE);
  const minY = TOP_SAFE;
  const maxY = Math.max(minY, height - MASCOT - EDGE);
  const forbidden = getForbiddenRects();
  const minJump = Math.min(220, Math.max(120, width * 0.22));

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    const hitsBanner = forbidden.some(
      (rect) =>
        x < rect.right &&
        x + MASCOT > rect.left &&
        y < rect.bottom &&
        y + MASCOT > rect.top
    );
    const farEnough = Math.hypot(x - current.x, y - current.y) > minJump;
    if (!hitsBanner && farEnough) return { x, y };
  }

  return {
    x: EDGE,
    y: clamp(height * 0.62, minY, maxY),
  };
}

/**
 * مساعد FAMILY — شخصية «بيت» حيّة تتنقّل في أرجاء الصفحة، تتفاعل مع حركة
 * الماوس، وبالضغط عليها تُفتح المحادثة كقائمة منسدلة بجوارها.
 */
export default function AssistantWidget() {
  const { t } = useI18n();
  const seasonTheme = useSeasonTheme();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState({ x: -999, y: -999 });
  const [viewport, setViewport] = useState({ width: 1280, height: 800 });
  const [reduced, setReduced] = useState(false);
  /** نُفعّل الانتقالات بعد أول تثبيت حتى لا تظهر الشخصية منزَلِقة من خارج الشاشة */
  const [motion, setMotion] = useState(false);
  const [hopping, setHopping] = useState(false);
  const [hopKey, setHopKey] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0, ex: 0, ey: 0, near: false });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const posRef = useRef(pos);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  posRef.current = pos;

  const startHop = useCallback(() => {
    setHopping(true);
    setHopKey((key) => key + 1);
    window.setTimeout(() => setHopping(false), 800);
  }, []);

  /* الموضع الأولي + متابعة المقاس وتفضيل تقليل الحركة */
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduced = () => setReduced(query.matches);
    syncReduced();
    query.addEventListener("change", syncReduced);

    const measure = () => {
      setViewport({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      });
      setPos((current) =>
        current.x < 0
          ? current
          : {
              x: clamp(
                current.x,
                EDGE,
                document.documentElement.clientWidth - MASCOT - EDGE
              ),
              y: clamp(
                current.y,
                TOP_SAFE,
                document.documentElement.clientHeight - MASCOT - EDGE
              ),
            }
      );
    };

    setPos({
      x: document.documentElement.clientWidth - MASCOT - 24,
      y: document.documentElement.clientHeight - MASCOT - 150,
    });
    setReady(true);
    measure();
    const raf = window.requestAnimationFrame(() => setMotion(true));
    /* احتياط: بعض المتصفحات تُجمّد rAF في التبويبات الخلفية */
    const motionTimer = window.setTimeout(() => setMotion(true), 140);
    window.addEventListener("resize", measure);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(motionTimer);
      query.removeEventListener("change", syncReduced);
      window.removeEventListener("resize", measure);
    };
  }, []);

  /* التنقّل بين الحين والآخر — يتوقف أثناء الفتح أو المرور بالماوس */
  useEffect(() => {
    if (!ready || open || hovering || reduced) return;

    const timer = window.setTimeout(() => {
      setPos(randomSpot(posRef.current));
      startHop();
    }, 6500 + Math.random() * 3000);

    return () => window.clearTimeout(timer);
  }, [ready, open, hovering, reduced, pos, startHop]);

  /* تفاعل مع الماوس: العينان والجسم يتابعان المؤشر */
  useEffect(() => {
    if (reduced) return;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (frameRef.current) return;

      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = 0;
        const current = posRef.current;
        if (current.x < 0) return;

        const centerX = current.x + MASCOT / 2;
        const centerY = current.y + MASCOT / 2;
        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;
        const distance = Math.hypot(dx, dy) || 1;

        setLook({
          x: clamp(dx / 26, -9, 9),
          y: clamp(dy / 32, -7, 7),
          ex: clamp(dx / 22, -2.6, 2.6),
          ey: clamp(dy / 26, -2.2, 2.2),
          near: distance < 150,
        });
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [reduced]);

  /* الفتح من أي زر في الصفحات الأخرى */
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_AI_EVENT, handler);
    return () => window.removeEventListener(OPEN_AI_EVENT, handler);
  }, []);

  /* أول رسالة ترحيب عند أول فتح */
  useEffect(() => {
    if (!open || messages.length > 0) return;
    setMessages([{ id: 1, role: "bot", text: t("home.ai.greeting") }]);
  }, [open, messages.length, t]);

  /* إغلاق بـ Escape أو بالضغط خارج اللوحة والشخصية */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    const timer = window.setTimeout(
      () => window.addEventListener("mousedown", onPointerDown),
      0
    );

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onPointerDown);
      window.clearTimeout(timer);
    };
  }, [open]);

  /* تمرير تلقائي لآخر رسالة */
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, typing, open]);

  const send = (raw?: string) => {
    const value = (raw ?? input).trim();
    if (!value) return;

    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text: value }]);
    setInput("");
    setTyping(true);

    const replyKey = buildReply(value);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "bot", text: t(replyKey) },
      ]);
      setTyping(false);
    }, 650);
  };

  /** موضع اللوحة بالنسبة للشخصية مع ضمان بقائها داخل الشاشة */
  const panelStyle = useMemo(() => {
    const width = Math.min(352, viewport.width - 2 * EDGE);
    const left = clamp(
      pos.x + MASCOT / 2 - width / 2,
      EDGE,
      viewport.width - width - EDGE
    );
    const spaceBelow = viewport.height - (pos.y + MASCOT + 20);

    if (spaceBelow >= 260) {
      return {
        left,
        top: pos.y + MASCOT + 10,
        width,
        maxHeight: Math.min(470, spaceBelow - 8),
      };
    }

    return {
      left,
      bottom: viewport.height - pos.y + 10,
      width,
      maxHeight: Math.min(470, Math.max(220, pos.y - 20)),
    };
  }, [pos, viewport]);

  return (
    <>
      {/* ============ شخصية المساعد ============ */}
      <div
        ref={rootRef}
        className="fixed z-[70]"
        style={{
          left: pos.x,
          top: pos.y,
          width: MASCOT,
          height: MASCOT,
          opacity: ready && pos.x >= 0 ? 1 : 0,
          transition:
            motion && !reduced
              ? "left 720ms cubic-bezier(0.34, 1.3, 0.64, 1), top 720ms cubic-bezier(0.34, 1.3, 0.64, 1), opacity 200ms ease"
              : "opacity 200ms ease",
        }}
      >
        <div
          className="relative h-full w-full"
          style={{
            transform: reduced
              ? undefined
              : `translate(${look.x}px, ${look.y}px) rotate(${look.x * 0.45}deg)`,
            transition: "transform 260ms ease-out",
          }}
        >
          {/* هالة خفيفة تلفت النظر */}
          {!reduced && !open && (
            <span
              aria-hidden
              className="mascot-halo pointer-events-none absolute inset-0 rounded-full bg-gold-400/25 blur-md"
            />
          )}

          <button
            type="button"
            id="ai-launcher"
            aria-expanded={open}
            aria-controls="ai-panel"
            aria-label={t("home.ai.mascotAria")}
            title={t("home.ai.mascotHint")}
            onClick={() => {
              setOpen((value) => !value);
              startHop();
            }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className="group relative block h-full w-full outline-none focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2"
          >
            <span
              key={hopKey}
              className={`block h-full w-full ${hopping ? "mascot-hop" : "mascot-idle"}`}
            >
              <svg
                viewBox="0 0 72 72"
                className="h-full w-full drop-shadow-[0_10px_16px_rgba(20,26,51,0.28)] transition-transform duration-200 group-hover:scale-[1.06]"
                role="presentation"
              >
                <defs>
                  <linearGradient id="ai-roof" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f2dca6" />
                    <stop offset="55%" stopColor="#d9b95c" />
                    <stop offset="100%" stopColor="#b8963b" />
                  </linearGradient>
                  <linearGradient id="ai-body" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fffdf7" />
                    <stop offset="100%" stopColor="#f4ebd8" />
                  </linearGradient>
                </defs>

                {seasonTheme.active && seasonTheme.preset === "ramadan" && seasonTheme.motifs.assistantLantern && (
                  <g
                    aria-hidden="true"
                    fill="none"
                    stroke="#e8c36f"
                    strokeOpacity="0.82"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  >
                    <path d="M36 3v5M22 11h28l5 8-4 34-15 11-15-11-4-34Z" />
                    <path d="M17 22h38M20 52h32" strokeOpacity="0.56" />
                    <path d="M29 8h14" strokeWidth="2.2" />
                  </g>
                )}

                {/* الظل الأرضي */}
                <ellipse cx="36" cy="66" rx="16" ry="3.2" fill="#141a33" opacity="0.16" />
                <circle cx="58" cy="13" r="1.8" fill="#d9b95c" opacity="0.45" />
                <circle cx="64" cy="19" r="1.2" fill="#d9b95c" opacity="0.3" />

                {/* المدخنة */}
                <rect x="49" y="15" width="6.5" height="12" rx="2" fill="#c9a24a" />
                <rect x="48" y="13" width="8.5" height="3" rx="1.5" fill="#e2c688" />

                {/* السقف */}
                <path
                  d="M9 34 L36 9.5 L63 34"
                  fill="none"
                  stroke="url(#ai-roof)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* جسم البيت */}
                <rect
                  x="16"
                  y="33"
                  width="40"
                  height="29"
                  rx="8"
                  fill="url(#ai-body)"
                  stroke="#e3d7bd"
                  strokeWidth="1.6"
                />

                {/* العينان (شبابيك البيت) */}
                <g className={reduced ? undefined : "mascot-eyes"}>
                  <circle cx="27" cy="42" r="5.2" fill="#fffdf7" stroke="#c9922a" strokeWidth="1.6" />
                  <circle cx="45" cy="42" r="5.2" fill="#fffdf7" stroke="#c9922a" strokeWidth="1.6" />
                  <circle
                    cx="27"
                    cy="42"
                    r="2.3"
                    fill="#141a33"
                    style={{ transform: `translate(${look.ex}px, ${look.ey}px)` }}
                  />
                  <circle
                    cx="45"
                    cy="42"
                    r="2.3"
                    fill="#141a33"
                    style={{ transform: `translate(${look.ex}px, ${look.ey}px)` }}
                  />
                  <circle cx="26" cy="41" r="0.8" fill="#ffffff" />
                  <circle cx="44" cy="41" r="0.8" fill="#ffffff" />
                </g>

                {/* الباب */}
                <rect x="30" y="50" width="12" height="12" rx="4" fill="#141a33" />
                <circle cx="39" cy="56" r="1.2" fill="#e2c688" />
              </svg>
            </span>

            {/* شارة الذكاء الاصطناعي */}
            <span
              aria-hidden
              className="absolute -end-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full border border-gold-200 bg-gradient-to-br from-gold-300 to-gold-500 text-ocean-950 shadow-[0_4px_10px_-4px_rgba(20,26,51,0.6)]"
            >
              <Sparkles className="h-3 w-3" />
            </span>

            {/* فقاعة تلميح */}
            {!open && (hovering || look.near) && (
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ocean-950 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                {t("home.ai.mascotHint")}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ============ لوحة المحادثة المنسدلة ============ */}
      <div
        ref={panelRef}
        id="ai-panel"
        role="dialog"
        aria-label={t("home.ai.launcherShort")}
        aria-hidden={!open}
        className={`fixed z-[72] flex flex-col overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_40px_90px_-28px_rgba(20,26,51,0.55)] transition duration-200 ease-out ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0"
        }`}
        style={panelStyle}
      >
        {/* رأس اللوحة */}
        <div className="ai-panel-header relative shrink-0 overflow-hidden bg-[linear-gradient(135deg,#141a33,#27315e)] px-4 py-3 text-white">
          <span
            aria-hidden
            className="pointer-events-none absolute -end-8 -top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.35),transparent_65%)]"
          />
          <div className="relative flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-gold-400/40 bg-white/10 text-gold-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-black">{t("home.ai.botName")}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[9.5px] font-bold text-white/55">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {t("home.ai.connected")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("ads.close")}
              className="ms-auto rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* الرسائل */}
        <div
          ref={scrollRef}
          aria-live="polite"
          className="flex min-h-[104px] flex-1 flex-col gap-2 overflow-y-auto bg-gradient-to-b from-white to-sand-50 p-3"
        >
          {messages.map((message) => (
            <p
              key={message.id}
              className={`max-w-[88%] rounded-2xl px-3 py-2 text-[11.5px] font-semibold leading-6 ${
                message.role === "user"
                  ? "self-end rounded-br-md bg-ocean-900 font-bold text-white"
                  : "self-start rounded-bl-md border border-sand-200 bg-white text-ocean-900 shadow-[0_8px_20px_-18px_rgba(20,26,51,0.6)]"
              }`}
            >
              {message.text}
            </p>
          ))}
          {typing && (
            <span className="self-start rounded-2xl rounded-bl-md border border-sand-200 bg-white px-3 py-2">
              <span className="flex items-center gap-1">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-sand-400"
                    style={{ animationDelay: `${dot * 120}ms` }}
                  />
                ))}
              </span>
            </span>
          )}
        </div>

        {/* اقتراحات سريعة */}
        <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-sand-100 bg-white px-3 py-2">
          {SUGGESTIONS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => send(t(key))}
              className="rounded-full border border-sand-200 bg-sand-50 px-2.5 py-1 text-[9.5px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700"
            >
              {t(key)}
            </button>
          ))}
        </div>

        {/* الإدخال */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex shrink-0 items-center gap-2 border-t border-sand-200 bg-white p-2.5"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("home.ai.inputPlaceholder")}
            aria-label={t("home.ai.inputPlaceholder")}
            className="h-9 min-w-0 flex-1 rounded-xl border border-sand-200 bg-sand-50 px-3 text-[11.5px] font-semibold text-ocean-900 outline-none transition placeholder:font-medium placeholder:text-sand-500 focus:border-gold-400 focus:bg-white"
          />
          <button
            type="submit"
            aria-label={t("home.ai.send")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-l from-gold-500 to-gold-400 text-ocean-950 transition hover:-translate-y-0.5"
          >
            <Send className="h-4 w-4 rtl:-scale-x-100" />
          </button>
        </form>

        <p className="shrink-0 border-t border-sand-100 bg-sand-50 px-3 py-1.5 text-center text-[9px] font-bold text-sand-500">
          {t("home.ai.panelNote")}
        </p>
      </div>
    </>
  );
}
