import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPropertyById, mockProperties } from "@/data/properties";
import PropertyDetailClient from "@/components/PropertyDetailClient";
import { DEFAULT_CURRENCY, formatConvertedPrice } from "@/lib/currency-data";

interface PageProps {
  params: { id: string };
}

/** معرّف إعلان أضافه مستخدم — يُحلّ على العميل من التخزين المحلي */
const USER_PROPERTY_ID = /^user-\d+$/;

export function generateStaticParams() {
  return mockProperties.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const property = getPropertyById(params.id);
  if (!property) {
    return { title: "تفاصيل العقار | عقار FAMILY" };
  }
  /* التوليد على السيرفر لا يملك وصولاً لتفضيل العملة المحفوظ محلياً، لذا تُستخدم EGP كعملة افتراضية */
  const price = formatConvertedPrice(
    property.price,
    DEFAULT_CURRENCY,
    "ar"
  );
  return {
    title: `${property.title} | عقار FAMILY`,
    description: `${property.title} في ${property.district}، ${property.city} — ${price}`,
  };
}

export default function PropertyPage({ params }: PageProps) {
  const property = getPropertyById(params.id);
  /* أي معرّف غير معروف وغير تابع لإعلانات المستخدمين = 404 حقيقي
     بدل صفحة 200 فارغة (soft-404) */
  if (!property && !USER_PROPERTY_ID.test(params.id)) notFound();
  return (
    <PropertyDetailClient
      id={params.id}
      /* لا تُمرَّر بيانات تواصل المالك للعميل — كل التواصل عبر إدارة الموقع */
      initialProperty={property ? { ...property, whatsapp: "" } : undefined}
    />
  );
}
