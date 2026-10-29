"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * قراءة بيانات غير متزامنة عبر منفذ البيانات.
 *
 * الاستخدام:
 *   const { data, loading, error, refresh } = useAsyncData(
 *     () => dataSource().offers.list(),
 *     [] as Offer[],
 *   );
 *
 * القاعدة الذهبية: لا تنادِ مخزن localStorage من المكوّن مباشرة بعد اليوم —
 * كل قراءة تمر من `dataSource()` حتى يبقى التبديل لقاعدة البيانات في مكان واحد.
 */
export interface AsyncDataState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  initial: T,
  deps: readonly unknown[] = []
): AsyncDataState<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  /* نحفظ آخر loader في مرجع حتى لا نعيد الطلب مع كل رسم */
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loaderRef.current()
      .then((value) => {
        if (!alive) return;
        setData(value);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!alive) return;
        setError(
          reason instanceof Error && reason.message
            ? reason.message
            : "تعذّر تحميل البيانات"
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  return { data, loading, error, refresh };
}
