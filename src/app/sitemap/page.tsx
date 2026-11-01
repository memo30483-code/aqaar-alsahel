import type { Metadata } from "next";
import SitemapContent from "@/components/SitemapContent";
import PageStyleScope from "@/components/builder/PageStyleScope";

export const metadata: Metadata = {
  title: "خريطة الموقع | عقار FAMILY",
  description:
    "خريطة موقع عقار FAMILY: العقارات، المدن المعتمدة، البوصلة العقارية، الاستشارات القانونية، وإدارة الحساب.",
};

export default function SitemapPage() {
  return (
    <PageStyleScope pageId="sitemap">
      <SitemapContent />
    </PageStyleScope>
  );
}
