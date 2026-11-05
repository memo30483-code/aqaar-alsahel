"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Flag,
  Loader2,
  MessageSquarePlus,
  Send,
  Star,
  X,
} from "lucide-react";
import {
  REVIEW_POLICY_NOTE,
  REVIEW_STATUS_LABEL,
  summarizeReviews,
  type Review,
  type ReviewEntity,
  type ReviewEntitySettings,
  type ReviewSettings,
} from "@/lib/reviews";

interface ApiPayload {
  ok: boolean;
  settings?: {
    policy: ReviewSettings["policy"];
    moderation: boolean;
    subRatings: ReviewEntitySettings;
  };
  reviews?: Review[];
  summary?: ReturnType<typeof summarizeReviews>;
  error?: string;
  code?: string;
}

interface Props {
  entityType: ReviewEntity;
  entityId: string;
  entityName?: string;
}

const dateFmt = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function Stars({
  value,
  size = 14,
  onChange,
  label,
}: {
  value: number;
  size?: number;
  onChange?: (value: number) => void;
  label?: string;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div
      className="inline-flex items-center gap-0.5"
      dir="ltr"
      role={onChange ? "radiogroup" : undefined}
      aria-label={label}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange?.(star)}
          className={onChange ? "transition hover:scale-110" : "cursor-default"}
          aria-label={`${star} من 5`}
        >
          <Star
            style={{ width: size, height: size }}
            className={
              star <= active
                ? "fill-gold-400 text-gold-400"
                : "fill-transparent text-sand-300"
            }
          />
        </button>
      ))}
    </div>
  );
}

function SummaryBar({
  value,
  count,
  total,
}: {
  value: number;
  count: number;
  total: number;
}) {
  const width = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 text-[10px] font-bold text-sand-600">{value}</span>
      <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-100">
        <span
          className="block h-full rounded-full bg-gold-400"
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="w-6 text-end text-[10px] font-bold text-sand-500">
        {count}
      </span>
    </div>
  );
}

export default function ReviewsSection({
  entityType,
  entityId,
  entityName,
}: Props) {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [subRatings, setSubRatings] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [reported, setReported] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/reviews?entity=${encodeURIComponent(
          entityType
        )}&id=${encodeURIComponent(entityId)}`,
        { cache: "no-store" }
      );
      const data = (await response.json().catch(() => ({}))) as ApiPayload;
      setPayload(data.ok ? data : { ok: false });
    } catch {
      setPayload({ ok: false });
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    setLoading(true);
    setPayload(null);
    setOpen(false);
    setRating(0);
    setComment("");
    setSuccess("");
    void load();
  }, [load]);

  const reviews = useMemo(() => payload?.reviews ?? [], [payload?.reviews]);
  const summary = useMemo(
    () => payload?.summary ?? summarizeReviews(reviews),
    [payload?.summary, reviews]
  );
  const subSettings = payload?.settings?.subRatings;
  const policy = payload?.settings?.policy ?? "open_verified";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSuccess("");
    if (!rating) {
      setFormError("اختر عدد النجوم أولًا");
      return;
    }
    if (name.trim().length < 2) {
      setFormError("اكتب اسمك (حرفان على الأقل)");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          name,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          rating,
          subRatings,
          comment: comment.trim() || undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok || !data.ok) {
        setFormError(data.error || "تعذر إرسال التقييم");
        return;
      }
      setSuccess(data.message || "تم إرسال تقييمك، شكرًا لك.");
      setOpen(false);
      setRating(0);
      setComment("");
      setSubRatings({});
      await load();
    } catch {
      setFormError("تعذر الاتصال بالخادم، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  const report = async (id: string) => {
    if (reported.includes(id)) return;
    setReported((current) => [...current, id]);
    try {
      await fetch(`/api/reviews/${encodeURIComponent(id)}/report`, {
        method: "POST",
      });
    } catch {
      /* يبقى الزر معطّلًا محليًا على أي حال */
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-sand-200 bg-white p-5">
        <div className="flex items-center gap-2 text-[12px] font-bold text-sand-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          جارٍ تحميل التقييمات...
        </div>
      </section>
    );
  }

  /* النظام غير مفعّل أو تعذر التحميل: لا نعرض قسمًا فارغًا */
  if (!payload?.ok) return null;

  return (
    <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[14px] font-black text-ocean-900">
            <Star className="h-4 w-4 fill-gold-400 text-gold-400" />
            تقييمات الزوار
            {entityName ? (
              <span className="text-[11px] font-bold text-sand-500">
                — {entityName}
              </span>
            ) : null}
          </h2>
          <p className="mt-1 text-[10.5px] leading-6 text-sand-500">
            التقييمات تعبّر عن تجربة الزوار، وشارة «موثّق» تعني أن صاحب التقييم
            تعامل فعليًا عبر المنصة.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((value) => !value);
            setFormError("");
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-ocean-950 px-4 py-2 text-[11.5px] font-bold text-white transition hover:bg-ocean-900"
        >
          {open ? <X className="h-3.5 w-3.5" /> : <MessageSquarePlus className="h-3.5 w-3.5" />}
          {open ? "إغلاق" : "أضف تقييمك"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 rounded-2xl border border-sand-100 bg-sand-50/40 p-4 sm:grid-cols-[150px_1fr]">
        <div className="text-center sm:text-start">
          <p className="text-3xl font-black text-ocean-950">
            {summary.count ? summary.average.toFixed(1) : "—"}
          </p>
          <div className="mt-1 flex justify-center sm:justify-start">
            <Stars value={Math.round(summary.average)} size={15} />
          </div>
          <p className="mt-1 text-[10.5px] font-bold text-sand-500">
            {summary.count
              ? `${summary.count} تقييم منشور`
              : "لا توجد تقييمات منشورة بعد"}
          </p>
        </div>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((value) => (
            <SummaryBar
              key={value}
              value={value}
              count={summary.distribution[value as 1 | 2 | 3 | 4 | 5]}
              total={summary.count}
            />
          ))}
        </div>
      </div>

      {subSettings?.enabled && Object.keys(summary.subAverages).length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {subSettings.items.map((item) => {
            const value = summary.subAverages[item.key];
            if (!value) return null;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between gap-2 rounded-xl border border-sand-100 bg-white px-3 py-2"
              >
                <span className="text-[10.5px] font-bold text-sand-700">
                  {item.label}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-black text-ocean-900">
                  {value.toFixed(1)}
                  <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <form
          onSubmit={submit}
          className="mt-4 space-y-3 rounded-2xl border border-gold-200 bg-gold-50/40 p-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11.5px] font-black text-ocean-900">
              تقييمك العام
            </span>
            <Stars value={rating} size={22} onChange={setRating} label="التقييم العام" />
            {rating > 0 && (
              <span className="text-[11px] font-bold text-gold-700">
                {rating} من 5
              </span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[10.5px] font-bold text-sand-700">
                الاسم
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-gold-400"
                placeholder="اسمك أو الاسم الأول"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10.5px] font-bold text-sand-700">
                الهاتف {policy === "verified_only" ? "(مطلوب للتحقق)" : "(اختياري للتوثيق)"}
              </span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                dir="ltr"
                className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-gold-400"
                placeholder="01xxxxxxxxx"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-[10.5px] font-bold text-sand-700">
                البريد الإلكتروني (اختياري للتوثيق)
              </span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                dir="ltr"
                className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-gold-400"
                placeholder="name@example.com"
              />
            </label>
          </div>

          {subSettings?.enabled && subSettings.items.length > 0 && (
            <div className="rounded-xl border border-sand-200 bg-white p-3">
              <p className="text-[10.5px] font-black text-ocean-900">
                تقييمات فرعية (اختيارية)
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {subSettings.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-[10.5px] font-bold text-sand-700">
                      {item.label}
                    </span>
                    <Stars
                      value={subRatings[item.key] ?? 0}
                      onChange={(value) =>
                        setSubRatings((current) => ({
                          ...current,
                          [item.key]: value,
                        }))
                      }
                      size={15}
                      label={item.label}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="mb-1 block text-[10.5px] font-bold text-sand-700">
              تعليقك (اختياري)
            </span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              maxLength={1200}
              className="w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-gold-400"
              placeholder="شاركنا تجربتك بالتفصيل..."
            />
          </label>

          <p className="text-[10px] leading-5 text-sand-500">
            {REVIEW_POLICY_NOTE[policy]}
          </p>

          {formError && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[11.5px] font-black text-ocean-950 transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {saving ? "جارٍ الإرسال..." : "إرسال التقييم"}
          </button>
        </form>
      )}

      {success && (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800">
          {success}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {reviews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-sand-200 bg-sand-50/50 px-4 py-6 text-center text-[11px] font-bold text-sand-500">
            كن أول من يشارك تجربته مع هذا العنصر.
          </p>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-sand-100 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-ocean-950 text-[10px] font-black text-white">
                    {review.name.slice(0, 1)}
                  </span>
                  <span className="text-[11.5px] font-black text-ocean-900">
                    {review.name}
                  </span>
                  {review.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                      <BadgeCheck className="h-2.5 w-2.5" />
                      تقييم موثّق
                    </span>
                  )}
                  <Stars value={review.rating} size={12} />
                </div>
                <span className="text-[9.5px] font-semibold text-sand-400">
                  {dateFmt.format(new Date(review.createdAt))}
                </span>
              </div>

              {review.comment && (
                <p className="mt-2 text-[11.5px] leading-7 text-sand-800">
                  {review.comment}
                </p>
              )}

              {review.adminReply && (
                <div className="mt-2 rounded-xl border border-ocean-900/10 bg-ocean-50/60 px-3 py-2">
                  <p className="text-[9.5px] font-black text-ocean-800">
                    رد إدارة المنصة
                  </p>
                  <p className="mt-0.5 text-[11px] leading-6 text-ocean-900">
                    {review.adminReply}
                  </p>
                </div>
              )}

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[9px] font-semibold text-sand-400">
                  {review.reportedCount > 0 ? "قيد المراجعة الإدارية" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => report(review.id)}
                  disabled={reported.includes(review.id)}
                  className="inline-flex items-center gap-1 text-[9.5px] font-bold text-sand-400 transition hover:text-rose-600 disabled:opacity-50"
                >
                  <Flag className="h-2.5 w-2.5" />
                  {reported.includes(review.id) ? "تم الإبلاغ" : "إبلاغ"}
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {reviews.length > 0 && (
        <p className="mt-3 text-[9px] text-sand-400">
          تُعرض التقييمات المنشورة فقط ({REVIEW_STATUS_LABEL.approved}).
        </p>
      )}
    </section>
  );
}
