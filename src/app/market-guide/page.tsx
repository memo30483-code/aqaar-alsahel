import type { Metadata } from "next";
import MarketGuideContent from "./MarketGuideContent";

export const metadata: Metadata = {
  title: "البوصلة العقارية | عقار الساحل",
  description:
    "الدليل الاقتصادي والعقاري لمدن الساحل والدلتا: مؤشر أسعار المتر للشقق والفيلات، تحليل الطلب الاستثماري، وتقييم الكمبوندات في رأس البر، دمياط الجديدة، دمياط القديمة، المنصورة الجديدة وجمصة.",
};

export default function MarketGuidePage() {
  return <MarketGuideContent />;
}
