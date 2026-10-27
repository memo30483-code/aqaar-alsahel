import type { Metadata } from "next";
import ComplianceContent from "@/components/ComplianceContent";

export const metadata: Metadata = {
  title: "الشروط والأحكام | عقار FAMILY",
  description:
    "شروط استخدام منصة عقار FAMILY، وقواعد نشر الإعلانات، والتوثيق المستقل عن الإعلانات المدفوعة، والتواصل عبر إدارة الموقع فقط.",
};

export default function TermsPage() {
  return <ComplianceContent kind="terms" />;
}
