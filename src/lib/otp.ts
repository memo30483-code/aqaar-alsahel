/** إعدادات وقنوات OTP المشتركة بين السيرفر ولوحة الإدارة. */

export const OTP_SETTINGS_KEY = "aqaar-otp-settings";

export const OTP_CHANNELS = ["email", "sms", "whatsapp"] as const;
export type OtpChannel = (typeof OTP_CHANNELS)[number];
export type OtpPurpose = "registration" | "login" | "recovery";

export const OTP_CHANNEL_LABEL: Record<OtpChannel, string> = {
  email: "البريد الإلكتروني",
  sms: "رسالة SMS",
  whatsapp: "واتساب",
};

export interface OtpChannelSettings {
  enabled: boolean;
}

export interface OtpSettings {
  version: 1;
  /** لا يُفعّل إلا بعد ربط مزود البريد واختباره. */
  requiredForRegistration: boolean;
  allowUserChoice: boolean;
  defaultChannel: OtpChannel;
  channels: Record<OtpChannel, OtpChannelSettings>;
  ttlMinutes: number;
  maxAttempts: number;
  resendSeconds: number;
  email: {
    fromName: string;
    subjectAr: string;
  };
  sms: {
    messageAr: string;
  };
  whatsapp: {
    templateName: string;
    languageCode: string;
  };
}

export interface OtpProviderStatus {
  configured: boolean;
  provider: string;
  missing: string[];
}

export type OtpProviderStatuses = Record<OtpChannel, OtpProviderStatus>;

export interface PublicOtpOptions {
  required: boolean;
  allowUserChoice: boolean;
  defaultChannel: OtpChannel | null;
  channels: OtpChannel[];
  ttlMinutes: number;
  resendSeconds: number;
}

export const DEFAULT_OTP_SETTINGS: OtpSettings = {
  version: 1,
  /* التسجيل يفشل مغلقًا بلا إثبات بريد؛ يجب ضبط Resend قبل فتح التسجيل. */
  requiredForRegistration: true,
  allowUserChoice: false,
  defaultChannel: "email",
  channels: {
    email: { enabled: true },
    sms: { enabled: false },
    whatsapp: { enabled: false },
  },
  ttlMinutes: 5,
  maxAttempts: 5,
  resendSeconds: 60,
  email: {
    fromName: "عقار FAMILY",
    subjectAr: "كود التحقق من عقار FAMILY",
  },
  sms: {
    messageAr: "كود التحقق في عقار FAMILY هو: {{code}} — صالح لمدة {{minutes}} دقائق.",
  },
  whatsapp: {
    templateName: "aqaar_otp",
    languageCode: "ar",
  },
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function boundedNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number)
    ? Math.min(max, Math.max(min, Math.round(number)))
    : fallback;
}

function cleanText(value: unknown, fallback: string, max: number): string {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : fallback;
}

export function isOtpChannel(value: unknown): value is OtpChannel {
  return typeof value === "string" && (OTP_CHANNELS as readonly string[]).includes(value);
}

export function normalizeOtpSettings(value: unknown): OtpSettings {
  const source = objectValue(value);
  const channels = objectValue(source.channels);
  const email = objectValue(source.email);
  const sms = objectValue(source.sms);
  const whatsapp = objectValue(source.whatsapp);
  const normalized: OtpSettings = {
    version: 1,
    requiredForRegistration:
      typeof source.requiredForRegistration === "boolean"
        ? source.requiredForRegistration
        : DEFAULT_OTP_SETTINGS.requiredForRegistration,
    allowUserChoice:
      typeof source.allowUserChoice === "boolean"
        ? source.allowUserChoice
        : DEFAULT_OTP_SETTINGS.allowUserChoice,
    defaultChannel: isOtpChannel(source.defaultChannel)
      ? source.defaultChannel
      : DEFAULT_OTP_SETTINGS.defaultChannel,
    channels: {
      email: {
        enabled:
          objectValue(channels.email).enabled === true ||
          (objectValue(channels.email).enabled === undefined &&
            DEFAULT_OTP_SETTINGS.channels.email.enabled),
      },
      sms: { enabled: objectValue(channels.sms).enabled === true },
      whatsapp: { enabled: objectValue(channels.whatsapp).enabled === true },
    },
    ttlMinutes: boundedNumber(
      source.ttlMinutes,
      DEFAULT_OTP_SETTINGS.ttlMinutes,
      3,
      15
    ),
    maxAttempts: boundedNumber(
      source.maxAttempts,
      DEFAULT_OTP_SETTINGS.maxAttempts,
      3,
      10
    ),
    resendSeconds: boundedNumber(
      source.resendSeconds,
      DEFAULT_OTP_SETTINGS.resendSeconds,
      30,
      300
    ),
    email: {
      fromName: cleanText(
        email.fromName,
        DEFAULT_OTP_SETTINGS.email.fromName,
        100
      ),
      subjectAr: cleanText(
        email.subjectAr,
        DEFAULT_OTP_SETTINGS.email.subjectAr,
        180
      ),
    },
    sms: {
      messageAr: cleanText(
        sms.messageAr,
        DEFAULT_OTP_SETTINGS.sms.messageAr,
        500
      ),
    },
    whatsapp: {
      templateName: cleanText(
        whatsapp.templateName,
        DEFAULT_OTP_SETTINGS.whatsapp.templateName,
        120
      ),
      languageCode: cleanText(
        whatsapp.languageCode,
        DEFAULT_OTP_SETTINGS.whatsapp.languageCode,
        20
      ),
    },
  };

  if (!normalized.channels[normalized.defaultChannel].enabled) {
    normalized.defaultChannel =
      OTP_CHANNELS.find((channel) => normalized.channels[channel].enabled) ??
      "email";
  }
  return normalized;
}

export function otpMessage(
  template: string,
  code: string,
  minutes: number
): string {
  return template
    .replace(/\{\{code\}\}/g, code)
    .replace(/\{\{minutes\}\}/g, String(minutes));
}
