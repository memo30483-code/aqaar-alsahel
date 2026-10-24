/**
 * النقوش والزخارف المعمارية (إسلامية / فرعونية):
 * مكوّنات SVG/طبقات زخرفية مشتركة تُستخدم في الهيدر والكروت والبانرات ورؤوس القوائم.
 * لا تعتمد على أي حالة أو hooks، لذا تصلح للاستخدام في مكوّنات السيرفر والعميل معاً.
 */

/** طبقة نقش إسلامي هندسي شفاف (مشربية) تُوضع كخلفية خفيفة داخل العناصر */
export function MashrabiyaLayer({
  tone = "light",
  className = "opacity-[0.06]",
}: {
  /** "light" للخلفيات الفاتحة (نقش نيلي) و"dark" للخلفيات الداكنة (نقش ذهبي) */
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 ${
        tone === "dark" ? "pattern-mashrabiya-gold" : "pattern-mashrabiya"
      } ${className}`}
    />
  );
}

/** إطار زخرفي هندسي إسلامي دقيق (حدّ ذهبي + معينات في الزوايا) حول الكروت والبانرات */
export function OrnateFrame({
  tone = "light",
  className = "inset-2",
  radiusClassName = "rounded-[1.25rem]",
}: {
  tone?: "light" | "dark";
  /** مسافة الإطار من حافة العنصر (كلاسات inset) */
  className?: string;
  /** استدارة الإطار لتوافق استدارة العنصر الحاوي */
  radiusClassName?: string;
}) {
  const border = tone === "dark" ? "border-gold-300/45" : "border-gold-400/45";
  const corner =
    tone === "dark"
      ? "border-gold-300/70 bg-gold-400"
      : "border-gold-400/80 bg-gold-200";

  const corners = [
    "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
    "right-0 top-0 translate-x-1/2 -translate-y-1/2",
    "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
    "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
  ];

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute border ${className} ${radiusClassName} ${border}`}
    >
      {corners.map((position) => (
        <span
          key={position}
          className={`absolute h-1.5 w-1.5 rotate-45 border ${position} ${corner}`}
        />
      ))}
    </span>
  );
}

/** شارة التوثيق الفرعونية-الإسلامية: نجمة إسلامية ثمانية بداخلها مفتاح الحياة (عنخ) */
export function VerifiedSeal({
  title,
  className = "h-4 w-4",
}: {
  /** نص وصفي لقارئات الشاشة */
  title: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label={title}
      className={`shrink-0 ${className}`}
    >
      {/* النجمة الإسلامية الثمانية (الخاتم) */}
      <path
        d="M20 2 L22.9 13.1 L32.7 7.3 L26.9 17.1 L38 20 L26.9 22.9 L32.7 32.7 L22.9 26.9 L20 38 L17.1 26.9 L7.3 32.7 L13.1 22.9 L2 20 L13.1 17.1 L7.3 7.3 L17.1 13.1 Z"
        fill="#dfae3d"
        stroke="#a97420"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* مفتاح الحياة */}
      <g
        fill="none"
        stroke="#5e3c1c"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="20" cy="14.4" r="3.7" />
        <path d="M20 18.1 V30" />
        <path d="M13.8 22.6 H26.2" />
      </g>
    </svg>
  );
}

/** فاصل هندسي فرعوني: الشمس المجنّحة (Winged Sun) بين خطّين ومعينين ذهبيين */
export function PharaonicDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`my-5 flex items-center gap-3 ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-gold-400/50 to-gold-500/80" />
      <span className="h-1.5 w-1.5 shrink-0 rotate-45 border border-gold-400 bg-gold-200" />

      <svg viewBox="0 0 96 24" className="h-6 w-[96px] shrink-0 text-gold-500">
        {/* الجناحان */}
        <path
          d="M42 12 C34 5.4 23 4.4 13 8.6 C23 7.4 34 9.6 40 13.2 Z"
          fill="currentColor"
          opacity="0.85"
        />
        <path
          d="M54 12 C62 5.4 73 4.4 83 8.6 C73 7.4 62 9.6 56 13.2 Z"
          fill="currentColor"
          opacity="0.85"
        />
        {/* ريش الأجنحة */}
        <path
          d="M20 7.6 L24 11.4 M28 6.6 L32 10.9 M36 6.4 L39 10.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M76 7.6 L72 11.4 M68 6.6 L64 10.9 M60 6.4 L57 10.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* قرص الشمس وهالته */}
        <circle cx="48" cy="12" r="4.4" fill="currentColor" />
        <circle
          cx="48"
          cy="12"
          r="6.8"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.5"
        />
      </svg>

      <span className="h-1.5 w-1.5 shrink-0 rotate-45 border border-gold-400 bg-gold-200" />
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-400/50 to-gold-500/80" />
    </div>
  );
}
