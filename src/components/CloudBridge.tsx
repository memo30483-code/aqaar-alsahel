"use client";

import { useEffect } from "react";
import { applyRemoteValue, installCloudPush } from "@/lib/cloud/push";

/**
 * جسر الحالة بين المتصفح والسحابة.
 *
 * - يثبّت اعتراض الحفظ حتى تُرفع تعديلات الإدارة تلقائيًا.
 * - يحمّل المفاتيح الكبيرة التي لم تُحقن في HTML (مثل المحتوى المصوّر).
 * لا يعرض أي واجهة، ولا يعطّل الموقع إن تعذّر الاتصال.
 */
export default function CloudBridge() {
  useEffect(() => {
    installCloudPush();

    const boot = window.__AQAAR_CLOUD__;
    const omitted = boot?.omitted ?? [];
    /* لو فشل حقن الحالة على السيرفر (مهلة/انقطاع) نحاول تحميل النسخة
       العامة من العميل حتى لا يبقى الزائر على القيم الافتراضية. */
    const recovered = omitted.length === 0 && boot?.enabled === false;
    if (!omitted.length && !recovered) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);

    let alive = true;
    void fetch(
      omitted.length
        ? `/api/state?key=${encodeURIComponent(omitted.join(","))}`
        : "/api/state",
      { signal: controller.signal, cache: "no-store" }
    )
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { rows?: Record<string, { value: unknown; updated_at: string }> } | null) => {
        if (!alive || !data?.rows) return;
        for (const [key, row] of Object.entries(data.rows)) {
          applyRemoteValue(key, row.value, row.updated_at);
        }
      })
      .catch(() => {
        /* لا اتصال — نكمل بالنسخة المحلية */
      })
      .finally(() => clearTimeout(timer));

    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return null;
}
