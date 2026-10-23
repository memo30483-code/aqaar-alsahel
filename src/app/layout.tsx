import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedAds from "@/components/FeaturedAds";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "عقار الساحل | سوق عقارات الساحل المفتوح",
  description:
    "بيع واشتري عقارات مباشرة في رأس البر ودمياط الجديدة ودمياط القديمة والمنصورة الجديدة وجمصة — شقق، فلل، محلات وأراضي.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans antialiased`}>
        <Header />
        <main>{children}</main>
        <Footer />
        <FeaturedAds />
      </body>
    </html>
  );
}
