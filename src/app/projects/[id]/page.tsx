import type { Metadata } from "next";
import ProjectDetailClient from "@/components/projects/ProjectDetailClient";
import PageStyleScope from "@/components/builder/PageStyleScope";
import JsonLd from "@/components/JsonLd";
import { findSeoProject } from "@/lib/seo-data";
import { absoluteUrl } from "@/lib/site-url";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const found = await findSeoProject(id);
  if (!found) {
    return {
      title: "تفاصيل المشروع | عقار FAMILY",
      robots: { index: false, follow: false },
    };
  }
  const { project, professional } = found;
  const description =
    project.descriptionAr ||
    `${project.titleAr} من ${professional.companyAr || professional.nameAr}`;
  return {
    title: `${project.titleAr} | عقار FAMILY`,
    description,
    alternates: { canonical: `/projects/${encodeURIComponent(project.id)}` },
    openGraph: {
      type: "website",
      url: `/projects/${encodeURIComponent(project.id)}`,
      title: `${project.titleAr} | عقار FAMILY`,
      description,
      ...(project.coverUrl
        ? { images: [{ url: project.coverUrl, alt: project.titleAr }] }
        : {}),
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  const found = await findSeoProject(id);
  return (
    <PageStyleScope pageId="project">
      {found && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: found.project.titleAr,
            description: found.project.descriptionAr,
            image: found.project.coverUrl,
            url: absoluteUrl(
              `/projects/${encodeURIComponent(found.project.id)}`
            ),
            brand: {
              "@type": "Organization",
              name:
                found.professional.companyAr || found.professional.nameAr,
            },
            ...(found.project.priceFrom
              ? {
                  offers: {
                    "@type": "Offer",
                    priceCurrency: "EGP",
                    price: found.project.priceFrom.replace(/[^0-9.]/g, ""),
                  },
                }
              : {}),
          }}
        />
      )}
      <ProjectDetailClient id={id} />
    </PageStyleScope>
  );
}
