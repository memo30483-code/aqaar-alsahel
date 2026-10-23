"use client";

import Link from "next/link";
import { cities } from "@/data/properties";
import { Property } from "@/types/property";
import { formatArea, formatPrice } from "@/lib/format";
import ImageSlider from "./ImageSlider";
import InstallmentCard from "./InstallmentCard";
import PropertyDetailMapDynamic from "./PropertyDetailMapDynamic";

interface Props {
  property: Property;
}

export default function PropertyDetail({ property }: Props) {
  const pricePerMeter =
    property.area > 0 ? Math.round(property.price / property.area) : 0;
  const badge =
    property.type === "فيلا" || property.price >= 3_000_000
      ? "مميز"
      : "استلام فوري";
  const isApprovedCity = (cities as readonly string[]).includes(property.city);

  const specs = [
    { label: "المساحة", value: formatArea(property.area) },
    {
      label: "غرف",
      value:
        property.rooms > 0
          ? new Intl.NumberFormat("ar-EG").format(property.rooms)
          : "—",
    },
    {
      label: "حمامات",
      value:
        property.bathrooms > 0
          ? new Intl.NumberFormat("ar-EG").format(property.bathrooms)
          : "—",
    },
    { label: "النوع", value: property.type },
    { label: "المنطقة", value: property.district },
    { label: "المدينة", value: property.city },
    { label: "سعر المتر", value: `${formatPrice(pricePerMeter)} ج.م` },
    { label: "البائع", value: property.sellerType },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ocean-500">
        <Link href="/" className="hover:text-ocean-800">
          الرئيسية
        </Link>
        <span>/</span>
        <span className="text-ocean-400">{property.city}</span>
        <span>/</span>
        <span className="font-medium text-ocean-800 line-clamp-1">
          {property.title}
        </span>
      </nav>

      <ImageSlider images={property.images} title={property.title} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr] lg:items-start xl:grid-cols-[380px_1fr]">
        {/* في RTL العمود الأول يظهر يمين — كارت السعر والتواصل */}
        <InstallmentCard
          price={property.price}
          whatsapp={property.whatsapp}
          title={property.title}
        />

        <div className="space-y-6">
          <header className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-black px-2.5 py-1 text-xs font-bold text-white">
                {badge}
              </span>
              <span className="rounded-lg bg-ocean-100 px-2.5 py-1 text-xs font-bold text-ocean-800">
                {property.type}
              </span>
              <span className="rounded-lg bg-ocean-50 px-2.5 py-1 text-xs font-semibold text-ocean-600">
                {property.sellerType}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-ocean-900 sm:text-3xl">
              {property.title}
            </h1>
            <p className="mt-2 text-sm text-ocean-500">
              {property.district} · {property.city}
            </p>
            <p className="mt-3 text-lg font-bold text-ocean-700 lg:hidden">
              {formatPrice(property.price)} ج.م
            </p>
            <p className="mt-1 text-xs text-ocean-500 lg:hidden">
              سعر المتر التقديري{" "}
              <span className="font-bold text-ocean-700">
                {formatPrice(pricePerMeter)} ج.م
              </span>
            </p>
          </header>

          <section className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-bold text-ocean-900">التفاصيل</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-ocean-50 bg-ocean-50/40 px-3 py-3"
                >
                  <p className="text-xs font-semibold text-ocean-500">
                    {s.label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-ocean-900">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-ocean-900">
                المدينة والمنطقة
              </h2>
              {isApprovedCity && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  مدينة معتمدة
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-ocean-50 bg-ocean-50/40 px-4 py-3">
                <p className="text-xs font-semibold text-ocean-500">المدينة</p>
                <p className="mt-1 text-sm font-bold text-ocean-900">
                  {property.city}
                </p>
              </div>
              <div className="rounded-xl border border-ocean-50 bg-ocean-50/40 px-4 py-3">
                <p className="text-xs font-semibold text-ocean-500">المنطقة</p>
                <p className="mt-1 text-sm font-bold text-ocean-900">
                  {property.district}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs font-semibold text-ocean-500">
              المدن المعتمدة
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {cities.map((city) => (
                <span
                  key={city}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    city === property.city
                      ? "bg-ocean-700 text-white"
                      : "bg-ocean-50 text-ocean-600"
                  }`}
                >
                  {city}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-bold text-ocean-900">الوصف</h2>
            <p className="mt-3 leading-8 text-ocean-700">{property.description}</p>
          </section>

          <section className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-bold text-ocean-900">الموقع على الخريطة</h2>
            <p className="mt-1 text-sm text-ocean-500">
              {property.district}، {property.city}
            </p>
            <div className="mt-4">
              <PropertyDetailMapDynamic
                lat={property.lat}
                lng={property.lng}
                title={property.title}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
