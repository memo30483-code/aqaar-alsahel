"use client";

import { useState } from "react";
import { Check, Mail, MessageCircle, Send } from "lucide-react";
import type { AppSettings } from "@/lib/app-settings";
import { useSiteSettings, whatsappHref } from "@/lib/site-settings";
import { submitPublicRequest } from "@/lib/public-requests";

const INPUT_DARK =
  "w-full min-w-0 flex-1 basis-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[12.5px] font-semibold text-white outline-none placeholder:text-[#8f9bb8] focus:border-gold-400/70 sm:basis-0";

/** تسجيل الاهتمام في قاعدة البيانات، مع البريد وواتساب كبدائل عند التعذر. */
export default function AppInterestForm({
  app,
  tone = "dark",
  sectionId = "interest",
}: {
  app: AppSettings;
  tone?: "dark" | "light";
  sectionId?: string;
}) {
  const site = useSiteSettings();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const target = (app.interestEmail || site.managementEmail || "").trim();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || sending) return;
    const value = email.trim();
    setSending(true);
    setSent(false);
    setError("");
    const result = await submitPublicRequest({
      kind: "app_interest",
      email: value,
      message: "تسجيل اهتمام بتطبيق عقار FAMILY",
      payload: { source: "app-page" },
    });
    setSending(false);
    if (!result.ok) {
      setError("تعذّر تسجيل اهتمامك حاليًا. جرّب مرة أخرى أو استخدم وسيلة التواصل المباشر.");
      return;
    }
    setSent(true);
    setEmail("");
  };

  const mailto = target
    ? `mailto:${target}?subject=${encodeURIComponent("تسجيل اهتمام بتطبيق عقار FAMILY")}&body=${encodeURIComponent(`مرحبًا،\nأرغب في تحميل تطبيق عقار FAMILY فور نزوله.\nبريدي: ${email.trim()}\n`)}`
    : "";

  const whatsapp = whatsappHref(
    site.whatsapp || site.managementPhone,
    "مرحبًا، أرغب في تحميل تطبيق عقار FAMILY فور نزوله."
  );

  return (
    <div id={sectionId} className="scroll-mt-28">
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSent(false);
            setError("");
          }}
          placeholder="اكتب إيميلك وهنبعتلك أول ما ينزل"
          dir="ltr"
          className={`${INPUT_DARK} ${tone === "light" ? "!border-sand-200 !bg-white !text-ocean-950" : ""}`}
          aria-label="البريد الإلكتروني"
        />
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gold-500 px-4 py-2.5 text-[12px] font-black text-white transition hover:bg-gold-600 disabled:cursor-wait disabled:opacity-65"
        >
          <Send className="h-3.5 w-3.5" />
          {sending ? "جارٍ التسجيل…" : "سجّل اهتمامك"}
        </button>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-[12px] font-black transition ${
            tone === "light"
              ? "border-sand-200 text-emerald-700 hover:bg-emerald-50"
              : "border-white/15 text-emerald-300 hover:bg-emerald-500/10"
          }`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          واتساب
        </a>
      </form>
      <p
        className={`mt-2 flex items-center gap-1.5 text-[10.5px] font-semibold ${
          tone === "light" ? "text-sand-600" : "text-[#9aa6c3]"
        }`}
      >
        {sent ? (
          <>
            <Check className="h-3 w-3 text-emerald-400" />
            تم تسجيل اهتمامك — هنبعتلك أول ما التطبيق ينزل.
          </>
        ) : error ? (
          <>
            <Mail className="h-3 w-3 text-rose-400" />
            <span>{error}</span>
            {mailto && (
              <a className="font-black underline" href={mailto}>
                البريد المباشر
              </a>
            )}
          </>
        ) : (
          <>
            <Mail className="h-3 w-3" />
            هنستخدم إيميلك لإشعار الإطلاق فقط، بدون أي رسائل تسويقية.
          </>
        )}
      </p>
    </div>
  );
}
