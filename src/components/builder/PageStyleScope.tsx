"use client";

import { blockCssVars, blockScopeClasses } from "@/lib/home-block-style";
import { usePageStyle, type PageId } from "@/lib/page-builder-store";

/**
 * يطبّق تنسيق الصفحة العام (خط/أحجام/ألوان/خلفية/مسافات) على أي صفحة.
 *
 * الصفحات التي تُبنى من أقسام تستخدمه داخل `PageRenderer`، والصفحات ذات
 * البنية الثابتة (نماذج/قوالب تفاصيل) تلتف به للحصول على نفس تحكم التنسيق
 * دون المساس ببنيتها أو وظيفتها.
 */
export default function PageStyleScope({
  pageId,
  children,
  className = "w-full flex-1 flex flex-col",
}: {
  pageId: PageId;
  children: React.ReactNode;
  className?: string;
}) {
  const style = usePageStyle(pageId);

  return (
    <div
      className={[className, ...blockScopeClasses(style)]
        .filter(Boolean)
        .join(" ")}
      style={blockCssVars(style) as React.CSSProperties}
    >
      {children}
    </div>
  );
}
