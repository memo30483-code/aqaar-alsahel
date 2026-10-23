import type { Metadata } from "next";
import { getPropertyById, mockProperties } from "@/data/properties";
import PropertyDetailClient from "@/components/PropertyDetailClient";
import { formatPrice } from "@/lib/format";

interface PageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return mockProperties.map((p) => ({ id: p.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const property = getPropertyById(params.id);
  if (!property) {
    return { title: "تفاصيل العقار | عقار الساحل" };
  }
  return {
    title: `${property.title} | عقار الساحل`,
    description: `${property.title} في ${property.district}، ${property.city} — ${formatPrice(property.price)} ج.م`,
  };
}

export default function PropertyPage({ params }: PageProps) {
  return (
    <PropertyDetailClient
      id={params.id}
      initialProperty={getPropertyById(params.id)}
    />
  );
}
