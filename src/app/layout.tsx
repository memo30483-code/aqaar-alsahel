import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import AppProviders from "@/components/AppProviders";
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
  title: "عقار FAMILY | عقار أحلامك بثقة موثّقة",
  description:
    "سوق عقاري موثّق في رأس البر، دمياط، دمياط الجديدة، فارسكور، جمصة والمنصورة الجديدة — شقق، فلل، شاليهات، محلات وأراضي بعد التحقق من المستندات والسلامة القانونية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <AppProviders>
          <Header />
          <main className="flex-1 min-h-0 flex flex-col">{children}</main>
          <Footer />
          <FeaturedAds />
        </AppProviders>
      </body>
    </html>
  );
}
