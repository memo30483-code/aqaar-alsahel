import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "طلباتي العقارية | عقار FAMILY",
  description:
    "متابعة طلبات العقار الخاصة بك وعرض أحدث العقارات المطابقة من الإعلانات المعتمدة.",
  robots: { index: false, follow: false },
};

export default function MyRequestsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
