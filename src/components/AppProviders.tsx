"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { CurrencyProvider } from "@/lib/currency";

/** مزوّدات المنصة: اللغة ثم العملة (التي تعتمد على اللغة) */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </I18nProvider>
  );
}
