import type { Metadata } from "next";
import ProfessionalProfile from "@/components/professionals/ProfessionalProfile";
import PageStyleScope from "@/components/builder/PageStyleScope";

export const metadata: Metadata = {
  title: "ملف مسوق عقاري معتمد | عقار FAMILY",
  description:
    "صفحة المسوق أو الوسيط العقاري المعتمد: بيانات المكتب، العروض المنشورة بعد اعتماد الإدارة، والفيديوهات التعريفية.",
};

export default async function BrokerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PageStyleScope pageId="broker">
      <ProfessionalProfile kind="marketer" id={id} />
    </PageStyleScope>
  );
}
