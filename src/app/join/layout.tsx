import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "انضم إلى دليل عقار FAMILY | عقار FAMILY",
  description:
    "سجّل كمطور عقاري أو مسوق أو محامٍ معتمد. يخضع الطلب لمراجعة الإدارة والمستندات قبل الظهور في الدليل.",
};

export default function JoinLayout({ children }: { children: ReactNode }) {
  return children;
}
