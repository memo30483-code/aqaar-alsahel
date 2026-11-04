"use client";

/**
 * دفع تعديلات الإدارة إلى السحابة تلقائيًا.
 *
 * أداة الحفظ في المشروع كلها تكتب في `localStorage`. بدل تعديل عشرات الدوال،
 * نعترض الكتابة مرة واحدة: أي مفتاح مُدرج في `CLOUD_KEYS` يُرسل للسيرفر بعد
 * فترة قصيرة (debounce) — فلا تتكرر الطلبات أثناء الكتابة السريعة.
 *
 * الطلب يُرفض تلقائيًا إن لم تكن الجلسة جلسة أدمن، ولا يؤثر على واجهة الزائر.
 */

import {
  CLOUD_EVENT,
  cloudTsKey,
  isCloudKey,
} from "./keys";

type PushState = "idle" | "saving" | "saved" | "error" | "offline";

interface CloudFlags {
  enabled?: boolean;
  omitted?: string[];
}

declare global {
  interface Window {
    __AQAAR_CLOUD__?: CloudFlags;
    __AQAAR_PUSH_STATE__?: PushState;
  }
}

const DEBOUNCE_MS = 700;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let installed = false;
let suppress = false;

function announce(state: PushState) {
  if (typeof window === "undefined") return;
  window.__AQAAR_PUSH_STATE__ = state;
  window.dispatchEvent(new CustomEvent("aqaar:push-state", { detail: state }));
}

async function send(key: string, raw: string) {
  try {
    const value = JSON.parse(raw);
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });

    if (!response.ok) {
      /* 401 = زائر عادي؛ لا نزعج أحدًا */
      announce(response.status === 401 ? "offline" : "error");
      return;
    }

    const data = (await response.json()) as {
      ok?: boolean;
      saved?: Record<string, string>;
    };
    const stamp = data.saved?.[key];
    if (stamp) {
      suppress = true;
      try {
        window.localStorage.setItem(cloudTsKey(key), String(Date.parse(stamp)));
      } finally {
        suppress = false;
      }
    }
    announce("saved");
  } catch {
    announce("error");
  }
}

function schedule(key: string, raw: string) {
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  announce("saving");
  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      void send(key, raw);
    }, DEBOUNCE_MS)
  );
}

/** تُثبَّت مرة واحدة عند تحميل التطبيق في المتصفح */
export function installCloudPush(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const original = Storage.prototype.setItem;
  Storage.prototype.setItem = function patchedSetItem(
    this: Storage,
    key: string,
    value: string
  ) {
    original.call(this, key, value);

    if (this !== window.localStorage) return;
    if (suppress) return;
    if (!isCloudKey(key)) return;
    if (window.__AQAAR_CLOUD__?.enabled !== true) return;

    schedule(key, value);
  };
}

/** تطبيق قيمة قادمة من السيرفر ثم إبلاغ المكوّنات */
export function applyRemoteValue(key: string, value: unknown, updatedAt: string): void {
  if (typeof window === "undefined" || !isCloudKey(key)) return;

  suppress = true;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.localStorage.setItem(
      cloudTsKey(key),
      String(Date.parse(updatedAt) || Date.now())
    );
  } finally {
    suppress = false;
  }

  /*
   * كل مخازن المشروع تسمع أحداثًا خاصة بها. نطلقها كلها لأن قيمًا واحدة
   * (مثل إعدادات الموقع) تغذّي أكثر من واجهة في الوقت نفسه.
   */
  for (const event of [
    CLOUD_EVENT,
    "aqaar-branding-updated",
    "aqaar-season-theme-updated",
    "aqaar:cities",
    "aqaar:company-info",
    "aqaar:page-builder",
    "aqaar:professionals",
    "aqaar:professional-requests",
    "aqaar:add-property-fields",
    "aqaar:add-property-options",
  ]) {
    window.dispatchEvent(new CustomEvent(event, { detail: { key } }));
  }
}
