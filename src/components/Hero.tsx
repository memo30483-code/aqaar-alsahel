import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://picsum.photos/seed/sahel-hero/1600/900"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-ocean-950/90 via-ocean-900/80 to-ocean-800/70" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_30%,rgba(61,147,192,0.4),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(14,90,122,0.5),transparent_40%)]" />

      <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6 sm:py-28">
        <p className="mb-3 text-sm font-semibold tracking-wide text-ocean-200">
          رأس البر · دمياط الجديدة · دمياط القديمة · المنصورة الجديدة · جمصة
        </p>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
          عقار الساحل
        </h1>
        <p className="mt-4 max-w-xl text-lg text-ocean-100 sm:text-xl">
          سوق عقارات الساحل المفتوح — بيع واشتري مباشر بدون وسطاء معقّدين
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#properties"
            className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-ocean-900 shadow-soft transition hover:bg-ocean-50"
          >
            تصفّح العقارات
          </a>
          <Link
            href="/add-property"
            className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
          >
            انشر عقارك مجاناً
          </Link>
        </div>
      </div>
    </section>
  );
}
