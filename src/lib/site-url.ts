const configured =
  process.env.NEXT_PUBLIC_SITE_URL || "https://aqaar-alsahel.vercel.app";

export const SITE_URL = configured.replace(/\/+$/, "");

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${SITE_URL}/`).toString();
}
