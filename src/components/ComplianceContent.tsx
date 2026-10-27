"use client";

import { useI18n } from "@/lib/i18n";
import LegalDocPage, { type DocSection } from "@/components/LegalDocPage";

const PRIVACY: { ar: DocSection[]; en: DocSection[] } = {
  ar: [
    {
      id: "data-we-collect",
      title: "البيانات اللي بنجمعها",
      body: [
        "بيانات الحساب: الاسم، البريد الإلكتروني، رقم الجوال، ونوع الحساب (فرد / مطور أو وسيط / محامٍ معتمد).",
        "بيانات الإعلان: مواصفات العقار، السعر، المدينة والمنطقة، الصور، والموقع التقريبي على الخريطة.",
        "مستندات التوثيق: صورة البطاقة أو السجل التجاري أو البطاقة الضريبية أو كارنيه المحاماة — حسب نوع الحساب.",
        "بيانات الاستخدام: الصفحات اللي بتزورها والإجراءات اللي بتتم داخل الموقع، لأغراض الأمان وتحسين الخدمة.",
      ],
    },
    {
      id: "how-we-use",
      title: "إزاي بنستخدم البيانات",
      body: [
        "مراجعة الإعلانات والتحقق من ملكية العقار وسلامته القانونية قبل النشر.",
        "التواصل معاك بشأن طلبات المعاينة أو الاستشارات أو حالة إعلانك.",
        "حماية المنصة من الإعلانات الوهمية والانتحال ومنع تكرار العروض المخالفة.",
        "إرسال تحديثات أو عروض موسمية — وتقدر توقفها في أي وقت من إعدادات حسابك.",
      ],
    },
    {
      id: "public-data",
      title: "اللي بيظهر للزوار",
      body: [
        "بيظهر للزائر: عنوان الإعلان، الوصف، المساحة، عدد الغرف، السعر، المدينة والمنطقة، الصور، ورقم التوثيق.",
        "ما بيظهرش أبداً: اسم المالك، رقم جواله، أو أي مستند من مستندات الملكية.",
        "المعاينة والتفاوض والتواصل بيتم عبر إدارة الموقع فقط — وده جزء أساسي من حماية الطرفين.",
      ],
    },
    {
      id: "documents-access",
      title: "مين بيشوف المستندات؟",
      body: [
        "المستندات متاحة لفريق المراجعة المعتمد فقط، ولأغراض التحقق من الملكية والسلامة القانونية.",
        "لا يتم بيع أو تأجير أو مشاركة المستندات مع أي طرف ثالث لأغراض تسويقية.",
        "قد يتم مشاركة بيانات محدودة مع الجهات القانونية المختصة عند وجود طلب رسمي أو نزاع قضائي.",
      ],
    },
    {
      id: "retention-rights",
      title: "مدة الاحتفاظ وحقوقك",
      body: [
        "بنحتفظ ببيانات الحساب والمستندات طول فترة نشاط الحساب، ولمدة لازمة بعدها للالتزامات القانونية.",
        "تقدر تطلب تعديل بياناتك أو حذف حسابك، مع مراعاة المستندات المرتبطة بإعلانات قائمة أو نزاعات مفتوحة.",
        "أي طلب متعلق ببياناتك بيتم عبر إدارة الموقع وبالتحقق من هويتك أولاً.",
      ],
    },
    {
      id: "contact",
      title: "التواصل بشأن الخصوصية",
      body: [
        "لأي سؤال أو طلب متعلق ببياناتك الشخصية، تواصل مع إدارة عقار FAMILY من خلال بيانات التواصل الظاهرة في هذه الصفحة.",
        "سيتم الرد على طلبك خلال مدة أقصاها 7 أيام عمل من تاريخ استلامه.",
      ],
    },
  ],
  en: [
    {
      id: "data-we-collect",
      title: "Data we collect",
      body: [
        "Account data: name, email, mobile number, and account type (individual / developer or broker / licensed lawyer).",
        "Listing data: property specs, price, city and district, photos, and the approximate map location.",
        "Verification documents: national ID, commercial register, tax card, or bar association card — depending on the account type.",
        "Usage data: pages you visit and actions taken on the site, for security and service improvement.",
      ],
    },
    {
      id: "how-we-use",
      title: "How we use the data",
      body: [
        "Reviewing listings and verifying ownership and legal safety before publishing.",
        "Contacting you about viewing requests, consultations, or your listing status.",
        "Protecting the platform from fake listings, impersonation, and prohibited duplicate offers.",
        "Sending updates or seasonal offers — you can stop these at any time from your account settings.",
      ],
    },
    {
      id: "public-data",
      title: "What visitors can see",
      body: [
        "Visitors see: listing title, description, area, rooms, price, city and district, photos, and the verification ID.",
        "Never shown: the owner's name, mobile number, or any ownership document.",
        "Viewings, negotiations, and contact happen only through site management — a core part of protecting both sides.",
      ],
    },
    {
      id: "documents-access",
      title: "Who sees the documents?",
      body: [
        "Documents are available only to the approved review team, for ownership and legal-safety verification.",
        "Documents are never sold, rented, or shared with third parties for marketing purposes.",
        "Limited data may be shared with competent legal authorities upon an official request or litigation.",
      ],
    },
    {
      id: "retention-rights",
      title: "Retention and your rights",
      body: [
        "We retain account data and documents while the account is active, and for a period afterward required by legal obligations.",
        "You can request a correction of your data or deletion of your account, subject to documents tied to active listings or open disputes.",
        "Any request about your data is handled through site management after verifying your identity.",
      ],
    },
    {
      id: "contact",
      title: "Privacy contact",
      body: [
        "For any question or request about your personal data, contact Aqaar FAMILY management using the details shown on this page.",
        "We respond to your request within a maximum of 7 business days from receipt.",
      ],
    },
  ],
};

const TERMS: { ar: DocSection[]; en: DocSection[] } = {
  ar: [
    {
      id: "platform-role",
      title: "طبيعة المنصة ودورها",
      body: [
        "عقار FAMILY منصة تنظيمية وتوثيقية للعروض العقارية في المدن الست المعتمدة، وليست طرفاً في البيع أو الشراء.",
        "المنصة لا تتحمل مسؤولية أي اتفاق يتم خارج إطارها، ولا تضمن تنفيذ التزامات البائع أو المشتري بعد إتمام الصفقة.",
        "كل عرض يتم نشره بعد المرور على خطوات التحقق الموضحة، ورقم التوثيق دليل على المراجعة وقت النشر فقط.",
      ],
    },
    {
      id: "listing-rules",
      title: "شروط نشر الإعلان",
      body: [
        "البيانات والصور المقدَّمة لازم تكون صحيحة وحديثة وتخص العقار نفسه، وصور حقيقية للوحدة وليست صوراً دعائية.",
        "ممنوع نشر عقار لا تملك حق التصرف فيه، أو تكرار نفس الإعلان بأكثر من حساب أو أكثر من صيغة.",
        "لإدارة الموقع الحق في تعديل أو رفض أو أرشفة أي إعلان يخالف الشروط، مع تسجيل سبب الإجراء.",
      ],
    },
    {
      id: "verification",
      title: "التوثيق والتحقق",
      body: [
        "التحقق يشمل مطابقة بيانات المالك، المراجعة القانونية للسلامة، والمعاينة الميدانية للمساحة.",
        "التحقق مستقل تماماً عن الإعلانات المدفوعة — الدفع مقابل الترويج لا يمنح أي إعلان شارة توثيق.",
        "كل إعلان مدفوع أو برعاية يتم وسمه بكلمة «إعلان» بشكل واضح، ولا يؤثر على ترتيب العروض الموثّقة أو تقييمها.",
      ],
    },
    {
      id: "communication",
      title: "التواصل عبر الإدارة فقط",
      body: [
        "بيانات المالك والمستندات محجوبة، وكل تواصل أو معاينة أو تفاوض يتم عبر إدارة الموقع.",
        "ممنوع محاولة الحصول على بيانات مالك أو مستنداته خارج القنوات الرسمية.",
        "المخالفة قد تؤدي إلى إيقاف الحساب ورفع الإعلانات وإبلاغ الجهات المختصة عند الحاجة.",
      ],
    },
    {
      id: "offers-ads",
      title: "العروض الموسمية والإعلانات",
      body: [
        "العروض الموسمية تُفعَّل من إدارة الموقع لفترة محددة، وتظهر فقط خلال هذه الفترة.",
        "العرض قد يكون مرتبطاً بعقار موثّق أو عرضاً عاماً من الإدارة، وتطبيق العرض يتم عبر التواصل الرسمي.",
        "إدارة الموقع تحتفظ بحق إيقاف أي عرض أو حملة إعلانية تخالف الشروط أو تضلل المستخدمين.",
      ],
    },
    {
      id: "liability-law",
      title: "المسؤولية والقانون المطبق",
      body: [
        "المستخدم مسؤول عن دقة بياناته ومستنداته وعن التزامه بالقوانين المصرية المعمول بها.",
        "أي نزاع ينشأ عن التعامل خارج المنصة لا يكون الموقع طرفاً فيه.",
        "تخضع هذه الشروط لأحكام القانون المصري، وتختص المحاكم المصرية بأي نزاع متعلق بها.",
      ],
    },
    {
      id: "updates",
      title: "تعديل الشروط",
      body: [
        "قد يتم تحديث هذه الشروط من وقت لآخر، ويتم نشر النسخة السارية على هذه الصفحة بتاريخ التحديث.",
        "استمرارك في استخدام المنصة بعد نشر التعديلات يعني موافقتك على النسخة المحدثة.",
      ],
    },
  ],
  en: [
    {
      id: "platform-role",
      title: "The platform's role",
      body: [
        "Aqaar FAMILY is an organizing and verification platform for property listings in the six approved cities; it is not a party to any sale or purchase.",
        "The platform is not responsible for agreements made outside it, and does not guarantee the performance of buyer or seller obligations after a deal closes.",
        "Every listing is published after the stated verification steps; the verification ID proves review at the time of publishing only.",
      ],
    },
    {
      id: "listing-rules",
      title: "Listing rules",
      body: [
        "Submitted data and photos must be accurate, current, and specific to the property — real photos, not promotional mockups.",
        "Listing a property you have no right to dispose of, or duplicating the same listing across accounts or formats, is prohibited.",
        "Site management may edit, reject, or archive any listing that breaks these rules, with the reason recorded.",
      ],
    },
    {
      id: "verification",
      title: "Verification",
      body: [
        "Verification covers owner-data matching, a legal safety review, and an on-site area inspection.",
        "Verification is fully independent of paid ads — paying for promotion never grants a verification badge.",
        "Every paid or sponsored listing is clearly labeled as an “Ad” and never affects the ranking or assessment of verified listings.",
      ],
    },
    {
      id: "communication",
      title: "Contact through management only",
      body: [
        "Owner data and documents are hidden; all contact, viewings, and negotiation go through site management.",
        "Attempting to obtain owner data or documents outside official channels is prohibited.",
        "Violations may lead to account suspension, listing removal, and reporting to the competent authorities when needed.",
      ],
    },
    {
      id: "offers-ads",
      title: "Seasonal offers and ads",
      body: [
        "Seasonal offers are enabled by site management for a defined window and appear only during that window.",
        "An offer may be linked to a verified listing or be a general management offer; redemption goes through official contact.",
        "Management may stop any offer or ad campaign that breaks these terms or misleads users.",
      ],
    },
    {
      id: "liability-law",
      title: "Liability and governing law",
      body: [
        "Users are responsible for the accuracy of their data and documents and for complying with applicable Egyptian law.",
        "The site is not a party to any dispute arising from dealings outside the platform.",
        "These terms are governed by Egyptian law, and Egyptian courts have jurisdiction over related disputes.",
      ],
    },
    {
      id: "updates",
      title: "Changes to the terms",
      body: [
        "These terms may be updated from time to time; the effective version is published on this page with its update date.",
        "Continuing to use the platform after changes are published means you accept the updated version.",
      ],
    },
  ],
};

export default function ComplianceContent({ kind }: { kind: "privacy" | "terms" }) {
  const { locale } = useI18n();
  const ar = locale === "ar";
  const isPrivacy = kind === "privacy";

  const sections = isPrivacy ? (ar ? PRIVACY.ar : PRIVACY.en) : ar ? TERMS.ar : TERMS.en;

  return (
    <LegalDocPage
      eyebrow={isPrivacy ? (ar ? "الخصوصية" : "Privacy") : ar ? "الشروط" : "Terms"}
      title={
        isPrivacy
          ? ar
            ? "سياسة الخصوصية وحماية البيانات"
            : "Privacy and data protection policy"
          : ar
            ? "الشروط والأحكام"
            : "Terms and conditions"
      }
      updated={ar ? "آخر تحديث: أكتوبر 2026" : "Last updated: October 2026"}
      intro={
        isPrivacy
          ? ar
            ? "بنحمي بياناتك ومستنداتك، وبنفصل تماماً بين اللي بيظهر للزوار واللي بيبقى للإدارة. الصفحة دي بتشرح كل بيانات بنجمعها وإزاي بنستخدمها."
            : "We protect your data and documents, and fully separate what visitors see from what stays with management. This page explains every piece of data we collect and how we use it."
          : ar
            ? "قواعد واضحة لاستخدام المنصة ونشر الإعلانات والتوثيق والتواصل. الهدف حماية المشترين والبائعين وضمان شفافية كل عرض."
            : "Clear rules for using the platform, publishing listings, verification, and contact — to protect buyers and sellers and keep every listing transparent."
      }
      sections={sections}
      noteTitle={ar ? "مبدأ أساسي: بيانات المالك خط أحمر" : "Core principle: owner data is off-limits"}
      noteBody={
        ar
          ? "لا يتم عرض اسم المالك أو رقمه أو مستنداته لأي زائر. كل طلب معاينة أو استشارة أو استفسار بيتم عبر إدارة الموقع، والتحقق مستقل تماماً عن أي إعلان مدفوع."
          : "No visitor sees the owner's name, phone, or documents. Every viewing, consultation, or inquiry goes through site management, and verification is entirely independent of paid ads."
      }
      contactTitle={ar ? "عندك سؤال؟ تواصل مع الإدارة" : "Questions? Contact management"}
      contactBody={
        ar
          ? "إدارة عقار FAMILY هي القناة الرسمية الوحيدة للتواصل بشأن البيانات أو الإعلانات أو التوثيق."
          : "Aqaar FAMILY management is the only official channel for data, listing, or verification questions."
      }
      tocTitle={ar ? "محتويات الصفحة" : "On this page"}
      related={
        isPrivacy
          ? [
              { label: ar ? "الشروط والأحكام" : "Terms & conditions", href: "/terms" },
              { label: ar ? "الاستشارات القانونية" : "Legal consultations", href: "/legal-consultational" },
            ]
          : [
              { label: ar ? "سياسة الخصوصية" : "Privacy policy", href: "/privacy" },
              { label: ar ? "الاستشارات القانونية" : "Legal consultations", href: "/legal-consultational" },
            ]
      }
    />
  );
}
