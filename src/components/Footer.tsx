import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-ocean-800/20 bg-ocean-950 text-ocean-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-lg font-bold text-white">عقار الساحل</p>
          <p className="mt-1 text-sm text-ocean-300">
            سوق عقاري مفتوح لمدن الساحل الجديدة
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="hover:text-white">
            الرئيسية
          </Link>
          <Link href="/add-property" className="hover:text-white">
            أضف عقار
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-ocean-400">
        © {new Date().getFullYear()} عقار الساحل — MVP تجريبي ببيانات وهمية
      </div>
    </footer>
  );
}
