"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cities,
  CITY_CENTERS,
  propertyTypes,
  sellerTypes,
  USER_PROPERTIES_KEY,
} from "@/data/properties";
import { City, Property, PropertyType, SellerType } from "@/types/property";
import { formatPrice } from "@/lib/format";
import LocationPickerDynamic from "@/components/LocationPickerDynamic";

interface FormState {
  title: string;
  city: City | "";
  district: string;
  area: string;
  price: string;
  rooms: string;
  sellerType: SellerType | "";
  whatsapp: string;
  description: string;
  type: PropertyType | "";
  lat: number;
  lng: number;
  imageName: string;
  imagePreview: string;
}

const initial: FormState = {
  title: "",
  city: "",
  district: "",
  area: "",
  price: "",
  rooms: "",
  sellerType: "",
  whatsapp: "",
  description: "",
  type: "",
  lat: CITY_CENTERS["دمياط الجديدة"].lat,
  lng: CITY_CENTERS["دمياط الجديدة"].lng,
  imageName: "",
  imagePreview: "",
};

export default function AddPropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (form.city && CITY_CENTERS[form.city]) {
      const c = CITY_CENTERS[form.city];
      setForm((prev) => ({ ...prev, lat: c.lat, lng: c.lng }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.city]);

  const set =
    (key: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((prev) => ({
        ...prev,
        imageName: file.name,
        imagePreview: String(reader.result),
      }));
    reader.readAsDataURL(file);
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
      setError("من فضلك أكمل كل الحقول المطلوبة.");
      return;
    }
    if (Number(form.area) <= 0 || Number(form.price) <= 0) {
      setError("المساحة والسعر يجب أن يكونا أكبر من صفر.");
      return;
    }

    setError("");

    const id = `user-${Date.now()}`;
    const image =
      form.imagePreview || `https://picsum.photos/seed/${id}/800/600`;

    const property: Property = {
      id,
      title: form.title.trim(),
      city: form.city,
      district: form.district.trim(),
      type: form.type,
      area: Number(form.area),
      rooms: Number(form.rooms) || 0,
      bathrooms: 1,
      price: Number(form.price),
      sellerType: form.sellerType,
      whatsapp: form.whatsapp.trim(),
      description: form.description.trim(),
      image,
      images: [image],
      lat: form.lat,
      lng: form.lng,
    };

    const stored = localStorage.getItem(USER_PROPERTIES_KEY);
    const list: Property[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem(
      USER_PROPERTIES_KEY,
      JSON.stringify([...list, property])
    );

    // تأكيد الحفظ ثم تحويل تلقائي للصفحة الرئيسية لرؤية العقار
    setSaved(true);
    setTimeout(() => router.push("/"), 700);
  };

  const fieldClass =
    "w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black";
  const labelClass = "mb-1.5 block text-xs font-bold text-gray-700";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <span className="inline-flex rounded-full bg-black px-3 py-1.5 text-[11px] font-bold text-white">
          نشر مجاني في النسخة التجريبية
        </span>
        <h1 className="mt-4 text-3xl font-black text-gray-900 sm:text-4xl">
          أضف عقارك
        </h1>
        <p className="mt-3 text-sm leading-7 text-gray-600">
          املأ بيانات العرض وسيظهر العقار فوراً في الصفحة الرئيسية والنتائج
          والخريطة.
        </p>
      </div>

      {saved && (
        <div className="mb-5 rounded-3xl border border-green-200 bg-green-50 px-5 py-4">
          <p className="text-sm font-bold text-green-800">
            تم حفظ العقار بنجاح — جاري تحويلك للصفحة الرئيسية...
          </p>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-7 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
      >
        {/* بيانات الإعلان */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-900">بيانات الإعلان</h2>

          <label className="block">
            <span className={labelClass}>عنوان الإعلان *</span>
            <input
              required
              value={form.title}
              onChange={set("title")}
              placeholder="مثال: شقة فاخرة مطلّة على البحر"
              className={fieldClass}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>المدينة *</span>
              <select
                required
                value={form.city}
                onChange={set("city")}
                className={fieldClass}
              >
                <option value="">اختر المدينة</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>الحي *</span>
              <input
                required
                value={form.district}
                onChange={set("district")}
                placeholder="مثال: الحي الأول"
                className={fieldClass}
              />
            </label>
          </div>
        </section>

        {/* تفاصيل العقار */}
        <section className="space-y-4 border-t border-gray-100 pt-6">
          <h2 className="text-sm font-bold text-gray-900">تفاصيل العقار</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className={labelClass}>نوع العقار *</span>
              <select
                required
                value={form.type}
                onChange={set("type")}
                className={fieldClass}
              >
                <option value="">اختر</option>
                {propertyTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>المساحة (م²) *</span>
              <input
                required
                type="number"
                min={1}
                value={form.area}
                onChange={set("area")}
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>السعر (ج.م) *</span>
              <input
                required
                type="number"
                min={1}
                value={form.price}
                onChange={set("price")}
                className={fieldClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>عدد الغرف *</span>
              <input
                required
                type="number"
                min={0}
                value={form.rooms}
                onChange={set("rooms")}
                className={fieldClass}
              />
            </label>
          </div>

          {pricePerMeter !== null && (
            <p className="rounded-2xl bg-blue-50 px-4 py-3 text-xs font-bold text-gray-800">
              سعر المتر المحسوب: {formatPrice(pricePerMeter)} ج.م
            </p>
          )}

          <label className="block">
            <span className={labelClass}>وصف العقار *</span>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={set("description")}
              placeholder="اكتب وصفاً واضحاً للعقار والمميزات..."
              className={fieldClass}
            />
          </label>
        </section>

        {/* بيانات التواصل */}
        <section className="space-y-4 border-t border-gray-100 pt-6">
          <h2 className="text-sm font-bold text-gray-900">بيانات التواصل</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>نوع البائع *</span>
              <select
                required
                value={form.sellerType}
                onChange={set("sellerType")}
                className={fieldClass}
              >
                <option value="">اختر</option>
                {sellerTypes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>رقم الواتساب *</span>
              <input
                required
                type="tel"
                value={form.whatsapp}
                onChange={set("whatsapp")}
                placeholder="2010xxxxxxxx"
                className={fieldClass}
                dir="ltr"
              />
            </label>
          </div>
        </section>

        {/* الصورة والموقع */}
        <section className="space-y-5 border-t border-gray-100 pt-6">
          <label className="block">
            <span className={labelClass}>صورة العقار</span>
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <input
                type="file"
                accept="image/*"
                onChange={onImage}
                className="w-full text-sm text-gray-700 file:ml-3 file:rounded-xl file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
              />
              {form.imagePreview && (
                <div className="mt-3 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imagePreview}
                    alt="معاينة"
                    className="h-40 w-full object-cover"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    {form.imageName}
                  </p>
                </div>
              )}
            </div>
          </label>

          <div>
            <span className={labelClass}>الموقع على الخريطة *</span>
            <p className="mb-2 text-xs text-gray-500">
              اضغط على الخريطة أو اسحب العلامة لتحديد الموقع بدقة
            </p>
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <LocationPickerDynamic
                city={form.city}
                lat={form.lat}
                lng={form.lng}
                onChange={(lat, lng) =>
                  setForm((prev) => ({ ...prev, lat, lng }))
                }
              />
            </div>
            <p className="mt-2 text-xs text-gray-500" dir="ltr">
              {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
            </p>
          </div>
        </section>

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
          <button
            type="submit"
            disabled={saved}
            className="rounded-full bg-black px-8 py-3.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {saved ? "جاري الحفظ..." : "حفظ العقار ونشره"}
          </button>
          <Link
            href="/"
            className="rounded-full border border-gray-200 px-6 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
