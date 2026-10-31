import type { Metadata } from "next";
import PageRenderer from "@/components/builder/PageRenderer";

export const metadata: Metadata = {
  title: "بيانات الشركة المالكة | عقار FAMILY",
  description:
    "الكيان القانوني المالك لمنصة عقار FAMILY: الاسم القانوني والتجاري، السجل التجاري، البطاقة الضريبية، التراخيص، وبيانات التواصل الرسمية.",
};

export default function CompanyPage() {
  return <PageRenderer pageId="company" />;
}
