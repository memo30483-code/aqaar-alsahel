"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  FileText,
  ImagePlus,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { sellerTypes, USER_PROPERTIES_KEY } from "@/data/properties";
import {
  City,
  Property,
  PropertyType,
  Purpose,
  SellerType,
} from "@/types/property";
import { useT, type MessageKey } from "@/lib/i18n";
import { CITY_NAMES, cityCenter, cityLabel } from "@/lib/i18n/cities";
import {
  PROPERTY_TYPES,
  propertyTypeLabel,
  sellerTypeLabel,
} from "@/lib/i18n/taxonomy";
import { useCurrency } from "@/lib/currency";
import { getSession } from "@/lib/session";
import LocationPickerDynamic from "@/components/LocationPickerDynamic";

interface FormState {
  title: string;
  purpose: Purpose;
  city: City | "";
  district: string;
  area: string;
  price: string;
  rooms: string;
  bathrooms: string;
  sellerType: SellerType | "";
  whatsapp: string;
  description: string;
  type: PropertyType | "";
  lat: number;
  lng: number;
  imageName: string;
  imagePreview: string;
}

const START_CENTER = cityCenter("دمياط الجديدة");

/** أرقام مصرية محلية (01xxxxxxxxx) أو دولية (201xxxxxxxxx) أو بدون الصفر */
const WHATSAPP_PATTERN = /^(20)?0?1[0125]\d{8}$/;

/** تحويل رقم الواتساب إلى الصيغة الدولية 20xxxxxxxxxx أو null عند عدم الصلاحية */
function normalizeWhatsApp(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!WHATSAPP_PATTERN.test(digits)) return null;
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return `20${digits}`;
}

/** قراءة الإعلانات المحفوظة بأمان — أي تلف في التخزين لا يعطّل الحفظ */
function readUserProperties(): Property[] {
  try {
    const stored = localStorage.getItem(USER_PROPERTIES_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as Property[]) : [];
  } catch {
    return [];
  }
}

/** ضغط الصورة قبل تخزينها كـ base64 لتقليل حجم localStorage */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const source = String(reader.result ?? "");
      if (!source) {
        resolve("");
        return;
      }
      const image = new Image();
      image.onerror = () => resolve(source);
      image.onload = () => {
        try {
          const scale = Math.min(
            1,
            1400 / Math.max(image.width, image.height)
          );
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            resolve(source);
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        } catch {
          resolve(source);
        }
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}

const initial: FormState = {
  title: "",
  purpose: "بيع",
  city: "",
  district: "",
  area: "",
  price: "",
  rooms: "",
  bathrooms: "1",
  sellerType: "",
  whatsapp: "",
  description: "",
  type: "",
  lat: START_CENTER.lat,
  lng: START_CENTER.lng,
  imageName: "",
  imagePreview: "",
};

const FIELD =
  "w-full rounded-xl border border-sand-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-ocean-900 outline-none transition placeholder:font-medium placeholder:text-sand-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60";
const LABEL = "mb-1.5 block text-[11px] font-extrabold text-sand-700";

/** عنوان قسم مرقّم داخل النموذج */
function SectionHead({
  step,
  title,
  desc,
  Icon,
}: {
  step: string;
  title: string;
  desc?: string;
  Icon: typeof FileText;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#141a33,#2d3875)] text-white">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-600">
          {step}
        </p>
        <h2 className="text-[15px] font-black text-ocean-900">{title}</h2>
        {desc && <p className="mt-0.5 text-[11.5px] text-sand-700">{desc}</p>}
      </div>
    </div>
  );
}

export default function AddPropertyPage() {
  const router = useRouter();
  const t = useT();
  const { formatWithSymbol } = useCurrency();
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<MessageKey | "">("");
  const [saved, setSaved] = useState(false);
  const [checking, setChecking] = useState(true);

  /** Auth Guard — يعرض null (لا محتوى) حتى يكتمل التحقق */
  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login?redirect=/add-property");
      return;
    }
    setChecking(false);
  }, [router]);

  useEffect(() => {
    if (!form.city) return;
    const center = cityCenter(form.city);
    setForm((prev) => ({ ...prev, lat: center.lat, lng: center.lng }));
  }, [form.city]);

  /** Auth Guard — لا تعرض الفورم إلا بعد تأكيد وجود جلسة */
  if (checking) {
    return (
      <div className="flex min-h-[60vh] flex-1 items-center justify-center bg-sand-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sand-300 border-t-gold-500" />
      </div>
    );
  }

  const set =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("addProperty.errorImageType");
      return;
    }
    setError("");
    const preview = await compressImage(file);
    setForm((prev) => ({
      ...prev,
      imageName: file.name,
      imagePreview: preview,
    }));
  };

  const pricePerMeter =
    Number(form.price) > 0 && Number(form.area) > 0
      ? Math.round(Number(form.price) / Number(form.area))
      : null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (
      !form.title.trim() ||
      !form.city ||
      !form.district.trim() ||
      !form.type ||
      !form.sellerType ||
      !form.whatsapp.trim() ||
      !form.description.trim()
    ) {
      setError("addProperty.errorRequired");
      return;
    }
    if (Number(form.area) <= 0 || Number(form.price) <= 0) {
      setError("addProperty.errorPositive");
      return;
    }

    const whatsapp = normalizeWhatsApp(form.whatsapp);
    if (!whatsapp) {
      setError("addProperty.errorWhatsapp");
      return;
    }

    setError("");

    const id = `user-${Date.now()}`;
    const image =
      form.imagePreview || `https://picsum.photos/seed/${id}/800/600`;

    const property: Property = {
      id,
      title: form.title.trim(),
      purpose: form.purpose,
      city: form.city,
      district: form.district.trim(),
      type: form.type,
      area: Number(form.area),
      rooms: Number(form.rooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      price: Number(form.price),
      sellerType: form.sellerType,
      whatsapp,
      description: form.description.trim(),
      image,
      images: [image],
      lat: form.lat,
      lng: form.lng,
    };

    const list = readUserProperties();
    try {
      localStorage.setItem(
        USER_PROPERTIES_KEY,
        JSON.stringify([...list, property])
      );
    } catch {
      setError("addProperty.errorStorage");
      return;
    }

    // تأكيد الحفظ ثم تحويل تلقائي للصفحة الرئيسية لرؤية العقار
    setSaved(true);
    setTimeout(() => router.push("/"), 700);
  };

  const steps = [
    { title: t("addProperty.steps.1.title"), desc: t("addProperty.steps.1.desc") },
    { title: t("addProperty.steps.2.title"), desc: t("addProperty.steps.2.desc") },
    { title: t("addProperty.steps.3.title"), desc: t("addProperty.steps.3.desc") },
  ];

  return (
    <div className="bg-sand-50">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 sm:py-10">
        {/* ====================== HERO ====================== */}
        <header className="relative overflow-hidden rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_30px_80px_-70px_rgba(20,26,51,0.6)] sm:p-7">
          <span
            aria-hidden
            className="pointer-events-none absolute -end-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(201,146,42,0.16),transparent_65%)]"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-300/70 bg-gold-50 px-3 py-1 text-[10.5px] font-black text-gold-800">
              <Sparkles className="h-3.5 w-3.5" />
              {t("addProperty.badge")}
            </span>
            <p className="mt-3 flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-600">
              <span aria-hidden className="h-px w-6 bg-gold-400/70" />
              {t("addProperty.eyebrow")}
            </p>
            <h1 className="mt-1.5 text-[26px] font-black leading-9 text-ocean-900 sm:text-[32px] sm:leading-[44px]">
              {t("addProperty.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-[12.5px] leading-7 text-sand-800">
              {t("addProperty.subtitle")}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {[
                { Icon: ShieldCheck, label: t("home.listings.verified") },
                { Icon: Lock, label: t("addProperty.privacy.title") },
                { Icon: MapPin, label: t("home.hero.place") },
              ].map(({ Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-sand-50 px-3 py-1 text-[10.5px] font-bold text-ocean-800"
                >
                  <Icon className="h-3.5 w-3.5 text-gold-600" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </header>

        {saved && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={3} />
            <p className="text-[12.5px] font-bold text-emerald-800">
              {t("addProperty.saved")}
            </p>
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_336px]">
          {/* ====================== FORM ====================== */}
          <form onSubmit={onSubmit} className="space-y-4">
            {/* ---------- بيانات الإعلان ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <SectionHead
                step="01"
                title={t("addProperty.sectionListing")}
                Icon={FileText}
              />

              <div className="mt-4 space-y-3.5">
                <label className="block">
                  <span className={LABEL}>
                    {t("addProperty.fieldTitle")}
                  </span>
                  <input
                    required
                    value={form.title}
                    onChange={set("title")}
                    placeholder={t("addProperty.titlePlaceholder")}
                    className={FIELD}
                  />
                </label>

                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block">
                    <span className={LABEL}>
                      {t("addProperty.fieldPurpose")}
                    </span>
                    <select
                      required
                      value={form.purpose}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          purpose: e.target.value as Purpose,
                        }))
                      }
                      className={FIELD}
                    >
                      <option value="بيع">{t("purpose.buy")}</option>
                      <option value="إيجار">{t("purpose.rent")}</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className={LABEL}>
                      {t("addProperty.fieldCity")}
                    </span>
                    <select
                      required
                      value={form.city}
                      onChange={set("city")}
                      className={FIELD}
                    >
                      <option value="">{t("addProperty.cityPlaceholder")}</option>
                      {CITY_NAMES.map((c) => (
                        <option key={c} value={c}>
                          {cityLabel(c, t)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className={LABEL}>
                      {t("addProperty.fieldDistrict")}
                    </span>
                    <input
                      required
                      value={form.district}
                      onChange={set("district")}
                      placeholder={t("addProperty.districtPlaceholder")}
                      className={FIELD}
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* ---------- تفاصيل العقار ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <SectionHead
                step="02"
                title={t("addProperty.sectionDetails")}
                Icon={ShieldCheck}
              />

              <div className="mt-4 space-y-3.5">
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block">
                    <span className={LABEL}>
                      {t("addProperty.fieldType")}
                    </span>
                    <select
                      required
                      value={form.type}
                      onChange={set("type")}
                      className={FIELD}
                    >
                      <option value="">{t("addProperty.select")}</option>
                      {PROPERTY_TYPES.map((pt) => (
                        <option key={pt} value={pt}>
                          {propertyTypeLabel(pt, t)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className={LABEL}>
                      {t("addProperty.fieldArea")}
                    </span>
                    <input
                      required
                      type="number"
                      min={1}
                      value={form.area}
                      onChange={set("area")}
                      className={FIELD}
                    />
                  </label>

                  <label className="block">
                    <span className={LABEL}>
                      {t("addProperty.fieldPrice")}
                    </span>
                    <input
                      required
                      type="number"
                      min={1}
                      value={form.price}
                      onChange={set("price")}
                      className={FIELD}
                    />
                  </label>

                  <label className="block">
                    <span className={LABEL}>
                      {t("addProperty.fieldRooms")}
                    </span>
                    <input
                      required
                      type="number"
                      min={0}
                      value={form.rooms}
                      onChange={set("rooms")}
                      className={FIELD}
                    />
                  </label>

                  <label className="block">
                    <span className={LABEL}>
                      {t("addProperty.fieldBathrooms")}
                    </span>
                    <input
                      required
                      type="number"
                      min={0}
                      value={form.bathrooms}
                      onChange={set("bathrooms")}
                      className={FIELD}
                    />
                  </label>
                </div>

                {pricePerMeter !== null && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gold-200/70 bg-gold-50/60 px-4 py-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-gold-800">
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("addProperty.priceHint")}
                    </span>
                    <span className="text-[14px] font-black text-ocean-900">
                      {formatWithSymbol(pricePerMeter)}
                    </span>
                  </div>
                )}

                <label className="block">
                  <span className={LABEL}>
                    {t("addProperty.fieldDescription")}
                  </span>
                  <textarea
                    required
                    rows={4}
                    value={form.description}
                    onChange={set("description")}
                    placeholder={t("addProperty.descriptionPlaceholder")}
                    className={FIELD}
                  />
                </label>
              </div>
            </section>

            {/* ---------- بيانات التواصل ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <SectionHead
                step="03"
                title={t("addProperty.sectionContact")}
                desc={t("addProperty.privacy.desc")}
                Icon={Lock}
              />

              <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <label className="block">
                  <span className={LABEL}>
                    {t("addProperty.fieldSellerType")}
                  </span>
                  <select
                    required
                    value={form.sellerType}
                    onChange={set("sellerType")}
                    className={FIELD}
                  >
                    <option value="">{t("addProperty.select")}</option>
                    {sellerTypes.map((s) => (
                      <option key={s} value={s}>
                        {sellerTypeLabel(s, t)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={LABEL}>
                    {t("addProperty.fieldWhatsapp")}
                  </span>
                  <input
                    required
                    type="tel"
                    value={form.whatsapp}
                    onChange={set("whatsapp")}
                    placeholder="2010xxxxxxxx"
                    className={FIELD}
                    dir="ltr"
                  />
                </label>
              </div>
            </section>

            {/* ---------- الصورة والموقع ---------- */}
            <section className="rounded-3xl border border-sand-200 bg-white p-5 shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)] sm:p-6">
              <SectionHead
                step="04"
                title={t("addProperty.sectionImage")}
                Icon={Camera}
              />

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className={LABEL}>{t("addProperty.fieldImage")}</span>
                  <div className="rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 p-4 transition hover:border-gold-400/70 hover:bg-gold-50/30">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sand-200 bg-white text-gold-600">
                        <ImagePlus className="h-5 w-5" />
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onImage}
                        className="w-full text-[12px] font-semibold text-sand-800 file:me-3 file:rounded-lg file:border-0 file:bg-ocean-950 file:px-3.5 file:py-2 file:text-[11.5px] file:font-bold file:text-white"
                      />
                    </div>
                    {form.imagePreview && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-sand-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={form.imagePreview}
                          alt={t("addProperty.imageAlt")}
                          className="h-44 w-full object-cover"
                        />
                        <p className="bg-white px-3 py-2 text-[11px] font-semibold text-sand-700">
                          {form.imageName}
                        </p>
                      </div>
                    )}
                  </div>
                </label>

                <div>
                  <span className={LABEL}>{t("addProperty.fieldLocation")}</span>
                  <p className="mb-2 text-[11px] font-medium text-sand-600">
                    {t("addProperty.locationHint")}
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-sand-200">
                    <LocationPickerDynamic
                      city={form.city}
                      lat={form.lat}
                      lng={form.lng}
                      onChange={(lat, lng) =>
                        setForm((prev) => ({ ...prev, lat, lng }))
                      }
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] font-bold text-sand-600" dir="ltr">
                    {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                  </p>
                </div>
              </div>
            </section>

            {error && (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12.5px] font-bold text-rose-700">
                {t(error)}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2.5 rounded-3xl border border-sand-200 bg-white p-4 sm:p-5">
              <button
                type="submit"
                disabled={saved}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-7 py-3 text-[13px] font-black text-ocean-950 shadow-[0_18px_38px_-24px_rgba(201,146,42,0.95)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-60"
              >
                {saved ? t("addProperty.saving") : t("addProperty.submit")}
              </button>
              <Link
                href="/"
                className="rounded-full border border-sand-200 px-6 py-3 text-[12.5px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/50"
              >
                {t("addProperty.cancel")}
              </Link>
            </div>
          </form>

          {/* ====================== SIDEBAR ====================== */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="rounded-3xl border border-sand-200 bg-white p-5">
              <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.18em] text-gold-600">
                <span aria-hidden className="h-px w-5 bg-gold-400/70" />
                {t("addProperty.steps.title")}
              </p>
              <ol className="mt-4 space-y-3.5">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold-300/70 bg-gold-50 text-[11px] font-black text-gold-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-[12.5px] font-extrabold text-ocean-900">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-5 text-sand-700">
                        {step.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-3xl border border-ocean-900/10 bg-ocean-950 p-5 text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold-300">
                <Lock className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[12.5px] font-black">
                {t("addProperty.privacy.title")}
              </p>
              <p className="mt-1.5 text-[11px] leading-6 text-white/70">
                {t("addProperty.privacy.desc")}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
