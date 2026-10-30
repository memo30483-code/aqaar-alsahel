import type { Metadata } from "next";
import ProfessionalDirectory from "@/components/professionals/ProfessionalDirectory";

export const metadata: Metadata = {
  title: "الاستشارات القانونية | المحامون المعتمدون | عقار FAMILY",
  description:
    "استشارات قانونية مع محامين معتمدين، مراجعة العقود والملكية قبل الدفع.",
};

export default function LegalConsultationPage() {
  return (
    <div>
      <section className="relative overflow-hidden theme-hero px-4 py-10 text-white sm:px-6">
        <h1 className="text-[26px] font-black sm:text-[32px]">الاستشارات القانونية</h1>
        <p className="mt-2 max-w-2xl text-[12.5px] leading-7 text-white/70">
          قبل ما تدفع مقدم أي عقار، خلّي عقدك يتفحص. محامٍ معتمد يراجع الملكية،
          الرهون، تراخيص المطور، وبنود العقد والغرامات.
        </p>
        <a
          href="/lawyers"
          className="mt-4 inline-block rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[11.5px] font-black text-ocean-950 transition hover:-translate-y-0.5"
        >
          تصفح المحامين المعتمدين
        </a>
      </section>
      <ProfessionalDirectory kind="lawyer" />
    </div>
  );
}
