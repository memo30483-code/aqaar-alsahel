/**
 * طبقة التقييمات — للسيرفر فقط (service_role).
 *
 * جداول التقييمات مغلقة بـRLS، وكل وصول يمر عبر Route Handlers محمية.
 */

import { cloudRest, CloudRestError } from "@/lib/cloud/server";
import {
  clampRating,
  normalizeReviewSettings,
  type Review,
  type ReviewEntity,
  type ReviewSettings,
  type ReviewStatus,
} from "@/lib/reviews";

interface ReviewRow {
  id: string;
  entity_type: string;
  entity_id: string;
  reviewer_device: string;
  reviewer_name: string;
  reviewer_phone: string | null;
  reviewer_email: string | null;
  rating: number | string;
  sub_ratings: Record<string, unknown> | null;
  comment: string | null;
  status: string;
  verified: boolean;
  admin_reply: string | null;
  reported_count: number | string;
  created_at: string;
  updated_at: string;
}

interface ReviewSettingsRow {
  id: string;
  policy: string;
  moderation: boolean;
  sub_ratings: unknown;
}

function query(resource: string, params: Record<string, string>): string {
  return `${resource}?${new URLSearchParams(params).toString()}`;
}

function toReview(row: ReviewRow): Review {
  const subRatings: Record<string, number> = {};
  if (row.sub_ratings && typeof row.sub_ratings === "object") {
    for (const [key, value] of Object.entries(row.sub_ratings)) {
      const rating = clampRating(value);
      if (rating) subRatings[key] = rating;
    }
  }
  return {
    id: row.id,
    entityType: row.entity_type as ReviewEntity,
    entityId: row.entity_id,
    name: row.reviewer_name || "زائر",
    rating: clampRating(row.rating) || 5,
    subRatings,
    comment: row.comment || undefined,
    status: row.status as ReviewStatus,
    verified: row.verified === true,
    adminReply: row.admin_reply || undefined,
    reportedCount: Number(row.reported_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function reviewSchemaMissing(error: unknown): boolean {
  return (
    error instanceof CloudRestError &&
    (error.status === 404 ||
      error.body.includes("PGRST205") ||
      error.body.includes("reviews"))
  );
}

export function reviewDuplicate(error: unknown): boolean {
  return (
    error instanceof CloudRestError &&
    (error.status === 409 || error.body.includes("23505"))
  );
}

export async function cloudGetReviewSettings(): Promise<ReviewSettings> {
  const rows = await cloudRest<ReviewSettingsRow[]>(
    query("review_settings", { select: "*", id: "eq.main", limit: "1" })
  );
  return normalizeReviewSettings(rows[0] ?? null);
}

export async function cloudSaveReviewSettings(
  settings: ReviewSettings,
  actor: string
): Promise<ReviewSettings> {
  await cloudRest<ReviewSettingsRow[]>(
    query("review_settings", { id: "eq.main", select: "id" }),
    {
      method: "PATCH",
      prefer: "return=representation",
      body: {
        policy: settings.policy,
        moderation: settings.moderation,
        sub_ratings: settings.subRatings,
        updated_at: new Date().toISOString(),
        updated_by: actor,
      },
    }
  );
  return cloudGetReviewSettings();
}

export async function cloudGetApprovedReviews(
  entityType: ReviewEntity,
  entityId: string,
  limit = 60
): Promise<Review[]> {
  const rows = await cloudRest<ReviewRow[]>(
    query("reviews", {
      select: "*",
      entity_type: `eq.${entityType}`,
      entity_id: `eq.${entityId}`,
      status: "eq.approved",
      order: "created_at.desc",
      limit: String(Math.min(Math.max(limit, 1), 200)),
    })
  );
  return rows.map(toReview);
}

export interface NewReviewInput {
  entityType: ReviewEntity;
  entityId: string;
  device: string;
  name: string;
  phone?: string;
  email?: string;
  rating: number;
  subRatings: Record<string, number>;
  comment?: string;
  verified: boolean;
  moderation: boolean;
}

export async function cloudCreateReview(
  input: NewReviewInput
): Promise<Review> {
  const rows = await cloudRest<ReviewRow[]>("reviews", {
    method: "POST",
    prefer: "return=representation",
    body: {
      entity_type: input.entityType,
      entity_id: input.entityId,
      reviewer_device: input.device,
      reviewer_name: input.name,
      reviewer_phone: input.phone || null,
      reviewer_email: input.email || null,
      rating: input.rating,
      sub_ratings: input.subRatings,
      comment: input.comment || null,
      status: input.moderation ? "pending" : "approved",
      verified: input.verified,
    },
  });
  const row = rows[0];
  if (!row) throw new Error("تعذر حفظ التقييم");
  return toReview(row);
}

/** هل الرقم/البريد يطابق عميلًا مسجلًا في CRM؟ */
export async function cloudCheckVerified(
  phone?: string,
  email?: string
): Promise<boolean> {
  const digits = (phone ?? "").replace(/\D/g, "");
  const normalizedPhone = digits.length > 10 ? digits.slice(-10) : digits;
  const normalizedEmail = (email ?? "").trim().toLowerCase();

  if (!normalizedPhone && !normalizedEmail) return false;

  const filters: string[] = [];
  if (normalizedPhone) {
    filters.push(`phone_normalized.eq.${normalizedPhone}`);
  }
  if (normalizedEmail) {
    filters.push(`email_normalized.eq.${normalizedEmail}`);
  }

  const rows = await cloudRest<{ id: string }[]>(
    query("crm_leads", {
      select: "id",
      or: `(${filters.join(",")})`,
      limit: "1",
    })
  );
  return rows.length > 0;
}

export interface AdminReviewFilters {
  status?: ReviewStatus | "all";
  entityType?: ReviewEntity | "all";
  limit?: number;
}

export async function cloudGetAdminReviews(
  filters: AdminReviewFilters = {}
): Promise<(Review & { phone?: string; email?: string })[]> {
  const params: Record<string, string> = {
    select: "*",
    order: "created_at.desc",
    limit: String(Math.min(Math.max(filters.limit ?? 300, 1), 500)),
  };
  if (filters.status && filters.status !== "all") {
    params.status = `eq.${filters.status}`;
  }
  if (filters.entityType && filters.entityType !== "all") {
    params.entity_type = `eq.${filters.entityType}`;
  }
  const rows = await cloudRest<ReviewRow[]>(query("reviews", params));
  return rows.map((row) => ({
    ...toReview(row),
    phone: row.reviewer_phone || undefined,
    email: row.reviewer_email || undefined,
  }));
}

export interface AdminReviewPatch {
  status?: ReviewStatus;
  adminReply?: string;
  verified?: boolean;
}

export async function cloudUpdateReview(
  id: string,
  patch: AdminReviewPatch
): Promise<Review | null> {
  const body: Record<string, unknown> = {};
  if (patch.status !== undefined) body.status = patch.status;
  if (patch.adminReply !== undefined) {
    body.admin_reply = patch.adminReply.trim() ? patch.adminReply : null;
  }
  if (patch.verified !== undefined) body.verified = patch.verified;

  const rows = await cloudRest<ReviewRow[]>(
    query("reviews", { id: `eq.${id}`, select: "*" }),
    {
      method: "PATCH",
      prefer: "return=representation",
      body,
    }
  );
  return rows[0] ? toReview(rows[0]) : null;
}

export async function cloudDeleteReview(id: string): Promise<boolean> {
  const rows = await cloudRest<ReviewRow[]>(
    query("reviews", { id: `eq.${id}`, select: "id" }),
    { method: "DELETE", prefer: "return=representation" }
  );
  return rows.length > 0;
}

export async function cloudReportReview(id: string): Promise<number> {
  return cloudRest<number>("rpc/review_report", {
    method: "POST",
    body: { p_id: id },
  });
}
