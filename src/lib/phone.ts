/**
 * تحقق موحّد من أرقام الموبايل المصرية.
 * كل الصفحات (التسجيل، الانضمام، الدليل، طلبات التواصل) تستخدم هذه الدالة
 * حتى لا تقبل صفحة أرقاماً ترفضها صفحة أخرى.
 */

const EGYPT_MOBILE = /^01[0125]\d{8}$/;

/** 01xxxxxxxxx — يقبل أيضاً 201... و00201... والمسافات والشرطات */
export function normalizeEgyptPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  let local = digits;
  if (local.startsWith("0020")) local = local.slice(4);
  else if (local.startsWith("20")) local = local.slice(2);
  /* رقم محلي بلا صفر بادئ: 1xxxxxxxxx */
  if (local.length === 10 && local.startsWith("1")) local = `0${local}`;
  return EGYPT_MOBILE.test(local) ? local : null;
}

export function isValidEgyptPhone(raw: string): boolean {
  return normalizeEgyptPhone(raw) !== null;
}

/** صيغة واتساب الدولية بلا علامة + */
export function toWhatsAppNumber(raw: string): string | null {
  const local = normalizeEgyptPhone(raw);
  return local ? `20${local.slice(1)}` : null;
}
