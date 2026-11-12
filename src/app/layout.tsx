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
import TextStyleInjector from "@/components/TextStyleInjector";
import PageAddonBlocks from "@/components/builder/PageAddonBlocks";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, absoluteUrl } from "@/lib/site-url";
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
  preload: false,
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
  preload: false,
});

const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-readex",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "عقار FAMILY",
  title: "عقار FAMILY | عقار أحلامك بثقة موثّقة",
  description:
    "سوق عقاري موثّق في رأس البر، دمياط، دمياط الجديدة، فارسكور، جمصة والمنصورة الجديدة — شقق، فلل، شاليهات، محلات وأراضي بعد التحقق من المستندات والسلامة القانونية.",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "/",
    siteName: "عقار FAMILY",
    title: "عقار FAMILY | عقار أحلامك بثقة موثّقة",
    description:
      "عقارات موثّقة في مدن الساحل بعد مراجعة المستندات والسلامة القانونية والهندسية.",
    images: [
      {
        url: "/images/hero-property-handover.jpg",
        width: 1600,
        height: 900,
        alt: "عقار FAMILY — عقار أحلامك بثقة موثّقة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "عقار FAMILY | عقار أحلامك",
    description: "منصة عقارية موثّقة لمدن الساحل.",
    images: ["/images/hero-property-handover.jpg"],
  },
  category: "real estate",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "عقار FAMILY",
      alternateName: "Aqaar FAMILY",
      url: SITE_URL,
      logo: absoluteUrl("/favicon.ico"),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "عقار FAMILY",
      url: SITE_URL,
      inLanguage: ["ar", "en"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
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
        {/*
          حالة السحابة أولاً، ثم يقرأ منها سكربتا الموسم والهوية في نفس الرسم.
          هذا يمنع ومضة الألوان/الشعار الافتراضي عند أول زيارة من جهاز جديد.
        */}
        <script dangerouslySetInnerHTML={{ __html: cloudBootScript(cloud) }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        {/* حقن الهوية (الخطوط/الأحجام/ألوان العلامة/الفافيكون) قبل أول رسم */}
        <script dangerouslySetInnerHTML={{ __html: BRANDING_BOOT_SCRIPT }} />
      </head>
      <body
        className={`${cairo.variable} ${tajawal.variable} ${amiri.variable} ${readex.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <JsonLd data={organizationJsonLd} />
        <AppProviders>
          <ThemeProvider>
          <Header />
          {/* شريط الزخارف الموسمي — يظهر في الصفحات الداخلية فقط */}
          <SeasonRibbon />
          <main className="flex-1 min-h-0 flex flex-col">
            {children}
            <PageAddonBlocks />
          </main>
          <Footer />
          <MobileAppBanner />
          <SiteWidgets />
          <CloudBridge />
          <TextStyleInjector />
          </ThemeProvider>
        </AppProviders>
      </body>
    </html>
  );
}
