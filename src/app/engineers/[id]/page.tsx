import type { Metadata } from "next";
import ProfessionalProfile from "@/components/professionals/ProfessionalProfile";
import PageStyleScope from "@/components/builder/PageStyleScope";

export const metadata: Metadata = {
  title: "ملف مكتب هندسي معتمد | عقار FAMILY",
  description:
    "صفحة المكتب الهندسي المعتمد: بيانات المكتب، سابقة الأعمال المنشورة بعد اعتماد الإدارة، والفيديوهات التعريفية.",
};

export default async function EngineerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageStyleScope pageId="engineer">
      <ProfessionalProfile kind="engineer" id={id} />
    </PageStyleScope>
  );
}
