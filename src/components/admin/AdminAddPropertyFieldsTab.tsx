"use client";

import { useMemo, useState } from "react";
import { Check, Lock, RotateCcw, ShieldCheck } from "lucide-react";
import {
  ADD_PROPERTY_FIELDS,
  ADD_PROPERTY_FIELD_GROUPS,
  DEFAULT_ADD_PROPERTY_OPTIONS,
  countAddPropertyFields,
  getAddPropertyFieldSettings,
  getAddPropertyOptions,
  resetAddPropertyFieldSettings,
  resetAddPropertyOptions,
  saveAddPropertyFieldSettings,
  saveAddPropertyOptions,
  type AddPropertyFieldKey,
  type AddPropertyFieldSettings,
  type AddPropertyOptions,
} from "@/lib/add-property-fields";
import { addAdminLog } from "@/lib/admin-system";
import { getSession } from "@/lib/session";
import { BTN_GOLD, BTN_PRIMARY, Panel, ToggleRow } from "@/components/admin/shared";

interface Props {
  can: (key: string) => boolean;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

/**
 * تحكم الأدمن في حقول صفحة «أضف عقارك»:
 * أي حقل إجباري (لا يُقبل الطلب بدونه) وأي حقل اختياري — لكل الطلبات.
 */
export default function AdminAddPropertyFieldsTab({
  can,
  notify,
  reloadLogs,
}: Props) {
  const [draft, setDraft] = useState<AddPropertyFieldSettings>(
    getAddPropertyFieldSettings
  );
  const [baseline, setBaseline] = useState<AddPropertyFieldSettings>(draft);

  /** خيارات السعر: قائمة التفاوض وخيار «السعر تحدده المنصة» */
  const [optionsDraft, setOptionsDraft] = useState<AddPropertyOptions>(
    getAddPropertyOptions
  );
  const [optionsBaseline, setOptionsBaseline] = useState<AddPropertyOptions>(
    optionsDraft
  );

  const manage = can("site.settings");

  const counts = useMemo(() => countAddPropertyFields(draft), [draft]);
  const dirty = useMemo(
    () =>
      ADD_PROPERTY_FIELDS.some(
        (field) => draft[field.key] !== baseline[field.key]
      ) ||
      (Object.keys(DEFAULT_ADD_PROPERTY_OPTIONS) as (keyof AddPropertyOptions)[]).some(
        (key) => optionsDraft[key] !== optionsBaseline[key]
      ),
    [draft, baseline, optionsDraft, optionsBaseline]
  );

  const logChange = (details: string) => {
    const session = getSession();
    addAdminLog({
      action: "settings.add-property-fields",
      category: "settings",
      performedBy: session?.email ?? "unknown",
      performedByName: session?.name ?? "—",
      performedByRole: session?.role ?? "moderator",
      details,
    });
    reloadLogs();
  };

  const toggle = (key: AddPropertyFieldKey, value: boolean) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = () => {
    saveAddPropertyFieldSettings(draft);
    saveAddPropertyOptions(optionsDraft);
    const next = getAddPropertyFieldSettings();
    const nextOptions = getAddPropertyOptions();
    setDraft(next);
    setBaseline(next);
    setOptionsDraft(nextOptions);
    setOptionsBaseline(nextOptions);
    const nextCounts = countAddPropertyFields(next);
    logChange(
      `حفظ إعدادات حقول إضافة العقار — إجباري: ${nextCounts.required}، اختياري: ${nextCounts.optional}، قائمة التفاوض: ${
        nextOptions.negotiableEnabled ? "مفعّلة" : "موقوفة"
      }، سعر المنصة: ${nextOptions.platformPriceEnabled ? "متاح" : "موقوف"}`
    );
    notify("تم حفظ إعدادات الحقول والخيارات وتطبيقها على كل طلبات النشر");
  };

  const reset = () => {
    resetAddPropertyFieldSettings();
    resetAddPropertyOptions();
    const next = getAddPropertyFieldSettings();
    const nextOptions = getAddPropertyOptions();
    setDraft(next);
    setBaseline(next);
    setOptionsDraft(nextOptions);
    setOptionsBaseline(nextOptions);
    logChange("استعادة الإعدادات الافتراضية لحقول إضافة العقار وخيارات السعر");
    notify("تم استعادة الإعدادات الافتراضية للحقول وخيارات السعر");
  };

  return (
    <div className="space-y-5">
      <Panel
        title="تحكم كامل في حقول صفحة أضف عقارك"
        desc="حدد الحقول الإجبارية التي لا يُقبل طلب النشر بدونها، والحقول الاختيارية. الإعدادات تُطبَّق على كل الطلبات القادمة من الصفحة."
        actions={
          <>
            <button
              type="button"
              onClick={reset}
              disabled={!manage}
              className={`${BTN_PRIMARY} gap-1.5`}
            >
              <RotateCcw className="h-3.5 w-3.5" /> استعادة الافتراضي
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!manage || !dirty}
              className={BTN_GOLD}
            >
              <Check className="h-4 w-4" /> حفظ الإعدادات
            </button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            إجباري: {counts.required}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-3 py-1 text-[11px] font-black text-sand-700">
            اختياري: {counts.optional}
          </span>
          {dirty && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-800">
              تغييرات غير محفوظة
            </span>
          )}
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[11.5px] font-semibold leading-6 text-amber-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          الطلبات لا تُقبل بدون الحقول الإجبارية. الحقول المقفلة أساسية في بنية
          الإعلان (المدينة ونوع العقار) ولا يمكن جعلها اختيارية، والموقع يُحدَّد
          دائماً على الخريطة.
        </p>

        {!manage && (
          <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[11.5px] font-bold text-rose-700">
            لا تملك صلاحية تعديل إعدادات الموقع — التعديل متاح للأدمن فقط.
          </p>
        )}

        <div className="mt-4 space-y-4">
          {ADD_PROPERTY_FIELD_GROUPS.map((group) => {
            const fields = ADD_PROPERTY_FIELDS.filter(
              (field) => field.group === group.key
            );
            const groupRequired = fields.filter(
              (field) => draft[field.key]
            ).length;

            return (
              <section
                key={group.key}
                className="rounded-2xl border border-sand-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[13px] font-black text-ocean-900">
                      {group.label}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-sand-600">
                      {group.desc}
                    </p>
                  </div>
                  <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-[10px] font-black text-sand-700">
                    {groupRequired} / {fields.length} إجباري
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {fields.map((field) => (
                    <ToggleRow
                      key={field.key}
                      title={field.label}
                      hint={
                        field.locked
                          ? "حقل أساسي في بنية الإعلان — إجباري دائماً"
                          : field.key === "negotiable" &&
                              !optionsDraft.negotiableEnabled
                            ? "قائمة التفاوض موقوفة من «خيارات السعر والتفاوض» بالأسفل"
                            : draft[field.key]
                              ? "إجباري: لا يُقبل الطلب بدونه"
                              : "اختياري: يمكن تركه فارغاً"
                      }
                      checked={draft[field.key]}
                      disabled={
                        !manage ||
                        field.locked ||
                        (field.key === "negotiable" &&
                          !optionsDraft.negotiableEnabled)
                      }
                      onChange={(value) => toggle(field.key, value)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="خيارات السعر والتفاوض"
        desc="تحكم كامل في الخيارات التي تظهر للبائع بجوار خانة سعر البيع."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <ToggleRow
            title="قائمة «قابل للتفاوض / غير قابل للتفاوض»"
            hint={
              optionsDraft.negotiableEnabled
                ? "تظهر للبائع بجوار خانة السعر، وإجباريتها يحددها مفتاح «قابلية التفاوض على السعر» بالأعلى."
                : "مخفية تماماً من صفحة إضافة العقار."
            }
            checked={optionsDraft.negotiableEnabled}
            disabled={!manage}
            onChange={(value) =>
              setOptionsDraft((current) => ({
                ...current,
                negotiableEnabled: value,
              }))
            }
          />
          <ToggleRow
            title="خيار «يحدد السعر من قبل إدارة الموقع/المنصة»"
            hint={
              optionsDraft.platformPriceEnabled
                ? "يستطيع البائع تفويض تحديد السعر للإدارة، فتُغلق خانة السعر وقائمة التفاوض."
                : "مخفي — يبقى السعر على البائع حسب إجبارية حقل السعر."
            }
            checked={optionsDraft.platformPriceEnabled}
            disabled={!manage}
            onChange={(value) =>
              setOptionsDraft((current) => ({
                ...current,
                platformPriceEnabled: value,
              }))
            }
          />
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-2xl border border-gold-200 bg-gold-50 px-3.5 py-3 text-[11.5px] font-semibold leading-6 text-gold-900">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          عند اختيار البائع «السعر تحدده الإدارة» يُحفظ الطلب بدون سعر بعلامة
          «السعر تحدده الإدارة»، وتُلغى مطالبته بالسعر والتفاوض. الإعلان يظل
          «قيد المراجعة» ولا يُنشر إلا بموافقتك.
        </p>
      </Panel>

      <Panel title="ملاحظات مهمة" desc="كيف يظهر أثر الإعدادات على الزوار والإدارة؟">
        <ul className="space-y-2 text-[12px] font-semibold leading-6 text-sand-700">
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
            الحقل الإجباري يظهر بعلامة «*» في صفحة أضف عقارك، ولا يُقبل إرسال
            الطلب بدونه برسالة عربية توضح الحقول الناقصة.
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
            المستندات المعلّمة كإجبارية تمنع إرسال الطلب، وتظهر للمراجع في ملف
            الطلب. أي مستند اختياري يظهر بشارة «اختياري».
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
            الطلبات المحفوظة قبل التعديل لا تتأثر — لكنها تظل بحالة «قيد
            المراجعة» ولا تُنشر إلا بموافقتك.
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
            كل تعديل على الإعدادات يُسجَّل في سجل النشاطات مع اسم المنفِّذ.
          </li>
        </ul>
      </Panel>
    </div>
  );
}
