import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Building2, ClipboardCheck, Ruler, ShieldCheck } from "lucide-react";
import ProfessionalDirectory from "@/components/professionals/ProfessionalDirectory";

export const metadata: Metadata = {
  title: "الاستشارات الهندسية | المكاتب الهندسية المعتمدة | عقار FAMILY",
  description:
    "استشارات هندسية مع مكاتب معتمدة: فحص فني للوحدة قبل الشراء، مراجعة الرسومات، والإشراف على التنفيذ والتشطيب.",
};

const STEPS = [
  {
    Icon: ClipboardCheck,
    title: "فحص فني قبل الشراء",
    text: "تقرير مصور عن حالة الأساسات والإنشاءات والتشطيبات، مع توصيات المعالجة وتقدير التكلفة.",
  },
  {
    Icon: Ruler,
    title: "مراجعة الرسومات والمستندات",
    text: "مطابقة الرسومات التنفيذية للواقع ومراجعة تراخيص البناء والاشتراطات قبل التعاقد.",
  },
  {
    Icon: ShieldCheck,
    title: "إشراف على التنفيذ",
    text: "زيارات دورية وتقارير جودة لكل مرحلة، من الأعمال الخرسانية حتى التسليم النهائي.",
  },
];

export default function EngineeringConsultationPage() {
  return (
    <div>
      <section className="relative overflow-hidden theme-hero px-4 py-10 text-white sm:px-6">
        <span
          aria-hidden
          className="pointer-events-none absolute -end-24 -top-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(217,185,92,0.24),transparent_65%)]"
        />
        <div className="relative mx-auto w-full max-w-[1180px]">
          <p className="flex items-center gap-2 text-[10.5px] font-black uppercase tracking-[0.2em] text-gold-300">
            <span aria-hidden className="h-px w-6 bg-gold-400/70" />
            خدمة الاستشارات الهندسية
          </p>
          <h1 className="mt-3 text-[26px] font-black sm:text-[34px]">
            الاستشارات الهندسية
          </h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-7 text-white/70">
            قبل ما تدفع مقدم أي عقار، خلّي المبنى نفسه يتفحص. مكتب هندسي معتمد
            يراجع الإنشاءات والرسومات والتراخيص، ويكتب لك تقريراً واضحاً بما يحتاج
            معالجة وما لا يستحق المخاطرة.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a
              href="#engineers"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-5 py-2.5 text-[11.5px] font-black text-ocean-950 transition hover:-translate-y-0.5"
            >
              تصفح المكاتب الهندسية
            </a>
            <Link
              href="/join?role=engineer"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-[11.5px] font-bold text-white transition hover:border-gold-300 hover:text-gold-200"
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              سجّل مكتبك الهندسي
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-sand-200 bg-white">
        <div className="mx-auto grid w-full max-w-[1180px] gap-3 px-4 py-8 sm:grid-cols-3 sm:px-6">
          {STEPS.map((step) => {
            const Icon = step.Icon;
            return (
              <div
                key={step.title}
                className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-gold-600 shadow-sm">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <p className="mt-2.5 text-[12.5px] font-black text-ocean-900">
                  {step.title}
                </p>
                <p className="mt-1 text-[11px] leading-6 text-sand-700">
                  {step.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-b border-sand-200 bg-ocean-950/[0.03]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center gap-3 px-4 py-4 text-[11px] font-semibold text-sand-700 sm:px-6">
          <Building2 className="h-4 w-4 shrink-0 text-gold-600" />
          الاعتماد بعد مراجعة كارنيه نقابة المهندسين والسجل التجاري — والتوثيق
          مستقل تماماً عن الإعلانات المدفوعة.
        </div>
      </section>

      <div id="engineers">
        <ProfessionalDirectory kind="engineer" />
      </div>
    </div>
  );
}
