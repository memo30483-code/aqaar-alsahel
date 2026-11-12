import {
  cloudDeleteStorageObject,
  cloudDeleteUploadTracking,
  cloudGetOrphanUploads,
  cloudPurgeClaimedUploadTracking,
} from "@/lib/cloud/server";

const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;
const CLAIMED_METADATA_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export async function cleanupOrphanUploads(limit = 100): Promise<{
  scanned: number;
  deleted: number;
  failed: number;
}> {
  const orphanCutoff = new Date(Date.now() - ORPHAN_AGE_MS).toISOString();
  const rows = await cloudGetOrphanUploads(orphanCutoff, limit);
  const deletedPaths: string[] = [];
  let failed = 0;

  for (const row of rows) {
    try {
      await cloudDeleteStorageObject(row.bucket, row.path);
      deletedPaths.push(row.path);
    } catch {
      failed += 1;
    }
  }

  await cloudDeleteUploadTracking(deletedPaths);
  const claimedCutoff = new Date(
    Date.now() - CLAIMED_METADATA_AGE_MS
  ).toISOString();
  await cloudPurgeClaimedUploadTracking(claimedCutoff);

  return {
    scanned: rows.length,
    deleted: deletedPaths.length,
    failed,
  };
}
