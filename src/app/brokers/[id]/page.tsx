import type { Metadata } from "next";
import ProfessionalProfile from "@/components/professionals/ProfessionalProfile";

export const metadata: Metadata = {
  title: "ملف مسوق عقاري معتمد | عقار FAMILY",
  description:
    "صفحة المسوق أو الوسيط العقاري المعتمد: بيانات المكتب، العروض المنشورة بعد اعتماد الإدارة، والفيديوهات التعريفية.",
};

export default function BrokerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  return <ProfessionalProfile kind="marketer" id={params.id} />;
}
