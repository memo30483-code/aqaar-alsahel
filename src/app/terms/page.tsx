import type { Metadata } from "next";
import ComplianceContent from "@/components/ComplianceContent";
import PageStyleScope from "@/components/builder/PageStyleScope";

export const metadata: Metadata = {
  title: "الشروط والأحكام | عقار FAMILY",
  description:
    "شروط استخدام منصة عقار FAMILY، وقواعد نشر الإعلانات، والتوثيق المستقل عن الإعلانات المدفوعة، والتواصل عبر إدارة الموقع فقط.",
};

export default function TermsPage() {
  return (
    <PageStyleScope pageId="terms">
      <ComplianceContent kind="terms" />
    </PageStyleScope>
  );
}
