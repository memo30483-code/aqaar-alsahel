import type { Metadata } from "next";
import PageRenderer from "@/components/builder/PageRenderer";

export const metadata: Metadata = {
  title: "الاستشارات الهندسية | المكاتب الهندسية المعتمدة | عقار FAMILY",
  description:
    "استشارات هندسية مع مكاتب معتمدة: فحص فني للوحدة قبل الشراء، مراجعة الرسومات، والإشراف على التنفيذ والتشطيب.",
};

export default function EngineeringConsultationPage() {
  return <PageRenderer pageId="engineering-consultational" />;
}
