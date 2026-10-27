import type { Metadata } from "next";
import SitemapContent from "@/components/SitemapContent";

export const metadata: Metadata = {
  title: "خريطة الموقع | عقار FAMILY",
  description:
    "خريطة موقع عقار FAMILY: العقارات، المدن الست، البوصلة العقارية، الاستشارات القانونية، وإدارة الحساب.",
};

export default function SitemapPage() {
  return <SitemapContent />;
}
