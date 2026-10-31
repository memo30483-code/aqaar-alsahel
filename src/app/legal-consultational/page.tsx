import type { Metadata } from "next";
import PageRenderer from "@/components/builder/PageRenderer";

export const metadata: Metadata = {
  title: "الاستشارات القانونية | المحامون المعتمدون | عقار FAMILY",
  description:
    "استشارات قانونية مع محامين معتمدين، مراجعة العقود والملكية قبل الدفع.",
};

export default function LegalConsultationPage() {
  return <PageRenderer pageId="legal-consultational" />;
}
