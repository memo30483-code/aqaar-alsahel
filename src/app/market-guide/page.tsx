import type { Metadata } from "next";
import MarketGuideContent from "./MarketGuideContent";

export const metadata: Metadata = {
  title: "البوصلة العقارية | عقار FAMILY",
  description:
    "الدليل الاقتصادي والعقاري لمدن الدلتا: مؤشر أسعار المتر للشقق والفيلات، تحليل الطلب الاستثماري، وتقييم الكمبوندات في رأس البر، دمياط، دمياط الجديدة، فارسكور، جمصة والمنصورة الجديدة.",
};

export default function MarketGuidePage() {
  return <MarketGuideContent />;
}
