import type { Metadata } from "next";
import PageRenderer from "@/components/builder/PageRenderer";

export const metadata: Metadata = {
  title: "المحامون المعتمدون | عقار FAMILY",
  description:
    "دليل المحامين المعتمدين بعد التحقق من كارنيه المحاماة، لفحص الملكية وصياغة العقود والتسجيل العقاري.",
};

export default function LawyersPage() {
  return <PageRenderer pageId="lawyers" />;
}
