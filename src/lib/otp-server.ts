/**
 * OTP حقيقي على السيرفر فقط.
 *
 * - لا يُخزّن الكود أو البريد/الهاتف كنص صريح في PostgreSQL.
 * - القنوات المعطلة لا تنفذ أي اتصال بمزوّد خارجي ولا تُنشئ تكلفة.
 * - Email: Resend، SMS: Twilio، WhatsApp: Meta Cloud API.
 */

import {
  createHmac,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { cloudGetRows, cloudPutRow, cloudRest, CloudRestError } from "@/lib/cloud/server";
import { normalizeEmail } from "@/lib/auth/accounts";
import { normalizeEgyptPhone, toWhatsAppNumber } from "@/lib/phone";
import {
  DEFAULT_OTP_SETTINGS,
  OTP_CHANNELS,
  OTP_SETTINGS_KEY,
  normalizeOtpSettings,
  otpMessage,
  type OtpChannel,
  type OtpProviderStatuses,
  type OtpPurpose,
  type OtpSettings,
  type PublicOtpOptions,
} from "@/lib/otp";

export const OTP_PROOF_COOKIE = "aqaar_otp_verified";
export const OTP_PROOF_MAX_AGE = 10 * 60;

const TARGET_WINDOW_MS = 15 * 60 * 1000;
const TARGET_MAX_REQUESTS = 5;
const IP_WINDOW_MS = 60 * 60 * 1000;
const IP_MAX_REQUESTS = 20;

interface OtpChallengeRow {
  id: string;
  target_hash: string;
  target_hint: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  code_hash: string;
  ip_hash: string;
  expires_at: string;
  consumed_at: string | null;
  proof_used_at: string | null;
  attempts: number;
  max_attempts: number;
  created_at: string;
}

interface OtpVerifyRpcRow {
  result: "verified" | "invalid" | "expired" | "locked" | "already_used" | "not_found";
  verified_channel: OtpChannel | null;
  verified_purpose: OtpPurpose | null;
  verified_target_hash: string | null;
}

interface OtpProofPayload {
  challengeId: string;
  targetHash: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  exp: number;
}

export class OtpError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "OtpError";
    this.code = code;
    this.status = status;
  }
}

function otpSecret(): string {
  return (process.env.OTP_SECRET || process.env.ADMIN_SESSION_SECRET || "").trim();
}

function hmac(value: string, namespace: string): string {
  const secret = otpSecret();
  if (!secret) throw new OtpError("otp_not_configured", "مفتاح OTP غير مضبوط", 503);
  return createHmac("sha256", `${namespace}:${secret}`).update(value).digest("hex");
}

function targetHash(target: string): string {
  return hmac(target, "otp-target");
}

function ipHash(ip: string): string {
  return hmac(ip || "unknown", "otp-ip");
}

function codeHash(challengeId: string, code: string): string {
  return hmac(`${challengeId}:${code}`, "otp-code");
}

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function normalizedTarget(
  channel: OtpChannel,
  input: { email?: string; phone?: string }
): string {
  if (channel === "email") {
    const email = normalizeEmail(input.email || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      throw new OtpError("invalid_target", "البريد الإلكتروني غير صالح");
    }
    return email;
  }
  const local = normalizeEgyptPhone(input.phone || "");
  if (!local) throw new OtpError("invalid_target", "رقم الهاتف غير صالح");
  return `+20${local.slice(1)}`;
}

function maskTarget(channel: OtpChannel, target: string): string {
  if (channel === "email") {
    const [name, domain] = target.split("@");
    const visible = name.slice(0, Math.min(2, name.length));
    return `${visible}${"*".repeat(Math.max(3, name.length - visible.length))}@${domain}`;
  }
  return `${target.slice(0, 4)}******${target.slice(-3)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function otpProviderStatuses(): OtpProviderStatuses {
  const status = (
    provider: string,
    required: Array<[string, string | undefined]>
  ) => {
    const missing = required.filter(([, value]) => !value?.trim()).map(([name]) => name);
    return { configured: missing.length === 0, provider, missing };
  };
  return {
    email: status("Resend", [
      ["RESEND_API_KEY", process.env.RESEND_API_KEY],
      ["OTP_EMAIL_FROM", process.env.OTP_EMAIL_FROM],
    ]),
    sms: status("Twilio SMS", [
      ["TWILIO_ACCOUNT_SID", process.env.TWILIO_ACCOUNT_SID],
      ["TWILIO_AUTH_TOKEN", process.env.TWILIO_AUTH_TOKEN],
      ["TWILIO_SMS_FROM", process.env.TWILIO_SMS_FROM],
    ]),
    whatsapp: status("Meta WhatsApp Cloud API", [
      ["WHATSAPP_ACCESS_TOKEN", process.env.WHATSAPP_ACCESS_TOKEN],
      ["WHATSAPP_PHONE_NUMBER_ID", process.env.WHATSAPP_PHONE_NUMBER_ID],
      ["WHATSAPP_GRAPH_VERSION", process.env.WHATSAPP_GRAPH_VERSION],
    ]),
  };
}

export async function readOtpSettings(): Promise<OtpSettings> {
  try {
    const rows = await cloudGetRows({ keys: [OTP_SETTINGS_KEY], timeoutMs: 8_000 });
    return normalizeOtpSettings(rows.find((row) => row.key === OTP_SETTINGS_KEY)?.value);
  } catch {
    return normalizeOtpSettings(DEFAULT_OTP_SETTINGS);
  }
}

export async function otpSchemaReady(): Promise<boolean> {
  try {
    await cloudRest<Array<{ id: string }>>(
      "otp_challenges?select=id&limit=1"
    );
    return true;
  } catch {
    return false;
  }
}

export async function writeOtpSettings(
  value: unknown,
  actor: string
): Promise<OtpSettings> {
  const settings = normalizeOtpSettings(value);
  const providers = otpProviderStatuses();
  const enabled = OTP_CHANNELS.filter(
    (channel) => settings.channels[channel].enabled
  );
  const configuredEnabled = enabled.filter(
    (channel) => providers[channel].configured
  );
  if (
    settings.requiredForRegistration &&
    configuredEnabled.length === 0
  ) {
    throw new OtpError(
      "no_enabled_channel",
      "يجب ربط وتشغيل وسيلة تحقق واحدة على الأقل قبل فرض OTP",
      409
    );
  }
  if (settings.requiredForRegistration && !(await otpSchemaReady())) {
    throw new OtpError(
      "otp_schema_missing",
      "فعّل migration جدول OTP في Supabase أولًا",
      409
    );
  }
  await cloudPutRow(OTP_SETTINGS_KEY, settings, actor);
  return settings;
}

export async function publicOtpOptions(): Promise<PublicOtpOptions> {
  const [settings, providers] = await Promise.all([
    readOtpSettings(),
    Promise.resolve(otpProviderStatuses()),
  ]);
  const channels = OTP_CHANNELS.filter(
    (channel) =>
      settings.channels[channel].enabled && providers[channel].configured
  );
  return {
    required: settings.requiredForRegistration,
    allowUserChoice: settings.allowUserChoice,
    defaultChannel: channels.includes(settings.defaultChannel)
      ? settings.defaultChannel
      : channels[0] ?? null,
    channels,
    ttlMinutes: settings.ttlMinutes,
    resendSeconds: settings.resendSeconds,
  };
}

function providerError(provider: string, status: number, body: string): OtpError {
  console.error(`[OTP:${provider}] ${status} ${body.slice(0, 500)}`);
  return new OtpError(
    "delivery_failed",
    "تعذر إرسال كود التحقق حاليًا. حاول بعد قليل.",
    502
  );
}

async function sendEmail(
  target: string,
  code: string,
  settings: OtpSettings
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY || "";
  const configuredFrom = process.env.OTP_EMAIL_FROM || "";
  const from = configuredFrom.includes("<")
    ? configuredFrom
    : `${settings.email.fromName} <${configuredFrom}>`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [target],
      subject: settings.email.subjectAr,
      text: `كود التحقق في عقار FAMILY هو ${code}. صالح لمدة ${settings.ttlMinutes} دقائق. لا تشارك هذا الكود مع أي شخص.`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#142033"><h2>${escapeHtml(
        settings.email.fromName
      )}</h2><p>استخدم الكود التالي لإكمال التحقق:</p><div style="font-size:32px;font-weight:800;letter-spacing:8px;padding:18px;background:#f7f4ed;border-radius:14px;text-align:center">${code}</div><p>الكود صالح لمدة ${settings.ttlMinutes} دقائق ويُستخدم مرة واحدة فقط.</p><p style="color:#777">لا تشارك هذا الكود مع أي شخص. إدارة عقار FAMILY لن تطلبه منك.</p></div>`,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw providerError("resend", response.status, await response.text());
  }
}

async function sendSms(
  target: string,
  code: string,
  settings: OtpSettings
): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID || "";
  const token = process.env.TWILIO_AUTH_TOKEN || "";
  const body = new URLSearchParams({
    To: target,
    From: process.env.TWILIO_SMS_FROM || "",
    Body: otpMessage(settings.sms.messageAr, code, settings.ttlMinutes),
  });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    }
  );
  if (!response.ok) {
    throw providerError("twilio", response.status, await response.text());
  }
}

async function sendWhatsApp(
  target: string,
  code: string,
  settings: OtpSettings
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || "";
  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toWhatsAppNumber(target) || target.replace(/\D/g, ""),
        type: "template",
        template: {
          name: settings.whatsapp.templateName,
          language: { code: settings.whatsapp.languageCode },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: code }],
            },
          ],
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    }
  );
  if (!response.ok) {
    throw providerError("whatsapp", response.status, await response.text());
  }
}

async function deliver(
  channel: OtpChannel,
  target: string,
  code: string,
  settings: OtpSettings
): Promise<void> {
  if (channel === "email") return sendEmail(target, code, settings);
  if (channel === "sms") return sendSms(target, code, settings);
  return sendWhatsApp(target, code, settings);
}

function schemaError(error: unknown): boolean {
  return (
    error instanceof CloudRestError &&
    (error.status === 404 || /otp_challenges|verify_otp_challenge/i.test(error.body))
  );
}

export async function createOtpChallenge(input: {
  request: Request;
  channel: OtpChannel;
  purpose: OtpPurpose;
  email?: string;
  phone?: string;
}): Promise<{
  challengeId: string;
  maskedTarget: string;
  expiresAt: string;
  resendAfter: string;
}> {
  const settings = await readOtpSettings();
  const providers = otpProviderStatuses();
  if (!settings.channels[input.channel].enabled) {
    throw new OtpError("channel_disabled", "وسيلة التحقق غير مفعلة", 409);
  }
  if (!providers[input.channel].configured) {
    throw new OtpError("provider_not_configured", "وسيلة التحقق غير مربوطة بعد", 503);
  }
  const target = normalizedTarget(input.channel, input);
  const targetDigest = targetHash(target);
  const ipDigest = ipHash(clientIp(input.request));
  const now = Date.now();
  const targetSince = new Date(now - TARGET_WINDOW_MS).toISOString();
  const ipSince = new Date(now - IP_WINDOW_MS).toISOString();
  const targetQuery = new URLSearchParams({
    select: "id,created_at",
    target_hash: `eq.${targetDigest}`,
    created_at: `gte.${targetSince}`,
    order: "created_at.desc",
    limit: String(TARGET_MAX_REQUESTS + 1),
  });
  const ipQuery = new URLSearchParams({
    select: "id",
    ip_hash: `eq.${ipDigest}`,
    created_at: `gte.${ipSince}`,
    limit: String(IP_MAX_REQUESTS + 1),
  });

  try {
    const [targetRows, ipRows] = await Promise.all([
      cloudRest<Array<{ id: string; created_at: string }>>(
        `otp_challenges?${targetQuery.toString()}`
      ),
      cloudRest<Array<{ id: string }>>(`otp_challenges?${ipQuery.toString()}`),
    ]);
    if (targetRows.length >= TARGET_MAX_REQUESTS || ipRows.length >= IP_MAX_REQUESTS) {
      throw new OtpError(
        "rate_limited",
        "تم تجاوز عدد محاولات الإرسال. حاول لاحقًا.",
        429
      );
    }
    const latestAt = targetRows[0]?.created_at
      ? Date.parse(targetRows[0].created_at)
      : 0;
    if (latestAt && now - latestAt < settings.resendSeconds * 1000) {
      throw new OtpError(
        "resend_wait",
        `انتظر ${settings.resendSeconds} ثانية قبل إعادة الإرسال`,
        429
      );
    }

    const challengeId = randomUUID();
    const code = String(randomInt(100000, 1_000_000));
    const expiresAt = new Date(now + settings.ttlMinutes * 60_000).toISOString();
    const row: OtpChallengeRow = {
      id: challengeId,
      target_hash: targetDigest,
      target_hint: maskTarget(input.channel, target),
      channel: input.channel,
      purpose: input.purpose,
      code_hash: codeHash(challengeId, code),
      ip_hash: ipDigest,
      expires_at: expiresAt,
      consumed_at: null,
      proof_used_at: null,
      attempts: 0,
      max_attempts: settings.maxAttempts,
      created_at: new Date(now).toISOString(),
    };
    await cloudRest<OtpChallengeRow[]>("otp_challenges", {
      method: "POST",
      body: row,
      prefer: "return=representation",
    });
    try {
      await deliver(input.channel, target, code, settings);
    } catch (error) {
      await cloudRest(
        `otp_challenges?id=eq.${encodeURIComponent(challengeId)}`,
        { method: "DELETE" }
      ).catch(() => undefined);
      throw error;
    }
    return {
      challengeId,
      maskedTarget: row.target_hint,
      expiresAt,
      resendAfter: new Date(now + settings.resendSeconds * 1000).toISOString(),
    };
  } catch (error) {
    if (error instanceof OtpError) throw error;
    if (schemaError(error)) {
      throw new OtpError(
        "otp_schema_missing",
        "جدول OTP غير مفعّل في قاعدة البيانات",
        503
      );
    }
    throw error;
  }
}

export async function verifyOtpChallenge(input: {
  challengeId: string;
  code: string;
  email?: string;
  phone?: string;
}): Promise<OtpProofPayload> {
  if (!/^[0-9a-f-]{36}$/i.test(input.challengeId) || !/^\d{6}$/.test(input.code)) {
    throw new OtpError("invalid_code", "كود التحقق غير صحيح");
  }
  const lookup = new URLSearchParams({
    select: "channel,purpose",
    id: `eq.${input.challengeId}`,
    limit: "1",
  });
  try {
    const rows = await cloudRest<Array<{ channel: OtpChannel; purpose: OtpPurpose }>>(
      `otp_challenges?${lookup.toString()}`
    );
    const challenge = rows[0];
    if (!challenge) throw new OtpError("invalid_code", "كود التحقق غير صحيح");
    const target = normalizedTarget(challenge.channel, input);
    const digest = targetHash(target);
    const verified = await cloudRest<OtpVerifyRpcRow[]>(
      "rpc/verify_otp_challenge",
      {
        method: "POST",
        body: {
          p_id: input.challengeId,
          p_code_hash: codeHash(input.challengeId, input.code),
          p_target_hash: digest,
        },
      }
    );
    const result = verified[0];
    if (!result || result.result !== "verified") {
      const messages: Record<string, string> = {
        expired: "انتهت صلاحية الكود. اطلب كودًا جديدًا.",
        locked: "تم تجاوز عدد المحاولات. اطلب كودًا جديدًا.",
        already_used: "تم استخدام هذا الكود من قبل.",
      };
      throw new OtpError(
        result?.result || "invalid_code",
        messages[result?.result || ""] || "كود التحقق غير صحيح",
        result?.result === "locked" ? 429 : 400
      );
    }
    return {
      challengeId: input.challengeId,
      targetHash: result.verified_target_hash || digest,
      channel: result.verified_channel || challenge.channel,
      purpose: result.verified_purpose || challenge.purpose,
      exp: Math.floor(Date.now() / 1000) + OTP_PROOF_MAX_AGE,
    };
  } catch (error) {
    if (error instanceof OtpError) throw error;
    if (schemaError(error)) {
      throw new OtpError("otp_schema_missing", "نظام OTP غير مفعّل", 503);
    }
    throw error;
  }
}

function base64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

export function createOtpProofToken(payload: OtpProofPayload): string {
  const body = base64Url(JSON.stringify(payload));
  const signature = hmac(body, "otp-proof");
  return `${body}.${signature}`;
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function readOtpProofToken(token: string | null | undefined): OtpProofPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  try {
    if (!safeEqual(hmac(body, "otp-proof"), signature)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<OtpProofPayload>;
    if (
      !payload.challengeId ||
      !payload.targetHash ||
      !payload.channel ||
      !payload.purpose ||
      typeof payload.exp !== "number" ||
      payload.exp * 1000 <= Date.now()
    ) return null;
    return payload as OtpProofPayload;
  } catch {
    return null;
  }
}

export function otpProofMatchesRegistration(
  proof: OtpProofPayload,
  input: { email: string; phone: string }
): boolean {
  if (proof.purpose !== "registration") return false;
  try {
    return (
      targetHash(
        normalizedTarget(proof.channel, {
          email: input.email,
          phone: input.phone,
        })
      ) === proof.targetHash
    );
  } catch {
    return false;
  }
}

export async function consumeOtpRegistrationProof(
  proof: OtpProofPayload
): Promise<boolean> {
  try {
    const result = await cloudRest<boolean>("rpc/consume_otp_registration_proof", {
      method: "POST",
      body: {
        p_id: proof.challengeId,
        p_target_hash: proof.targetHash,
      },
    });
    return result === true;
  } catch (error) {
    if (schemaError(error)) {
      throw new OtpError("otp_schema_missing", "نظام OTP غير مفعّل", 503);
    }
    throw error;
  }
}
