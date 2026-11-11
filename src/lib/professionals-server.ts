import { randomUUID } from "node:crypto";
import { cloudGetRows, cloudRest } from "@/lib/cloud/server";
import {
  canonicalProfessionalsValue,
  professionalVersion,
} from "@/lib/professionals-data";
import { detectReelPlatform, isValidReelUrl } from "@/lib/embed";
import type {
  ProfessionalProject,
  ProfessionalRecord,
  ProfessionalReel,
} from "@/lib/professionals-store";

const PROFESSIONALS_KEY = "aqaar-professionals";
const MAX_PROJECTS = 20;
const MAX_REELS = 20;

export class ProfessionalConflictError extends Error {
  current?: ProfessionalRecord;

  constructor(current?: ProfessionalRecord) {
    super("تم تعديل الملف من جهاز آخر. حدّث الصفحة ثم أعد المحاولة.");
    this.name = "ProfessionalConflictError";
    this.current = current;
  }
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function cleanText(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : undefined;
}

function cleanList(value: unknown, maxItems = 30, maxLength = 160): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, maxLength))
        .filter(Boolean)
    )
  ).slice(0, maxItems);
}

function cleanMedia(value: unknown): string | undefined {
  const raw = cleanText(value, 1_500_000);
  if (!raw) return undefined;
  if (/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" ? raw : undefined;
  } catch {
    return undefined;
  }
}

function cleanUrl(value: unknown): string | undefined {
  const raw = cleanText(value, 1000);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:"
      ? raw
      : undefined;
  } catch {
    return undefined;
  }
}

function cleanReels(value: unknown): ProfessionalReel[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_REELS).flatMap((raw, index) => {
    const item = objectValue(raw);
    const url = cleanText(item.url, 1000) ?? "";
    if (!url || !isValidReelUrl(url)) return [];
    return [
      {
        id: cleanText(item.id, 120) ?? `reel-${randomUUID()}`,
        titleAr: cleanText(item.titleAr, 180) ?? "فيديو تعريفي",
        titleEn: cleanText(item.titleEn, 180),
        url,
        platform: detectReelPlatform(url),
        order: index + 1,
      },
    ];
  });
}

function projectContent(project: ProfessionalProject) {
  return {
    titleAr: project.titleAr,
    titleEn: project.titleEn,
    descriptionAr: project.descriptionAr,
    descriptionEn: project.descriptionEn,
    cityAr: project.cityAr,
    typeAr: project.typeAr,
    typeId: project.typeId,
    purpose: project.purpose,
    coverUrl: project.coverUrl,
    priceFrom: project.priceFrom,
    deliveryAr: project.deliveryAr,
    areaFrom: project.areaFrom,
    unitsCount: project.unitsCount,
    roleAr: project.roleAr,
    year: project.year,
    gallery: project.gallery ?? [],
    videoUrl: project.videoUrl,
    featuresAr: project.featuresAr ?? [],
    paymentPlanAr: project.paymentPlanAr,
    mapLat: project.mapLat,
    mapLng: project.mapLng,
  };
}

function cleanProjects(
  value: unknown,
  current: ProfessionalProject[],
  actor: string
): ProfessionalProject[] {
  if (!Array.isArray(value)) return [];
  const existing = new Map(current.map((project) => [project.id, project]));
  const now = new Date().toISOString();
  return value.slice(0, MAX_PROJECTS).flatMap((raw, index) => {
    const item = objectValue(raw);
    const titleAr = cleanText(item.titleAr, 180);
    if (!titleAr) return [];
    const id = cleanText(item.id, 120) ?? `project-${randomUUID()}`;
    const previous = existing.get(id);
    const requestedStatus = item.status === "draft" ? "draft" : "pending";
    const purpose =
      item.purpose === "rent" ||
      item.purpose === "marketing" ||
      item.purpose === "project"
        ? item.purpose
        : "sale";
    const units = Number(item.unitsCount);
    const lat = Number(item.mapLat);
    const lng = Number(item.mapLng);
    const event = {
      id: `evt-${Date.now()}-${index}`,
      action: requestedStatus === "draft" ? ("draft" as const) : previous ? ("edited" as const) : ("submitted" as const),
      at: now,
      by: actor,
      byRole: "professional",
    };
    const candidate: ProfessionalProject = {
        id,
        titleAr,
        titleEn: cleanText(item.titleEn, 180),
        descriptionAr: cleanText(item.descriptionAr, 4000),
        descriptionEn: cleanText(item.descriptionEn, 4000),
        cityAr: cleanText(item.cityAr, 120),
        typeAr: cleanText(item.typeAr, 120),
        typeId:
          typeof item.typeId === "string"
            ? (item.typeId as ProfessionalProject["typeId"])
            : undefined,
        purpose,
        coverUrl: cleanMedia(item.coverUrl),
        priceFrom: cleanText(item.priceFrom, 120),
        deliveryAr: cleanText(item.deliveryAr, 160),
        areaFrom: cleanText(item.areaFrom, 120),
        unitsCount:
          Number.isFinite(units) && units >= 0 && units <= 1_000_000
            ? Math.round(units)
            : undefined,
        roleAr: cleanText(item.roleAr, 160),
        year: cleanText(item.year, 10),
        gallery: cleanList(item.gallery, 10, 1500).filter((url) => cleanMedia(url)),
        videoUrl:
          typeof item.videoUrl === "string" && isValidReelUrl(item.videoUrl)
            ? item.videoUrl.trim().slice(0, 1000)
            : undefined,
        featuresAr: cleanList(item.featuresAr, 30, 160),
        paymentPlanAr: cleanText(item.paymentPlanAr, 1000),
        mapLat: Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : undefined,
        mapLng: Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : undefined,
        status: requestedStatus,
        featured: false,
        history: [...(previous?.history ?? []), event].slice(-25),
        createdAt: previous?.createdAt ?? now,
        order: index + 1,
      };
    if (
      previous &&
      JSON.stringify(projectContent(previous)) ===
        JSON.stringify(projectContent(candidate))
    ) {
      return [{ ...previous, order: index + 1 }];
    }
    return [candidate];
  });
}

function editableProfile(record: ProfessionalRecord) {
  return {
    nameAr: record.nameAr,
    nameEn: record.nameEn,
    companyAr: record.companyAr,
    companyEn: record.companyEn,
    titleAr: record.titleAr,
    titleEn: record.titleEn,
    bioAr: record.bioAr,
    bioEn: record.bioEn,
    cityAr: record.cityAr,
    coverageAr: record.coverageAr,
    specialtiesAr: record.specialtiesAr,
    website: record.website,
    socials: record.socials,
    logoUrl: record.logoUrl,
    photoUrl: record.photoUrl,
    reels: record.reels,
  };
}

function sanitizeOwnedUpdate(
  current: ProfessionalRecord,
  incomingValue: unknown,
  actor: string
): ProfessionalRecord {
  const incoming = objectValue(incomingValue);
  const socials = objectValue(incoming.socials);
  const nextSocials = {
    facebook: cleanUrl(socials.facebook),
    instagram: cleanUrl(socials.instagram),
    x: cleanUrl(socials.x),
    linkedin: cleanUrl(socials.linkedin),
    youtube: cleanUrl(socials.youtube),
    tiktok: cleanUrl(socials.tiktok),
  };
  const hasSocials = Object.values(nextSocials).some(Boolean);
  const next: ProfessionalRecord = {
    ...current,
    nameAr: cleanText(incoming.nameAr, 160) ?? current.nameAr,
    nameEn: cleanText(incoming.nameEn, 160),
    companyAr: cleanText(incoming.companyAr, 180),
    companyEn: cleanText(incoming.companyEn, 180),
    titleAr: cleanText(incoming.titleAr, 180),
    titleEn: cleanText(incoming.titleEn, 180),
    bioAr: cleanText(incoming.bioAr, 4000),
    bioEn: cleanText(incoming.bioEn, 4000),
    cityAr: cleanText(incoming.cityAr, 120),
    coverageAr: cleanList(incoming.coverageAr),
    specialtiesAr: cleanList(incoming.specialtiesAr),
    website: cleanUrl(incoming.website),
    socials: hasSocials ? nextSocials : undefined,
    logoUrl: cleanMedia(incoming.logoUrl),
    photoUrl: cleanMedia(incoming.photoUrl),
    projects: cleanProjects(incoming.projects, current.projects ?? [], actor),
    reels: cleanReels(incoming.reels),
    updatedAt: new Date().toISOString(),
    version: professionalVersion(current),
  };
  const profileChanged =
    JSON.stringify(editableProfile(next)) !==
    JSON.stringify(editableProfile(current));
  if (profileChanged) {
    next.status = "pending";
    next.reviewedAt = undefined;
    next.reviewNote = undefined;
  }
  return next;
}

export async function getOwnedProfessional(
  accountId: string
): Promise<{ record: ProfessionalRecord; updatedAt: string } | null> {
  const rows = await cloudGetRows({ keys: [PROFESSIONALS_KEY], timeoutMs: 8_000 });
  const row = rows[0];
  const record = canonicalProfessionalsValue(row?.value).find(
    (item) => item.accountId === accountId
  ) as ProfessionalRecord | undefined;
  return record && row ? { record, updatedAt: row.updated_at } : null;
}

interface UpdateOwnedResult {
  result: "updated" | "conflict" | "not_found";
  record?: ProfessionalRecord;
  updated_at?: string;
}

export async function updateOwnedProfessional(input: {
  accountId: string;
  actor: string;
  expectedVersion: number;
  value: unknown;
}): Promise<{ record: ProfessionalRecord; updatedAt: string }> {
  const owned = await getOwnedProfessional(input.accountId);
  if (!owned) throw new Error("NOT_FOUND");
  const next = sanitizeOwnedUpdate(owned.record, input.value, input.actor);
  const result = await cloudRest<UpdateOwnedResult>(
    "rpc/update_owned_professional",
    {
      method: "POST",
      body: {
        p_account_id: input.accountId,
        p_record_id: owned.record.id,
        p_expected_version: input.expectedVersion,
        p_next_record: next,
        p_updated_by: input.actor,
      },
      timeoutMs: 12_000,
    }
  );
  if (result.result === "conflict") {
    throw new ProfessionalConflictError(result.record);
  }
  if (result.result !== "updated" || !result.record || !result.updated_at) {
    throw new Error("NOT_FOUND");
  }
  return { record: result.record, updatedAt: result.updated_at };
}
