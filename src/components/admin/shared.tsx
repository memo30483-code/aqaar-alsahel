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
  archived: "border border-slate-200 bg-slate-100 text-slate-700",
  deleted: "border border-red-200 bg-red-50 text-red-700",
};

export const ROW_ACTION =
  "inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 transition hover:border-[#b8963b] hover:text-[#b8963b]";

export const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#b8963b] focus:ring-2 focus:ring-[rgba(201,162,77,0.18)]";

export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

export const BTN_GOLD =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#b8963b] to-[#d9b95c] px-4 py-2 text-sm font-bold text-white shadow-[0_14px_30px_-18px_rgba(184,150,59,0.9)] transition hover:-translate-y-0.5";

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
    <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white/90 shadow-[0_30px_80px_-70px_rgba(15,23,42,0.65)]">
      <header className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900">{title}</h2>
          {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
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
      <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
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
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3">
      <div>
        <p className="text-sm font-bold text-slate-800">{title}</p>
        {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-emerald-500" : "bg-slate-300"
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
