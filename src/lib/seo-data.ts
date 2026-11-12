import { cache } from "react";
import { cloudGetRows } from "@/lib/cloud/server";
import { canonicalProfessionalsValue } from "@/lib/professionals-data";
import { loadPublishedProperties } from "@/lib/property-requests-server";
import type { Property } from "@/types/property";

export interface SeoProject {
  id: string;
  titleAr: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  cityAr?: string;
  coverUrl?: string;
  priceFrom?: string;
  updatedAt?: string;
}

export interface SeoProfessional {
  id: string;
  kind: "developer" | "marketer" | "lawyer" | "engineer";
  nameAr: string;
  nameEn?: string;
  companyAr?: string;
  companyEn?: string;
  titleAr?: string;
  titleEn?: string;
  bioAr?: string;
  bioEn?: string;
  cityAr?: string;
  logoUrl?: string;
  photoUrl?: string;
  updatedAt?: string;
  projects: SeoProject[];
}

function text(value: unknown, max = 4000): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : undefined;
}

export const getSeoProfessionals = cache(async (): Promise<SeoProfessional[]> => {
  try {
    const rows = await cloudGetRows({
      keys: ["aqaar-professionals"],
      revalidate: 300,
      timeoutMs: 5_000,
    });
    return canonicalProfessionalsValue(rows[0]?.value).flatMap((raw) => {
      if (raw.status !== "approved") return [];
      const kind = raw.kind;
      const id = text(raw.id, 120);
      const nameAr = text(raw.nameAr, 160);
      if (
        !id ||
        !nameAr ||
        (kind !== "developer" &&
          kind !== "marketer" &&
          kind !== "lawyer" &&
          kind !== "engineer")
      ) {
        return [];
      }
      const projects: SeoProject[] = Array.isArray(raw.projects)
        ? raw.projects.flatMap((item) => {
            if (!item || typeof item !== "object" || Array.isArray(item)) return [];
            const project = item as Record<string, unknown>;
            const projectId = text(project.id, 120);
            const titleAr = text(project.titleAr, 180);
            if (!projectId || !titleAr || project.status !== "approved") return [];
            return [{
              id: projectId,
              titleAr,
              titleEn: text(project.titleEn, 180),
              descriptionAr: text(project.descriptionAr),
              descriptionEn: text(project.descriptionEn),
              cityAr: text(project.cityAr, 120),
              coverUrl: text(project.coverUrl, 1500),
              priceFrom: text(project.priceFrom, 120),
              updatedAt: text(project.reviewedAt, 80) ?? text(project.createdAt, 80),
            }];
          })
        : [];
      return [{
        id,
        kind,
        nameAr,
        nameEn: text(raw.nameEn, 160),
        companyAr: text(raw.companyAr, 180),
        companyEn: text(raw.companyEn, 180),
        titleAr: text(raw.titleAr, 180),
        titleEn: text(raw.titleEn, 180),
        bioAr: text(raw.bioAr),
        bioEn: text(raw.bioEn),
        cityAr: text(raw.cityAr, 120),
        logoUrl: text(raw.logoUrl, 1500),
        photoUrl: text(raw.photoUrl, 1500),
        updatedAt: text(raw.updatedAt, 80) ?? text(raw.reviewedAt, 80),
        projects,
      }];
    });
  } catch {
    return [];
  }
});

export const getSeoProperties = cache(async (): Promise<Property[]> => {
  return loadPublishedProperties({ revalidate: 300 });
});

export const findSeoProfessional = cache(
  async (kind: SeoProfessional["kind"], id: string) =>
    (await getSeoProfessionals()).find(
      (record) => record.kind === kind && record.id === id
    ) ?? null
);

export const findSeoProject = cache(async (id: string) => {
  for (const professional of await getSeoProfessionals()) {
    const project = professional.projects.find((item) => item.id === id);
    if (project) return { professional, project };
  }
  return null;
});
