"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Building2,
  Check,
  FileText,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  addCompany,
  removeCompany,
  setCompanyActive,
  setPrimaryCompany,
  updateCompany,
  useCompanies,
  type CompanyLicense,
  type CompanyRecord,
} from "@/lib/company-store";
import { addAdminLog } from "@/lib/admin-system";
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
  legalNameAr: string;
  legalNameEn: string;
  tradeNameAr: string;
  tradeNameEn: string;
  commercialRegister: string;
  taxCard: string;
  addressAr: string;
  addressEn: string;
  phones: string;
  emails: string;
  website: string;
  workingHoursAr: string;
  workingHoursEn: string;
  aboutAr: string;
  aboutEn: string;
  logoUrl: string;
  facebook: string;
  instagram: string;
  x: string;
  linkedin: string;
  youtube: string;
  tiktok: string;
  active: boolean;
  primary: boolean;
  licenses: CompanyLicense[];
}

const EMPTY_FORM: FormState = {
  legalNameAr: "",
  legalNameEn: "",
  tradeNameAr: "",
  tradeNameEn: "",
  commercialRegister: "",
  taxCard: "",
  addressAr: "",
  addressEn: "",
  phones: "",
  emails: "",
  website: "",
  workingHoursAr: "السبت – الخميس · 9 ص إلى 6 م",
  workingHoursEn: "Sat – Thu · 9 AM to 6 PM",
  aboutAr: "",
  aboutEn: "",
  logoUrl: "",
  facebook: "",
  instagram: "",
  x: "",
  linkedin: "",
  youtube: "",
  tiktok: "",
  active: true,
  primary: false,
  licenses: [],
};

function linesToArray(value: string): string[] {
  return value
    .split(/[\n,،;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToLines(value: string[]): string {
  return value.join("\n");
}

function formFromCompany(company: CompanyRecord): FormState {
  return {
    legalNameAr: company.legalNameAr,
    legalNameEn: company.legalNameEn,
    tradeNameAr: company.tradeNameAr,
    tradeNameEn: company.tradeNameEn,
    commercialRegister: company.commercialRegister,
    taxCard: company.taxCard,
    addressAr: company.addressAr,
    addressEn: company.addressEn,
    phones: arrayToLines(company.phones),
    emails: arrayToLines(company.emails),
    website: company.website ?? "",
    workingHoursAr: company.workingHoursAr,
    workingHoursEn: company.workingHoursEn,
    aboutAr: company.aboutAr,
    aboutEn: company.aboutEn,
    logoUrl: company.logoUrl ?? "",
    facebook: company.facebook ?? "",
    instagram: company.instagram ?? "",
    x: company.x ?? "",
    linkedin: company.linkedin ?? "",
    youtube: company.youtube ?? "",
    tiktok: company.tiktok ?? "",
    active: company.active,
    primary: company.primary,
    licenses: company.licenses.map((license) => ({ ...license })),
  };
}

function newLicense(): CompanyLicense {
  return {
    id: `license-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "",
    number: "",
    issuer: "",
    issuedAt: "",
    expiresAt: "",
    url: "",
  };
}

export default function AdminCompanyTab({ can, notify, reloadLogs }: Props) {
  const companies = useCompanies();
  const canManage = can("site.settings");

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const editingCompany = editingId
    ? companies.find((company) => company.id === editingId) ?? null
    : null;
  const confirmCompany = confirmId
    ? companies.find((company) => company.id === confirmId) ?? null
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
    setForm({ ...EMPTY_FORM, primary: companies.length === 0 });
    setError("");
    setFormOpen(true);
  };

  const openEdit = (company: CompanyRecord) => {
    setEditingId(company.id);
    setForm(formFromCompany(company));
    setError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setError("");
  };

  const submit = () => {
    const payload = {
      legalNameAr: form.legalNameAr,
      legalNameEn: form.legalNameEn,
      tradeNameAr: form.tradeNameAr,
      tradeNameEn: form.tradeNameEn,
      commercialRegister: form.commercialRegister,
      taxCard: form.taxCard,
      addressAr: form.addressAr,
      addressEn: form.addressEn,
      phones: linesToArray(form.phones),
      emails: linesToArray(form.emails),
      website: form.website,
      workingHoursAr: form.workingHoursAr,
      workingHoursEn: form.workingHoursEn,
      aboutAr: form.aboutAr,
      aboutEn: form.aboutEn,
      logoUrl: form.logoUrl,
      facebook: form.facebook,
      instagram: form.instagram,
      x: form.x,
      linkedin: form.linkedin,
      youtube: form.youtube,
      tiktok: form.tiktok,
      active: form.active,
      primary: form.primary,
      licenses: form.licenses.filter(
        (license) => license.name.trim() || license.number.trim()
      ),
    };

    const result = editingId
      ? updateCompany(editingId, payload)
      : addCompany(payload);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    log(
      editingId ? "company.updated" : "company.added",
      `${editingId ? "تعديل" : "إضافة"} بيانات شركة: ${result.company.legalNameAr}`
    );
    notify(editingId ? "تم حفظ بيانات الشركة" : "تمت إضافة الشركة");
    closeForm();
  };

  const toggleActive = (company: CompanyRecord) => {
    setCompanyActive(company.id, !company.active);
    log(
      company.active ? "company.archived" : "company.activated",
      `${company.active ? "إخفاء" : "إظهار"} شركة: ${company.legalNameAr}`
    );
    notify(company.active ? "تم إخفاء الشركة عن الزوار" : "تم إظهار الشركة");
  };

  const makePrimary = (company: CompanyRecord) => {
    setPrimaryCompany(company.id);
    log("company.primary", `تعيين الشركة المالكة: ${company.legalNameAr}`);
    notify("تم تعيين الشركة المالكة الرئيسية");
  };

  const confirmDelete = () => {
    if (!confirmCompany) return;
    const result = removeCompany(confirmCompany.id);
    if (!result.ok) {
      setError(result.error ?? "تعذّر حذف الشركة");
      setConfirmId(null);
      return;
    }
    log("company.deleted", `حذف بيانات شركة: ${confirmCompany.legalNameAr}`);
    notify("تم حذف بيانات الشركة");
    setConfirmId(null);
  };

  const updateLicense = (index: number, patch: Partial<CompanyLicense>) => {
    setForm((prev) => ({
      ...prev,
      licenses: prev.licenses.map((license, position) =>
        position === index ? { ...license, ...patch } : license
      ),
    }));
  };

  return (
    <Panel
      title="بيانات الشركة المالكة"
      desc="الكيان القانوني الذي يملك ويشغّل منصة عقار FAMILY. تظهر هذه البيانات في الفوتر وصفحة «بيانات الشركة» والصفحات القانونية. يمكنك إضافة أكثر من شركة، وتحديد شركة واحدة كمالك رئيسي."
      actions={
        <button
          type="button"
          onClick={openCreate}
          disabled={!canManage}
          className={BTN_PRIMARY}
        >
          <Plus className="h-4 w-4" /> إضافة شركة
        </button>
      }
    >
      {/* نموذج الإضافة/التعديل */}
      {formOpen && (
        <div className="mb-5 rounded-2xl border border-gold-200 bg-gold-50/40 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-[13px] font-black text-ocean-900">
              <Building2 className="h-4 w-4 text-gold-600" />
              {editingCompany
                ? `تعديل: ${editingCompany.legalNameAr}`
                : "شركة جديدة"}
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
            <Field label="الاسم القانوني بالعربية *">
              <input
                value={form.legalNameAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, legalNameAr: event.target.value }))
                }
                placeholder="شركة ... للاستثمار العقاري"
                className={INPUT}
              />
            </Field>
            <Field label="الاسم القانوني بالإنجليزية">
              <input
                value={form.legalNameEn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, legalNameEn: event.target.value }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="الاسم التجاري بالعربية">
              <input
                value={form.tradeNameAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, tradeNameAr: event.target.value }))
                }
                placeholder="عقار FAMILY"
                className={INPUT}
              />
            </Field>
            <Field label="الاسم التجاري بالإنجليزية">
              <input
                value={form.tradeNameEn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, tradeNameEn: event.target.value }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="رقم السجل التجاري">
              <input
                value={form.commercialRegister}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    commercialRegister: event.target.value,
                  }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="رقم البطاقة الضريبية">
              <input
                value={form.taxCard}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, taxCard: event.target.value }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="العنوان بالعربية">
              <input
                value={form.addressAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, addressAr: event.target.value }))
                }
                className={INPUT}
              />
            </Field>
            <Field label="العنوان بالإنجليزية">
              <input
                value={form.addressEn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, addressEn: event.target.value }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="الموقع الإلكتروني">
              <input
                value={form.website}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, website: event.target.value }))
                }
                placeholder="https://"
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="الهواتف" hint="رقم في كل سطر">
              <textarea
                value={form.phones}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, phones: event.target.value }))
                }
                rows={2}
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="البريد الإلكتروني" hint="بريد في كل سطر">
              <textarea
                value={form.emails}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, emails: event.target.value }))
                }
                rows={2}
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="أوقات العمل بالعربية">
              <input
                value={form.workingHoursAr}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    workingHoursAr: event.target.value,
                  }))
                }
                className={INPUT}
              />
            </Field>
            <Field label="أوقات العمل بالإنجليزية">
              <input
                value={form.workingHoursEn}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    workingHoursEn: event.target.value,
                  }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="رابط الشعار">
              <input
                value={form.logoUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, logoUrl: event.target.value }))
                }
                placeholder="https://"
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="فيسبوك">
              <input
                value={form.facebook}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, facebook: event.target.value }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="إنستجرام">
              <input
                value={form.instagram}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, instagram: event.target.value }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="X (تويتر)">
              <input
                value={form.x}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, x: event.target.value }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="لينكدإن">
              <input
                value={form.linkedin}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, linkedin: event.target.value }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="يوتيوب">
              <input
                value={form.youtube}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, youtube: event.target.value }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="تيك توك">
              <input
                value={form.tiktok}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, tiktok: event.target.value }))
                }
                dir="ltr"
                className={INPUT}
              />
            </Field>
            <Field label="نبذة بالعربية" hint="تظهر في صفحة بيانات الشركة والفوتر">
              <textarea
                value={form.aboutAr}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, aboutAr: event.target.value }))
                }
                rows={3}
                className={INPUT}
              />
            </Field>
            <Field label="نبذة بالإنجليزية">
              <textarea
                value={form.aboutEn}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, aboutEn: event.target.value }))
                }
                rows={3}
                dir="ltr"
                className={INPUT}
              />
            </Field>
          </div>

          {/* الترخيصات والسجلات */}
          <div className="mt-4 rounded-2xl border border-sand-200 bg-white/70 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[12px] font-black text-ocean-900">
                <FileText className="h-3.5 w-3.5 text-gold-600" />
                التراخيص والسجلات
              </p>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    licenses: [...prev.licenses, newLicense()],
                  }))
                }
                className={ROW_ACTION}
              >
                <Plus className="h-3 w-3" /> إضافة ترخيص
              </button>
            </div>

            {form.licenses.length === 0 ? (
              <p className="mt-2 text-[10.5px] text-sand-500">
                لا توجد تراخيص مسجّلة. أضف السجل التجاري والبطاقة الضريبية
                وأي تراخيص أخرى.
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {form.licenses.map((license, index) => (
                  <div
                    key={license.id}
                    className="grid gap-2 rounded-xl border border-sand-200 bg-sand-50/60 p-2.5 sm:grid-cols-2 lg:grid-cols-3"
                  >
                    <input
                      value={license.name}
                      onChange={(event) =>
                        updateLicense(index, { name: event.target.value })
                      }
                      placeholder="اسم الترخيص"
                      className={INPUT}
                    />
                    <input
                      value={license.number}
                      onChange={(event) =>
                        updateLicense(index, { number: event.target.value })
                      }
                      placeholder="الرقم"
                      dir="ltr"
                      className={INPUT}
                    />
                    <input
                      value={license.issuer ?? ""}
                      onChange={(event) =>
                        updateLicense(index, { issuer: event.target.value })
                      }
                      placeholder="جهة الإصدار"
                      className={INPUT}
                    />
                    <input
                      value={license.issuedAt ?? ""}
                      onChange={(event) =>
                        updateLicense(index, { issuedAt: event.target.value })
                      }
                      placeholder="تاريخ الإصدار"
                      className={INPUT}
                    />
                    <input
                      value={license.expiresAt ?? ""}
                      onChange={(event) =>
                        updateLicense(index, { expiresAt: event.target.value })
                      }
                      placeholder="تاريخ الانتهاء"
                      className={INPUT}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        value={license.url ?? ""}
                        onChange={(event) =>
                          updateLicense(index, { url: event.target.value })
                        }
                        placeholder="رابط الملف"
                        dir="ltr"
                        className={INPUT}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            licenses: prev.licenses.filter(
                              (_, position) => position !== index
                            ),
                          }))
                        }
                        className="shrink-0 rounded-lg border border-rose-200 bg-white p-2 text-rose-600 transition hover:bg-rose-50"
                        aria-label="حذف الترخيص"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* حالة الشركة */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              role="switch"
              aria-checked={form.active}
              onClick={() => setForm((prev) => ({ ...prev, active: !prev.active }))}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-[12px] font-bold transition ${
                form.active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-sand-200 bg-white text-sand-600"
              }`}
            >
              <span>{form.active ? "ظاهرة للزوار" : "مخفية"}</span>
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

            <button
              type="button"
              role="switch"
              aria-checked={form.primary}
              onClick={() => setForm((prev) => ({ ...prev, primary: !prev.primary }))}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-[12px] font-bold transition ${
                form.primary
                  ? "border-gold-300 bg-gold-50 text-gold-700"
                  : "border-sand-200 bg-white text-sand-600"
              }`}
            >
              <span>{form.primary ? "الشركة المالكة الرئيسية" : "شركة فرعية"}</span>
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                  form.primary ? "bg-gold-500" : "bg-sand-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                    form.primary ? "start-[18px]" : "start-0.5"
                  }`}
                />
              </span>
            </button>
          </div>

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
              {editingCompany ? "حفظ التعديلات" : "إضافة الشركة"}
            </button>
            <button type="button" onClick={closeForm} className={ROW_ACTION}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* تأكيد الحذف */}
      {confirmCompany && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
          <p className="flex items-center gap-2 text-[13px] font-black text-rose-800">
            <Trash2 className="h-4 w-4" />
            حذف بيانات «{confirmCompany.legalNameAr}»
          </p>
          <p className="mt-1.5 text-[11.5px] font-semibold leading-6 text-rose-700">
            سيتم حذف بيانات الشركة نهائياً. إن كانت هي الشركة المالكة الرئيسية
            سيتم تعيين شركة أخرى تلقائياً. لا يمكن حذف الشركة الوحيدة.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
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

      {/* قائمة الشركات */}
      <div className="space-y-2.5">
        {companies.map((company) => (
          <div
            key={company.id}
            className={`rounded-2xl border p-3.5 transition ${
              company.active
                ? "border-sand-200 bg-white"
                : "border-dashed border-sand-300 bg-sand-50/70"
            }`}
          >
            <div className="flex flex-wrap items-start gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                  company.primary
                    ? "bg-gold-100 text-gold-700"
                    : "bg-sand-100 text-sand-600"
                }`}
              >
                <Building2 className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-black text-ocean-900">
                  {company.tradeNameAr || company.legalNameAr}
                  {company.primary && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-[9.5px] font-black text-gold-700">
                      <Star className="h-2.5 w-2.5" /> المالكة
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${
                      company.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-sand-200 text-sand-700"
                    }`}
                  >
                    {company.active ? "ظاهرة" : "مخفية"}
                  </span>
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-sand-600">
                  {company.legalNameAr}
                  {company.legalNameEn && (
                    <span className="text-sand-400" dir="ltr">
                      {" · "}
                      {company.legalNameEn}
                    </span>
                  )}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] font-semibold text-sand-500">
                  <span>س.ت: {company.commercialRegister || "—"}</span>
                  <span aria-hidden>·</span>
                  <span>ضريبية: {company.taxCard || "—"}</span>
                  <span aria-hidden>·</span>
                  <span>{company.licenses.length} ترخيص</span>
                  <span aria-hidden>·</span>
                  <span>{company.phones.length} هاتف</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {!company.primary && (
                  <button
                    type="button"
                    onClick={() => makePrimary(company)}
                    disabled={!canManage}
                    className={ROW_ACTION}
                  >
                    <BadgeCheck className="h-3 w-3" /> تعيين كمالكة
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => toggleActive(company)}
                  disabled={!canManage}
                  className={ROW_ACTION}
                >
                  {company.active ? "إخفاء" : "إظهار"}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(company)}
                  disabled={!canManage}
                  className={ROW_ACTION}
                >
                  <Pencil className="h-3 w-3" /> تعديل
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(company.id)}
                  disabled={!canManage || companies.length <= 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-2 py-1 text-[11px] font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-3 w-3" /> حذف
                </button>
              </div>
            </div>
          </div>
        ))}

        {companies.length === 0 && (
          <p className="rounded-2xl border border-dashed border-sand-200 p-8 text-center text-sm text-sand-600">
            لا توجد بيانات شركة. اضغط «إضافة شركة» للبدء.
          </p>
        )}
      </div>

      <p className="mt-4 rounded-xl border border-sand-200 bg-sand-50/70 px-3 py-2 text-[10.5px] font-semibold leading-5 text-sand-600">
        ملاحظة: الشركة المالكة الرئيسية هي التي تظهر في الفوتر وصفحة بيانات
        الشركة. إخفاء الشركة يُخفي بياناتها عن الزوار دون حذفها، ويُستبعد أي
        إعلان أو بيانات مالك من هذا السجل تماماً.
      </p>
    </Panel>
  );
}
