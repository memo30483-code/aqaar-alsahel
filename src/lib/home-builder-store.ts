/**
 * طبقة توافق للبلدر القديم الخاص بالرئيسية.
 *
 * المحرك الفعلي أصبح `page-builder-store` (يدعم كل صفحات المحتوى).
 * هذا الملف يثبّت الصفحة الرئيسية (`pageId = "home"`) ويُعيد تصدير نفس
 * الأسماء القديمة حتى تظل صفحة الرئيسية ولوحة التحكم تعملان دون تغيير.
 */
import {
  ADDABLE_BLOCK_TYPES,
  BLOCK_TYPE_META,
  CORE_BLOCK_TYPES,
  CUSTOM_BLOCK_TYPES,
  PAGE_BUILDER_EVENT,
  PAGE_BUILDER_KEY,
  addPageBlock,
  blockLabel,
  getPageBlocks,
  isCoreBlockType,
  isCustomBlockType,
  movePageBlock,
  movePageBlockBy,
  removePageBlock,
  resetPageBlocks,
  savePageBlocks,
  togglePageBlock,
  updatePageBlock,
  usePageBlocks,
  useVisiblePageBlocks,
  type BlockTypeMeta,
  type PageBlock as HomeBlock,
  type PageBlockItem as HomeBlockItem,
  type PageBlockType as HomeBlockType,
} from "@/lib/page-builder-store";

export type { BlockTypeMeta, HomeBlock, HomeBlockItem, HomeBlockType };

/** مفتاح التخزين القديم — ما زال مقروءاً للترحيل فقط */
export const HOME_BLOCKS_KEY = "aqaar-home-builder";
export const HOME_BLOCKS_EVENT = PAGE_BUILDER_EVENT;
/** مفتاح المحرك الجديد */
export const PAGE_BUILDER_STORE_KEY = PAGE_BUILDER_KEY;

export {
  ADDABLE_BLOCK_TYPES,
  BLOCK_TYPE_META,
  CORE_BLOCK_TYPES,
  CUSTOM_BLOCK_TYPES,
  blockLabel,
  isCoreBlockType,
  isCustomBlockType,
};

const PAGE_ID = "home" as const;

export const DEFAULT_HOME_BLOCKS: HomeBlock[] = getPageBlocks(PAGE_ID);

export function getHomeBlocks(): HomeBlock[] {
  return getPageBlocks(PAGE_ID);
}

export function saveHomeBlocks(blocks: HomeBlock[]): void {
  savePageBlocks(PAGE_ID, blocks);
}

export function addHomeBlock(type: HomeBlockType): HomeBlock | null {
  return addPageBlock(PAGE_ID, type);
}

export function updateHomeBlock(id: string, patch: Partial<HomeBlock>): void {
  updatePageBlock(PAGE_ID, id, patch);
}

export function removeHomeBlock(id: string): void {
  removePageBlock(PAGE_ID, id);
}

export function toggleHomeBlock(id: string): void {
  togglePageBlock(PAGE_ID, id);
}

export function moveHomeBlock(id: string, targetIndex: number): void {
  movePageBlock(PAGE_ID, id, targetIndex);
}

export function moveHomeBlockBy(id: string, direction: "up" | "down"): void {
  movePageBlockBy(PAGE_ID, id, direction);
}

export function resetHomeBlocks(): void {
  resetPageBlocks(PAGE_ID);
}

export function useHomeBlocks(): HomeBlock[] {
  return usePageBlocks(PAGE_ID);
}

export function useVisibleHomeBlocks(): HomeBlock[] {
  return useVisiblePageBlocks(PAGE_ID);
}
