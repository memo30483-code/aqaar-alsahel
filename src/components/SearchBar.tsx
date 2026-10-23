"use client";

import { FormEvent } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  resultCount?: number;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  resultCount,
}: Props) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center gap-2 rounded-2xl border border-ocean-100 bg-white p-2 shadow-soft sm:p-2.5"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ocean-50 text-ocean-600">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ابحث باسم المنطقة أو الحي..."
        className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ocean-900 outline-none placeholder:text-ocean-400"
        aria-label="بحث بالمنطقة"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-ocean-500 hover:bg-ocean-50 hover:text-ocean-800"
        >
          مسح
        </button>
      )}
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-ocean-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ocean-800 sm:px-5"
      >
        بحث
      </button>
      {typeof resultCount === "number" && (
        <span className="absolute -bottom-7 left-0 text-xs text-ocean-500 sm:left-auto sm:right-1">
          {resultCount} عقار
        </span>
      )}
    </form>
  );
}
