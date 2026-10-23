"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cities,
  CITY_CENTERS,
  propertyTypes,
  sellerTypes,
  USER_PROPERTIES_KEY,
} from "@/data/properties";
import { City, Property, PropertyType, SellerType } from "@/types/property";
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

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    const id = `user-${Date.now()}`;
    const image =
      form.imagePreview || `https://picsum.photos/seed/${id}/800/600`;

    const property: Property = {
      id,
      title: form.title.trim(),
      city: form.city as City,
      district: form.district.trim(),
      type: form.type as PropertyType,
      area: Number(form.area),
      rooms: Number(form.rooms),
      bathrooms: 1,
      price: Number(form.price),
      sellerType: form.sellerType as SellerType,
      whatsapp: form.whatsapp.trim(),
      description: form.description.trim(),
      image,
      images: [image],
      lat: form.lat,
      lng: form.lng,
    };

    const stored = localStorage.getItem(USER_PROPERTIES_KEY);
    const list: Property[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem(USER_PROPERTIES_KEY, JSON.stringify([...list, property]));

    router.push("/");
  };

  const fieldClass =
    "w-full rounded-xl border border-ocean-200 bg-white px-3 py-2.5 text-sm text-ocean-900 outline-none transition focus:border-ocean-500 focus:ring-2 focus:ring-ocean-200";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-ocean-900 sm:text-3xl">
          أضف عقارك
        </h1>
        <p className="mt-2 text-sm text-ocean-500">
          انشر إعلانك مباشرة على سوق الساحل المفتوح — بدون رسوم في النسخة التجريبية
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-8"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
            عنوان الإعلان *
          </span>
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
            <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
              المدينة *
            </span>
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
            <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
              الحي *
            </span>
            <input
              required
              value={form.district}
              onChange={set("district")}
              placeholder="مثال: الحي الأول"
              className={fieldClass}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
              نوع العقار *
            </span>
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
            <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
              المساحة (م²) *
            </span>
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
            <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
              السعر (ج.م) *
            </span>
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
            <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
              عدد الغرف *
            </span>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
              نوع البائع *
            </span>
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
            <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
              رقم الواتساب *
            </span>
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

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
            صورة العقار
          </span>
          <div className="rounded-xl border border-dashed border-ocean-300 bg-ocean-50/50 p-4">
            <input
              type="file"
              accept="image/*"
              onChange={onImage}
              className="w-full text-sm text-ocean-700 file:ml-3 file:rounded-lg file:border-0 file:bg-ocean-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            {form.imagePreview && (
              <div className="mt-3 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.imagePreview}
                  alt="معاينة"
                  className="h-40 w-full object-cover"
                />
                <p className="mt-1 text-xs text-ocean-500">{form.imageName}</p>
              </div>
            )}
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
            الوصف *
          </span>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={set("description")}
            placeholder="اكتب وصفاً واضحاً للعقار والمميزات..."
            className={fieldClass}
          />
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-ocean-600">
            الموقع على الخريطة *
          </span>
          <p className="mb-2 text-xs text-ocean-500">
            اضغط على الخريطة أو اسحب العلامة لتحديد الموقع
          </p>
          <LocationPickerDynamic
            city={form.city}
            lat={form.lat}
            lng={form.lng}
            onChange={(lat, lng) => setForm((prev) => ({ ...prev, lat, lng }))}
          />
          <p className="mt-2 text-xs text-ocean-500" dir="ltr">
            {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
          </p>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-ocean-700 py-3.5 text-sm font-bold text-white shadow-soft transition hover:bg-ocean-800 sm:w-auto sm:px-10"
        >
          نشر الإعلان
        </button>
      </form>
    </div>
  );
}
