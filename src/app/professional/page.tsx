import type { Metadata } from "next";
import ProfessionalDashboard from "@/components/professionals/ProfessionalDashboard";

export const metadata: Metadata = {
  title: "لوحة المهني | عقار FAMILY",
  description:
    "لوحة المطور أو المسوق أو المحامي: تعديل الملف، رفع اللوجو والصورة، وإضافة المشاريع والريلز بانتظار اعتماد الإدارة.",
};

export default function ProfessionalDashboardPage() {
  return <ProfessionalDashboard />;
}
