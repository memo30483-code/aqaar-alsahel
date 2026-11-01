"use client";

import { blockCssVars, blockScopeClasses } from "@/lib/home-block-style";
import {
  useVisiblePageBlocks,
  type PageId,
} from "@/lib/page-builder-store";
import BlockRenderer from "@/components/builder/BlockRenderer";
import PageStyleScope from "@/components/builder/PageStyleScope";

/**
 * يرندر صفحة محتوى كاملة من أقسام البلدر.
 * تنسيق الصفحة العام يُطبَّق على الغلاف، وكل قسم يُغلَّف بـ `.hb-scope`
 * حتى تُطبَّق عليه تنسيقاته (خط/حجم/لون/خلفية/وسائط) ويتجاوز تنسيق الصفحة.
 */
export default function PageRenderer({ pageId }: { pageId: PageId }) {
  const blocks = useVisiblePageBlocks(pageId);

  return (
    <PageStyleScope pageId={pageId}>
      {blocks.map((block) => (
        <div
          key={block.id}
          className={["w-full", ...blockScopeClasses(block.style)].join(" ")}
          style={
            {
              order: block.order,
              ...blockCssVars(block.style),
            } as React.CSSProperties
          }
        >
          <BlockRenderer block={block} />
        </div>
      ))}
    </PageStyleScope>
  );
}
