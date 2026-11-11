import type { Metadata } from "next";
import ProfessionalProfile from "@/components/professionals/ProfessionalProfile";
import PageStyleScope from "@/components/builder/PageStyleScope";

export const metadata: Metadata = {
  title: "ملف محامٍ معتمد | عقار FAMILY",
  description:
    "صفحة المحامي المعتمد: الصورة الشخصية، لوجو المكتب، التخصصات، والفيديوهات التعريفية بعد اعتماد الإدارة.",
};

export default async function LawyerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageStyleScope pageId="lawyer">
      <ProfessionalProfile kind="lawyer" id={id} />
    </PageStyleScope>
  );
}
