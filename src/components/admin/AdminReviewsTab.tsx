"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  Loader2,
  MessageSquareReply,
  RefreshCw,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { addAdminLog } from "@/lib/admin-system";
import { getSession } from "@/lib/session";
import {
  REVIEW_ENTITY_LABEL,
  REVIEW_ENTITIES,
  REVIEW_POLICY_LABEL,
  REVIEW_POLICY_NOTE,
  REVIEW_STATUS_LABEL,
  normalizeReviewSettings,
  type Review,
  type ReviewEntity,
  type ReviewSettings,
  type ReviewStatus,
} from "@/lib/reviews";
import {
  BTN_GOLD,
  BTN_PRIMARY,
  INPUT,
  Panel,
  ROW_ACTION,
  ToggleRow,
} from "@/components/admin/shared";

interface Props {
  can: (key: string) => boolean;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

type WithContact = Review & { phone?: string; email?: string };

const dateFmt = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: "border border-amber-200 bg-amber-50 text-amber-700",
  approved: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border border-rose-200 bg-rose-50 text-rose-700",
};

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          style={{ width: size, height: size }}
          className={
            star <= value
              ? "fill-gold-400 text-gold-400"
              : "fill-transparent text-sand-300"
          }
        />
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sand-500">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-black text-ocean-950">{value}</p>
    </div>
  );
}

export default function AdminReviewsTab({ can, notify, reloadLogs }: Props) {
  const canManage = can("reviews.manage");
  const [reviews, setReviews] = useState<WithContact[]>([]);
  const [settings, setSettings] = useState<ReviewSettings>(() =>
    normalizeReviewSettings(null)
  );
  const [status, setStatus] = useState<ReviewStatus | "all">("all");
  const [entityFilter, setEntityFilter] = useState<ReviewEntity | "all">("all");
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const actor = useMemo(() => {
    const session = getSession();
    return {
      id: session?.email || "admin",
      name: session?.name || "الإدارة",
      role: session?.role || "admin",
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (status !== "all") params.set("status", status);
      if (entityFilter !== "all") params.set("entityType", entityFilter);
      const response = await fetch(`/api/admin/reviews?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        reviews?: WithContact[];
        settings?: ReviewSettings;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error || "تعذر تحميل التقييمات");
        setReviews([]);
        return;
      }
      setReviews(data.reviews ?? []);
      if (data.settings) {
        setSettings(normalizeReviewSettings(data.settings));
      }
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, [status, entityFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const approved = reviews.filter((item) => item.status === "approved");
    const pending = reviews.filter((item) => item.status === "pending").length;
    const reported = reviews.filter((item) => item.reportedCount > 0).length;
    const average = approved.length
      ? Math.round(
          (approved.reduce((sum, item) => sum + item.rating, 0) /
            approved.length) *
            10
        ) / 10
      : 0;
    return { pending, approved: approved.length, reported, average };
  }, [reviews]);

  const log = (action: string, details: string) => {
    addAdminLog({
      action,
      category: "reviews",
      performedBy: actor.id,
      performedByName: actor.name,
      performedByRole: actor.role,
      details,
    });
    reloadLogs();
  };

  const patchReview = async (
    review: WithContact,
    patch: { status?: ReviewStatus; adminReply?: string; verified?: boolean }
  ) => {
    if (!canManage) return;
    setBusy(review.id);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/reviews/${encodeURIComponent(review.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error || "تعذر تنفيذ العملية");
        return;
      }
      if (patch.status) {
        notify(
          `تم ${patch.status === "approved" ? "اعتماد" : patch.status === "rejected" ? "رفض" : "تحديث"} التقييم`
        );
        log(
          patch.status === "approved" ? "اعتماد تقييم" : "تحديث حالة تقييم",
          `«${review.name}» — ${REVIEW_STATUS_LABEL[patch.status]}`
        );
      }
      if (patch.adminReply !== undefined) {
        notify("تم حفظ رد الإدارة");
        log("رد على تقييم", `«${review.name}»`);
      }
      if (patch.verified !== undefined) {
        notify("تم تحديث حالة التوثيق");
      }
      await load();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setBusy(null);
    }
  };

  const removeReview = async (review: WithContact) => {
    if (!canManage) return;
    if (!window.confirm(`حذف تقييم «${review.name}» نهائيًا؟`)) return;
    setBusy(review.id);
    try {
      const response = await fetch(
        `/api/admin/reviews/${encodeURIComponent(review.id)}`,
        { method: "DELETE" }
      );
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error || "تعذر الحذف");
        return;
      }
      notify("تم حذف التقييم");
      log("حذف تقييم", `«${review.name}»`);
      await load();
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setBusy(null);
    }
  };

  const saveSettings = async () => {
    if (!canManage) return;
    setSavingSettings(true);
    setError("");
    try {
      const response = await fetch("/api/admin/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        settings?: ReviewSettings;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error || "تعذر حفظ الإعدادات");
        return;
      }
      if (data.settings) setSettings(normalizeReviewSettings(data.settings));
      notify("تم حفظ إعدادات التقييمات");
      log("تحديث إعدادات التقييمات", REVIEW_POLICY_LABEL[settings.policy]);
    } catch {
      setError("تعذر الاتصال بالخادم");
    } finally {
      setSavingSettings(false);
    }
  };

  const updateEntitySettings = (
    entity: ReviewEntity,
    updater: (current: ReviewSettings["subRatings"][ReviewEntity]) => ReviewSettings["subRatings"][ReviewEntity]
  ) => {
    setSettings((current) => ({
      ...current,
      subRatings: {
        ...current.subRatings,
        [entity]: updater(current.subRatings[entity]),
      },
    }));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="بانتظار المراجعة" value={stats.pending} />
        <Stat label="تقييمات منشورة" value={stats.approved} />
        <Stat label="متوسط التقييم" value={stats.average ? stats.average.toFixed(1) : "—"} />
        <Stat label="تقييمات عليها بلاغات" value={stats.reported} />
      </div>

      <Panel
        title="إعدادات نظام التقييم"
        desc="تحكّم كامل في من يحق له التقييم، وهل يُنشر فورًا أم بعد مراجعتك، والتقييمات الفرعية."
        actions={
          <button
            type="button"
            onClick={saveSettings}
            disabled={!canManage || savingSettings}
            className={BTN_GOLD}
          >
            {savingSettings ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            حفظ الإعدادات
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11.5px] font-black text-ocean-900">
              من يحق له إضافة تقييم؟
            </p>
            <div className="grid gap-2 lg:grid-cols-3">
              {(
                ["open_verified", "verified_only", "open"] as const
              ).map((policy) => (
                <label
                  key={policy}
                  className={`cursor-pointer rounded-2xl border p-3 transition ${
                    settings.policy === policy
                      ? "border-gold-400 bg-gold-50/60"
                      : "border-sand-200 bg-white hover:border-gold-200"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="review-policy"
                      checked={settings.policy === policy}
                      onChange={() =>
                        setSettings((current) => ({ ...current, policy }))
                      }
                      disabled={!canManage}
                      className="mt-1 accent-gold-500"
                    />
                    <span>
                      <span className="block text-[11.5px] font-black text-ocean-900">
                        {REVIEW_POLICY_LABEL[policy]}
                      </span>
                      <span className="mt-1 block text-[10px] leading-5 text-sand-600">
                        {REVIEW_POLICY_NOTE[policy]}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <ToggleRow
            title="مراجعة التقييم قبل النشر"
            hint="عند التفعيل يبقى التقييم مخفيًا حتى تعتمده الإدارة. عند الإيقاف يُنشر فورًا."
            checked={settings.moderation}
            onChange={(value) =>
              setSettings((current) => ({ ...current, moderation: value }))
            }
            disabled={!canManage}
          />

          <div className="space-y-3">
            <p className="text-[11.5px] font-black text-ocean-900">
              التقييمات الفرعية
            </p>
            {REVIEW_ENTITIES.map((entity) => {
              const entitySettings = settings.subRatings[entity];
              return (
                <div
                  key={entity}
                  className="rounded-2xl border border-sand-200 bg-sand-50/40 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-ocean-900">
                      {REVIEW_ENTITY_LABEL[entity]}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateEntitySettings(entity, (current) => ({
                          ...current,
                          enabled: !current.enabled,
                        }))
                      }
                      disabled={!canManage}
                      className={`rounded-full border px-3 py-1 text-[10px] font-black transition ${
                        entitySettings.enabled
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-sand-300 bg-white text-sand-500"
                      }`}
                    >
                      {entitySettings.enabled ? "مفعّلة" : "موقوفة"}
                    </button>
                  </div>
                  {entitySettings.enabled && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {entitySettings.items.map((item, index) => (
                        <input
                          key={item.key}
                          value={item.label}
                          maxLength={60}
                          disabled={!canManage}
                          onChange={(event) =>
                            updateEntitySettings(entity, (current) => ({
                              ...current,
                              items: current.items.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, label: event.target.value }
                                  : entry
                              ),
                            }))
                          }
                          className={`${INPUT} !py-1.5 text-[11px]`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      <Panel
        title="صندوق التقييمات"
        desc="اعتمد أو ارفض، اكتب ردًا رسميًا، أو احذف تقييمًا مخالفًا."
        actions={
          <button type="button" onClick={() => void load()} className={BTN_PRIMARY}>
            <RefreshCw className="h-3.5 w-3.5" /> تحديث
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "الكل"],
              ["pending", REVIEW_STATUS_LABEL.pending],
              ["approved", REVIEW_STATUS_LABEL.approved],
              ["rejected", REVIEW_STATUS_LABEL.rejected],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`rounded-full border px-3 py-1.5 text-[10.5px] font-black transition ${
                status === key
                  ? "border-ocean-950 bg-ocean-950 text-white"
                  : "border-sand-200 bg-white text-sand-700 hover:bg-sand-50"
              }`}
            >
              {label}
            </button>
          ))}
          <select
            value={entityFilter}
            onChange={(event) =>
              setEntityFilter(event.target.value as ReviewEntity | "all")
            }
            className={`${INPUT} ms-auto w-auto min-w-[140px] !py-1.5 text-[11px]`}
          >
            <option value="all">كل الأنواع</option>
            {REVIEW_ENTITIES.map((entity) => (
              <option key={entity} value={entity}>
                {REVIEW_ENTITY_LABEL[entity]}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">
            {error}
          </p>
        )}

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-[11px] font-bold text-sand-500">
            <Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل...
          </div>
        ) : reviews.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-sand-200 bg-sand-50/50 px-4 py-8 text-center text-[11.5px] font-bold text-sand-500">
            لا توجد تقييمات في هذا التصنيف.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-2xl border border-sand-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-black text-ocean-900">
                        {review.name}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${STATUS_STYLE[review.status]}`}>
                        {REVIEW_STATUS_LABEL[review.status]}
                      </span>
                      <span className="rounded-full border border-sand-200 bg-sand-50 px-2 py-0.5 text-[9px] font-bold text-sand-600">
                        {REVIEW_ENTITY_LABEL[review.entityType]}
                      </span>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                          <BadgeCheck className="h-2.5 w-2.5" /> موثّق
                        </span>
                      )}
                      {review.reportedCount > 0 && (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9px] font-black text-rose-700">
                          {review.reportedCount} بلاغ
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold text-sand-500">
                      <Stars value={review.rating} />
                      <span>{dateFmt.format(new Date(review.createdAt))}</span>
                      <span dir="ltr" className="truncate">
                        {review.entityId}
                      </span>
                    </div>
                    {review.phone && (
                      <p className="mt-1 text-[10px] font-semibold text-sand-500" dir="ltr">
                        {review.phone} {review.email ? `· ${review.email}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {review.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => void patchReview(review, { status: "approved" })}
                        disabled={!canManage || busy === review.id}
                        className={ROW_ACTION}
                      >
                        <Check className="h-3 w-3 text-emerald-600" /> اعتماد
                      </button>
                    )}
                    {review.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => void patchReview(review, { status: "rejected" })}
                        disabled={!canManage || busy === review.id}
                        className={ROW_ACTION}
                      >
                        <X className="h-3 w-3 text-rose-600" /> رفض
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        void patchReview(review, { verified: !review.verified })
                      }
                      disabled={!canManage || busy === review.id}
                      className={ROW_ACTION}
                    >
                      <ShieldCheck className="h-3 w-3 text-ocean-700" />
                      {review.verified ? "إلغاء التوثيق" : "توثيق"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeReview(review)}
                      disabled={!canManage || busy === review.id}
                      className={`${ROW_ACTION} !text-rose-700`}
                    >
                      <Trash2 className="h-3 w-3" /> حذف
                    </button>
                  </div>
                </div>

                {review.comment && (
                  <p className="mt-2 rounded-xl bg-sand-50 px-3 py-2 text-[11.5px] leading-7 text-sand-800">
                    {review.comment}
                  </p>
                )}

                <div className="mt-2 flex flex-col gap-1.5 sm:flex-row">
                  <input
                    value={replyDrafts[review.id] ?? review.adminReply ?? ""}
                    onChange={(event) =>
                      setReplyDrafts((current) => ({
                        ...current,
                        [review.id]: event.target.value,
                      }))
                    }
                    placeholder="رد رسمي على التقييم..."
                    maxLength={1200}
                    className={`${INPUT} text-[11px]`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void patchReview(review, {
                        adminReply:
                          replyDrafts[review.id] ?? review.adminReply ?? "",
                      })
                    }
                    disabled={!canManage || busy === review.id}
                    className={`${BTN_PRIMARY} shrink-0 !px-3`}
                  >
                    <MessageSquareReply className="h-3.5 w-3.5" /> حفظ الرد
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
