"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  images: string[];
  title: string;
}

export default function ImageSlider({ images, title }: Props) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const total = images.length;

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + total) % total);
    },
    [total]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (total === 0) return null;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-sand-200 bg-ocean-950 shadow-[0_34px_90px_-70px_rgba(20,26,51,0.85)]">
      <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={t("property.imageAlt", { title, index: index + 1 })}
          className="h-full w-full object-cover transition-opacity duration-500"
        />

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(10,14,32,0.72)_0%,rgba(10,14,32,0.16)_38%,rgba(10,14,32,0)_65%)]"
        />

        {/* عدّاد الصور */}
        <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-ocean-950/45 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur">
          <Images className="h-3.5 w-3.5 text-gold-300" />
          {index + 1} / {total}
        </span>

        {/* أسهم التنقل */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t("property.prevImage")}
              className="absolute end-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition hover:border-white/50 hover:bg-white/25 sm:h-11 sm:w-11"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t("property.nextImage")}
              className="absolute start-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition hover:border-white/50 hover:bg-white/25 sm:h-11 sm:w-11"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </>
        )}

        {/* المصغّرات */}
        {total > 1 && (
          <div className="absolute inset-x-0 bottom-0 hidden px-4 pb-4 sm:block">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={t("property.imageAlt", { title, index: i + 1 })}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    i === index
                      ? "border-gold-300 opacity-100"
                      : "border-white/25 opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
