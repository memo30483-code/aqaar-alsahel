import type { Metadata } from "next";
import ProfessionalProfile from "@/components/professionals/ProfessionalProfile";
import PageStyleScope from "@/components/builder/PageStyleScope";
import JsonLd from "@/components/JsonLd";
import { findSeoProfessional } from "@/lib/seo-data";
import { professionalJsonLd, professionalMetadata } from "@/lib/professional-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  return professionalMetadata("engineer", (await params).id);
}

export default async function EngineerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await findSeoProfessional("engineer", id);
  return (
    <PageStyleScope pageId="engineer">
      {record && <JsonLd data={professionalJsonLd(record)} />}
      <ProfessionalProfile kind="engineer" id={id} />
    </PageStyleScope>
  );
}
