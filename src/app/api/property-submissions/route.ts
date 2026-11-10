import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { USER_PROPERTIES_KEY } from "@/data/properties";
import type {
  Property,
  PropertyDocument,
  PropertyType,
  Purpose,
  SaleReason,
  SellerType,
} from "@/types/property";
import { FINISH_STATES, isBuildingType, type FinishState } from "@/types/property";
import {
  ADD_PROPERTY_FIELDS_KEY,
  DEFAULT_ADD_PROPERTY_FIELD_SETTINGS,
  type AddPropertyFieldKey,
  type AddPropertyFieldSettings,
} from "@/lib/add-property-fields";
import {
  cloudEnabled,
  cloudGetRows,
  cloudInsertInquiry,
  cloudPutRow,
} from "@/lib/cloud/server";
import { propertyLead } from "@/lib/crm-types";
import {
  cloudCreateCrmLead,
  cloudGetCrmSettings,
} from "@/lib/crm-server";
import { initializeReviewRecord } from "@/lib/workflow-server";
import { getUserApiSession } from "@/lib/user-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS = 8;
const submissions = new Map<string, { count: number; resetAt: number }>();

const PROPERTY_TYPES = new Set([
  "أرض",
  "شقة",
  "محل",
  "منزل",
  "فيلا",
  "شقة دوبلكس",
  "شاليه",
  "استوديو",
]);
const PURPOSES = new Set(["بيع", "إيجار"]);
const SALE_REASONS = new Set(["بيع عادي", "استكمال أقساط"]);
const SELLERS = new Set(["فرد", "مطور", "مسوق"]);
const FINISHES = new Set<string>(FINISH_STATES);

interface UploadedDocument extends PropertyDocument {
  storagePath: string;
}

interface SubmissionBody {
  submissionId?: unknown;
  title?: unknown;
  purpose?: unknown;
  saleReason?: unknown;
  city?: unknown;
  district?: unknown;
  type?: unknown;
  finish?: unknown;
  area?: unknown;
  rooms?: unknown;
  bathrooms?: unknown;
  price?: unknown;
  priceByAdmin?: unknown;
  negotiable?: unknown;
  sellerType?: unknown;
  ownerName?: unknown;
  whatsapp?: unknown;
  description?: unknown;
  image?: unknown;
  lat?: unknown;
  lng?: unknown;
  documents?: unknown;
}

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function allowSubmission(key: string): boolean {
  const now = Date.now();
  const current = submissions.get(key);
  if (!current || current.resetAt <= now) {
    submissions.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_SUBMISSIONS) return false;
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

function text(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function numberIn(value: unknown, min: number, max: number): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

function normalizePhone(value: unknown): string | null {
  const digits = text(value, 30).replace(/\D/g, "");
  if (!/^(20)?0?1[0125]\d{8}$/.test(digits)) return null;
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return `20${digits}`;
}

function mediaUrl(value: unknown, submissionId: string): string {
  const candidate = text(value, 1000);
  if (!candidate) return "";
  const base = (
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  ).replace(/\/+$/, "");
  const prefix = `${base}/storage/v1/object/public/media/property-submissions/${submissionId}/`;
  return candidate.startsWith(prefix) ? candidate : "";
}

function uploadedDocuments(value: unknown, submissionId: string): UploadedDocument[] {
  if (!Array.isArray(value)) return [];
  const prefix = `property-submissions/${submissionId}/`;
  return value.slice(0, 10).flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const storagePath = text(item.storagePath, 500);
    const key = text(item.key, 50);
    const name = text(item.name, 180);
    const type = text(item.type, 100);
    const size = numberIn(item.size, 1, 4 * 1024 * 1024);
    if (
      !key ||
      !storagePath.startsWith(`${prefix}document-${key}-`) ||
      !name ||
      !type ||
      size === null
    ) {
      return [];
    }
    return [
      {
        key,
        label: text(item.label, 150) || key,
        name,
        type,
        size,
        storagePath,
      },
    ];
  });
}

function referenceNumber(): string {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-7);
  return `AQF-${new Date().getFullYear()}-${suffix}`;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "مصدر الطلب غير مسموح" }, { status: 403 });
  }
  const session = await getUserApiSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "يجب تسجيل الدخول بحساب معتمد لإضافة عقار" },
      { status: 401 }
    );
  }
  if (!cloudEnabled()) {
    return NextResponse.json({ ok: false, error: "قاعدة البيانات غير متاحة" }, { status: 503 });
  }
  if (!allowSubmission(`${session.sub}:${clientKey(request)}`)) {
    return NextResponse.json(
      { ok: false, error: "تم تجاوز عدد الطلبات المسموح مؤقتًا، حاول لاحقًا" },
      { status: 429 }
    );
  }

  let body: SubmissionBody;
  try {
    body = (await request.json()) as SubmissionBody;
  } catch {
    return NextResponse.json({ ok: false, error: "صيغة الطلب غير صحيحة" }, { status: 400 });
  }

  const submissionId = text(body.submissionId, 80);
  const titleInput = text(body.title, 180);
  const city = text(body.city, 100);
  const districtInput = text(body.district, 150);
  const descriptionInput = text(body.description, 4000);
  const ownerName = text(body.ownerName, 120);
  const whatsappInput = text(body.whatsapp, 30);
  const whatsapp = whatsappInput ? normalizePhone(whatsappInput) : "";
  const area = numberIn(body.area, 0, 1_000_000);
  const rooms = numberIn(body.rooms, 0, 100);
  const bathrooms = numberIn(body.bathrooms, 0, 100);
  const finishInput = text(body.finish, 40);
  const finish = FINISHES.has(finishInput) ? (finishInput as FinishState) : "";
  const saleReasonInput = text(body.saleReason, 40);
  const saleReason =
    body.purpose === "بيع" && SALE_REASONS.has(saleReasonInput)
      ? (saleReasonInput as SaleReason)
      : "";
  const lat = numberIn(body.lat, -90, 90);
  const lng = numberIn(body.lng, -180, 180);
  const priceByAdmin = body.priceByAdmin === true;
  const price = priceByAdmin ? 0 : numberIn(body.price, 0, 10_000_000_000);

  let fieldSettings: AddPropertyFieldSettings = {
    ...DEFAULT_ADD_PROPERTY_FIELD_SETTINGS,
  };
  try {
    const rows = await cloudGetRows({ keys: [ADD_PROPERTY_FIELDS_KEY] });
    const stored = rows[0]?.value;
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      fieldSettings = {
        ...fieldSettings,
        ...(stored as Partial<AddPropertyFieldSettings>),
        /* الحقول المقفلة لا يمكن تعطيلها حتى بطلب مزوّر */
        city: true,
        type: true,
      };
    }
  } catch {
    /* عند تعذر القراءة نستخدم الافتراضي الأكثر أمانًا */
  }
  const needs = (key: AddPropertyFieldKey) => fieldSettings[key] === true;

  if (!/^[a-zA-Z0-9-]{8,80}$/.test(submissionId)) {
    return NextResponse.json({ ok: false, error: "رقم الطلب غير صالح" }, { status: 400 });
  }
  if (
    (needs("title") && !titleInput) ||
    !city ||
    (needs("district") && !districtInput) ||
    (needs("description") && !descriptionInput) ||
    (needs("whatsapp") && !whatsapp)
  ) {
    return NextResponse.json({ ok: false, error: "بيانات العقار الأساسية غير مكتملة" }, { status: 400 });
  }
  if (whatsappInput && !whatsapp) {
    return NextResponse.json({ ok: false, error: "رقم التواصل غير صالح" }, { status: 400 });
  }
  if (!PROPERTY_TYPES.has(String(body.type)) || !PURPOSES.has(String(body.purpose))) {
    return NextResponse.json(
      { ok: false, error: "نوع العقار أو نوع العرض غير صالح" },
      { status: 400 }
    );
  }
  if (body.purpose === "بيع" && saleReasonInput && !saleReason) {
    return NextResponse.json(
      { ok: false, error: "الغرض من البيع غير صالح" },
      { status: 400 }
    );
  }
  if (finishInput && !finish) {
    return NextResponse.json({ ok: false, error: "حالة التشطيب غير صالحة" }, { status: 400 });
  }
  if (needs("finish") && isBuildingType(String(body.type)) && !finish) {
    return NextResponse.json(
      { ok: false, error: "حالة الوحدة أو العقار مطلوبة" },
      { status: 400 }
    );
  }
  if (needs("sellerType") && !SELLERS.has(String(body.sellerType))) {
    return NextResponse.json({ ok: false, error: "صفة مقدم الطلب غير صالحة" }, { status: 400 });
  }
  if (area === null || rooms === null || bathrooms === null || lat === null || lng === null || price === null) {
    return NextResponse.json({ ok: false, error: "القيم الرقمية غير صحيحة" }, { status: 400 });
  }
  if (
    (needs("area") && area <= 0) ||
    (needs("rooms") && rooms <= 0) ||
    (needs("bathrooms") && bathrooms <= 0) ||
    (needs("price") && !priceByAdmin && price <= 0)
  ) {
    return NextResponse.json({ ok: false, error: "الحقول الرقمية المطلوبة غير مكتملة" }, { status: 400 });
  }

  const id = `user-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const reference = referenceNumber();
  const image = mediaUrl(body.image, submissionId) || `https://picsum.photos/seed/${id}/800/600`;
  const documents = uploadedDocuments(body.documents, submissionId);
  if (needs("image") && !mediaUrl(body.image, submissionId)) {
    return NextResponse.json({ ok: false, error: "صورة العقار مطلوبة" }, { status: 400 });
  }
  const missingDocument = [
    "owner_id",
    "ownership",
    "license",
    "utility",
    "power_of_attorney",
    "tax",
  ].some(
    (key) =>
      needs(`doc_${key}` as AddPropertyFieldKey) &&
      !documents.some((document) => document.key === key)
  );
  if (missingDocument) {
    return NextResponse.json({ ok: false, error: "المستندات الإجبارية غير مكتملة" }, { status: 400 });
  }
  const title = titleInput || "عقار جديد";
  const district = districtInput || "غير محدد";
  const description = descriptionInput || "لا يوجد وصف مضاف";
  const property: Property = {
    id,
    title,
    purpose: body.purpose as Purpose,
    saleReason: saleReason || undefined,
    city,
    district,
    type: body.type as PropertyType,
    finish:
      isBuildingType(String(body.type)) && finish
        ? (finish as FinishState)
        : undefined,
    area,
    rooms,
    bathrooms,
    price,
    priceByAdmin: priceByAdmin || undefined,
    negotiable:
      priceByAdmin || typeof body.negotiable !== "boolean"
        ? undefined
        : body.negotiable,
    sellerType: SELLERS.has(String(body.sellerType))
      ? (body.sellerType as SellerType)
      : "فرد",
    ownerName: ownerName || undefined,
    whatsapp: whatsapp || "",
    description,
    image,
    images: [image],
    lat,
    lng,
    status: "pending",
    documents,
    submittedAt: new Date().toISOString(),
    reference,
  };

  try {
    /* inquiries هو سجل المصدر غير القابل للعرض العام */
    await cloudInsertInquiry({
      kind: "property_submission",
      name: ownerName || title,
      phone: whatsapp || undefined,
      message: description,
      payload: { property, submissionId, accountId: session.sub },
      status: "new",
    });

    /* app_state هو نموذج القراءة الحالي للوحة الإدارة */
    const rows = await cloudGetRows({ keys: [USER_PROPERTIES_KEY] });
    const existing = Array.isArray(rows[0]?.value)
      ? (rows[0].value as Property[])
      : [];
    await cloudPutRow(
      USER_PROPERTIES_KEY,
      [...existing.filter((item) => item.id !== id), property].slice(-5000),
      "public-property-form"
    );
    await initializeReviewRecord("listings", id, "public-property-form").catch(() => undefined);

    /*
     * إنشاء بطاقة عميل تلقائيًا حتى يجد فريق المبيعات الطلب في الـCRM
     * بمجرد وصوله، بدون انتظار فتح اللوحة أو ضغط «استيراد».
     */
    try {
      const lead = propertyLead(property);
      const crmSettings = await cloudGetCrmSettings();
      if (crmSettings.autoAssign && crmSettings.defaultAssigneeId) {
        lead.assignedTo = crmSettings.defaultAssigneeId;
        lead.assignedToName = crmSettings.defaultAssigneeName;
      }
      await cloudCreateCrmLead(lead, "الموقع");
    } catch {
      /*
       * فشل بطاقة CRM لا يفقد الطلب: نسخة المصدر محفوظة في inquiries وفي
       * aqaar-properties، ويمكن استيرادها من اللوحة بعد إصلاح الاتصال.
       */
    }

    try {
      revalidatePath("/", "layout");
    } catch {
      /* لا يؤثر على حفظ الطلب */
    }

    return NextResponse.json({
      ok: true,
      reference,
      property: { id, title, city, status: "pending" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "تعذر حفظ الطلب",
      },
      { status: 500 }
    );
  }
}
