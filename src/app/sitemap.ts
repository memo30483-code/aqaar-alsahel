import type { MetadataRoute } from "next";
import { getSeoProfessionals, getSeoProperties } from "@/lib/seo-data";
import { absoluteUrl } from "@/lib/site-url";

export const revalidate = 3600;

const STATIC_PATHS = [
  "/",
  "/company",
  "/projects",
  "/developers",
  "/brokers",
  "/lawyers",
  "/engineers",
  "/market-guide",
  "/legal-consultational",
  "/engineering-consultational",
  "/offers",
  "/wanted-properties",
  "/request-property",
  "/app",
  "/privacy",
  "/terms",
  "/sitemap",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, professionals] = await Promise.all([
    getSeoProperties(),
    getSeoProfessionals(),
  ]);
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
  const propertyEntries: MetadataRoute.Sitemap = properties.map((property) => ({
    url: absoluteUrl(`/property/${encodeURIComponent(property.id)}`),
    lastModified: property.submittedAt ? new Date(property.submittedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
    ...(property.image ? { images: [property.image] } : {}),
  }));
  const professionalEntries: MetadataRoute.Sitemap = professionals.flatMap(
    (record) => {
      const base =
        record.kind === "developer"
          ? "/developers"
          : record.kind === "marketer"
            ? "/brokers"
            : record.kind === "lawyer"
              ? "/lawyers"
              : "/engineers";
      const profile: MetadataRoute.Sitemap[number] = {
        url: absoluteUrl(`${base}/${encodeURIComponent(record.id)}`),
        lastModified: record.updatedAt ? new Date(record.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.75,
      };
      const projects: MetadataRoute.Sitemap = record.projects.map((project) => ({
        url: absoluteUrl(`/projects/${encodeURIComponent(project.id)}`),
        lastModified: project.updatedAt ? new Date(project.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.75,
        ...(project.coverUrl ? { images: [project.coverUrl] } : {}),
      }));
      return [profile, ...projects];
    }
  );
  return [...staticEntries, ...propertyEntries, ...professionalEntries];
}
