"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
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

/**
 * المساعد الذكي العائم — زر صغير ثابت في كل الصفحات،
 * وبالضغط عليه تنفتح لوحة محادثة كقائمة منسدلة.
 */
export default function AssistantWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /** رفع الزر فوق بانر العروض العائم عندما يكون نشطاً */
  const [raised, setRaised] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* الفتح من أي زر في الصفحات الأخرى */
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_AI_EVENT, handler);
    return () => window.removeEventListener(OPEN_AI_EVENT, handler);
  }, []);

  /* متابعة ظهور بانر العروض العائم لتفادي التعارض */
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setRaised(root.dataset.offersBanner === "1");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-offers-banner"],
    });
    return () => observer.disconnect();
  }, []);

  /* أول رسالة ترحيب عند أول فتح — باللغة الحالية */
  useEffect(() => {
    if (!open || messages.length > 0) return;
    setMessages([{ id: 1, role: "bot", text: t("home.ai.greeting") }]);
  }, [open, messages.length, t]);

  /* إغلاق بـ Escape أو بالضغط خارج اللوحة */
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target && typeof target.closest === "function" && target.closest("#ai-launcher")) {
        return;
      }
      if (panelRef.current && !panelRef.current.contains(target as Node)) setOpen(false);
    };
    /* تأجيل التسجيل حتى لا تُغلق اللوحة بنفس ضغطة الفتح */
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

    const userMessage: ChatMessage = { id: Date.now(), role: "user", text: value };
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
    }, 650);
  };

  return (
    <>
      {/* ============ الزر العائم ============ */}
      <button
        type="button"
        id="ai-launcher"
        aria-expanded={open}
        aria-controls="ai-panel"
        aria-label={t("home.ai.launcherShort")}
        onClick={() => setOpen((value) => !value)}
        className={`group fixed end-4 z-[70] flex items-center gap-2 rounded-full border border-gold-400/45 bg-ocean-950/95 p-1.5 text-white shadow-[0_18px_40px_-14px_rgba(20,26,51,0.85)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-gold-300 sm:end-6 sm:pe-4 ${
          raised ? "bottom-[8.25rem]" : "bottom-4 sm:bottom-6"
        }`}
      >
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#c9922a,#ecc97a)] text-ocean-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          <Sparkles className="h-5 w-5" />
          <span className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-ocean-950 bg-emerald-400" />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full ring-2 ring-gold-300/40 transition group-hover:ring-gold-200/70"
          />
        </span>

        <span className="hidden text-start sm:block">
          <span className="block text-[9.5px] font-bold text-white/50">
            {t("home.ai.eyebrow")}
          </span>
          <span className="block text-[12px] font-black leading-5">
            {t("home.ai.launcher")}
          </span>
        </span>

        {open && (
          <X className="me-1 hidden h-4 w-4 text-white/50 sm:block" aria-hidden />
        )}
      </button>

      {/* ============ لوحة المحادثة ============ */}
      <div
        ref={panelRef}
        id="ai-panel"
        role="dialog"
        aria-label={t("home.ai.launcherShort")}
        aria-hidden={!open}
        className={`fixed end-3 z-[71] w-[min(93vw,376px)] origin-bottom-left overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_40px_90px_-28px_rgba(20,26,51,0.55)] transition duration-200 ease-out sm:end-6 ${
          raised
            ? "bottom-[12.5rem]"
            : "bottom-[4.75rem] sm:bottom-24"
        } ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-95 opacity-0"
        }`}
      >
        {/* رأس اللوحة */}
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#141a33,#27315e)] px-4 py-3.5 text-white">
          <span
            aria-hidden
            className="pointer-events-none absolute -end-8 -top-10 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.35),transparent_65%)]"
          />
          <div className="relative flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-gold-400/40 bg-white/10 text-gold-300">
              <Bot className="h-4 w-4" />
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
          className="flex max-h-[min(40vh,320px)] flex-col gap-2 overflow-y-auto bg-gradient-to-b from-white to-sand-50 p-3"
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
        <div className="flex flex-wrap gap-1.5 border-t border-sand-100 bg-white px-3 py-2">
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
          className="flex items-center gap-2 border-t border-sand-200 bg-white p-2.5"
        >
          <input
            ref={inputRef}
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

        <p className="border-t border-sand-100 bg-sand-50 px-3 py-1.5 text-center text-[9px] font-bold text-sand-500">
          {t("home.ai.panelNote")}
        </p>
      </div>
    </>
  );
}
