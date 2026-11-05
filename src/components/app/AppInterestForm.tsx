"use client";

import { useState } from "react";
import { Check, Mail, MessageCircle, Send } from "lucide-react";
import type { AppSettings } from "@/lib/app-settings";
import { useSiteSettings, whatsappHref } from "@/lib/site-settings";

const INPUT_DARK =
  "w-full min-w-0 flex-1 basis-full rounded-xl border border-white/15 bg-white/[0.06] px-3.5 py-2.5 text-[12.5px] font-semibold text-white outline-none placeholder:text-[#8f9bb8] focus:border-gold-400/70 sm:basis-0";

/** تسجيل الاهتمام: يفتح رسالة بريد جاهزة للإدارة + واتساب كبديل فوري */
export default function AppInterestForm({
  app,
  tone = "dark",
}: {
  app: AppSettings;
  tone?: "dark" | "light";
}) {
  const site = useSiteSettings();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const target = (app.interestEmail || site.managementEmail || "").trim();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !target) return;
    const value = email.trim();
    /* حفظ الطلب في قاعدة البيانات وإنشاء بطاقة CRM تلقائيًا */
    void fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        kind: "app_interest",
        email: value,
        message: "تسجيل اهتمام بتطبيق عقار FAMILY",
      }),
    }).catch(() => {
      /* البريد الاحتياطي يظل متاحًا حتى لو تعذر الاتصال */
    });
    const subject = "تسجيل اهتمام بتطبيق عقار FAMILY";
    const body = `مرحبًا،\nأرغب في تحميل تطبيق عقار FAMILY فور نزوله.\nبريدي: ${value}\n`;
    window.location.href = `mailto:${target}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const whatsapp = whatsappHref(
    site.whatsapp || site.managementPhone,
    "مرحبًا، أرغب في تحميل تطبيق عقار FAMILY فور نزوله."
  );

  return (
    <div id="interest" className="scroll-mt-28">
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="اكتب إيميلك وهنبعتلك أول ما ينزل"
          dir="ltr"
          className={`${INPUT_DARK} ${tone === "light" ? "!border-sand-200 !bg-white !text-ocean-950" : ""}`}
          aria-label="البريد الإلكتروني"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gold-500 px-4 py-2.5 text-[12px] font-black text-white transition hover:bg-gold-600"
        >
          <Send className="h-3.5 w-3.5" />
          سجّل اهتمامك
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
            تم تجهيز الرسالة في بريدك — ابعتـها وهنضيفك لقائمة الإطلاق.
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
