import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-ocean-900">العقار غير موجود</h1>
      <p className="mt-2 text-sm text-ocean-500">
        قد يكون الرابط غير صحيح أو تم حذف الإعلان.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl bg-ocean-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-ocean-800"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
