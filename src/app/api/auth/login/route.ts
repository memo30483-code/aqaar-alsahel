import { NextResponse } from "next/server";
import {
  burnPasswordCheck,
  normalizeEmail,
  readAccounts,
  toPublicAccount,
  verifyPassword,
} from "@/lib/auth/accounts";
import {
  clearAttempts,
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
 * تسجيل دخول المستخدمين — التحقق من البريد وكلمة المرور على السيرفر فقط.
 *
 * لا تُنشأ أي جلسة إن لم يوجد حساب مطابق بكلمة مرور صحيحة.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RATE = { scope: "login", max: 10, windowMs: 10 * 60 * 1000 };

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export async function POST(request: Request) {
  const key = clientKey(request);
  if (isRateLimited(key, RATE)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 }
    );
  }

  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "invalid_credentials" },
      { status: 401 }
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

    const account = store.file.accounts.find(
      (item) => item.emailNormalized === normalizeEmail(email)
    );

    /* نفس زمن الحساب في الحالتين حتى لا يُستدل على وجود البريد */
    if (!account) {
      await burnPasswordCheck(password);
      recordAttempt(key, RATE);
      return NextResponse.json(
        { ok: false, error: "invalid_credentials" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, account.salt, account.hash);
    if (!valid) {
      recordAttempt(key, RATE);
      return NextResponse.json(
        { ok: false, error: "invalid_credentials" },
        { status: 401 }
      );
    }

    clearAttempts(key, RATE);

    if (account.status !== "approved") {
      return NextResponse.json(
        {
          ok: false,
          error:
            account.status === "pending"
              ? "account_pending"
              : account.status === "suspended"
                ? "account_suspended"
                : "account_rejected",
        },
        { status: 403 }
      );
    }

    /* كوكي جلسة موقّع لربط طلبات العقار بالحساب على السيرفر */
    const response = NextResponse.json({
      ok: true,
      account: toPublicAccount(account),
    });
    try {
      const token = await createUserToken({
        sub: account.id,
        email: account.email,
        name: account.name,
      });
      response.cookies.set(USER_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: USER_SESSION_MAX_AGE,
      });
    } catch {
      /* لا نُفشل الدخول إذا تعذّر إنشاء الكوكي — الجلسة المحلية تعمل */
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
