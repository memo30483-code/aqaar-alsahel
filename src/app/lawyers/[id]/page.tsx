import type { Metadata } from "next";
import ProfessionalProfile from "@/components/professionals/ProfessionalProfile";

export const metadata: Metadata = {
  title: "ملف محامٍ معتمد | عقار FAMILY",
  description:
    "صفحة المحامي المعتمد: الصورة الشخصية، لوجو المكتب، التخصصات، والفيديوهات التعريفية بعد اعتماد الإدارة.",
};

export default function LawyerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return <ProfessionalProfile kind="lawyer" id={params.id} />;
}
