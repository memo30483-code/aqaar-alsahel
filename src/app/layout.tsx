import type { Metadata } from "next";
import { Amiri, Cairo, Readex_Pro, Tajawal } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import AppProviders from "@/components/AppProviders";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SiteWidgets from "@/components/SiteWidgets";
import MobileAppBanner from "@/components/MobileAppBanner";
import SeasonRibbon from "@/components/SeasonRibbon";
import CloudBridge from "@/components/CloudBridge";
import { THEME_BOOT_SCRIPT } from "@/lib/theme-season";
import { BRANDING_BOOT_SCRIPT } from "@/lib/branding";
import { cloudBootScript, loadCloudBoot } from "@/lib/cloud/boot";
import "./theme-css.css";
import "./globals.css";

/**
 * الصفحات تُبنى مسبقًا وتُحدَّث كل دقيقة من قاعدة البيانات،
 * كما تُحدَّث فورًا عند حفظ الأدمن (revalidatePath في /api/state).
 */
export const revalidate = 60;

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

/* خطوط إضافية يختار منها الأدمن داخل Builder الرئيسية */
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-readex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "عقار FAMILY | عقار أحلامك بثقة موثّقة",
  description:
    "سوق عقاري موثّق في رأس البر، دمياط، دمياط الجديدة، فارسكور، جمصة والمنصورة الجديدة — شقق، فلل، شاليهات، محلات وأراضي بعد التحقق من المستندات والسلامة القانونية.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* آخر حالة محفوظة في السحابة — تُحقن قبل أول رسم */
  const cloud = await loadCloudBoot();

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/*
          حقن الثيم قبل أول رسم من التخزين المحلي حتى لا يرى الزائر ومضة
          ألوان العلامة ثم يتبدّل الموسم بعد التحميل. السكربت ثابت ومولّد
          من نفس وحدة الثيم (بلا أي بيانات مستخدم).
          suppressHydrationWarning: السكربت يضيف data-season-theme/style على <html>
          قبل الـhydration — وهو السلوك المقصود لمنع الومضة.
        */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {/* حقن الهوية (الخطوط/الأحجام/ألوان العلامة/الفافيكون) قبل أول رسم */}
        <script dangerouslySetInnerHTML={{ __html: BRANDING_BOOT_SCRIPT }} />
        {/* حقن آخر حالة من قاعدة البيانات — يجعل تعديلات الأدمن عامة */}
        <script dangerouslySetInnerHTML={{ __html: cloudBootScript(cloud) }} />
      </head>
      <body
        className={`${cairo.variable} ${tajawal.variable} ${amiri.variable} ${readex.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <AppProviders>
          <ThemeProvider>
          <Header />
          {/* شريط الزخارف الموسمي — يظهر في الصفحات الداخلية فقط */}
          <SeasonRibbon />
          <main className="flex-1 min-h-0 flex flex-col">{children}</main>
          <Footer />
          <MobileAppBanner />
          <SiteWidgets />
          <CloudBridge />
          </ThemeProvider>
        </AppProviders>
      </body>
    </html>
  );
}
