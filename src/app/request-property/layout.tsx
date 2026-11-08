import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "اطلب عقارك | عقار FAMILY",
  description:
    "أرسل مواصفات العقار الذي تبحث عنه واحصل على ترشيحات ذكية من الإعلانات العقارية المنشورة والمعتمدة.",
};

export default function RequestPropertyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
