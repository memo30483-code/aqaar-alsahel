import { NextResponse } from "next/server";
import { cloudEnabled, cloudUploadToBucket } from "@/lib/cloud/server";
import { getUserApiSession } from "@/lib/user-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const WINDOW_MS = 30 * 60 * 1000;
const MAX_UPLOADS = 30;
const attempts = new Map<string, { count: number; resetAt: number }>();

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function allowUpload(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_UPLOADS) return false;
  current.count += 1;
  return true;
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function matchesSignature(type: string, bytes: Uint8Array): boolean {
  if (type === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return bytes.length >= png.length && png.every((value, index) => bytes[index] === value);
  }
  if (type === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  if (type === "application/pdf") {
    return (
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    );
  }
  return false;
}

function extension(type: string): string {
  if (type === "application/pdf") return "pdf";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "مصدر الطلب غير مسموح" }, { status: 403 });
  }
  const session = await getUserApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول بحساب معتمد قبل رفع الملفات" },
      { status: 401 }
    );
  }
  if (!cloudEnabled()) {
    return NextResponse.json({ ok: false, error: "التخزين السحابي غير مضبوط" }, { status: 503 });
  }
  if (!allowUpload(`${session.sub}:${clientKey(request)}`)) {
    return NextResponse.json(
      { ok: false, error: "تم تجاوز عدد الرفعات المسموح مؤقتًا، حاول لاحقًا" },
      { status: 429 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const kind = form.get("kind");
    const submissionId = String(form.get("submissionId") ?? "");
    const documentKey = String(form.get("documentKey") ?? "document");

    if (!(file instanceof File) || (kind !== "image" && kind !== "document")) {
      return NextResponse.json({ ok: false, error: "ملف غير صالح" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9-]{8,80}$/.test(submissionId)) {
      return NextResponse.json({ ok: false, error: "رقم رفع غير صالح" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(documentKey)) {
      return NextResponse.json({ ok: false, error: "نوع مستند غير صالح" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "حجم الملف يجب ألا يتجاوز 4 ميجابايت" },
        { status: 413 }
      );
    }

    const allowed = kind === "image" ? IMAGE_TYPES : DOCUMENT_TYPES;
    if (!allowed.has(file.type)) {
      return NextResponse.json({ ok: false, error: "نوع الملف غير مسموح" }, { status: 415 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!matchesSignature(file.type, bytes)) {
      return NextResponse.json(
        { ok: false, error: "محتوى الملف لا يطابق نوعه الحقيقي" },
        { status: 415 }
      );
    }

    const bucket = kind === "image" ? "media" : "documents";
    const path = `property-submissions/${submissionId}/${kind}-${documentKey}-${crypto.randomUUID()}.${extension(file.type)}`;
    const uploaded = await cloudUploadToBucket(
      bucket,
      path,
      bytes,
      file.type
    );

    return NextResponse.json({
      ok: true,
      path: uploaded.path,
      ...(uploaded.publicUrl ? { url: uploaded.publicUrl } : {}),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "تعذر رفع الملف",
      },
      { status: 500 }
    );
  }
}
