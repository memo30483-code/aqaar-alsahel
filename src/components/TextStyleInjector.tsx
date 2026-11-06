"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { CLOUD_EVENT } from "@/lib/cloud/keys";
import {
  TEXT_FONT_STACK,
  TEXT_OVERRIDES_EVENT,
  TEXT_STYLES_EVENT,
  getTextOverrides,
  getTextStyles,
  resolveText,
  type TextStyleOverride,
} from "@/lib/text-overrides";

/**
 * مُطبِّق تنسيق النصوص الفردي.
 *
 * يقرأ الأنماط التي يضبطها الأدمن لكل نص، ثم يجد العناصر التي تعرض هذا النص
 * فعليًا في الصفحة ويطبّق عليها الخط/الحجم/اللون/الوزن/المحاذاة. يعمل على كل
 * الصفحات (هيدر، فوتر، رئيسية، وصفحات المحتوى) دون الحاجة لتعديل كل مكوّن.
 *
 * - لا يعمل إطلاقًا إذا لم يضبط الأدمن أي تنسيق.
 * - يعيد التطبيق تلقائيًا بعد أي تحديث للصفحة أو تغيير للغة.
 */

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "SVG",
  "PATH",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "OPTION",
  "IFRAME",
  "CODE",
  "PRE",
]);

const MAX_TEXT_LENGTH = 420;

function normalize(text: string | null | undefined): string {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function placeholderRegex(raw: string): RegExp | null {
  if (!/\{[a-zA-Z0-9_]+\}/.test(raw)) return null;
  const parts = raw.split(/\{[a-zA-Z0-9_]+\}/).map(escapeRegExp);
  return new RegExp(`^${parts.join(".+?")}$`);
}

function cssValue(style: TextStyleOverride): Record<string, string> {
  const out: Record<string, string> = {};
  if (style.fontFamily) out["font-family"] = TEXT_FONT_STACK[style.fontFamily];
  if (style.fontSize) out["font-size"] = `${style.fontSize}px`;
  if (style.color) out["color"] = style.color;
  if (style.fontWeight) out["font-weight"] = style.fontWeight;
  if (style.align) out["text-align"] = style.align;
  return out;
}

interface Applied {
  el: HTMLElement;
  original: Record<string, { value: string; priority: string }>;
}

export default function TextStyleInjector() {
  const { locale } = useI18n();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let observer: MutationObserver | null = null;
    const applied = new Map<HTMLElement, Applied>();

    const clearApplied = () => {
      for (const { el, original } of Array.from(applied.values())) {
        for (const [prop, saved] of Object.entries(original) as [
          string,
          { value: string; priority: string },
        ][]) {
          if (saved.value) el.style.setProperty(prop, saved.value, saved.priority);
          else el.style.removeProperty(prop);
        }
        el.removeAttribute("data-tx-styled");
      }
      applied.clear();
    };

    const apply = () => {
      clearApplied();

      const styles = getTextStyles();
      const entries = Object.entries(styles).filter(
        ([, style]) => style && Object.keys(style).length > 0
      );
      if (!entries.length || !document.body) return;

      const overrides = getTextOverrides();
      const exact = new Map<string, { key: string; style: TextStyleOverride }>();
      const patterns: { key: string; style: TextStyleOverride; regex: RegExp }[] = [];

      for (const [key, style] of entries) {
        const raw = normalize(resolveText(key, locale, overrides));
        if (!raw) continue;
        const regex = placeholderRegex(raw);
        if (regex) patterns.push({ key, style, regex });
        else if (!exact.has(raw)) exact.set(raw, { key, style });
      }

      if (!exact.size && !patterns.length) return;

      const elements = document.body.querySelectorAll("*");
      elements.forEach((node) => {
        const el = node as HTMLElement;
        if (SKIP_TAGS.has(el.tagName)) return;
        if (el.closest("[data-tx-ignore]")) return;

        const text = normalize(el.textContent);
        if (!text || text.length > MAX_TEXT_LENGTH) return;

        const match =
          exact.get(text) ?? patterns.find((item) => item.regex.test(text));
        if (!match) return;

        /* لا نعيد تنسيق نفس النص داخل عنصر أب تم تنسيقه بالفعل */
        const styledAncestor = el.parentElement?.closest(
          `[data-tx-styled="${CSS.escape(match.key)}"]`
        ) as HTMLElement | null;
        if (styledAncestor) return;

        const values = cssValue(match.style);
        if (!Object.keys(values).length) return;

        const original: Applied["original"] = {};
        for (const [prop, value] of Object.entries(values)) {
          original[prop] = {
            value: el.style.getPropertyValue(prop),
            priority: el.style.getPropertyPriority(prop),
          };
          el.style.setProperty(prop, value, "important");
        }
        el.setAttribute("data-tx-styled", match.key);
        applied.set(el, { el, original });
      });
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(apply, 120);
    };

    apply();
    observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.addEventListener(TEXT_STYLES_EVENT, schedule);
    window.addEventListener(TEXT_OVERRIDES_EVENT, schedule);
    window.addEventListener(CLOUD_EVENT, schedule);
    window.addEventListener("storage", schedule);

    return () => {
      observer?.disconnect();
      if (timer) clearTimeout(timer);
      window.removeEventListener(TEXT_STYLES_EVENT, schedule);
      window.removeEventListener(TEXT_OVERRIDES_EVENT, schedule);
      window.removeEventListener(CLOUD_EVENT, schedule);
      window.removeEventListener("storage", schedule);
      clearApplied();
    };
  }, [locale]);

  return null;
}
