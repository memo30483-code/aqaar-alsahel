"use client";

import { useEffect, useState } from "react";
import type { ReviewEntity } from "@/lib/reviews";

/**
 * تجميع طلبات ملخّص التقييمات في القوائم.
 *
 * كل بطاقة تطلب ملخّصها، لكننا نجمّع الطلبات في دفعة واحدة لكل نوع عنصر
 * بدل إرسال طلب لكل بطاقة. النتائج تُحفظ في ذاكرة المتصفح للجلسة.
 */

export interface RatingSummary {
  average: number;
  count: number;
}

type CacheValue = RatingSummary | null;

const cache = new Map<string, CacheValue>();
const listeners = new Map<string, Set<() => void>>();
const queue = new Set<string>();
const inflight = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

function keyOf(entityType: ReviewEntity, entityId: string): string {
  return `${entityType}:${entityId}`;
}

function emit(key: string): void {
  const set = listeners.get(key);
  if (!set) return;
  set.forEach((listener) => listener());
}

function request(entityType: ReviewEntity, entityId: string, key: string): void {
  if (cache.has(key) || inflight.has(key) || queue.has(key)) return;
  queue.add(key);
  schedule();
}

function schedule(): void {
  if (timer !== null) return;
  timer = setTimeout(() => {
    timer = null;
    void flush();
  }, 30);
}

function splitKey(key: string): { entityType: ReviewEntity; entityId: string } {
  const index = key.indexOf(":");
  return {
    entityType: key.slice(0, index) as ReviewEntity,
    entityId: key.slice(index + 1),
  };
}

async function flush(): Promise<void> {
  if (!queue.size) return;
  const queued = Array.from(queue);
  queue.clear();

  const groups: { entityType: ReviewEntity; ids: string[] }[] = [];
  for (const key of queued) {
    const { entityType, entityId } = splitKey(key);
    const group = groups.find((entry) => entry.entityType === entityType);
    if (group) group.ids.push(entityId);
    else groups.push({ entityType, ids: [entityId] });
  }

  await Promise.all(
    groups.map((group) => fetchGroup(group.entityType, group.ids))
  );
}

async function fetchGroup(
  entityType: ReviewEntity,
  ids: string[]
): Promise<void> {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += 60) {
    chunks.push(ids.slice(index, index + 60));
  }
  await Promise.all(chunks.map((chunk) => fetchChunk(entityType, chunk)));
}

async function fetchChunk(
  entityType: ReviewEntity,
  ids: string[]
): Promise<void> {
  const keys = ids.map((id) => keyOf(entityType, id));
  keys.forEach((key) => inflight.add(key));
  try {
    const response = await fetch(
      `/api/reviews/summary?entity=${encodeURIComponent(
        entityType
      )}&ids=${encodeURIComponent(ids.join(","))}`,
      { cache: "no-store" }
    );
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; summaries?: Record<string, RatingSummary> }
      | null;
    const summaries = data && data.ok ? data.summaries ?? {} : null;
    keys.forEach((key, index) => {
      const value = summaries
        ? summaries[ids[index]] ?? { average: 0, count: 0 }
        : null;
      cache.set(key, value);
    });
  } catch {
    keys.forEach((key) => cache.set(key, null));
  } finally {
    keys.forEach((key) => {
      inflight.delete(key);
      emit(key);
    });
  }
}

/** يعيد undefined أثناء التحميل، وnull إن تعذر الجلب، وإلا الملخّص */
export function useRatingSummary(
  entityType: ReviewEntity,
  entityId: string
): RatingSummary | null | undefined {
  const key = keyOf(entityType, entityId);
  const [value, setValue] = useState<CacheValue | undefined>(() =>
    cache.has(key) ? cache.get(key) : undefined
  );

  useEffect(() => {
    let alive = true;
    const listener = () => {
      if (alive) setValue(cache.get(key) ?? null);
    };
    const set = listeners.get(key) ?? new Set<() => void>();
    set.add(listener);
    listeners.set(key, set);

    if (cache.has(key)) listener();
    else request(entityType, entityId, key);

    return () => {
      alive = false;
      set.delete(listener);
      if (!set.size) listeners.delete(key);
    };
  }, [key, entityType, entityId]);

  return value;
}
