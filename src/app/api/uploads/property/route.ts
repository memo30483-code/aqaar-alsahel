import { NextResponse } from "next/server";
import { cloudEnabled, cloudUploadToBucket } from "@/lib/cloud/server";

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
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
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
  if (!cloudEnabled()) {
    return NextResponse.json({ ok: false, error: "التخزين السحابي غير مضبوط" }, { status: 503 });
  }
  if (!allowUpload(clientKey(request))) {
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

    const bucket = kind === "image" ? "media" : "documents";
    const path = `property-submissions/${submissionId}/${kind}-${documentKey}-${crypto.randomUUID()}.${extension(file.type)}`;
    const uploaded = await cloudUploadToBucket(
      bucket,
      path,
      await file.arrayBuffer(),
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
