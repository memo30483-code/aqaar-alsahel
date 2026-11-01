import type { Metadata } from "next";
import ComplianceContent from "@/components/ComplianceContent";
import PageStyleScope from "@/components/builder/PageStyleScope";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | عقار FAMILY",
  description:
    "كيف تجمع منصة عقار FAMILY بيانات الحساب والإعلانات والمستندات وتستخدمها، وما يظهر للزوار وما يبقى للإدارة فقط.",
};

export default function PrivacyPage() {
  return (
    <PageStyleScope pageId="privacy">
      <ComplianceContent kind="privacy" />
    </PageStyleScope>
  );
}
