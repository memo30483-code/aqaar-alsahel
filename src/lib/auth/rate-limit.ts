/**
 * حد محاولات بسيط داخل ذاكرة العملية — يكفي لحماية واجهات الدخول/التسجيل
 * من المحاولات المتكررة. لا يعتمد على أي خدمة خارجية.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Entry>();
const MAX_ENTRIES = 5_000;

export interface RateLimitOptions {
  /** اسم المجموعة حتى لا تتداخل العدادات بين الواجهات */
  scope: string;
  /** أقصى عدد محاولات داخل النافذة */
  max: number;
  /** طول النافذة بالمللي ثانية */
  windowMs: number;
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "local";
}

export function isRateLimited(key: string, options: RateLimitOptions): boolean {
  const bucket = `${options.scope}:${key}`;
  const now = Date.now();
  const entry = buckets.get(bucket);
  if (!entry || entry.resetAt <= now) return false;
  return entry.count >= options.max;
}

export function recordAttempt(key: string, options: RateLimitOptions): void {
  const bucket = `${options.scope}:${key}`;
  const now = Date.now();
  const entry = buckets.get(bucket);

  if (!entry || entry.resetAt <= now) {
    if (buckets.size > MAX_ENTRIES) buckets.clear();
    buckets.set(bucket, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  entry.count += 1;
}

export function clearAttempts(key: string, options: RateLimitOptions): void {
  buckets.delete(`${options.scope}:${key}`);
}
