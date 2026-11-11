export type PublicRequestKind =
  | "professional_request"
  | "app_interest"
  | "newsletter_subscription"
  | "property_inquiry";

export interface PublicRequestInput {
  kind: PublicRequestKind;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  payload?: Record<string, unknown>;
}

export type PublicRequestResult =
  | { ok: true; id: string }
  | { ok: false; error: string; status?: number };

function fallbackError(status: number): string {
  if (status === 429) {
    return "تم إرسال عدة طلبات مؤخرًا. حاول مرة أخرى بعد قليل.";
  }
  if (status === 503) {
    return "خدمة استقبال الطلبات غير متاحة حاليًا. حاول مرة أخرى لاحقًا.";
  }
  return "تعذّر إرسال الطلب. تحقق من اتصالك وحاول مرة أخرى.";
}

/** إرسال طلب عام وعدم إعلان النجاح إلا بعد تأكيد حفظه على السيرفر. */
export async function submitPublicRequest(
  input: PublicRequestInput
): Promise<PublicRequestResult> {
  try {
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      id?: string;
      error?: string;
    };
    if (!response.ok || data.ok !== true || !data.id) {
      return {
        ok: false,
        error: data.error || fallbackError(response.status),
        status: response.status,
      };
    }
    return { ok: true, id: data.id };
  } catch {
    return {
      ok: false,
      error: "تعذّر الاتصال بالسيرفر. تحقق من الإنترنت وحاول مرة أخرى.",
    };
  }
}
