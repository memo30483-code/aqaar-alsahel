"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";

/**
 * سحب وإفلات أفقي لأي شريط منزلق (`overflow-x-auto`).
 *
 * يعمل مع الماوس واللمس والقلم، ويحترم اتجاه الصفحة (RTL/LTR):
 * في العربية يُسحب المحتوى لليسار للانتقال إلى البطاقات التالية.
 *
 * يوقف مؤقتًا `scroll-behavior: smooth` و`scroll-snap` أثناء السحب حتى
 * يتحرك الشريط مع المؤشر مباشرة، ثم يعيدهما عند الإفلات. كما يمنع فتح
 * الروابط أو سحب الصور إذا كانت الحركة سحبًا لا نقرة.
 */

/** أقل مسافة (بكسل) قبل اعتبار الحركة سحبًا وليس نقرة */
const DRAG_THRESHOLD = 5;

export interface DragScrollHandlers<T extends HTMLElement> {
  onPointerDown: (event: ReactPointerEvent<T>) => void;
  onClickCapture: (event: ReactMouseEvent<T>) => void;
  onDragStartCapture: (event: ReactMouseEvent<T>) => void;
}

/**
 * موضع التمرير الجديد بعد سحب مسافة `dx`.
 *
 * `scrollLeft` يقيس إزاحة المحتوى عن بدايته في الاتجاهين: زيادته تحرّك
 * المحتوى لليسار ونقصانه تحرّكه لليمين — سواء كانت الصفحة عربية أم
 * إنجليزية. لذلك يتبع المحتوى المؤشر دائمًا عبر `startScroll - dx`
 * من غير أي قلب للإشارة حسب اتجاه الصفحة.
 */
export function scrollLeftAfterDrag(
  startScroll: number,
  dx: number
): number {
  return startScroll - dx;
}

/** حالة حركة التمرير الجارية لكل عنصر حتى نلغيها قبل بدء حركة جديدة أو سحب */
interface ScrollAnimation {
  frame: number;
  guard: number;
  behavior: string;
  snap: string;
}

const animations = new WeakMap<HTMLElement, ScrollAnimation>();

function restoreStyles(node: HTMLElement, animation: ScrollAnimation) {
  window.cancelAnimationFrame(animation.frame);
  window.clearTimeout(animation.guard);
  node.style.scrollBehavior = animation.behavior;
  node.style.scrollSnapType = animation.snap;
  animations.delete(node);
}

/** إيقاف أي حركة تمرير تلقائية جارية دون القفز إلى نهايتها */
export function cancelHorizontalScroll(node: HTMLElement): void {
  const animation = animations.get(node);
  if (animation) restoreStyles(node, animation);
}

/**
 * تمرير أفقي ناعم إلى موضع محدد.
 *
 * لا نستخدم `scrollTo({ behavior: "smooth" })` لأن كروم يتعامل معه بشكل
 * خاطئ في الصفحات RTL (يكتمل بدون أي حركة عندما تكون القيم سالبة)، لذلك
 * نحرّك `scrollLeft` يدويًا عبر `requestAnimationFrame`.
 *
 * ومعه مؤقّت احتياطي: بعض المتصفحات توقف `requestAnimationFrame` في
 * التبويبات غير النشطة، فنضمن الوصول للموضع المطلوب بدل بقاء الشريط مكانه.
 */
export function animateScrollTo(
  node: HTMLElement,
  target: number,
  duration = 400
): void {
  cancelHorizontalScroll(node);

  const start = node.scrollLeft;
  const distance = target - start;
  if (Math.abs(distance) < 1) return;

  const animation: ScrollAnimation = {
    frame: 0,
    guard: 0,
    behavior: node.style.scrollBehavior,
    snap: node.style.scrollSnapType,
  };

  node.style.scrollBehavior = "auto";
  /* لا نترك snap يخطف الحركة في منتصفها */
  node.style.scrollSnapType = "none";

  const startedAt = performance.now();
  const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

  const finish = () => {
    if (animations.get(node) !== animation) return;
    node.scrollLeft = target;
    restoreStyles(node, animation);
  };

  const step = (now: number) => {
    if (animations.get(node) !== animation) return;
    const progress = Math.min(1, (now - startedAt) / duration);
    node.scrollLeft = start + distance * easeOutCubic(progress);
    if (progress < 1) {
      animation.frame = window.requestAnimationFrame(step);
    } else {
      finish();
    }
  };

  animations.set(node, animation);
  animation.frame = window.requestAnimationFrame(step);
  animation.guard = window.setTimeout(finish, duration + 250);
}

export function useDragScroll<T extends HTMLElement>(ref: RefObject<T>) {
  const [dragging, setDragging] = useState(false);
  /** يمنع فتح الرابط بعد سحب انتهى فوق البطاقة */
  const suppressClick = useRef(false);
  const suppressTimer = useRef<number | null>(null);
  const detach = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      detach.current?.();
      if (suppressTimer.current !== null) {
        window.clearTimeout(suppressTimer.current);
      }
    };
  }, []);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<T>) => {
      const element = ref.current;
      if (!element) return;
      /* سحب واحد فقط في المرة — نتجاهل لمسة ثانية أثناء السحب */
      if (detach.current) return;
      /* نوع غير قابل للعدم ليظل واضحًا داخل دوال الأحداث */
      const node: T = element;
      /* زر الماوس الأيسر فقط — نترك القائمة اليمنى تعمل بشكل طبيعي */
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (node.scrollWidth <= node.clientWidth + 1) return;

      const startX = event.clientX;
      const startScroll = node.scrollLeft;
      const pointerId = event.pointerId;

      /* سحب جديد يوقف أي حركة أسهم جارية */
      cancelHorizontalScroll(node);

      let moved = 0;
      let active = false;
      let previousBehavior = "";
      let previousSnap = "";
      let previousUserSelect = "";

      const beginDrag = () => {
        active = true;
        setDragging(true);
        previousBehavior = node.style.scrollBehavior;
        previousSnap = node.style.scrollSnapType;
        previousUserSelect = document.body.style.userSelect;
        /* حركة مباشرة مع المؤشر بدل الانتقال الناعم */
        node.style.scrollBehavior = "auto";
        node.style.scrollSnapType = "none";
        document.body.style.userSelect = "none";
      };

      const endDrag = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onEnd);
        window.removeEventListener("pointercancel", onEnd);
        detach.current = null;

        if (!active) return;

        node.style.scrollBehavior = previousBehavior;
        node.style.scrollSnapType = previousSnap;
        document.body.style.userSelect = previousUserSelect;
        setDragging(false);

        /* النقرة التي تعقب الإفلات لا تفتح الرابط */
        suppressClick.current = true;
        if (suppressTimer.current !== null) {
          window.clearTimeout(suppressTimer.current);
        }
        suppressTimer.current = window.setTimeout(() => {
          suppressClick.current = false;
          suppressTimer.current = null;
        }, 350);
      };

      function onMove(moveEvent: PointerEvent) {
        if (moveEvent.pointerId !== pointerId) return;
        const dx = moveEvent.clientX - startX;
        moved = Math.max(moved, Math.abs(dx));

        if (!active) {
          if (moved < DRAG_THRESHOLD) return;
          beginDrag();
          /* أول سحب يبدأ من النقطة الحالية بلا قفزة */
        }

        node.scrollLeft = scrollLeftAfterDrag(startScroll, dx);
      }

      function onEnd(endEvent: PointerEvent) {
        if (endEvent.pointerId !== pointerId) return;
        endDrag();
      }

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onEnd);
      window.addEventListener("pointercancel", onEnd);
      detach.current = endDrag;
    },
    [ref]
  );

  const onClickCapture = useCallback((event: ReactMouseEvent<T>) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick.current = false;
  }, []);

  const onDragStartCapture = useCallback((event: ReactMouseEvent<T>) => {
    /* يمنع سحب الصور/النصوص الأصلية داخل الشريط */
    event.preventDefault();
  }, []);

  return {
    dragging,
    handlers: {
      onPointerDown,
      onClickCapture,
      onDragStartCapture,
    } satisfies DragScrollHandlers<T>,
  };
}
