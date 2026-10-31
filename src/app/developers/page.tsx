import type { Metadata } from "next";
import PageRenderer from "@/components/builder/PageRenderer";

export const metadata: Metadata = {
  title: "المطورون العقاريون المعتمدون | عقار FAMILY",
  description:
    "دليل شركات التطوير العقاري المعتمدة في مدن الدلتا بعد مراجعة المستندات، مع مشروعاتها وفيديوهاتها التعريفية.",
};

export default function DevelopersPage() {
  return <PageRenderer pageId="developers" />;
}
