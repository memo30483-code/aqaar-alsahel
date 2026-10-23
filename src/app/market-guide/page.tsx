import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { mockProperties } from "@/data/properties";
import { City, PropertyType } from "@/types/property";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "البوصلة العقارية | عقار الساحل",
  description:
    "الدليل الاقتصادي والعقاري لمدن الساحل والدلتا: مؤشر أسعار المتر للشقق والفيلات، تحليل الطلب الاستثماري، وتقييم الكمبوندات في رأس البر، دمياط الجديدة، دمياط القديمة، المنصورة الجديدة وجمصة.",
};

type Demand = "مرتفع" | "موسمي" | "مستقر";

interface CityProfile {
  city: City;
  demand: Demand;
  demandNote: string;
  summary: string;
}

/** ترتيب وبيانات المدن المعتمدة الخمس — بيانات تحريرية خاصة بهذه الصفحة */
const CITY_PROFILES: CityProfile[] = [
  {
    city: "رأس البر",
    demand: "موسمي",
    demandNote: "ذروة الطلب من مايو إلى سبتمبر",
    summary:
      "المدينة الساحلية الأولى للدمياط؛ الطلب يتركز على الشاليهات والشقق القريبة من الكورنيش والصف الأول، وتتضاعف الأسعار في موسم الصيف.",
  },
  {
    city: "دمياط الجديدة",
    demand: "مرتفع",
    demandNote: "طلب على التسليم الفوري والوحدات الجاهزة",
    summary:
      "أكبر تجمع عمراني بالمنطقة، بها كمبوندات ومشروعات مطورين وتقبل واسع على الوحدات المفروشة للاستثمار الإيجاري.",
  },
  {
    city: "دمياط القديمة",
    demand: "مستقر",
    demandNote: "طلب عائلي على السكن الدائم",
    summary:
      "أسعار المتر الأقل بين المدن الخمس مع طلب ثابت من السكان المحليين وطلبات الإحلال والتجديد في وسط البلد والكورنيش.",
  },
  {
    city: "جمصة",
    demand: "موسمي",
    demandNote: "إقبال صيفي على المصيف والاستثمار الفندقي",
    summary:
      "منتج مصيفي بأسعار متر تنافسية، يجذب كل من يبحث عن وحدة صيفية أو عائد إيجار موسمي على الشاطئ.",
  },
  {
    city: "المنصورة الجديدة",
    demand: "مرتفع",
    demandNote: "مدينة جديدة بعمران حديث",
    summary:
      "عمران مخطط حديثاً وواجهات بحرية، الطلب فيها على الوحدات الأولى داخل الكمبوندات والبيت الهادئ للأسرة.",
  },
];

const DEMAND_STYLE: Record<Demand, string> = {
  مرتفع: "bg-rose-50 text-rose-700 ring-rose-100",
  موسمي: "bg-amber-50 text-amber-700 ring-amber-100",
  مستقر: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

interface GuideCard {
  title: string;
  description: string;
  badge: string;
  href?: string;
  icon: ReactNode;
}

/** كروت قسم «اعرف» — مستوحاة من تجربة عقار ماب */
const GUIDE_CARDS: GuideCard[] = [
  {
    title: "أسعار العقارات ومؤشر المتر",
    description:
      "متوسط سعر المتر للشقق والفيلات في مدن الساحل والدلتا الخمس، محسوباً من إعلانات المنصة المعروضة حالياً.",
    badge: "5 مدن",
    href: "#meters",
    icon: <ChartIcon />,
  },
  {
    title: "المؤشر العقاري وتحليل الطلب",
    description:
      "قراءة في مستويات الطلب الاستثماري (مرتفع، موسمي، مستقر) وأثر الموسم الصيفي على تسعير الوحدات.",
    badge: "تحليل بيانات",
    href: "#comparison",
    icon: <TrendIcon />,
  },
  {
    title: "تقييم الكمبوندات والمشاريع",
    description:
      "ملفات المشروعات والكمبوندات وأهم المناطق داخل كل مدينة مع ملاحظات الخبراء قبل الشراء على الخريطة.",
    badge: "رأي الخبراء",
    href: "#cities",
    icon: <BuildingIcon />,
  },
  {
    title: "اسأل أهل المنطقة",
    description:
      "استفسارات سكان الساحل والدلتا عن الخدمات والمواصلات والمدارس وتجربة السكن الفعلية في كل حي.",
    badge: "قريباً",
    icon: <ChatIcon />,
  },
  {
    title: "أبحاث ودراسات استثمارية",
    description:
      "منهجية حساب المؤشر ونصائح عملية للشراء والبيع وتوقيت الدخول المناسب للسوق العقاري.",
    badge: "دراسة",
    href: "#methodology",
    icon: <DocIcon />,
  },
  {
    title: "الاستشارات القانونية وتوثيق العقود",
    description:
      "مراجعة عقود البيع والتصرفات العقارية وفحص الملكية مع محامين معتمدين قبل الشراء أو دفع المقدم.",
    badge: "محامي معتمد",
    href: "/legal-consultational",
    icon: <ScaleIcon />,
  },
];

function cityProperties(city: City) {
  return mockProperties.filter((p) => p.city === city);
}

function avgPricePerMeter(city: City, type: PropertyType): number | null {
  const items = cityProperties(city).filter(
    (p) => p.type === type && p.area > 0
  );
  if (items.length === 0) return null;
  const total = items.reduce((sum, p) => sum + p.price / p.area, 0);
  return Math.round(total / items.length);
}

function districtsOf(city: City): string[] {
  return Array.from(new Set(cityProperties(city).map((p) => p.district)));
}

const TOTAL_LISTINGS = mockProperties.length;

const OVERALL_AVG_METER = Math.round(
  mockProperties.reduce((sum, p) => sum + p.price / p.area, 0) /
    mockProperties.length
);

const STATS = CITY_PROFILES.map((profile) => {
  const listings = cityProperties(profile.city);
  return {
    ...profile,
    listings: listings.length,
    apartments: avgPricePerMeter(profile.city, "شقة"),
    villas: avgPricePerMeter(profile.city, "فيلا"),
    districts: districtsOf(profile.city),
  };
});

const MAX_METER = Math.max(
  ...STATS.map((s) => s.apartments ?? 0),
  ...STATS.map((s) => s.villas ?? 0)
);

export default function MarketGuidePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            الدليل الاقتصادي والعقاري
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
            البوصلة العقارية
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
            كل ما تحتاجه لاتخاذ قرار شراء أو استثمار في مدن الساحل والدلتا:
            مؤشرات أسعار المتر، تحليل الطلب، تقييم المشروعات، والاستشارات
            القانونية — في مكان واحد.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: "المدن المعتمدة", value: `${CITY_PROFILES.length} مدن` },
              { label: "عقارات في المؤشر", value: `${TOTAL_LISTINGS} عقار` },
              {
                label: "متوسط سعر المتر العام",
                value: `${formatPrice(OVERALL_AVG_METER)} ج.م`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur"
              >
                <p className="text-xs font-semibold text-white/50">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {/* قسم «اعرف» — الكروت الاستشارية */}
        <section id="guide" className="scroll-mt-32">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
                اعرف قبل ما تشتري
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-500">
                ستة مسارات سريعة تبدأ من الأرقام وتنتهي بالقرار — اضغط على أي
                كارت للانتقال إلى تفاصيله.
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-600">
              بيانات تجريبية — MVP
            </span>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDE_CARDS.map((card) => {
              const inner = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white transition group-hover:scale-105">
                      {card.icon}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${
                        card.href
                          ? "bg-gray-900 text-white ring-gray-900"
                          : "bg-gray-100 text-gray-500 ring-gray-200"
                      }`}
                    >
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-black text-gray-900">
                    {card.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-7 text-gray-600">
                    {card.description}
                  </p>

                  <span className="mt-5 flex items-center gap-1.5 text-sm font-bold text-gray-900">
                    {card.href ? "اعرف أكثر" : "قريباً على المنصة"}
                    {card.href && (
                      <span className="transition group-hover:-translate-x-1">
                        ←
                      </span>
                    )}
                  </span>
                </>
              );

              const className =
                "group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl";

              if (card.href?.startsWith("#")) {
                return (
                  <a key={card.title} href={card.href} className={className}>
                    {inner}
                  </a>
                );
              }

              return card.href ? (
                <Link key={card.title} href={card.href} className={className}>
                  {inner}
                </Link>
              ) : (
                <div key={card.title} className={className}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>

        {/* كروت متوسطات أسعار المتر */}
        <section id="meters" className="mt-14 scroll-mt-32">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
                مؤشر أسعار المتر
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                متوسط سعر المتر للشقق والفيلات في المدن الخمس، محسوب من العقارات
                المعروضة على المنصة.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {STATS.map((row) => (
              <article
                key={row.city}
                className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black text-gray-900">
                    {row.city}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${DEMAND_STYLE[row.demand]}`}
                  >
                    طلب {row.demand}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
                  <div>
                    <p className="text-xs text-gray-500">سعر متر الشقق</p>
                    <p className="mt-1 text-xl font-black text-gray-900">
                      {row.apartments === null
                        ? "—"
                        : formatPrice(row.apartments)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">سعر متر الفيلات</p>
                    <p className="mt-1 text-xl font-black text-gray-900">
                      {row.villas === null ? "—" : formatPrice(row.villas)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  {row.listings} عقار معروض · {row.demandNote}
                </p>

                <div className="mt-auto pt-5">
                  <Link
                    href="/#properties"
                    className="flex items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    تصفح عقارات {row.city}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* أعمدة المقارنة */}
        <section id="comparison" className="mt-14 scroll-mt-32">
          <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
            مقارنة سريعة لسعر المتر
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            الأعمدة ممثلة لأعلى متوسط سعر متر مسجل بين المدن.
          </p>

          <div className="mt-6 space-y-5 rounded-3xl border border-gray-200 bg-white p-5 sm:p-7">
            {STATS.map((row) => (
              <div key={row.city}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-gray-900">
                    {row.city}
                  </span>
                  <span className="text-xs font-bold text-gray-500">شقق</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-black"
                    style={{
                      width: `${Math.round(
                        ((row.apartments ?? 0) / MAX_METER) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-gray-900">
                    {row.city}
                  </span>
                  <span className="text-xs font-bold text-gray-500">فيلات</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-ocean-600"
                    style={{
                      width: `${Math.round(
                        ((row.villas ?? 0) / MAX_METER) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* تفاصيل المدن ورأي الخبراء */}
        <section id="cities" className="mt-14 scroll-mt-32">
          <h2 className="text-2xl font-black text-gray-900 sm:text-3xl">
            تفاصيل المدن ورأي الخبراء
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            نبذة سريعة وأهم المناطق داخل كل مدينة.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {STATS.map((row) => (
              <article
                key={row.city}
                className="flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-xl font-black text-gray-900">
                    {row.city}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${DEMAND_STYLE[row.demand]}`}
                  >
                    طلب {row.demand}
                  </span>
                </div>

                <p className="mt-3 flex-1 text-sm leading-7 text-gray-600">
                  {row.summary}
                </p>

                <div className="mt-5">
                  <p className="text-xs font-bold text-gray-500">أهم المناطق</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {row.districts.map((district) => (
                      <span
                        key={district}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                      >
                        {district}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* المنهجية + دعوة للإضافة */}
        <section id="methodology" className="mt-14 scroll-mt-32">
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
              <h2 className="text-xl font-black text-gray-900">
                منهجية المؤشر ونصائح الشراء
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-gray-600">
                <li>
                  • يُحسب سعر المتر لكل عقار بقسمة السعر الإجمالي على المساحة.
                </li>
                <li>
                  • يُستخرج متوسط سعر المتر لكل مدينة على حدة، مفصولاً بين الشقق
                  والفيلات.
                </li>
                <li>
                  • تُحدَّث المؤشرات تلقائياً كلما أُضيف عقار جديد عبر صفحة «أضف
                  عقارك».
                </li>
                <li>
                  • مؤشر الطلب السوقي تقديري (مرتفع / موسمي / مستقر) ويعتمد على
                  طبيعة النشاط العقاري في كل مدينة.
                </li>
                <li>
                  • نصيحة الشراء: قارن سعر متر الوحدة بمتوسط المدينة قبل التفاوض،
                  وتجنّب الشراء على الخريطة دون مراجعة قانونية للعقد.
                </li>
              </ul>
            </div>

            <div className="flex flex-col justify-between rounded-3xl bg-black p-6 text-white sm:p-8">
              <div>
                <h2 className="text-xl font-black">أضف عقارك للمؤشر</h2>
                <p className="mt-3 text-sm leading-7 text-white/70">
                  عند إضافة عقارك يُحتسب سعر متره تلقائياً ويظهر ضمن مؤشرات
                  المنطقة فوراً.
                </p>
              </div>
              <Link
                href="/add-property"
                className="mt-6 flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-white/90"
              >
                أضف عقارك الآن
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function ChartIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20V10m5 10V4m5 16v-7m5 7V8"
      />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 17l6-6 4 4 8-8m0 0h-5m5 0v5"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21h18M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M15 21V9h3a2 2 0 012 2v10M8 7h2M8 11h2M8 15h2"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h8M8 14h5M21 12a8 8 0 01-11.6 7.1L4 21l1.9-5.4A8 8 0 1121 12z"
      />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 3v5h5M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM9 13h6M9 17h4"
      />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v18M7 21h10M5 7l-3 6h6l-3-6zm14 0l-3 6h6l-3-6zM5 7l7-2 7 2"
      />
    </svg>
  );
}
