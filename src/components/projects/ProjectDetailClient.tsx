"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getSession, hasAdminAccess } from "@/lib/session";
import {
  isProjectPublic,
  useProfessionalsState,
  type PublicProjectEntry,
} from "@/lib/professionals-store";
import ProjectDetail from "./ProjectDetail";

export default function ProjectDetailClient({ id }: { id: string }) {
  const { t } = useI18n();
  const { records, ready } = useProfessionalsState();

  const found = useMemo<PublicProjectEntry | null>(() => {
    for (const record of records) {
      const project = record.projects.find((item) => item.id === id);
      if (project) return { record, project };
    }
    return null;
  }, [records, id]);

  /* الإدارة تستطيع معاينة المشروع قبل اعتماده، والزائر يرى المنشور فقط */
  const visible = useMemo(() => {
    if (!found) return false;
    if (isProjectPublic(found.record, found.project)) return true;
    return hasAdminAccess(getSession());
  }, [found]);

  if (!ready) {
    return (
      <div className="grid min-h-[55vh] place-items-center bg-sand-50">
        <span className="h-9 w-9 animate-spin rounded-full border-2 border-gold-300 border-t-transparent" />
      </div>
    );
  }

  if (!found || !visible) {
    return (
      <div className="bg-sand-50">
        <section className="mx-auto w-full max-w-[820px] px-4 py-20 text-center sm:px-6">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-gold-600 shadow-sm">
            <Building2 className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-[24px] font-black text-ocean-900">
            {t("prof.project.notFoundTitle")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-7 text-sand-600">
            {t("prof.project.notFoundDesc")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/developers"
              className="rounded-xl bg-ocean-950 px-5 py-2.5 text-[11.5px] font-black text-white transition hover:bg-ocean-900"
            >
              {t("prof.project.backToDirectory")}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-sand-200 bg-white px-5 py-2.5 text-[11.5px] font-bold text-ocean-800 transition hover:border-gold-300"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-gold-600" />
              {t("prof.project.breadcrumbHome")}
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return <ProjectDetail record={found.record} project={found.project} />;
}
