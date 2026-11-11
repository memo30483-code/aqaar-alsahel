import type { Metadata } from "next";
import ProfessionalProfile from "@/components/professionals/ProfessionalProfile";
import PageStyleScope from "@/components/builder/PageStyleScope";

export const metadata: Metadata = {
  title: "ملف مطور عقاري معتمد | عقار FAMILY",
  description:
    "صفحة المطور العقاري المعتمد: بيانات الشركة، المشاريع المنشورة بعد اعتماد الإدارة، والفيديوهات التعريفية.",
};

export default async function DeveloperProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageStyleScope pageId="developer">
      <ProfessionalProfile kind="developer" id={id} />
    </PageStyleScope>
  );
}
