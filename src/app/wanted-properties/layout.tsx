import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "عقارات مطلوبة | عقار FAMILY",
  description:
    "طلبات شراء وإيجار عقارات وافقت إدارة عقار FAMILY على نشرها، مع الحفاظ الكامل على خصوصية بيانات العملاء.",
};

export default function WantedPropertiesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
