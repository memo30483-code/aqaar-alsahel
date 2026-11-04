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

    const omitted = window.__AQAAR_CLOUD__?.omitted ?? [];
    if (!omitted.length) return;

    let alive = true;
    void fetch(`/api/state?key=${encodeURIComponent(omitted.join(","))}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { rows?: Record<string, { value: unknown; updated_at: string }> } | null) => {
        if (!alive || !data?.rows) return;
        for (const [key, row] of Object.entries(data.rows)) {
          applyRemoteValue(key, row.value, row.updated_at);
        }
      })
      .catch(() => {
        /* لا اتصال — نكمل بالنسخة المحلية */
      });

    return () => {
      alive = false;
    };
  }, []);

  return null;
}
