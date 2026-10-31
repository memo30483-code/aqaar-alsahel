import type { Metadata } from "next";
import PageRenderer from "@/components/builder/PageRenderer";

export const metadata: Metadata = {
  title: "المكاتب الهندسية المعتمدة | عقار FAMILY",
  description:
    "دليل المكاتب الهندسية المعتمدة بعد مراجعة نقابة المهندسين والسجل التجاري، مع سابقة أعمال موثقة وخدمات فحص فني وإشراف على التنفيذ.",
};

export default function EngineersPage() {
  return <PageRenderer pageId="engineers" />;
}
