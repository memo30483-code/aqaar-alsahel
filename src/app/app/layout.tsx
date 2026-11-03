import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "تطبيق عقار FAMILY | عقار أحلامك في جيبك",
  description:
    "تطبيق عقار FAMILY — نفس التوثيق وفحص المستندات على الموبايل: تنبيهات فورية، بحث بالخريطة، حفظ ومقارنة، وتواصل عبر الإدارة فقط.",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return children;
}
