"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import LocationPickerDynamic from "@/components/LocationPickerDynamic";

interface FormState {
  title: string;
  purpose: Purpose;
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

const START_CENTER = cityCenter("دمياط الجديدة");

const initial: FormState = {
  title: "",
  purpose: "بيع",
  city: "",
  district: "",
  area: "",
  price: "",
  rooms: "",
  sellerType: "",
  whatsapp: "",
  description: "",
  type: "",
  lat: START_CENTER.lat,
  lng: START_CENTER.lng,
  imageName: "",
  imagePreview: "",
};

export default function AddPropertyPage() {
  const router = useRouter();
  const t = useT();
  const { formatWithSymbol } = useCurrency();
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<MessageKey | "">("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!form.city) return;
    const center = cityCenter(form.city);
    setForm((prev) => ({ ...prev, lat: center.lat, lng: center.lng }));
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
      setError("addProperty.errorRequired");
      return;
    }
    if (Number(form.area) <= 0 || Number(form.price) <= 0) {
      setError("addProperty.errorPositive");
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
          {t("addProperty.badge")}
        </span>
        <h1 className="mt-4 text-3xl font-black text-gray-900 sm:text-4xl">
          {t("addProperty.title")}
        </h1>
        <p className="mt-3 text-sm leading-7 text-gray-600">
          {t("addProperty.subtitle")}
        </p>
      </div>

      {saved && (
        <div className="mb-5 rounded-3xl border border-green-200 bg-green-50 px-5 py-4">
          <p className="text-sm font-bold text-green-800">
            {t("addProperty.saved")}
          </p>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-7 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7"
      >
        {/* بيانات الإعلان */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-gray-900">
            {t("addProperty.sectionListing")}
          </h2>

          <label className="block">
            <span className={labelClass}>{t("addProperty.fieldTitle")}</span>
            <input
              required
              value={form.title}
              onChange={set("title")}
              placeholder={t("addProperty.titlePlaceholder")}
              className={fieldClass}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className={labelClass}>
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
                className={fieldClass}
              >
                <option value="بيع">{t("purpose.buy")}</option>
                <option value="إيجار">{t("purpose.rent")}</option>
              </select>
            </label>

            <label className="block">
              <span className={labelClass}>{t("addProperty.fieldCity")}</span>
              <select
                required
                value={form.city}
                onChange={set("city")}
                className={fieldClass}
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
              <span className={labelClass}>
                {t("addProperty.fieldDistrict")}
              </span>
              <input
                required
                value={form.district}
                onChange={set("district")}
                placeholder={t("addProperty.districtPlaceholder")}
                className={fieldClass}
              />
            </label>
          </div>
        </section>

        {/* تفاصيل العقار */}
        <section className="space-y-4 border-t border-gray-100 pt-6">
          <h2 className="text-sm font-bold text-gray-900">
            {t("addProperty.sectionDetails")}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className={labelClass}>{t("addProperty.fieldType")}</span>
              <select
                required
                value={form.type}
                onChange={set("type")}
                className={fieldClass}
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
              <span className={labelClass}>{t("addProperty.fieldArea")}</span>
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
              <span className={labelClass}>{t("addProperty.fieldPrice")}</span>
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
              <span className={labelClass}>{t("addProperty.fieldRooms")}</span>
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
              {t("addProperty.pricePerMeter", {
                price: formatWithSymbol(pricePerMeter),
              })}
            </p>
          )}

          <label className="block">
            <span className={labelClass}>
              {t("addProperty.fieldDescription")}
            </span>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={set("description")}
              placeholder={t("addProperty.descriptionPlaceholder")}
              className={fieldClass}
            />
          </label>
        </section>

        {/* بيانات التواصل */}
        <section className="space-y-4 border-t border-gray-100 pt-6">
          <h2 className="text-sm font-bold text-gray-900">
            {t("addProperty.sectionContact")}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>
                {t("addProperty.fieldSellerType")}
              </span>
              <select
                required
                value={form.sellerType}
                onChange={set("sellerType")}
                className={fieldClass}
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
              <span className={labelClass}>
                {t("addProperty.fieldWhatsapp")}
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
        </section>

        {/* الصورة والموقع */}
        <section className="space-y-5 border-t border-gray-100 pt-6">
          <label className="block">
            <span className={labelClass}>{t("addProperty.fieldImage")}</span>
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
                    alt={t("addProperty.imageAlt")}
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
            <span className={labelClass}>{t("addProperty.fieldLocation")}</span>
            <p className="mb-2 text-xs text-gray-500">
              {t("addProperty.locationHint")}
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
            {t(error)}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
          <button
            type="submit"
            disabled={saved}
            className="rounded-full bg-black px-8 py-3.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {saved ? t("addProperty.saving") : t("addProperty.submit")}
          </button>
          <Link
            href="/"
            className="rounded-full border border-gray-200 px-6 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            {t("addProperty.cancel")}
          </Link>
        </div>
      </form>
    </div>
  );
}
