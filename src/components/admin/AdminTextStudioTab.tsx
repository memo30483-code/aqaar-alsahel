"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Palette,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Type,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { addAdminLog } from "@/lib/admin-system";
import {
  TEXT_CATALOG,
  TEXT_FONT_OPTIONS,
  TEXT_GROUP_LABEL,
  TEXT_GROUP_ORDER,
  TEXT_WEIGHT_OPTIONS,
  getTextOverrides,
  getTextStyles,
  hasPlaceholders,
  saveTextOverrides,
  saveTextStyles,
  type TextGroup,
  type TextStyleOverride,
  type TextStyles,
  type TextOverrides,
} from "@/lib/text-overrides";
import { BTN_PRIMARY, Field, INPUT, Panel } from "@/components/admin/shared";

interface Props {
  can: (key: string) => boolean;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

const PAGE_SIZE = 20;

type GroupFilter = TextGroup | "all";

function cleanStyle(style: TextStyleOverride): TextStyleOverride {
  const out: TextStyleOverride = {};
  if (style.fontFamily) out.fontFamily = style.fontFamily;
  if (style.fontSize) out.fontSize = style.fontSize;
  if (style.color) out.color = style.color;
  if (style.fontWeight) out.fontWeight = style.fontWeight;
  if (style.align) out.align = style.align;
  return out;
}

export default function AdminTextStudioTab({ can, notify, reloadLogs }: Props) {
  const editable = can("settings.full") || can("site.settings");
  const [overrides, setOverrides] = useState<TextOverrides>({});
  const [styles, setStyles] = useState<TextStyles>({});
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupFilter>("all");
  const [page, setPage] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setOverrides(getTextOverrides());
    setStyles(getTextStyles());
    setLoaded(true);
  }, []);

  useEffect(() => {
    setPage(0);
  }, [query, group]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEXT_CATALOG.filter((entry) => {
      if (group !== "all" && entry.group !== group) return false;
      if (!q) return true;
      const custom = overrides[entry.key];
      return (
        entry.key.toLowerCase().includes(q) ||
        entry.ar.toLowerCase().includes(q) ||
        entry.en.toLowerCase().includes(q) ||
        (custom?.ar ?? "").toLowerCase().includes(q) ||
        (custom?.en ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, group, overrides]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const customCount = Object.keys(overrides).length;
  const styledCount = Object.keys(styles).length;

  const updateText = (key: string, field: "ar" | "en", value: string) => {
    setOverrides((prev) => {
      const current = prev[key] ?? { ar: "", en: "" };
      const next = { ...current, [field]: value };
      const copy = { ...prev };
      if (!next.ar.trim() && !next.en.trim()) delete copy[key];
      else copy[key] = next;
      return copy;
    });
  };

  const updateStyle = (key: string, patch: Partial<TextStyleOverride>) => {
    setStyles((prev) => {
      const next = cleanStyle({ ...(prev[key] ?? {}), ...patch });
      const copy = { ...prev };
      if (Object.keys(next).length) copy[key] = next;
      else delete copy[key];
      return copy;
    });
  };

  const resetKey = (key: string) => {
    setOverrides((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setStyles((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const persist = () => {
    if (!editable) return;
    const overridesOk = saveTextOverrides(overrides);
    const stylesOk = saveTextStyles(styles);
    if (!overridesOk || !stylesOk) {
      notify("تعذّر الحفظ — مساحة التخزين في المتصفح ممتلئة.");
      return;
    }
    const session = getSession();
    if (session) {
      addAdminLog({
        action: "site.texts.update",
        category: "settings",
        performedBy: session.email,
        performedByName: session.name,
        performedByRole: session.role ?? "admin",
        details: `تم تحديث ${customCount} نص و${styledCount} تنسيق نص من استوديو النصوص`,
      });
      reloadLogs();
    }
    notify("تم حفظ النصوص والتنسيقات وتطبيقها على كل صفحات المنصة");
  };

  return (
    <div className="space-y-5">
      <Panel
        title="استوديو النصوص — تحكم كامل في كل كلمة على المنصة"
        desc="عدّل نص الهيدر والفوتر والرئيسية وكل الصفحات، واختر لكل نص نوع الخط وحجمه ولونه ووزنه ومحاذاته. التغييرات تُطبّق فور الحفظ على كل الزوار."
        actions={
          <button type="button" onClick={persist} className={BTN_PRIMARY} disabled={!editable}>
            <Save className="h-4 w-4" /> حفظ كل التغييرات
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-gold-200 bg-gold-50/60 p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-black text-gold-900">
              <Sparkles className="h-4 w-4" /> نصوص معدّلة
            </p>
            <p className="mt-1 text-2xl font-black text-ocean-900">{customCount}</p>
            <p className="text-[10.5px] font-semibold text-sand-600">
              من إجمالي {TEXT_CATALOG.length} نص متاح
            </p>
          </div>
          <div className="rounded-2xl border border-ocean-100 bg-ocean-50/50 p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-black text-ocean-900">
              <Palette className="h-4 w-4" /> نصوص منسّقة
            </p>
            <p className="mt-1 text-2xl font-black text-ocean-900">{styledCount}</p>
            <p className="text-[10.5px] font-semibold text-sand-600">
              خط / حجم / لون / وزن / محاذاة
            </p>
          </div>
          <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
            <p className="flex items-center gap-1.5 text-[12px] font-black text-ocean-900">
              <Type className="h-4 w-4" /> تعديل مباشر
            </p>
            <p className="mt-1 text-[11px] font-semibold leading-6 text-sand-700">
              اكتب فوق النص الحالي. اترك الحقل فارغًا للعودة للنص الافتراضي.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالنص العربي أو الإنجليزي أو باسم المفتاح…"
              className={`${INPUT} pe-9`}
            />
          </div>
          <select
            value={group}
            onChange={(event) => setGroup(event.target.value as GroupFilter)}
            className={`${INPUT} sm:w-56`}
          >
            <option value="all">كل الأقسام ({TEXT_CATALOG.length})</option>
            {TEXT_GROUP_ORDER.map((key) => {
              const count = TEXT_CATALOG.filter((entry) => entry.group === key).length;
              if (!count) return null;
              return (
                <option key={key} value={key}>
                  {TEXT_GROUP_LABEL[key]} ({count})
                </option>
              );
            })}
          </select>
        </div>

        <p className="mt-2 text-[10.5px] font-bold text-sand-600">
          {filtered.length} نتيجة — الصفحة {safePage + 1} من {pageCount}
        </p>
      </Panel>

      {!loaded ? (
        <div className="rounded-3xl border border-sand-200 bg-white p-8 text-center text-[12px] font-bold text-sand-600">
          جارٍ تحميل النصوص…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-sand-200 bg-white p-8 text-center text-[12px] font-bold text-sand-600">
          لا توجد نصوص مطابقة للبحث.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((entry) => {
            const custom = overrides[entry.key];
            const style = styles[entry.key] ?? {};
            const isCustom = Boolean(custom);
            const isStyled = Object.keys(style).length > 0;
            return (
              <section
                key={entry.key}
                className="rounded-2xl border border-sand-200 bg-white p-4 shadow-[0_18px_40px_-38px_rgba(20,26,51,0.55)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-[9.5px] font-black text-ocean-700">
                      {TEXT_GROUP_LABEL[entry.group]}
                    </span>
                    <code className="rounded bg-sand-50 px-1.5 py-0.5 text-[10px] font-bold text-sand-600" dir="ltr">
                      {entry.key}
                    </code>
                    {isCustom && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-black text-emerald-700">
                        نص معدّل
                      </span>
                    )}
                    {isStyled && (
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[9.5px] font-black text-gold-800">
                        منسّق
                      </span>
                    )}
                  </div>
                  {(isCustom || isStyled) && (
                    <button
                      type="button"
                      onClick={() => resetKey(entry.key)}
                      disabled={!editable}
                      className="inline-flex items-center gap-1 rounded-xl border border-sand-200 bg-white px-2 py-1 text-[10.5px] font-bold text-sand-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                    >
                      <RotateCcw className="h-3 w-3" /> رجوع للافتراضي
                    </button>
                  )}
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <Field
                    label="النص العربي"
                    hint={
                      hasPlaceholders(entry.ar)
                        ? `حافظ على المتغيّرات: ${entry.ar.match(/\{[a-zA-Z0-9_]+\}/g)?.join(" ")}`
                        : undefined
                    }
                  >
                    <textarea
                      value={custom?.ar ?? ""}
                      onChange={(event) => updateText(entry.key, "ar", event.target.value)}
                      placeholder={entry.ar}
                      rows={2}
                      className={INPUT}
                      disabled={!editable}
                    />
                  </Field>
                  <Field label="English text">
                    <textarea
                      value={custom?.en ?? ""}
                      onChange={(event) => updateText(entry.key, "en", event.target.value)}
                      placeholder={entry.en}
                      rows={2}
                      dir="ltr"
                      className={INPUT}
                      disabled={!editable}
                    />
                  </Field>
                </div>

                <details className="mt-3 rounded-2xl border border-ocean-100 bg-ocean-50/30 p-3">
                  <summary className="flex cursor-pointer items-center gap-1.5 text-[11.5px] font-black text-ocean-900">
                    <Palette className="h-3.5 w-3.5 text-gold-600" />
                    تنسيق هذا النص (خط / حجم / لون / وزن / محاذاة)
                  </summary>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="نوع الخط">
                      <select
                        value={style.fontFamily ?? ""}
                        onChange={(event) =>
                          updateStyle(entry.key, {
                            fontFamily: event.target.value
                              ? (event.target.value as TextStyleOverride["fontFamily"])
                              : undefined,
                          })
                        }
                        className={INPUT}
                        disabled={!editable}
                      >
                        <option value="">خط الموقع الافتراضي</option>
                        {TEXT_FONT_OPTIONS.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="حجم الخط (px)" hint="من 8 إلى 96">
                      <input
                        type="number"
                        min={8}
                        max={96}
                        value={style.fontSize ?? ""}
                        onChange={(event) =>
                          updateStyle(entry.key, {
                            fontSize: event.target.value ? Number(event.target.value) : undefined,
                          })
                        }
                        className={INPUT}
                        disabled={!editable}
                      />
                    </Field>

                    <Field label="وزن الخط">
                      <select
                        value={style.fontWeight ?? ""}
                        onChange={(event) =>
                          updateStyle(entry.key, {
                            fontWeight: event.target.value
                              ? (event.target.value as TextStyleOverride["fontWeight"])
                              : undefined,
                          })
                        }
                        className={INPUT}
                        disabled={!editable}
                      >
                        <option value="">الوزن الافتراضي</option>
                        {TEXT_WEIGHT_OPTIONS.map((weight) => (
                          <option key={weight.value} value={weight.value}>
                            {weight.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="لون الخط">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={style.color ?? "#141a33"}
                          onChange={(event) => updateStyle(entry.key, { color: event.target.value })}
                          aria-label="لون الخط"
                          className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-sand-200 bg-white p-1"
                          disabled={!editable}
                        />
                        <input
                          value={style.color ?? ""}
                          onChange={(event) =>
                            updateStyle(entry.key, { color: event.target.value || undefined })
                          }
                          placeholder="#141a33"
                          dir="ltr"
                          className={INPUT}
                          disabled={!editable}
                        />
                      </div>
                    </Field>

                    <Field label="محاذاة النص">
                      <select
                        value={style.align ?? ""}
                        onChange={(event) =>
                          updateStyle(entry.key, {
                            align: event.target.value
                              ? (event.target.value as TextStyleOverride["align"])
                              : undefined,
                          })
                        }
                        className={INPUT}
                        disabled={!editable}
                      >
                        <option value="">المحاذاة الافتراضية</option>
                        <option value="start">بداية السطر</option>
                        <option value="center">وسط</option>
                        <option value="end">نهاية السطر</option>
                      </select>
                    </Field>
                  </div>
                  <p className="mt-2 text-[10px] font-semibold leading-5 text-sand-600">
                    نصيحة: التنسيق الفردي يظهر على هذا النص في كل مكان بالمنصة. لتنسيق قسم كامل مرة
                    واحدة استخدم «Builder الصفحات».
                  </p>
                </details>
              </section>
            );
          })}
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            disabled={safePage === 0}
            className="inline-flex items-center gap-1 rounded-xl border border-sand-200 bg-white px-3 py-2 text-[11px] font-bold text-ocean-800 disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5" /> السابق
          </button>
          <span className="text-[11px] font-black text-sand-600">
            {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
            disabled={safePage >= pageCount - 1}
            className="inline-flex items-center gap-1 rounded-xl border border-sand-200 bg-white px-3 py-2 text-[11px] font-bold text-ocean-800 disabled:opacity-40"
          >
            التالي <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={persist} className={BTN_PRIMARY} disabled={!editable}>
          <Save className="h-4 w-4" /> حفظ كل التغييرات
        </button>
      </div>
    </div>
  );
}
