import { createHash } from "node:crypto";
import { cloudEnabled, cloudRest } from "@/lib/cloud/server";

/**
 * حد معدل مشترك بين كل نسخ السيرفر (Vercel Serverless) عبر Supabase،
 * مع بديل محلي في الذاكرة إذا كانت قاعدة البيانات غير متاحة.
 *
 * لا نخزّن IP أو بريدًا صريحًا: المفتاح يُمرَّر بعد التجزئة.
 */

export interface RateLimitOptions {
  /** أقصى عدد طلبات مسموح داخل النافذة */
  limit: number;
  /** طول النافذة بالثواني */
  windowSeconds: number;
  /** مسارات الدخول الحساسة تُرفض إذا تعطل العداد المشترك. */
  failClosed?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  /** ثوانٍ حتى تُصفَّر النافذة — تُستخدم في ترويسة Retry-After */
  retryAfterSeconds: number;
  unavailable?: boolean;
}

const memory = new Map<string, { count: number; resetAt: number }>();
const MEMORY_MAX_KEYS = 2000;

function memoryLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  const entry = memory.get(key);

  if (!entry || entry.resetAt <= now) {
    if (memory.size >= MEMORY_MAX_KEYS) {
      for (const [candidate, value] of memory) {
        if (value.resetAt <= now) memory.delete(candidate);
      }
      if (memory.size >= MEMORY_MAX_KEYS) memory.clear();
    }
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: options.windowSeconds };
  }

  entry.count += 1;
  return {
    allowed: entry.count <= options.limit,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

/** يجزّئ أي معرّف (IP/بريد) قبل تخزينه كمفتاح */
export function hashRateKey(scope: string, value: string): string {
  return createHash("sha256").update(`${scope}:${value}`).digest("hex");
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "local";
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const safeKey = key.slice(0, 200);

  if (cloudEnabled()) {
    try {
      const allowed = await cloudRest<boolean>("rpc/bump_rate_limit", {
        method: "POST",
        body: {
          p_key: safeKey,
          p_limit: options.limit,
          p_window_seconds: options.windowSeconds,
        },
        timeoutMs: 4000,
      });
      return {
        allowed: allowed === true,
        retryAfterSeconds: options.windowSeconds,
      };
    } catch {
      if (options.failClosed) {
        return {
          allowed: false,
          unavailable: true,
          retryAfterSeconds: Math.min(options.windowSeconds, 60),
        };
      }
      /* الطلبات العامة تستمر بحد محلي عند انقطاع عابر. */
    }
  }

  return memoryLimit(safeKey, options);
}

/** يبني رد 429 موحّدًا مع ترويسة إعادة المحاولة */
export function rateLimitResponse(result: RateLimitResult, message: string) {
  const unavailable = result.unavailable === true;
  return new Response(JSON.stringify({
    ok: false,
    error: unavailable ? "rate_limit_unavailable" : "rate_limited",
    message: unavailable
      ? "خدمة الحماية غير متاحة مؤقتًا. حاول بعد قليل."
      : message,
  }), {
    status: unavailable ? 503 : 429,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Retry-After": String(result.retryAfterSeconds),
      "Cache-Control": "no-store",
    },
  });
}
