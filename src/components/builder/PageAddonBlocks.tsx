"use client";

import { usePathname } from "next/navigation";
import { blockCssVars, blockScopeClasses } from "@/lib/home-block-style";
import {
  pageIdForPath,
  useVisiblePageBlocks,
  type PageId,
} from "@/lib/page-builder-store";
import BlockRenderer from "@/components/builder/BlockRenderer";
import PageStyleScope from "@/components/builder/PageStyleScope";

/** صفحات ترسم كامل محتواها من PageRenderer بالفعل — منع التكرار في Layout. */
const FULL_BUILDER_PAGES = new Set<PageId>([
  "home",
  "market-guide",
  "company",
  "projects",
  "engineering-consultational",
  "legal-consultational",
  "developers",
  "brokers",
  "lawyers",
  "engineers",
]);

function Addons({ pageId }: { pageId: PageId }) {
  const blocks = useVisiblePageBlocks(pageId);
  if (!blocks.length) return null;

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

/**
 * يتيح إضافة مكوّنات البلدر للصفحات الوظيفية والديناميكية دون المساس
 * بوظيفتها الأساسية. تظهر المكوّنات المضافة بعد المحتوى الأصلي للصفحة.
 */
export default function PageAddonBlocks() {
  const pathname = usePathname();
  const pageId = pageIdForPath(pathname);
  if (!pageId || FULL_BUILDER_PAGES.has(pageId)) return null;
  return <Addons pageId={pageId} />;
}
