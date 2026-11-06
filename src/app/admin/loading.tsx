/** شاشة تحميل فورية أثناء فتح لوحة التحكم — تمنع أي ثبات على شاشة الدخول */
export default function AdminLoading() {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-sand-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-sand-300 border-t-gold-500" />
        <p className="text-[12px] font-bold text-sand-600">
          جارٍ تجهيز لوحة التحكم…
        </p>
      </div>
    </div>
  );
}
