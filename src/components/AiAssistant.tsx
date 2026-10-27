"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Eye, MapPin, Send, ShieldCheck, Sparkles, Wallet, X } from "lucide-react";
import { useI18n, type MessageKey } from "@/lib/i18n";

type ChatMessage = { id: number; role: "bot" | "user"; text: string };

/** الحدث العام الذي يفتح المحادثة من أي زر في الصفحة (مثل «اسأل المساعد الذكي») */
export const OPEN_AI_EVENT = "aqaar:open-ai";

const SUGGESTIONS: MessageKey[] = [
  "home.ai.chip1",
  "home.ai.chip2",
  "home.ai.chip3",
  "home.ai.chip4",
];

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

export default function AiAssistant() {
  const { t } = useI18n();
  const stageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "bot", text: t("home.ai.greeting") },
    { id: 2, role: "user", text: t("home.ai.demoUser") },
    { id: 3, role: "bot", text: t("home.ai.demoBot") },
  ]);

  /* فتح المحادثة من أزرار الصفحة الأخرى */
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_AI_EVENT, handler);
    return () => window.removeEventListener(OPEN_AI_EVENT, handler);
  }, []);

  /* تمرير تلقائي لآخر رسالة */
  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, typing, open]);

  /* إغلاق المحادثة بمفتاح Escape */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const node = stageRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const mx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const my = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    node.style.setProperty("--mx", mx.toFixed(3));
    node.style.setProperty("--my", my.toFixed(3));
  };

  const handleLeave = () => {
    const node = stageRef.current;
    if (!node) return;
    node.style.setProperty("--mx", "0");
    node.style.setProperty("--my", "0");
  };

  const send = (raw?: string) => {
    const value = (raw ?? input).trim();
    if (!value) return;
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: value,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    const replyKey = buildReply(value);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "bot", text: t(replyKey) },
      ]);
      setTyping(false);
    }, 700);
  };

  return (
    <div
      ref={stageRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={() => setOpen(true)}
      className="relative h-[440px] cursor-pointer overflow-hidden rounded-[26px] bg-[radial-gradient(120%_100%_at_72%_8%,#303d74_0%,#1a2246_46%,#0b1023_100%)] shadow-[0_40px_80px_-40px_rgba(20,26,51,0.85),inset_0_0_0_1px_rgba(255,255,255,0.07)] sm:h-[500px] lg:h-[520px]"
      style={{ perspective: "1000px" }}
    >
      {/* نجوم/نقاط خلفية + وهج ذهبي سفلي */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.55)_1px,transparent_1.4px)] bg-[length:46px_46px] opacity-[0.18]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(60%_45%_at_50%_88%,rgba(223,174,61,0.22),transparent_70%)]"
      />

      {/* البيت ثلاثي الطبقات */}
      <div className="absolute inset-0 z-[2] grid place-items-center">
        <div
          className="w-[320px] transition-transform duration-150 ease-out sm:w-[400px] lg:w-[470px]"
          style={{
            transformStyle: "preserve-3d",
            transform:
              "translate3d(0,14px,0) rotateY(calc(var(--mx,0) * 7deg)) rotateX(calc(var(--my,0) * -6deg))",
          }}
        >
          <svg
            viewBox="0 0 420 420"
            fill="none"
            aria-hidden
            className="block w-full overflow-visible"
          >
            <defs>
              <linearGradient id="ai-wall" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fbf6ea" />
                <stop offset="1" stopColor="#e6dcc5" />
              </linearGradient>
              <linearGradient id="ai-roof" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2b3768" />
                <stop offset="1" stopColor="#151c39" />
              </linearGradient>
              <linearGradient id="ai-warm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#ffe9a8" />
                <stop offset="1" stopColor="#eab949" />
              </linearGradient>
              <filter id="ai-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* السماء */}
            <g
              style={{
                transform:
                  "translate3d(calc(var(--mx,0) * 10px), calc(var(--my,0) * 10px), 0)",
                transition: "transform .22s ease-out",
              }}
            >
              <circle cx="336" cy="70" r="26" fill="#f2db9b" opacity=".22" />
              <circle cx="336" cy="70" r="15" fill="#f7e6b6" opacity=".75" />
              <circle cx="70" cy="52" r="1.6" fill="#fff" opacity=".75" />
              <circle cx="118" cy="88" r="1.2" fill="#fff" opacity=".5" />
              <circle cx="286" cy="42" r="1.3" fill="#fff" opacity=".6" />
              <circle cx="382" cy="126" r="1.1" fill="#fff" opacity=".45" />
            </g>

            {/* النخيل + الأرض */}
            <g
              style={{
                transform:
                  "translate3d(calc(var(--mx,0) * -8px), calc(var(--my,0) * -8px), 0)",
                transition: "transform .22s ease-out",
              }}
            >
              <path d="M52 350c8-40 6-74-2-104" stroke="#0f1730" strokeWidth="7" strokeLinecap="round" />
              <path
                d="M50 250c-22-14-34-12-44-6M50 248c-6-24 4-36 14-44M52 252c22-16 38-14 46-6M52 264c18 8 28 20 30 30"
                stroke="#0f1730"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path d="M368 352c-9-42-6-78 3-108" stroke="#0f1730" strokeWidth="7" strokeLinecap="round" />
              <path
                d="M371 248c-20-12-32-10-42-4M371 246c-4-24 6-36 16-44M370 250c22-16 38-14 46-6"
                stroke="#0f1730"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <ellipse cx="210" cy="372" rx="158" ry="17" fill="#05070f" opacity=".55" />
            </g>

            {/* البيت */}
            <g
              style={{
                transform:
                  "translate3d(calc(var(--mx,0) * 14px), calc(var(--my,0) * 10px), 0)",
                transition: "transform .22s ease-out",
              }}
            >
              <rect x="110" y="196" width="200" height="152" rx="9" fill="url(#ai-wall)" />
              <rect x="110" y="196" width="200" height="152" rx="9" stroke="#0f1730" strokeOpacity=".18" />

              <path d="M86 206 210 118l124 88Z" fill="url(#ai-roof)" />
              <path d="M86 206 210 118l124 88" stroke="#3d4a80" strokeWidth="3" strokeLinejoin="round" />
              <path d="M96 202h228" stroke="#0f1730" strokeWidth="7" strokeLinecap="round" />
              <path d="M210 122v78" stroke="#dfae3d" strokeWidth="1.2" opacity=".35" />

              <rect x="276" y="146" width="19" height="46" rx="3" fill="#28325f" />
              <rect x="272" y="140" width="27" height="9" rx="3" fill="#37447a" />
              <circle className="ai-smoke" cx="285" cy="132" r="5" fill="#cfd7ea" opacity=".4" />
              <circle
                className="ai-smoke"
                cx="290"
                cy="120"
                r="7"
                fill="#cfd7ea"
                opacity=".3"
                style={{ animationDelay: "1.6s" }}
              />

              <g filter="url(#ai-glow)">
                <rect className="ai-win" x="136" y="222" width="38" height="46" rx="4" fill="url(#ai-warm)" />
                <rect className="ai-win ai-win-b" x="246" y="222" width="38" height="46" rx="4" fill="url(#ai-warm)" />
              </g>
              <path
                d="M155 222v46M136 245h38M265 222v46M246 245h38"
                stroke="#1a2246"
                strokeWidth="2"
                opacity=".55"
              />

              <rect x="190" y="214" width="40" height="26" rx="3" fill="#1c2546" />
              <path d="M196 240v-14M204 240v-14M212 240v-14M220 240v-14" stroke="#dfae3d" strokeWidth="2" opacity=".55" />
              <rect x="186" y="238" width="48" height="4" rx="2" fill="#dfae3d" opacity=".5" />

              <g filter="url(#ai-glow)">
                <rect className="ai-win ai-win-c" x="128" y="296" width="44" height="38" rx="4" fill="url(#ai-warm)" />
                <rect className="ai-win ai-win-b" x="248" y="296" width="44" height="38" rx="4" fill="url(#ai-warm)" />
              </g>
              <path
                d="M150 296v38M128 315h44M270 296v38M248 315h44"
                stroke="#1a2246"
                strokeWidth="2"
                opacity=".5"
              />

              <path d="M191 348v-52a19 19 0 0 1 38 0v52Z" fill="#1a2246" />
              <path d="M191 348v-52a19 19 0 0 1 38 0v52" stroke="#dfae3d" strokeWidth="2.4" />
              <circle cx="200" cy="318" r="2.2" fill="#dfae3d" />
              <path d="M196 348v-46" stroke="#dfae3d" strokeWidth="1" opacity=".3" />

              <rect x="196" y="260" width="28" height="16" rx="4" fill="#1a2246" opacity=".9" />
              <path d="m204 268 3 3 6-6" stroke="#dfae3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

              <path d="M316 262v10" stroke="#0f1730" strokeWidth="2" />
              <circle cx="316" cy="276" r="4.5" fill="#ffe9a8" filter="url(#ai-glow)" />
            </g>

            {/* المقدمة */}
            <g
              style={{
                transform:
                  "translate3d(calc(var(--mx,0) * 26px), calc(var(--my,0) * 18px), 0)",
                transition: "transform .22s ease-out",
              }}
            >
              <path d="M200 352h20l26 20h-72Z" fill="#0f1730" opacity=".35" />
              <path
                d="M118 356c8-10 26-12 36-4M266 356c10-10 28-8 36 2"
                stroke="#16203f"
                strokeWidth="6"
                strokeLinecap="round"
                opacity=".8"
              />
            </g>
          </svg>
        </div>
      </div>

      {/* شارة المساعد */}
      <div className="absolute right-4 top-4 z-[4] flex items-center gap-2">
        <span className="relative grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-gold-300 to-gold-600 text-[#231a06] shadow-[0_0_0_1px_rgba(255,255,255,0.28),0_14px_34px_-8px_rgba(223,174,61,0.8)]">
          <span aria-hidden className="ai-ping absolute inset-[-8px] rounded-[20px] border border-gold-400/45" />
          <span
            aria-hidden
            className="ai-ping absolute inset-[-8px] rounded-[20px] border border-gold-400/45"
            style={{ animationDelay: "1.8s" }}
          />
          <Bot className="relative h-5 w-5" />
        </span>
        <span className="hidden items-center gap-1.5 rounded-full border border-white/[0.16] bg-white/10 px-2.5 py-1 text-[9px] font-extrabold text-[#dfe5f5] backdrop-blur sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t("home.ai.connected")}
        </span>
      </div>

      {/* شرائح عائمة */}
      <div className="ai-float absolute right-3 top-16 z-[5] flex items-center gap-1.5 rounded-full border border-white/[0.18] bg-white/[0.09] px-3 py-1.5 text-[10px] font-extrabold text-[#e9edf8] backdrop-blur">
        <MapPin className="h-3 w-3 text-gold-300" />
        {t("home.ai.chip1")}
      </div>
      <div
        className="ai-float absolute left-2 top-36 z-[5] flex items-center gap-1.5 rounded-full border border-white/[0.18] bg-white/[0.09] px-3 py-1.5 text-[10px] font-extrabold text-[#e9edf8] backdrop-blur"
        style={{ animationDelay: "1.4s" }}
      >
        <Eye className="h-3 w-3 text-gold-300" />
        {t("home.ai.chip2")}
      </div>
      <div
        className="ai-float absolute bottom-20 right-2 z-[5] hidden items-center gap-1.5 rounded-full border border-white/[0.18] bg-white/[0.09] px-3 py-1.5 text-[10px] font-extrabold text-[#e9edf8] backdrop-blur sm:flex"
        style={{ animationDelay: "2.6s" }}
      >
        <Wallet className="h-3 w-3 text-gold-300" />
        {t("home.ai.chip3")}
      </div>
      <div
        className="ai-float absolute bottom-20 left-2 z-[5] hidden items-center gap-1.5 rounded-full border border-white/[0.18] bg-white/[0.09] px-3 py-1.5 text-[10px] font-extrabold text-[#e9edf8] backdrop-blur sm:flex"
        style={{ animationDelay: "3.4s" }}
      >
        <ShieldCheck className="h-3 w-3 text-gold-300" />
        {t("home.ai.chip4")}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[6] flex justify-center">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
          aria-label={t("home.ai.hint")}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#0a0e20]/55 px-3 py-1.5 text-[9.5px] font-bold text-[#aeb7cf] backdrop-blur transition hover:border-gold-400/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/70"
        >
          <Sparkles className="h-3 w-3 text-gold-300" />
          {t("home.ai.hint")}
        </button>
      </div>

      {/* المحادثة */}
      <div
        className={`absolute inset-x-3 bottom-3 z-[9] overflow-hidden rounded-2xl bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] transition duration-300 ${
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-[118%] opacity-0"
        }`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label={t("home.ai.botName")}
        aria-modal="false"
      >
        <div className="flex items-center gap-2.5 bg-ocean-950 px-3.5 py-2.5 text-white">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-gold-400/40 bg-gold-400/15 text-gold-300">
            <Bot className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold">{t("home.ai.botName")}</p>
            <p className="flex items-center gap-1 text-[8.5px] text-[#aeb7cd]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {t("home.ai.botStatus")}
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
            }}
            aria-label={t("ads.close")}
            className="ms-auto rounded-md p-1 text-[#93a0bd] transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex max-h-[210px] flex-col gap-1.5 overflow-y-auto bg-gradient-to-b from-white to-sand-50 p-3"
          aria-live="polite"
        >
          {messages.map((message) => (
            <p
              key={message.id}
              className={`max-w-[88%] rounded-[10px] px-2.5 py-1.5 text-[10.5px] font-semibold leading-6 ${
                message.role === "user"
                  ? "self-end rounded-tl-[3px] bg-ocean-900 font-bold text-white"
                  : "self-start rounded-tr-[3px] border border-sand-200 bg-sand-100 text-ocean-900"
              }`}
            >
              {message.text}
            </p>
          ))}
          {typing && (
            <p className="self-start rounded-[10px] rounded-tr-[3px] border border-sand-200 bg-sand-100 px-2.5 py-1.5 text-[10px] font-bold text-sand-600">
              {t("home.ai.typing")}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => send(t(key))}
                className="rounded-full border border-sand-300 bg-white px-2.5 py-1 text-[9px] font-bold text-ocean-700 transition hover:border-gold-300 hover:bg-gold-50"
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="flex items-center gap-1.5 border-t border-sand-200 bg-white p-2.5"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t("home.ai.inputPlaceholder")}
            aria-label={t("home.ai.inputPlaceholder")}
            className="h-8 min-w-0 flex-1 rounded-lg border border-sand-300 bg-sand-50 px-2.5 text-[10.5px] font-semibold text-ocean-900 outline-none transition focus:border-ocean-500 focus:bg-white"
          />
          <button
            type="submit"
            aria-label={t("home.ai.send")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ocean-900 text-white transition hover:bg-ocean-950"
          >
            <Send className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </button>
        </form>
      </div>
    </div>
  );
}
