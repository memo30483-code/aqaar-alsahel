import { NextResponse } from "next/server";
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
  clientKey,
  isRateLimited,
  recordAttempt,
} from "@/lib/auth/rate-limit";
import {
  USER_COOKIE,
  USER_SESSION_MAX_AGE,
  createUserToken,
} from "@/lib/user-session";

/**
 * إنشاء حساب مستخدم حقيقي.
 *
 * كلمة المرور تُجزّأ (scrypt) على السيرفر قبل الحفظ، ولا تُخزَّن أبدًا كنص.
 * هذا هو المصدر الوحيد الذي تعتمد عليه صفحة الدخول لاحقًا.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE = { scope: "register", max: 6, windowMs: 60 * 60 * 1000 };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface RegisterBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  phone?: unknown;
  accountType?: unknown;
  ownerToken?: unknown;
}

export async function POST(request: Request) {
  const key = clientKey(request);
  if (isRateLimited(key, RATE)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 }
    );
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
      recordAttempt(key, RATE);
      return NextResponse.json(
        { ok: false, error: "email_exists" },
        { status: 409 }
      );
    }

    const { salt, hash } = await hashPassword(password);
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
      createdAt: new Date().toISOString(),
    };

    await writeAccounts({
      version: ACCOUNTS_VERSION,
      accounts: [...store.file.accounts, record],
    });

    const response = NextResponse.json({
      ok: true,
      account: toPublicAccount(record),
    });
    try {
      const token = await createUserToken({
        sub: record.id,
        email: record.email,
        name: record.name,
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
