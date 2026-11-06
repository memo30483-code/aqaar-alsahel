/**
 * مفاتيح الحالة المشتركة بين المتصفح والسحابة.
 *
 * المشروع كان يخزّن كل شيء في `localStorage`. الآن نفس المفاتيح تُنسخ إلى
 * قاعدة البيانات، فتصبح تعديلات الإدارة ظاهرة لكل الزوار وأجهزتهم.
 *
 * `public: true`  → يمكن قراءتها من `/api/state` بلا تسجيل دخول.
 * `public: false` → تُقرأ فقط لجلسة أدمن صالحة (بيانات إدارية/حساسة).
 *
 * إضافة مفتاح جديد هنا تفعيل للمزامنة؛ لا يحتاج أي كود آخر.
 */

export interface CloudKeyMeta {
  /** هل تُقرأ علنًا؟ */
  public: boolean;
  /** وصف عربي يظهر في تقرير الاتصال */
  label: string;
}

export const CLOUD_KEYS: Record<string, CloudKeyMeta> = {
  "aqaar-site-settings": { public: true, label: "إعدادات الموقع والهوية" },
  "aqaar-cities": { public: true, label: "المدن" },
  "aqaar-company-info": { public: true, label: "بيانات الشركة" },
  "aqaar-admin-developers-v2": { public: false, label: "بيانات المطورين الإدارية" },
  "aqaar-offers": { public: true, label: "العروض" },
  "aqaar-offers-settings": { public: true, label: "إعدادات العروض" },
  "aqaar-marquee-items": { public: true, label: "الشريط المتحرك" },
  /* تُعرض للعامة بعد تنقية المستندات ورمز الملكية داخل cloud/privacy.ts */
  "aqaar-professionals": { public: true, label: "المحامون والمهندسون" },
  "aqaar-page-builder-v1": { public: true, label: "محتوى الصفحات" },
  "aqaar-text-overrides": { public: true, label: "نصوص الموقع القابلة للتعديل" },
  "aqaar-text-styles": { public: true, label: "تنسيق النصوص (خط/لون/حجم)" },
  "aqaar-home-builder": { public: true, label: "محتوى الرئيسية (قديم)" },
  "aqaar-admin-listing-overrides-v2": { public: true, label: "حالة نشر الإعلانات" },
  "aqaar-add-property-fields": { public: true, label: "حقول إضافة العقار" },
  "aqaar-add-property-options": { public: true, label: "خيارات إضافة العقار" },
  /* تُعرض للعامة بعد حذف بيانات المالك والمستندات وقصرها على المعتمد */
  "aqaar-properties": { public: true, label: "العقارات" },

  "aqaar-admin-users-v2": { public: false, label: "حسابات الإدارة" },
  "aqaar-admin-permissions": { public: false, label: "صلاحيات الإدارة" },
  "aqaar-admin-logs": { public: false, label: "سجل العمليات" },
  "aqaar-listing-actions": { public: false, label: "قرارات مراجعة الإعلانات" },
  "aqaar-professional-requests": { public: false, label: "طلبات الانضمام" },
  "aqaar-crm-v1": { public: false, label: "العملاء والفرص (CRM)" },
};

export const CLOUD_KEY_LIST = Object.keys(CLOUD_KEYS);

export const PUBLIC_CLOUD_KEYS = CLOUD_KEY_LIST.filter(
  (key) => CLOUD_KEYS[key].public
);

export function isCloudKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(CLOUD_KEYS, key);
}

export function isPublicCloudKey(key: string): boolean {
  return CLOUD_KEYS[key]?.public === true;
}

/** حدث عام يُطلق بعد تحديث الحالة من السحابة */
export const CLOUD_EVENT = "aqaar:cloud";

/** بادئة مفتاح تخزين وقت آخر تحديث محلي */
export const CLOUD_TS_PREFIX = "aqaar:ts:";

/** مفتاح وقت التحديث للسحابة */
export function cloudTsKey(key: string): string {
  return `${CLOUD_TS_PREFIX}${key}`;
}
