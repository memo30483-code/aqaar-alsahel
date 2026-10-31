import type { Metadata } from "next";
import ProfessionalDirectory from "@/components/professionals/ProfessionalDirectory";

export const metadata: Metadata = {
  title: "المكاتب الهندسية المعتمدة | عقار FAMILY",
  description:
    "دليل المكاتب الهندسية المعتمدة بعد مراجعة نقابة المهندسين والسجل التجاري، مع سابقة أعمال موثقة وخدمات فحص فني وإشراف على التنفيذ.",
};

export default function EngineersPage() {
  return <ProfessionalDirectory kind="engineer" />;
}
