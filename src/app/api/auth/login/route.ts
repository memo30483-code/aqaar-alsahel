import { NextResponse } from "next/server";
import {
  burnPasswordCheck,
  normalizeEmail,
  readAccounts,
  toPublicAccount,
  verifyPassword,
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

/**
 * تسجيل دخول المستخدمين — التحقق من البريد وكلمة المرور على السيرفر فقط.
 *
 * لا تُنشأ أي جلسة إن لم يوجد حساب مطابق بكلمة مرور صحيحة.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IP_RATE = { limit: 20, windowSeconds: 10 * 60 };
const EMAIL_RATE = { limit: 8, windowSeconds: 10 * 60 };

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export async function POST(request: Request) {
  const limit = await checkRateLimit(
    hashRateKey("user-login", clientIp(request)),
    IP_RATE
  );
  if (!limit.allowed) {
    return rateLimitResponse(limit, "محاولات دخول كثيرة. حاول بعد قليل.");
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

  const emailLimit = await checkRateLimit(
    hashRateKey("user-login-email", normalizeEmail(email)),
    EMAIL_RATE
  );
  if (!emailLimit.allowed) {
    return rateLimitResponse(
      emailLimit,
      "محاولات دخول كثيرة لهذا الحساب. حاول بعد قليل."
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
      return NextResponse.json(
        { ok: false, error: "invalid_credentials" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, account.salt, account.hash);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "invalid_credentials" },
        { status: 401 }
      );
    }


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

    /* لا نعلن نجاح الدخول إذا تعذّر إنشاء جلسة السيرفر. */
    let token: string;
    try {
      token = await createUserToken({
        sub: account.id,
        email: account.email,
        name: account.name,
        ver: account.sessionVersion,
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: "session_unavailable" },
        { status: 503 }
      );
    }
    const response = NextResponse.json({
      ok: true,
      account: toPublicAccount(account),
    });
    response.cookies.set(USER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: USER_SESSION_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "server_error",
        message: "تعذر تسجيل الدخول حاليًا",
      },
      { status: 500 }
    );
  }
}
