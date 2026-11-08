/** إعدادات زر واتساب الثابت — مشتركة بين الواجهة ولوحة الإدارة. */
export interface WhatsAppWidgetSettings {
  enabled: boolean;
  /** رقم مستقل للزر؛ إذا كان فارغًا نستخدم واتساب/هاتف الإدارة العام. */
  phone: string;
  labelAr: string;
  labelEn: string;
  messageAr: string;
  messageEn: string;
  showLabel: boolean;
  pulse: boolean;
}

export const DEFAULT_WHATSAPP_WIDGET_SETTINGS: WhatsAppWidgetSettings = {
  enabled: true,
  phone: "",
  labelAr: "تواصل مباشر مع الإدارة",
  labelEn: "Chat with management",
  messageAr: "مرحبًا، أريد التواصل مع إدارة عقار FAMILY.",
  messageEn: "Hello, I would like to contact Aqaar FAMILY management.",
  showLabel: true,
  pulse: true,
};

function text(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim().slice(0, 500) : fallback;
}

export function normalizeWhatsAppWidgetSettings(
  value: unknown
): WhatsAppWidgetSettings {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const defaults = DEFAULT_WHATSAPP_WIDGET_SETTINGS;
  return {
    enabled:
      typeof source.enabled === "boolean" ? source.enabled : defaults.enabled,
    phone: text(source.phone, defaults.phone),
    labelAr: text(source.labelAr, defaults.labelAr),
    labelEn: text(source.labelEn, defaults.labelEn),
    messageAr: text(source.messageAr, defaults.messageAr),
    messageEn: text(source.messageEn, defaults.messageEn),
    showLabel:
      typeof source.showLabel === "boolean"
        ? source.showLabel
        : defaults.showLabel,
    pulse: typeof source.pulse === "boolean" ? source.pulse : defaults.pulse,
  };
}
