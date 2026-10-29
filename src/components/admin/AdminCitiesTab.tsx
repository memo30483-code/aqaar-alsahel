"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  useAllCities,
  type CityDemand,
  type CityRecord,
} from "@/lib/cities-store";
import { dataSource } from "@/lib/data";
import { addAdminLog, getListings } from "@/lib/admin-system";
import { getSession } from "@/lib/session";
import {
  BTN_PRIMARY,
  Field,
  INPUT,
  Panel,
  ROW_ACTION,
} from "@/components/admin/shared";

interface Props {
  can: (key: string) => boolean;
  notify: (message: string) => void;
  reloadLogs: () => void;
}

interface FormState {
  nameAr: string;
  nameEn: string;
  lat: string;
  lng: string;
  zoom: string;
  active: boolean;
  demand: CityDemand;
  summaryAr: string;
  summaryEn: string;
}

const EMPTY_FORM: FormState = {
  nameAr: "",
  nameEn: "",
  lat: "31.44",
  lng: "31.67",
  zoom: "12",
  active: true,
  demand: "مستقر",
  summaryAr: "",
  summaryEn: "",
};

const DEMAND_OPTIONS: CityDemand[] = ["مرتفع", "موسمي", "مستقر"];

function formFromCity(city: CityRecord): FormState {
  return {
    nameAr: city.nameAr,
    nameEn: city.nameEn,
    lat: String(city.lat),
    lng: String(city.lng),
    zoom: String(city.zoom),
    active: city.active,
    demand: city.demand ?? "مستقر",
    summaryAr: city.summaryAr ?? "",
    summaryEn: city.summaryEn ?? "",
  };
}

export default function AdminCitiesTab({ can, notify, reloadLogs }: Props) {
  const cities = useAllCities();
  const canManage = can("site.settings");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  /** عدد الإعلانات المرتبطة بكل مدينة (تحذير قبل الحذف النهائي) */
  const listingCounts: Record<string, number> = {};
  getListings().forEach((listing) => {
    if (listing.status === "deleted") return;
    listingCounts[listing.city] = (listingCounts[listing.city] ?? 0) + 1;
  });

  const editingCity = editingId
    ? cities.find((city) => city.id === editingId) ?? null
    : null;
  const confirmCity = confirmId
    ? cities.find((city) => city.id === confirmId) ?? null
    : null;

  const log = (action: string, details: string) => {
    const session = getSession();
    if (!session) return;
    addAdminLog({
      action,
      category: "site",
      performedBy: session.email,
      performedByName: session.name,
      performedByRole: session.role ?? "admin",
      details,
    });
    reloadLogs();
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setFormOpen(true);
  };

  const openEdit = (city: CityRecord) => {
    setEditingId(city.id);
    setForm(formFromCity(city));
    setError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setError("");
  };

  const submit = async () => {
    /* الفراغ ليس صفراً — نرسل NaN ليرفضه التحقق بدل إنشاء مدينة عند 0,0 */
    const parseCoord = (value: string) => (value.trim() === "" ? NaN : Number(value));
    const payload = {
      nameAr: form.nameAr,
      nameEn: form.nameEn,
      lat: parseCoord(form.lat),
      lng: parseCoord(form.lng),
      zoom: Number(form.zoom) || 12,
      active: form.active,
      demand: form.demand,
      summaryAr: form.summaryAr,
      summaryEn: form.summaryEn,
    };

    if (!Number.isFinite(payload.lat) || !Number.isFinite(payload.lng)) {
      setError("أدخل خط العرض وخط الطول للمدينة");
      return;
    }

    /* الكتابة عبر منفذ البيانات — نفس السلوك الآن، وقاعدة بيانات لاحقاً */
    const port = dataSource().cities;
    const result = editingId
      ? await port.update(editingId, payload)
      : await port.add(payload);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    log(
      editingId ? "city.updated" : "city.added",
      `${editingId ? "تعديل" : "إضافة"} مدينة: ${result.city.nameAr}`
    );
    notify(editingId ? "تم حفظ تعديلات المدينة" : "تمت إضافة المدينة");
    closeForm();
  };

  const toggleActive = async (city: CityRecord) => {
    if (!(await dataSource().cities.setActive(city.id, !city.active))) {
      notify("تعذّر الحفظ — مساحة التخزين في المتصفح ممتلئة");
      return;
    }
    log(
      city.active ? "city.archived" : "city.activated",
      `${city.active ? "أرشفة/إخفاء" : "إعادة تفعيل"} مدينة: ${city.nameAr}`
    );
    notify(city.active ? "تم إخفاء المدينة عن الزوار" : "تم تفعيل المدينة");
  };

  const move = async (city: CityRecord, direction: "up" | "down") => {
    if (!(await dataSource().cities.move(city.id, direction))) return;
    log("city.reordered", `تغيير ترتيب مدينة: ${city.nameAr}`);
  };

  const archiveInstead = async () => {
    if (!confirmCity) return;
    if (!(await dataSource().cities.setActive(confirmCity.id, false))) {
      notify("تعذّر الحفظ — مساحة التخزين في المتصفح ممتلئة");
      return;
    }
    log("city.archived", `أرشفة مدينة بدل الحذف: ${confirmCity.nameAr}`);
    notify("تمت أرشفة المدينة — إعلاناتها محفوظة ويمكن إعادة تفعيلها");
    setConfirmId(null);
  };

  const confirmDelete = async () => {
    if (!confirmCity) return;
    if (!(await dataSource().cities.remove(confirmCity.id))) {
      notify("تعذّر الحذف — مساحة التخزين في المتصفح ممتلئة");
      return;
    }
    log("city.deleted", `حذف نهائي لمدينة: ${confirmCity.nameAr}`);
    notify("تم حذف المدينة نهائياً");
    setConfirmId(null);
  };

  return (
    <Panel
      title="المدن"
      desc="إضافة المدن وتعديلها وترتيبها وإخفاؤها أو حذفها. كل قوائم المدن في المنصة (الفلاتر، البحث، الخريطة، دليل السوق، الموقع، وإضافة العقار) تُحدَّث تلقائياً من هنا."
      actions={
        <button
          type="button"
          onClick={openCreate}
          disabled={!canManage}
          className={BTN_PRIMARY}
        >
          <Plus className="h-4 w-4" /> إضافة مدينة
        </button>
      }
    >
      {/* نموذج الإضافة/التعديل */}
      {formOpen && (
        <div className="mb-5 rounded-2xl border border-gold-200 bg-gold-50/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-[13px] font-black text-ocean-900">
              <MapPin className="h-4 w-4 text-gold-600" />
              {editingCity ? `تعديل: ${editingCity.nameAr}` : "مدينة جديدة"}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-sand-200 bg-white p-1.5 text-sand-600 transition hover:text-ocean-900"
              aria-label="إغلاق"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="الاسم بالعربية *">
              <input
                value={form.nameAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, nameAr: event.target.value }))
                }
                placeholder="مثال: بلطيم"
                className={INPUT}
              />
            </Field>
            <Field label="الاسم بالإنجليزية">
              <input
                value={form.nameEn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, nameEn: event.target.value }))
                }
                placeholder="Baltim"
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="مؤشر الطلب">
              <select
                value={form.demand}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    demand: event.target.value as CityDemand,
                  }))
                }
                className={INPUT}
              >
                {DEMAND_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="خط العرض (Latitude)">
              <input
                value={form.lat}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, lat: event.target.value }))
                }
                inputMode="decimal"
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="خط الطول (Longitude)">
              <input
                value={form.lng}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, lng: event.target.value }))
                }
                inputMode="decimal"
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="تكبير الخريطة" hint="من 8 إلى 16">
              <input
                value={form.zoom}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, zoom: event.target.value }))
                }
                inputMode="numeric"
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="نبذة عربية (اختياري)" hint="تظهر في دليل السوق بدل الوصف العام">
              <textarea
                value={form.summaryAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, summaryAr: event.target.value }))
                }
                rows={2}
                className={INPUT}
              />
            </Field>
            <Field label="نبذة إنجليزية (اختياري)">
              <textarea
                value={form.summaryEn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, summaryEn: event.target.value }))
                }
                rows={2}
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                onClick={() =>
                  setForm((prev) => ({ ...prev, active: !prev.active }))
                }
                className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-[12px] font-bold transition ${
                  form.active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-sand-200 bg-white text-sand-600"
                }`}
              >
                <span>{form.active ? "ظاهرة للزوار" : "مخفية (مؤرشفة)"}</span>
                <span
                  className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                    form.active ? "bg-emerald-500" : "bg-sand-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                      form.active ? "start-[18px]" : "start-0.5"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {editingCity && (
            <p className="mt-3 rounded-xl border border-sand-200 bg-white/70 px-3 py-2 text-[10.5px] font-semibold leading-5 text-sand-600">
              تغيير الاسم العربي يُحدّث اسم المدينة داخل إعلانات المستخدمين
              المحفوظة تلقائياً. إعلانات البيانات التجريبية تبقى بالاسم القديم.
            </p>
          )}

          {error && (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] font-bold text-rose-700">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={!canManage}
              className={BTN_PRIMARY}
            >
              <Check className="h-4 w-4" />
              {editingCity ? "حفظ التعديلات" : "إضافة المدينة"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className={ROW_ACTION}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* تأكيد الحذف — خيارا الأرشفة والحذف النهائي */}
      {confirmCity && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
          <p className="flex items-center gap-2 text-[13px] font-black text-rose-800">
            <Trash2 className="h-4 w-4" />
            حذف مدينة «{confirmCity.nameAr}»
          </p>
          <p className="mt-1.5 text-[11.5px] font-semibold leading-6 text-rose-700">
            {(listingCounts[confirmCity.nameAr] ?? 0) > 0
              ? `يوجد ${listingCounts[confirmCity.nameAr]} إعلان مرتبط بهذه المدينة. الأرشفة تُخفي المدينة من القوائم وتحفظ الإعلانات، أما الحذف النهائي فلا يمكن التراجع عنه.`
              : "لا توجد إعلانات مرتبطة بهذه المدينة. يمكنك الأرشفة أو الحذف النهائي."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={archiveInstead}
              className="inline-flex items-center gap-1.5 rounded-full bg-ocean-950 px-4 py-2 text-[12px] font-black text-white transition hover:bg-ocean-900"
            >
              أرشفة بدل الحذف (مستحسن)
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-white px-4 py-2 text-[12px] font-black text-rose-700 transition hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> حذف نهائي
            </button>
            <button
              type="button"
              onClick={() => setConfirmId(null)}
              className={ROW_ACTION}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* قائمة المدن */}
      <div className="space-y-2.5">
        {cities.map((city, index) => {
          const count = listingCounts[city.nameAr] ?? 0;
          return (
            <div
              key={city.id}
              className={`rounded-2xl border p-3.5 transition ${
                city.active
                  ? "border-sand-200 bg-white"
                  : "border-dashed border-sand-300 bg-sand-50/70"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sand-100 text-[11px] font-black text-sand-700">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[13px] font-black text-ocean-900">
                    {city.nameAr}
                    <span className="text-[10.5px] font-semibold text-sand-500" dir="ltr">
                      {city.nameEn}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                        city.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-sand-200 text-sand-700"
                      }`}
                    >
                      {city.active ? "ظاهرة" : "مخفية"}
                    </span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] font-semibold text-sand-500">
                    <span dir="ltr">
                      {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {count} إعلان
                    </span>
                    <span aria-hidden>·</span>
                    <span>طلب {city.demand ?? "مستقر"}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => move(city, "up")}
                    disabled={!canManage || index === 0}
                    className={`${ROW_ACTION} disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-label={`تحريك ${city.nameAr} لأعلى`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(city, "down")}
                    disabled={!canManage || index === cities.length - 1}
                    className={`${ROW_ACTION} disabled:cursor-not-allowed disabled:opacity-40`}
                    aria-label={`تحريك ${city.nameAr} لأسفل`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(city)}
                    disabled={!canManage}
                    className={ROW_ACTION}
                  >
                    {city.active ? "أرشفة/إخفاء" : "تفعيل"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(city)}
                    disabled={!canManage}
                    className={ROW_ACTION}
                  >
                    <Pencil className="h-3 w-3" /> تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(city.id)}
                    disabled={!canManage}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3 w-3" /> حذف
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {cities.length === 0 && (
          <p className="rounded-2xl border border-dashed border-sand-200 p-8 text-center text-sm text-sand-600">
            لا توجد مدن مسجّلة. اضغط «إضافة مدينة» للبدء.
          </p>
        )}
      </div>

      <p className="mt-4 rounded-xl border border-sand-200 bg-sand-50/70 px-3 py-2 text-[10.5px] font-semibold leading-5 text-sand-600">
        ملاحظة: المدن المخفية لا تظهر في القوائم العامة، لكن إعلاناتها تظل
        محفوظة وتظهر عند الوصول إليها مباشرة. حذف المدينة نهائياً لا يحذف
        إعلاناتها، لكنه يفصلها عن قوائم المدينة.
      </p>
    </Panel>
  );
}
