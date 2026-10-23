"use client";

import Link from "next/link";
import { useState } from "react";

const cities = [
  { name: "رأس البر", href: "/#properties" },
  { name: "دمياط الجديدة", href: "/#properties" },
  { name: "دمياط القديمة", href: "/#properties" },
  { name: "المنصورة الجديدة", href: "/#properties" },
  { name: "جمصة", href: "/#properties" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ocean-100/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-600 to-ocean-800 text-lg font-bold text-white shadow-soft transition group-hover:scale-105">
            ع
          </span>
          <span className="text-xl font-bold tracking-tight text-ocean-900 sm:text-2xl">
            عقار الساحل
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {cities.map((city) => (
            <Link
              key={city.name}
              href={city.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ocean-700 transition hover:bg-ocean-50 hover:text-ocean-900"
            >
              {city.name}
            </Link>
          ))}
          <Link
            href="/add-property"
            className="mr-2 rounded-xl bg-ocean-700 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-ocean-800"
          >
            أضف عقارك
          </Link>
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-ocean-200 text-ocean-800 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="القائمة"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-ocean-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {cities.map((city) => (
              <Link
                key={city.name}
                href={city.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ocean-700 hover:bg-ocean-50"
                onClick={() => setOpen(false)}
              >
                {city.name}
              </Link>
            ))}
            <Link
              href="/add-property"
              className="mt-2 rounded-xl bg-ocean-700 px-4 py-2.5 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              أضف عقارك
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
