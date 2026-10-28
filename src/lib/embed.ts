/**
 * أدوات روابط الفيديو المدمجة (embed).
 * المنصة تقبل روابط يوتيوب وإنستجرام فقط، ولا ترفع ملفات فيديو.
 */

export type ReelPlatform = "youtube" | "instagram" | "unknown";

const YOUTUBE_ID =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

const INSTAGRAM_CODE = /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/;

export function detectReelPlatform(url: string): ReelPlatform {
  const value = url.trim();
  if (!value) return "unknown";
  if (YOUTUBE_ID.test(value)) return "youtube";
  if (INSTAGRAM_CODE.test(value)) return "instagram";
  return "unknown";
}

/** تحويل أي رابط يوتيوب/إنستجرام إلى رابط embed صالح للعرض داخل iframe */
export function toEmbedUrl(url: string): string | null {
  const value = url.trim();
  if (!value) return null;

  const youtube = value.match(YOUTUBE_ID);
  if (youtube) {
    return `https://www.youtube.com/embed/${youtube[1]}?rel=0&modestbranding=1`;
  }

  const instagram = value.match(INSTAGRAM_CODE);
  if (instagram) {
    return `https://www.instagram.com/reel/${instagram[1]}/embed`;
  }

  return null;
}

export function isValidReelUrl(url: string): boolean {
  return toEmbedUrl(url) !== null;
}

export function reelPlatformLabel(platform: ReelPlatform): string {
  if (platform === "youtube") return "YouTube";
  if (platform === "instagram") return "Instagram";
  return "—";
}
