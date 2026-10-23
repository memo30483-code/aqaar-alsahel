"use client";

import { useCallback, useEffect, useState } from "react";

interface Props {
  images: string[];
  title: string;
}

export default function ImageSlider({ images, title }: Props) {
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
    <div className="overflow-hidden rounded-2xl bg-ocean-900">
      <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt={`${title} — صورة ${index + 1}`}
          className="h-full w-full object-cover transition-opacity duration-300"
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-4 pb-4 pt-12">
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    i === index
                      ? "border-white"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
            <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              {index + 1} / {total}
            </span>
          </div>
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="السابق"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ocean-900 shadow-soft transition hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="التالي"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ocean-900 shadow-soft transition hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
