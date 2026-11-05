"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { useRatingSummary } from "@/lib/review-summaries";
import type { ReviewEntity } from "@/lib/reviews";

interface Props {
  entityType: ReviewEntity;
  entityId: string;
  href?: string;
  className?: string;
}

const STAR_BASE = "h-3.5 w-3.5";

function Stars({ filled }: { filled: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" dir="ltr" aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${STAR_BASE} ${
            star <= filled
              ? "fill-gold-400 text-gold-400"
              : "fill-transparent text-gold-300"
          }`}
        />
      ))}
    </span>
  );
}

/** شارة نجوم مختصرة لبطاقات العقارات والمهنيين */
export default function RatingBadge({
  entityType,
  entityId,
  href,
  className = "",
}: Props) {
  const summary = useRatingSummary(entityType, entityId);
  const count = summary?.count ?? 0;
  const average = summary?.average ?? 0;
  const loading = summary === undefined;

  const body =
    count > 0 ? (
      <>
        <Stars filled={Math.round(average)} />
        <span className="text-[11px] font-black text-ocean-900">
          {average.toFixed(1)}
        </span>
        <span className="text-[10px] font-semibold text-sand-500">
          ({count} تقييم)
        </span>
      </>
    ) : (
      <>
        <Stars filled={0} />
        <span className="text-[10px] font-bold text-sand-500">
          {loading ? "جارٍ تحميل التقييم" : "كن أول من يقيّم"}
        </span>
      </>
    );

  const classes = `inline-flex items-center gap-1.5 ${className}`;
  const label =
    count > 0
      ? `تقييم ${average.toFixed(1)} من 5 من ${count} تقييم`
      : "لا توجد تقييمات بعد";

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label} title={label}>
        {body}
      </Link>
    );
  }
  return (
    <span className={classes} aria-label={label} title={label}>
      {body}
    </span>
  );
}
