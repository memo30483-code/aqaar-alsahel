import type { Metadata } from "next";
import {
  findSeoProfessional,
  type SeoProfessional,
} from "@/lib/seo-data";
import { absoluteUrl } from "@/lib/site-url";

export type SeoProfessionalKind = SeoProfessional["kind"];

const KIND_INFO: Record<
  SeoProfessionalKind,
  { path: string; fallback: string; type: "Person" | "Organization" }
> = {
  developer: {
    path: "/developers",
    fallback: "مطور عقاري معتمد",
    type: "Organization",
  },
  marketer: {
    path: "/brokers",
    fallback: "مسوق عقاري معتمد",
    type: "Organization",
  },
  lawyer: {
    path: "/lawyers",
    fallback: "محامٍ معتمد",
    type: "Person",
  },
  engineer: {
    path: "/engineers",
    fallback: "مكتب هندسي معتمد",
    type: "Organization",
  },
};

export async function professionalMetadata(
  kind: SeoProfessionalKind,
  id: string
): Promise<Metadata> {
  const record = await findSeoProfessional(kind, id);
  const info = KIND_INFO[kind];
  if (!record) {
    return {
      title: `${info.fallback} | عقار FAMILY`,
      robots: { index: false, follow: false },
    };
  }
  const name = record.companyAr || record.nameAr;
  const description =
    record.bioAr || record.titleAr || `${info.fallback} على منصة عقار FAMILY`;
  const path = `${info.path}/${encodeURIComponent(record.id)}`;
  const image = record.logoUrl || record.photoUrl;
  return {
    title: `${name} | عقار FAMILY`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "profile",
      url: path,
      title: `${name} | عقار FAMILY`,
      description,
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
  };
}

export function professionalJsonLd(record: SeoProfessional) {
  const info = KIND_INFO[record.kind];
  const name = record.companyAr || record.nameAr;
  return {
    "@context": "https://schema.org",
    "@type": info.type,
    name,
    alternateName: record.companyEn || record.nameEn,
    description: record.bioAr || record.titleAr,
    url: absoluteUrl(`${info.path}/${encodeURIComponent(record.id)}`),
    image: record.logoUrl || record.photoUrl,
    address: record.cityAr
      ? { "@type": "PostalAddress", addressLocality: record.cityAr }
      : undefined,
  };
}
