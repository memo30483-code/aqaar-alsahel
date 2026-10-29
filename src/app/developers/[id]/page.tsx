import type { Metadata } from "next";
import ProfessionalProfile from "@/components/professionals/ProfessionalProfile";

export const metadata: Metadata = {
  title: "ملف مطور عقاري معتمد | عقار FAMILY",
  description:
    "صفحة المطور العقاري المعتمد: بيانات الشركة، المشاريع المنشورة بعد اعتماد الإدارة، والفيديوهات التعريفية.",
};

export default function DeveloperProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return <ProfessionalProfile kind="developer" id={params.id} />;
}
