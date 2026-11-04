/**
 * حقن حالة السحابة داخل الصفحة قبل أول رسم.
 *
 * الفكرة: الصفحات تُولَّد على السيرفر، فنقرأ أحدث حالة من Supabase ونضعها
 * في سكربت صغير يعمل قبل React. النتيجة:
 *  - لا ومضة إعدادات قديمة.
 *  - كل الزوار يرون نفس الهوية والأقسام والعقارات التي يعدّلها الأدمن.
 *  - العمل دون إنترنت أو دون ضبط Supabase يظل كما هو (القيم الافتراضية).
 */

import { cloudEnabled, cloudGetRows } from "./server";

export interface CloudBootEntry {
  value: unknown;
  updated_at: string;
}

export type CloudBootPayload = Record<string, CloudBootEntry>;

/** أقصى حجم لمفتاح واحد يُحقن في HTML — ما زاد يُحمَّل عبر /api/state */
export const MAX_EMBED_BYTES = 96 * 1024;

export interface CloudBootResult {
  payload: CloudBootPayload;
  /** مفاتيح كبيرة لم تُحقن، ويجب تحميلها من العميل */
  omitted: string[];
  enabled: boolean;
}

export async function loadCloudBoot(): Promise<CloudBootResult> {
  if (!cloudEnabled()) {
    return { payload: {}, omitted: [], enabled: false };
  }

  try {
    const rows = await cloudGetRows({ publicOnly: true, revalidate: 60 });
    const payload: CloudBootPayload = {};
    const omitted: string[] = [];

    for (const row of rows) {
      const serialized = JSON.stringify(row.value ?? null);
      if (serialized.length > MAX_EMBED_BYTES) {
        omitted.push(row.key);
        continue;
      }
      payload[row.key] = { value: row.value, updated_at: row.updated_at };
    }

    return { payload, omitted, enabled: true };
  } catch {
    /* أي خطأ في قاعدة البيانات يجب ألّا يمنع الموقع من العمل */
    return { payload: {}, omitted: [], enabled: false };
  }
}

/**
 * سكربت يُحقن في <head> قبل أي رسم.
 * يكتب القيم في localStorage فقط إن كانت أحدث من النسخة المحلية.
 */
export function cloudBootScript(result: CloudBootResult): string {
  const stable = JSON.stringify(result.payload)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  const omitted = JSON.stringify(result.omitted);
  const enabled = result.enabled ? "true" : "false";

  return `(function(){try{
var cloud=${stable},omit=${omitted},ls=window.localStorage;
window.__AQAAR_CLOUD__={enabled:${enabled},omitted:omit};
for(var k in cloud){
  var row=cloud[k]||{},ts=Date.parse(row.updated_at||"")||0;
  var prev=Number(ls.getItem("aqaar:ts:"+k)||0);
  if(!ls.getItem(k)||ts>prev){
    ls.setItem(k,JSON.stringify(row.value));
    ls.setItem("aqaar:ts:"+k,String(ts));
  }
}
}catch(e){}})();`;
}
