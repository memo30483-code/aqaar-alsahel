import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import {
  ACCOUNTS_VERSION,
  hashPassword,
  isAccountType,
  normalizeEmail,
  readAccounts,
  toPublicAccount,
  writeAccounts,
  type AccountRecord,
} from "@/lib/auth/accounts";
import {
  checkRateLimit,
  clientIp,
  hashRateKey,
  rateLimitResponse,
} from "@/lib/rate-limit-server";
import {
  USER_COOKIE,
  USER_SESSION_MAX_AGE,
  createUserToken,
} from "@/lib/user-session";
import { initializeReviewRecord, readWorkflowSettings } from "@/lib/workflow-server";
import { cloudGetRows, cloudPutRow } from "@/lib/cloud/server";
import { canonicalProfessionalsValue } from "@/lib/professionals-data";
import {
  consumeOtpRegistrationProof,
  OTP_PROOF_COOKIE,
  OtpError,
  otpProofMatchesRegistration,
  publicOtpOptions,
  readOtpProofToken,
  type OtpProofPayload,
} from "@/lib/otp-server";

/**
 * إنشاء حساب مستخدم حقيقي.
 *
 * كلمة المرور تُجزّأ (scrypt) على السيرفر قبل الحفظ، ولا تُخزَّن أبدًا كنص.
 * هذا هو المصدر الوحيد الذي تعتمد عليه صفحة الدخول لاحقًا.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE = { limit: 6, windowSeconds: 60 * 60 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface RegisterBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  phone?: unknown;
  accountType?: unknown;
  ownerToken?: unknown;
  professionalProfile?: unknown;
}

const PROFESSIONALS_KEY = "aqaar-professionals";

interface ProfessionalRegistrationDocument {
  id: string;
  type: string;
  label: string;
  fileName: string;
  dataUrl: string;
  uploadedAt: string;
}

interface ProfessionalRegistrationProfile {
  nameAr: string;
  companyAr?: string;
  licenseNumber?: string;
  documents: ProfessionalRegistrationDocument[];
}

function professionalProfile(value: unknown): ProfessionalRegistrationProfile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const nameAr = typeof source.nameAr === "string" ? source.nameAr.trim().slice(0, 160) : "";
  if (!nameAr) return null;
  const rawDocuments = Array.isArray(source.documents) ? source.documents : [];
  let totalBytes = 0;
  const documents = rawDocuments.slice(0, 10).flatMap((raw, index) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const item = raw as Record<string, unknown>;
    const dataUrl = typeof item.dataUrl === "string" ? item.dataUrl : "";
    if (!/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(dataUrl)) return [];
    totalBytes += dataUrl.length;
    if (dataUrl.length > 1_500_000 || totalBytes > 4_000_000) return [];
    const type = typeof item.type === "string" ? item.type.slice(0, 80) : `document-${index}`;
    return [{
      id: typeof item.id === "string" ? item.id.slice(0, 120) : `doc-${index}`,
      type,
      label: typeof item.label === "string" ? item.label.slice(0, 160) : type,
      fileName: typeof item.fileName === "string" ? item.fileName.slice(0, 180) : type,
      dataUrl,
      uploadedAt: new Date().toISOString(),
    }];
  });
  if (rawDocuments.length > 0 && documents.length !== rawDocuments.slice(0, 10).length) {
    return null;
  }
  return {
    nameAr,
    companyAr:
      typeof source.companyAr === "string" && source.companyAr.trim()
        ? source.companyAr.trim().slice(0, 180)
        : undefined,
    licenseNumber:
      typeof source.licenseNumber === "string" && source.licenseNumber.trim()
        ? source.licenseNumber.trim().slice(0, 120)
        : undefined,
    documents,
  };
}

async function saveProfessionalRegistration(input: {
  accountId: string;
  accountType: Exclude<AccountRecord["accountType"], "individual">;
  email: string;
  phone: string;
  ownerToken?: string;
  profile: ProfessionalRegistrationProfile;
}): Promise<string> {
  const rows = await cloudGetRows({ keys: [PROFESSIONALS_KEY], timeoutMs: 8_000 });
  const stored = rows.find((row) => row.key === PROFESSIONALS_KEY)?.value;
  const records = canonicalProfessionalsValue(stored);
  const normalizedEmail = normalizeEmail(input.email);
  const existing = records.find((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
    const item = raw as Record<string, unknown>;
    return typeof item.email === "string" && normalizeEmail(item.email) === normalizedEmail;
  });
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    return String((existing as Record<string, unknown>).id ?? "");
  }
  const now = new Date().toISOString();
  const id = `${input.accountType}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const order =
    records.filter(
      (raw) =>
        raw &&
        typeof raw === "object" &&
        !Array.isArray(raw) &&
        (raw as Record<string, unknown>).kind === input.accountType
    ).length + 1;
  const record = {
    id,
    kind: input.accountType,
    status: "pending",
    verified: false,
    featured: false,
    nameAr: input.profile.nameAr,
    companyAr: input.profile.companyAr,
    phone: input.phone,
    email: input.email,
    licenseNumber: input.profile.licenseNumber,
    documents: input.profile.documents,
    licenses: [],
    reels: [],
    projects: [],
    ownerToken: input.ownerToken,
    accountId: input.accountId,
    version: 1,
    publishPolicy: "review",
    requestedAt: now,
    createdAt: now,
    updatedAt: now,
    order,
  };
  await cloudPutRow(PROFESSIONALS_KEY, [...records, record].slice(-5000), input.email);
  await initializeReviewRecord("professionals", id, input.email).catch(() => undefined);
  return id;
}

export async function POST(request: Request) {
  const limit = await checkRateLimit(
    hashRateKey("register", clientIp(request)),
    RATE
  );
  if (!limit.allowed) {
    return rateLimitResponse(limit, "محاولات تسجيل كثيرة. حاول لاحقًا.");
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const accountType = body.accountType;
  const ownerToken =
    typeof body.ownerToken === "string" ? body.ownerToken.trim() : "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400 }
    );
  }
  if (password.length < 8 || password.length > 200) {
    return NextResponse.json(
      { ok: false, error: "invalid_password" },
      { status: 400 }
    );
  }
  if (name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { ok: false, error: "invalid_name" },
      { status: 400 }
    );
  }
  if (!isAccountType(accountType)) {
    return NextResponse.json(
      { ok: false, error: "invalid_account_type" },
      { status: 400 }
    );
  }
  if (phone.length > 30 || ownerToken.length > 160) {
    return NextResponse.json(
      { ok: false, error: "invalid_input" },
      { status: 400 }
    );
  }

  try {
    const store = await readAccounts();
    if (!store.enabled) {
      return NextResponse.json(
        { ok: false, error: "accounts_unavailable" },
        { status: 503 }
      );
    }

    const normalized = normalizeEmail(email);
    if (store.file.accounts.some((item) => item.emailNormalized === normalized)) {
      return NextResponse.json(
        { ok: false, error: "email_exists" },
        { status: 409 }
      );
    }

    const workflow = await readWorkflowSettings();
    if (workflow.members.mode === "closed") {
      return NextResponse.json(
        { ok: false, error: "registration_closed" },
        { status: 403 }
      );
    }
    const profile = accountType === "individual" ? null : professionalProfile(body.professionalProfile);
    if (accountType !== "individual" && !profile) {
      return NextResponse.json(
        { ok: false, error: "invalid_professional_profile" },
        { status: 400 }
      );
    }
    const otpOptions = await publicOtpOptions();
    if (!otpOptions.channels.includes("email")) {
      return NextResponse.json(
        { ok: false, error: "otp_provider_unavailable" },
        { status: 503 }
      );
    }
    const proof: OtpProofPayload | null = readOtpProofToken(
      (await cookies()).get(OTP_PROOF_COOKIE)?.value
    );
    if (!proof || !otpProofMatchesRegistration(proof, { email, phone })) {
      return NextResponse.json(
        { ok: false, error: "otp_required" },
        { status: 403 }
      );
    }
    const { salt, hash } = await hashPassword(password);
    if (!(await consumeOtpRegistrationProof(proof))) {
      return NextResponse.json(
        { ok: false, error: "otp_proof_used" },
        { status: 409 }
      );
    }
    const verifiedAt = new Date().toISOString();
    const memberStatus = workflow.members.mode === "open" ? "approved" : "pending";
    const record: AccountRecord = {
      id: randomUUID(),
      name,
      email,
      emailNormalized: normalized,
      phone,
      accountType,
      role:
        accountType === "developer" || accountType === "marketer"
          ? "agent"
          : "user",
      ...(ownerToken ? { ownerToken } : {}),
      salt,
      hash,
      createdAt: verifiedAt,
      emailVerifiedAt: verifiedAt,
      sessionVersion: 1,
      status: memberStatus,
      statusUpdatedAt: verifiedAt,
      statusUpdatedBy: memberStatus === "approved" ? "registration-policy" : "system",
    };

    await writeAccounts({
      version: ACCOUNTS_VERSION,
      accounts: [...store.file.accounts, record],
    });

    let professionalId: string | undefined;
    if (accountType !== "individual" && profile) {
      try {
        professionalId = await saveProfessionalRegistration({
          accountId: record.id,
          accountType,
          email: record.email,
          phone: record.phone,
          ownerToken: record.ownerToken,
          profile,
        });
      } catch {
        /* الحساب محفوظ؛ يبقى الملف المحلي متاحًا ويمكن للإدارة استعادته. */
      }
    }

    const response = NextResponse.json({
      ok: true,
      account: toPublicAccount(record),
      requiresApproval: memberStatus === "pending",
      professionalId,
    });
    response.cookies.set(OTP_PROOF_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    try {
      if (memberStatus !== "approved") return response;
      const token = await createUserToken({
        sub: record.id,
        email: record.email,
        name: record.name,
        ver: record.sessionVersion,
      });
      response.cookies.set(USER_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: USER_SESSION_MAX_AGE,
      });
    } catch {
      /* الحساب أُنشئ بالفعل — تعذّر الكوكي لا يمنع إتمام التسجيل */
    }
    return response;
  } catch (error) {
    if (error instanceof OtpError) {
      return NextResponse.json(
        { ok: false, error: error.code, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: "server_error",
        message: error instanceof Error ? error.message : "خطأ غير معروف",
      },
      { status: 500 }
    );
  }
}
