"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";

interface InviteInfo {
  valid: boolean;
  name?: string;
  email?: string;
  expiresAt?: string;
}

export default function StaffJoinPage() {
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const inviteCode = new URLSearchParams(window.location.search).get("code")?.trim() ?? "";
    setCode(inviteCode);
    if (!inviteCode) {
      setInvite({ valid: false });
      setLoading(false);
      return;
    }
    void fetch(`/api/admin/join?code=${encodeURIComponent(inviteCode)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = (await response.json()) as InviteInfo;
        setInvite(data);
      })
      .catch(() => setInvite({ valid: false }))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 10) {
      setError("كلمة المرور يجب ألا تقل عن 10 أحرف.");
      return;
    }
    if (password !== confirmPassword) {
      setError("تأكيد كلمة المرور غير مطابق.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setError(
          response.status === 410
            ? "انتهت صلاحية الدعوة. اطلب من الأدمن إرسال دعوة جديدة."
            : "تعذّر تفعيل الحساب. قد تكون الدعوة منتهية أو مستخدمة سابقًا."
        );
        return;
      }
      setDone(true);
      window.setTimeout(() => window.location.replace("/admin"), 900);
    } catch {
      setError("تعذّر الاتصال بالسيرفر. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-sand-50 px-4 py-12">
      <section className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-sand-200 bg-white shadow-2xl">
        <div className="bg-ocean-950 px-7 py-8 text-white">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400 text-ocean-950">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-black">تفعيل حساب فريق عقار FAMILY</h1>
          <p className="mt-2 text-sm leading-7 text-white/70">
            أنشئ كلمة مرور خاصة بك للدخول إلى لوحة المراجعة حسب الصلاحيات التي منحها الأدمن.
          </p>
        </div>

        <div className="p-7">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sand-600">
              <Loader2 className="h-5 w-5 animate-spin" /> جاري فحص الدعوة…
            </div>
          ) : done ? (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
              <h2 className="mt-4 text-xl font-black text-ocean-950">تم تفعيل الحساب</h2>
              <p className="mt-2 text-sm text-sand-600">يتم فتح لوحة العمل الآن…</p>
            </div>
          ) : !invite?.valid ? (
            <div className="py-8 text-center">
              <LockKeyhole className="mx-auto h-12 w-12 text-rose-500" />
              <h2 className="mt-4 text-lg font-black text-ocean-950">رابط الدعوة غير صالح</h2>
              <p className="mt-2 text-sm leading-7 text-sand-600">
                الرابط ناقص أو انتهت صلاحيته. اطلب من الأدمن إعادة إرسال الدعوة.
              </p>
              <Link href="/login?redirect=/admin" className="mt-5 inline-block rounded-full bg-ocean-950 px-5 py-2.5 text-sm font-bold text-white">
                الذهاب لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
                <p className="font-black text-ocean-950">{invite.name}</p>
                <p className="mt-1 text-xs text-sand-600" dir="ltr">{invite.email}</p>
              </div>
              <label className="block text-sm font-bold text-ocean-950">
                كلمة المرور الجديدة
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-sand-200 px-4 py-3 outline-none focus:border-gold-400"
                  placeholder="10 أحرف على الأقل"
                />
              </label>
              <label className="block text-sm font-bold text-ocean-950">
                تأكيد كلمة المرور
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="mt-2 w-full rounded-xl border border-sand-200 px-4 py-3 outline-none focus:border-gold-400"
                />
              </label>
              {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-400 px-5 py-3 font-black text-ocean-950 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                تفعيل الحساب والدخول
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
