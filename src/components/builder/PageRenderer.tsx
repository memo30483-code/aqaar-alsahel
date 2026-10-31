"use client";

import { blockCssVars, blockScopeClasses } from "@/lib/home-block-style";
import {
  usePageStyle,
  useVisiblePageBlocks,
  type PageId,
} from "@/lib/page-builder-store";
import BlockRenderer from "@/components/builder/BlockRenderer";

/**
 * يرندر صفحة محتوى كاملة من أقسام البلدر.
 * كل قسم يُغلَّف بـ `.hb-scope` حتى تُطبَّق عليه تنسيقاته (خط/حجم/لون/خلفية/وسائط).
 */
export default function PageRenderer({ pageId }: { pageId: PageId }) {
  const blocks = useVisiblePageBlocks(pageId);
  const pageStyle = usePageStyle(pageId);

  return (
    <div
      className={["flex w-full flex-col", ...blockScopeClasses(pageStyle)].join(
        " "
      )}
      style={blockCssVars(pageStyle) as React.CSSProperties}
    >
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
    </div>
  );
}
