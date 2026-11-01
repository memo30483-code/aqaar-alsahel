import type { Metadata } from "next";
import ProfessionalProfile from "@/components/professionals/ProfessionalProfile";
import PageStyleScope from "@/components/builder/PageStyleScope";

export const metadata: Metadata = {
  title: "ملف مكتب هندسي معتمد | عقار FAMILY",
  description:
    "صفحة المكتب الهندسي المعتمد: بيانات المكتب، سابقة الأعمال المنشورة بعد اعتماد الإدارة، والفيديوهات التعريفية.",
};

export default function EngineerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <PageStyleScope pageId="engineer">
      <ProfessionalProfile kind="engineer" id={params.id} />
    </PageStyleScope>
  );
}
