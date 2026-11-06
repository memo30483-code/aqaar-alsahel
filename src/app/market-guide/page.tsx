import type { Metadata } from "next";
import PageRenderer from "@/components/builder/PageRenderer";

export const metadata: Metadata = {
  title: "البوصلة العقارية | عقار FAMILY",
  description:
    "الدليل الاقتصادي والعقاري للمدن المعتمدة: مؤشر أسعار المتر للشقق والفيلات، تحليل الطلب الاستثماري، وتقييم الكمبوندات في رأس البر، دمياط، دمياط الجديدة، فارسكور، جمصة والمنصورة الجديدة.",
};

export default function MarketGuidePage() {
  return <PageRenderer pageId="market-guide" />;
}
