"use client";

import { useState } from "react";
import { Calendar, Copy, Gift, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { mockProperties } from "@/data/properties";
import { useCurrency } from "@/lib/currency";
import { getSession } from "@/lib/session";
import {
  addAdminLog,
  addOffer,
  deleteOffer,
  getActiveOffers,
  getOffers,
  saveOffersSettings,
  updateOffer,
  type Offer,
  type OffersSettings,
} from "@/lib/admin-system";
import { BTN_GOLD, BTN_PRIMARY, Field, INPUT, Panel, ROW_ACTION, ToggleRow } from "@/components/admin/shared";

interface Props {
  offers: Offer[];
  settings: OffersSettings;
  can: (key: string) => boolean;
  onOffersChange: (offers: Offer[]) => void;
  onSettingsChange: (settings: OffersSettings) => void;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

const EMPTY_OFFER: Omit<Offer, "id" | "createdAt" | "updatedAt"> = {
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  type: "general",
  enabled: true,
  order: 1,
  createdBy: "",
  isSeasonal: false,
};

export default function AdminOffersTab({
  offers,
  settings,
  can,
  onOffersChange,
  onSettingsChange,
  notify,
  reloadLogs,
}: Props) {
  const { format } = useCurrency();
  const [draft, setDraft] = useState<(Partial<Offer> & typeof EMPTY_OFFER) | null>(null);
  const session = typeof window !== "undefined" ? getSession() : null;

  const persistSettings = () => {
    saveOffersSettings(settings);
    if (session) {
      addAdminLog({
        action: "offers.settings.update",
        category: "offers",
        performedBy: session.email,
        performedByName: session.name,
        performedByRole: session.role ?? "admin",
        details: "تم تحديث إعدادات صفحة العروض",
        meta: { enabled: settings.enabled, seasonal: settings.seasonal },
      });
      reloadLogs();
    }
    notify("تم حفظ إعدادات صفحة العروض");
  };

  const saveDraft = () => {
    if (!draft || !draft.titleAr.trim()) {
      notify("من فضلك أدخل عنوان العرض");
      return;
    }
    if (draft.id) {
      updateOffer(draft.id, draft);
      if (session) {
        addAdminLog({
          action: "offers.update",
          category: "offers",
          performedBy: session.email,
          performedByName: session.name,
          performedByRole: session.role ?? "admin",
          details: `تعديل عرض: ${draft.titleAr}`,
        });
      }
    } else {
      addOffer({
        ...EMPTY_OFFER,
        ...draft,
        titleAr: draft.titleAr,
        descriptionAr: draft.descriptionAr ?? "",
        enabled: draft.enabled ?? true,
        order: draft.order ?? offers.length + 1,
        createdBy: session?.email ?? "admin",
      } as Omit<Offer, "id" | "createdAt" | "updatedAt">);
      if (session) {
        addAdminLog({
          action: "offers.create",
          category: "offers",
          performedBy: session.email,
          performedByName: session.name,
          performedByRole: session.role ?? "admin",
          details: `إضافة عرض: ${draft.titleAr}`,
        });
      }
    }
    onOffersChange(getOffers());
    reloadLogs();
    setDraft(null);
    notify("تم حفظ العرض");
  };

  const active = getActiveOffers();

  return (
    <div className="space-y-5">
      <Panel
        title="إعدادات صفحة العروض والتخفيضات"
        desc="تحكم كامل في ظهور الصفحة، الموسمية، رابط الهيدر، والبانر العائم."
        actions={
          <button onClick={persistSettings} className={BTN_PRIMARY} disabled={!can("offers.publish")}>
            <Save className="h-4 w-4" /> حفظ الإعدادات
          </button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <ToggleRow
            title="تفعيل صفحة العروض"
            hint="عند الإيقاف تظهر رسالة مخصصة للزائر بدل الصفحة."
            checked={settings.enabled}
            onChange={(value) => onSettingsChange({ ...settings, enabled: value })}
            disabled={!can("offers.publish")}
          />
          <ToggleRow
            title="وضع موسمي"
            hint="الصفحة لا تعمل إلا بين تاريخ البداية والنهاية."
            checked={settings.seasonal}
            onChange={(value) => onSettingsChange({ ...settings, seasonal: value })}
            disabled={!can("offers.publish")}
          />
          <ToggleRow
            title="إظهار رابط في الهيدر"
            hint="يظهر الرابط فقط لو الصفحة متاحة فعلياً."
            checked={settings.showInHeader}
            onChange={(value) => onSettingsChange({ ...settings, showInHeader: value })}
            disabled={!can("offers.publish")}
          />
          <ToggleRow
            title="البانر العائم الضخم"
            hint="يظهر أعلى الصفحة الرئيسية ويمكن للزائر إخفاؤه."
            checked={settings.showFloatingBanner}
            onChange={(value) => onSettingsChange({ ...settings, showFloatingBanner: value })}
            disabled={!can("offers.publish")}
          />
          <Field label="تاريخ بداية الحملة">
            <input
              type="date"
              value={settings.startDate ?? ""}
              onChange={(event) => onSettingsChange({ ...settings, startDate: event.target.value })}
              className={INPUT}
            />
          </Field>
          <Field label="تاريخ نهاية الحملة">
            <input
              type="date"
              value={settings.endDate ?? ""}
              onChange={(event) => onSettingsChange({ ...settings, endDate: event.target.value })}
              className={INPUT}
            />
          </Field>
          <Field label="عنوان الصفحة (عربي)">
            <input
              value={settings.pageTitleAr}
              onChange={(event) => onSettingsChange({ ...settings, pageTitleAr: event.target.value })}
              className={INPUT}
            />
          </Field>
          <Field label="Page title (English)">
            <input
              value={settings.pageTitleEn}
              onChange={(event) => onSettingsChange({ ...settings, pageTitleEn: event.target.value })}
              className={INPUT}
            />
          </Field>
          <Field label="وصف الصفحة (عربي)">
            <textarea
              rows={2}
              value={settings.pageDescAr}
              onChange={(event) => onSettingsChange({ ...settings, pageDescAr: event.target.value })}
              className={INPUT}
            />
          </Field>
          <Field label="رسالة الإيقاف (عربي)">
            <textarea
              rows={2}
              value={settings.disabledMessageAr}
              onChange={(event) =>
                onSettingsChange({ ...settings, disabledMessageAr: event.target.value })
              }
              className={INPUT}
            />
          </Field>
          <Field label="عنوان البانر (عربي)">
            <input
              value={settings.bannerTitleAr}
              onChange={(event) => onSettingsChange({ ...settings, bannerTitleAr: event.target.value })}
              className={INPUT}
            />
          </Field>
          <Field label="نص زر البانر (عربي)">
            <input
              value={settings.bannerCtaAr}
              onChange={(event) => onSettingsChange({ ...settings, bannerCtaAr: event.target.value })}
              className={INPUT}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-sand-50 p-3 text-xs text-sand-700">
          <Calendar className="h-4 w-4 text-gold-600" />
          <span>
            الحالة الآن:{" "}
            <strong className={active.length > 0 ? "text-emerald-600" : "text-rose-600"}>
              {active.length > 0 ? `متاحة — ${active.length} عرض ساري` : "غير متاحة للزوار"}
            </strong>
          </span>
        </div>
      </Panel>

      <Panel
        title="قائمة العروض"
        desc="عروض مرتبطة بعقارات، عروض عامة، أو عروض مخصصة — مع نسبة خصم أو سعر قديم/جديد."
        actions={
          <button
            onClick={() =>
              setDraft({
                ...EMPTY_OFFER,
                order: offers.length + 1,
                createdBy: session?.email ?? "admin",
              })
            }
            className={BTN_GOLD}
            disabled={!can("offers.manage")}
          >
            <Plus className="h-4 w-4" /> إضافة عرض
          </button>
        }
      >
        <div className="space-y-2">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="flex flex-col gap-3 rounded-2xl border border-sand-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(201,146,42,0.12)] text-gold-600">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-ocean-900">{offer.titleAr}</p>
                  <p className="mt-0.5 text-[11px] text-sand-600">
                    {offer.type === "property_linked"
                      ? "مرتبط بعقار"
                      : offer.type === "general"
                        ? "عرض عام"
                        : "عرض مخصص"}
                    {offer.discountPercent ? ` • خصم ${offer.discountPercent}%` : ""}
                    {offer.newPrice ? ` • ${format(offer.newPrice)}` : ""}
                    {offer.startDate || offer.endDate
                      ? ` • ${offer.startDate || "…"} → ${offer.endDate || "…"}`
                      : " • بدون حد زمني"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    updateOffer(offer.id, { enabled: !offer.enabled });
                    onOffersChange(getOffers());
                    notify(offer.enabled ? "تم تعطيل العرض" : "تم تفعيل العرض");
                  }}
                  className={`${ROW_ACTION} ${
                    offer.enabled
                      ? "border-emerald-200 text-emerald-700"
                      : "border-sand-200 text-sand-600"
                  }`}
                  disabled={!can("offers.manage")}
                >
                  {offer.enabled ? "مفعّل" : "معطّل"}
                </button>
                <button
                  onClick={() => {
                    addOffer({
                      ...offer,
                      titleAr: `${offer.titleAr} (نسخة)`,
                      createdBy: session?.email ?? "admin",
                      order: offers.length + 1,
                    });
                    onOffersChange(getOffers());
                    notify("تم إنشاء نسخة من العرض");
                  }}
                  className={ROW_ACTION}
                  disabled={!can("offers.manage")}
                >
                  <Copy className="h-3 w-3" /> نسخ
                </button>
                <button
                  onClick={() => setDraft(offer)}
                  className={ROW_ACTION}
                  disabled={!can("offers.manage")}
                >
                  <Pencil className="h-3 w-3" /> تعديل
                </button>
                <button
                  onClick={() => {
                    if (confirm(`حذف العرض «${offer.titleAr}»؟`)) {
                      deleteOffer(offer.id);
                      onOffersChange(getOffers());
                      if (session) {
                        addAdminLog({
                          action: "offers.delete",
                          category: "offers",
                          performedBy: session.email,
                          performedByName: session.name,
                          performedByRole: session.role ?? "admin",
                          details: `حذف عرض: ${offer.titleAr}`,
                        });
                        reloadLogs();
                      }
                      notify("تم حذف العرض");
                    }
                  }}
                  className={`${ROW_ACTION} border-red-200 text-red-700`}
                  disabled={!can("offers.manage")}
                >
                  <Trash2 className="h-3 w-3" /> حذف
                </button>
              </div>
            </div>
          ))}
          {offers.length === 0 && (
            <p className="rounded-2xl border border-dashed border-sand-200 p-8 text-center text-sm text-sand-600">
              لا توجد عروض بعد. اضغط «إضافة عرض» لإنشاء أول عرض.
            </p>
          )}
        </div>
      </Panel>

      {draft && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ocean-950/60 p-4 py-10">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-black text-ocean-900">
                {draft.id ? "تعديل عرض" : "إضافة عرض جديد"}
              </h3>
              <button onClick={() => setDraft(null)}>
                <X className="h-5 w-5 text-sand-600" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="عنوان العرض (عربي)">
                <input
                  value={draft.titleAr ?? ""}
                  onChange={(event) => setDraft({ ...draft, titleAr: event.target.value })}
                  className={INPUT}
                />
              </Field>
              <Field label="Offer title (English)">
                <input
                  value={draft.titleEn ?? ""}
                  onChange={(event) => setDraft({ ...draft, titleEn: event.target.value })}
                  className={INPUT}
                />
              </Field>
              <Field label="نوع العرض">
                <select
                  value={draft.type ?? "general"}
                  onChange={(event) =>
                    setDraft({ ...draft, type: event.target.value as Offer["type"] })
                  }
                  className={INPUT}
                >
                  <option value="general">عرض عام</option>
                  <option value="property_linked">مرتبط بعقار</option>
                  <option value="custom">عرض مخصص</option>
                </select>
              </Field>
              {draft.type === "property_linked" && (
                <Field label="العقار المرتبط">
                  <select
                    value={draft.propertyId ?? ""}
                    onChange={(event) => {
                      const property = mockProperties.find((item) => item.id === event.target.value);
                      setDraft({
                        ...draft,
                        propertyId: event.target.value,
                        propertyTitle: property?.title,
                      });
                    }}
                    className={INPUT}
                  >
                    <option value="">اختر العقار</option>
                    {mockProperties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title} — {property.city}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="الوصف (عربي)">
                <textarea
                  rows={3}
                  value={draft.descriptionAr ?? ""}
                  onChange={(event) => setDraft({ ...draft, descriptionAr: event.target.value })}
                  className={INPUT}
                />
              </Field>
              <Field label="Description (English)">
                <textarea
                  rows={3}
                  value={draft.descriptionEn ?? ""}
                  onChange={(event) => setDraft({ ...draft, descriptionEn: event.target.value })}
                  className={INPUT}
                />
              </Field>
              <Field label="نسبة الخصم %">
                <input
                  type="number"
                  value={draft.discountPercent ?? ""}
                  onChange={(event) =>
                    setDraft({ ...draft, discountPercent: Number(event.target.value) })
                  }
                  className={INPUT}
                />
              </Field>
              <Field label="شارة العرض (عربي)">
                <input
                  value={draft.badgeTextAr ?? ""}
                  onChange={(event) => setDraft({ ...draft, badgeTextAr: event.target.value })}
                  className={INPUT}
                  placeholder="مثال: عرض العيد"
                />
              </Field>
              <Field label="السعر قبل الخصم">
                <input
                  type="number"
                  value={draft.oldPrice ?? ""}
                  onChange={(event) => setDraft({ ...draft, oldPrice: Number(event.target.value) })}
                  className={INPUT}
                />
              </Field>
              <Field label="السعر بعد الخصم">
                <input
                  type="number"
                  value={draft.newPrice ?? ""}
                  onChange={(event) => setDraft({ ...draft, newPrice: Number(event.target.value) })}
                  className={INPUT}
                />
              </Field>
              <Field label="تاريخ بداية العرض">
                <input
                  type="date"
                  value={draft.startDate ?? ""}
                  onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
                  className={INPUT}
                />
              </Field>
              <Field label="تاريخ نهاية العرض">
                <input
                  type="date"
                  value={draft.endDate ?? ""}
                  onChange={(event) => setDraft({ ...draft, endDate: event.target.value })}
                  className={INPUT}
                />
              </Field>
              <Field label="رابط الصورة">
                <input
                  value={draft.image ?? ""}
                  onChange={(event) => setDraft({ ...draft, image: event.target.value })}
                  className={INPUT}
                  placeholder="https://…"
                />
              </Field>
              <Field label="الترتيب">
                <input
                  type="number"
                  value={draft.order ?? 1}
                  onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })}
                  className={INPUT}
                />
              </Field>
            </div>

            <div className="mt-4">
              <ToggleRow
                title="العرض مفعّل"
                checked={draft.enabled !== false}
                onChange={(value) => setDraft({ ...draft, enabled: value })}
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDraft(null)}
                className="rounded-full border border-sand-200 px-4 py-2 text-sm font-bold text-sand-700"
              >
                إلغاء
              </button>
              <button onClick={saveDraft} className={BTN_PRIMARY}>
                <Save className="h-4 w-4" /> حفظ العرض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
