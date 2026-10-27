"use client";

import type { ReactNode } from "react";
import type { ListingStatus } from "@/lib/admin-system";

export const STATUS_LABEL: Record<ListingStatus, string> = {
  pending: "قيد المراجعة",
  approved: "منشور",
  rejected: "مرفوض",
  archived: "مؤرشف",
  deleted: "محذوف (سلة المحذوفات)",
};

export const STATUS_STYLE: Record<ListingStatus, string> = {
  pending: "border border-amber-200 bg-amber-50 text-amber-700",
  approved: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border border-rose-200 bg-rose-50 text-rose-700",
  archived: "border border-sand-200 bg-sand-100 text-sand-700",
  deleted: "border border-red-200 bg-red-50 text-red-700",
};

export const ROW_ACTION =
  "inline-flex items-center gap-1 rounded-xl border border-sand-200 bg-white px-2 py-1 text-[11px] font-bold text-ocean-800 transition hover:border-gold-300 hover:bg-gold-50/50 hover:text-gold-700";

export const INPUT =
  "w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-ocean-900 outline-none transition placeholder:font-medium placeholder:text-sand-500 focus:border-gold-400 focus:ring-2 focus:ring-gold-200/60";

export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-ocean-950 px-4 py-2 text-[12px] font-black text-white transition hover:bg-ocean-900 disabled:cursor-not-allowed disabled:opacity-50";

export const BTN_GOLD =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold-500 to-gold-400 px-4 py-2 text-[12px] font-black text-ocean-950 shadow-[0_16px_34px_-22px_rgba(201,146,42,0.9)] transition hover:-translate-y-0.5";

export function Panel({
  title,
  desc,
  actions,
  children,
}: {
  title: string;
  desc?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-[0_26px_70px_-65px_rgba(20,26,51,0.5)]">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-gold-600/70 via-gold-300/70 to-transparent"
      />
      <header className="flex flex-col gap-3 border-b border-sand-200 bg-sand-50/40 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-black text-ocean-900">{title}</h2>
          {desc && (
            <p className="mt-1 text-[11.5px] leading-6 text-sand-700">{desc}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-extrabold text-sand-700">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[10.5px] text-sand-500">{hint}</span>
      )}
    </label>
  );
}

export function ToggleRow({
  title,
  hint,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-sand-200 bg-sand-50/50 p-3">
      <div>
        <p className="text-[12.5px] font-extrabold text-ocean-900">{title}</p>
        {hint && (
          <p className="mt-0.5 text-[10.5px] leading-5 text-sand-600">{hint}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-sand-300"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "start-[22px]" : "start-0.5"
          }`}
        />
      </button>
    </div>
  );
}
