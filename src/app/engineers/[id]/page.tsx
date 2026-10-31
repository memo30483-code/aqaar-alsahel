import type { Metadata } from "next";
import ProfessionalProfile from "@/components/professionals/ProfessionalProfile";

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
  return <ProfessionalProfile kind="engineer" id={params.id} />;
}
