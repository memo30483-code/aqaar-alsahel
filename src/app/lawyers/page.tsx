import type { Metadata } from "next";
import ProfessionalDirectory from "@/components/professionals/ProfessionalDirectory";

export const metadata: Metadata = {
  title: "المحامون المعتمدون | عقار FAMILY",
  description:
    "دليل المحامين المعتمدين بعد التحقق من كارنيه المحاماة، لفحص الملكية وصياغة العقود والتسجيل العقاري في مدن الدلتا.",
};

export default function LawyersPage() {
  return <ProfessionalDirectory kind="lawyer" />;
}
