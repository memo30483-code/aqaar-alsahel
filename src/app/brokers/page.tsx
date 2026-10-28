import type { Metadata } from "next";
import ProfessionalDirectory from "@/components/professionals/ProfessionalDirectory";

export const metadata: Metadata = {
  title: "المسوقون والوسطاء العقاريون المعتمدون | عقار FAMILY",
  description:
    "دليل مكاتب الوساطة والمسوقين العقاريين المعتمدين في مدن الدلتا، مع فيديوهاتهم التعريفية وكل تواصل عبر إدارة المنصة.",
};

export default function BrokersPage() {
  return <ProfessionalDirectory kind="marketer" />;
}
