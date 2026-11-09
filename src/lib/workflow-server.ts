/** نظام المراجعة والموافقات وسجل التدقيق — سيرفر فقط. */

import { randomUUID } from "node:crypto";
import type { UserRole } from "@/lib/session";
import type { ServerStaffSession } from "@/lib/staff-server";
import { sessionCan } from "@/lib/staff-server";
import {
  DEFAULT_WORKFLOW_SETTINGS,
  emptyReviewRecord,
  hasDelegation,
  normalizeDocumentChecks,
  normalizeReviewStore,
  normalizeWorkflowSettings,
  reviewKey,
  scopeSettingsFor,
  type ReviewDocumentCheck,
  type ReviewRecord,
  type ReviewScope,
  type ReviewStore,
  type WorkflowSettings,
} from "@/lib/workflow";
import { cloudGetRows, cloudPutRow } from "@/lib/cloud/server";

export const WORKFLOW_SETTINGS_KEY = "aqaar-workflow-settings";
export const REVIEW_STATE_KEY = "aqaar-review-state";
export const AUDIT_LOG_KEY = "aqaar-audit-log";

export interface AuditEntry {
  id: string;
  action: string;
  category:
    | "auth"
    | "staff"
    | "members"
    | "workflow"
    | "review"
    | "documents"
    | "listings"
    | "propertyRequests"
    | "professionals"
    | "settings";
  actorId: string;
  actorEmail: string;
  actorName: string;
  actorRole: UserRole;
  scope?: ReviewScope | "members";
  itemId?: string;
  details: string;
  at: string;
  meta?: Record<string, unknown>;
}

export interface ReviewActionInput {
  scope: ReviewScope;
  itemId: string;
  action:
    | "start"
    | "assign"
    | "submit"
    | "approve"
    | "reject"
    | "return"
    | "reopen";
  assignedTo?: string;
  assignedToName?: string;
  notes?: string;
  decisionNote?: string;
  documents?: ReviewDocumentCheck[];
  expectedVersion?: number;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeAudit(value: unknown): AuditEntry[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 2500).flatMap((raw) => {
    const item = objectValue(raw);
    if (!item.id || !item.action || !item.at) return [];
    return [item as unknown as AuditEntry];
  });
}

async function readValues(keys: string[]): Promise<Record<string, unknown>> {
  const rows = await cloudGetRows({ keys, timeoutMs: 8_000 });
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export async function readWorkflowSettings(): Promise<WorkflowSettings> {
  try {
    const values = await readValues([WORKFLOW_SETTINGS_KEY]);
    return normalizeWorkflowSettings(values[WORKFLOW_SETTINGS_KEY]);
  } catch {
    return normalizeWorkflowSettings(DEFAULT_WORKFLOW_SETTINGS);
  }
}

export async function writeWorkflowSettings(
  settings: unknown,
  actor: string
): Promise<WorkflowSettings> {
  const normalized = normalizeWorkflowSettings(settings);
  await cloudPutRow(WORKFLOW_SETTINGS_KEY, normalized, actor);
  return normalized;
}

export async function readReviewStore(): Promise<ReviewStore> {
  const values = await readValues([REVIEW_STATE_KEY]);
  return normalizeReviewStore(values[REVIEW_STATE_KEY]);
}

export async function getReviewRecord(
  scope: ReviewScope,
  itemId: string
): Promise<ReviewRecord> {
  const store = await readReviewStore();
  const key = reviewKey(scope, itemId);
  if (store.records[key]) return store.records[key];
  const record: ReviewRecord = {
    ...emptyReviewRecord(scope, itemId),
    updatedAt: new Date().toISOString(),
  };
  store.records[key] = record;
  await cloudPutRow(REVIEW_STATE_KEY, store, "review-initializer");
  return record;
}

/** إنشاء سجل انتظار لطلب جديد حتى يظهر فورًا في العدادات وقوائم المراجعة. */
export async function initializeReviewRecord(
  scope: ReviewScope,
  itemId: string,
  actor = "system"
): Promise<ReviewRecord> {
  const store = await readReviewStore();
  const key = reviewKey(scope, itemId);
  if (store.records[key]) return store.records[key];
  const record: ReviewRecord = {
    ...emptyReviewRecord(scope, itemId),
    updatedAt: new Date().toISOString(),
  };
  store.records[key] = record;
  await cloudPutRow(REVIEW_STATE_KEY, store, actor);
  return record;
}

/** استعادة سجل سابق عند فشل خطوة النشر اللاحقة، لمنع حالة نصف مكتملة. */
export async function restoreReviewRecord(
  record: ReviewRecord,
  actor: string
): Promise<void> {
  const store = await readReviewStore();
  store.records[reviewKey(record.scope, record.itemId)] = record;
  await cloudPutRow(REVIEW_STATE_KEY, store, actor);
}

export function actorSummary(session: ServerStaffSession) {
  return {
    actorId: session.uid,
    actorEmail: session.sub,
    actorName: session.name,
    actorRole: session.role as UserRole,
  };
}

export async function appendAudit(
  entry: Omit<AuditEntry, "id" | "at">
): Promise<AuditEntry> {
  const values = await readValues([AUDIT_LOG_KEY]);
  const logs = normalizeAudit(values[AUDIT_LOG_KEY]);
  const next: AuditEntry = {
    ...entry,
    id: randomUUID(),
    at: new Date().toISOString(),
  };
  await cloudPutRow(AUDIT_LOG_KEY, [next, ...logs].slice(0, 2000), entry.actorEmail);
  return next;
}

export async function readAuditLog(limit = 300): Promise<AuditEntry[]> {
  const values = await readValues([AUDIT_LOG_KEY]);
  return normalizeAudit(values[AUDIT_LOG_KEY]).slice(0, Math.min(Math.max(limit, 1), 1000));
}

function isAdminActor(session: ServerStaffSession): boolean {
  return session.role === "admin" || session.role === "super_admin";
}

export function reviewPermission(scope: ReviewScope): string {
  return `${scope}.review`;
}

export function publishPermission(scope: ReviewScope): string {
  return `${scope}.publish`;
}

export function canReviewScope(
  session: ServerStaffSession,
  settings: WorkflowSettings,
  scope: ReviewScope
): boolean {
  if (session.role === "super_admin") return true;
  if (hasDelegation(settings, session.uid, scope, "review")) return true;
  if (!sessionCan(session, reviewPermission(scope))) return false;
  const mode = scopeSettingsFor(settings, scope).reviewBy;
  return (
    mode === "any" ||
    (mode === "admin" && isAdminActor(session)) ||
    (mode === "staff" && !isAdminActor(session))
  );
}

export function canPublishScope(
  session: ServerStaffSession,
  settings: WorkflowSettings,
  scope: ReviewScope
): boolean {
  if (session.role === "super_admin") return true;
  if (hasDelegation(settings, session.uid, scope, "publish")) return true;
  if (!sessionCan(session, publishPermission(scope))) return false;
  const mode = scopeSettingsFor(settings, scope).publishBy;
  return (
    mode === "any" ||
    (mode === "admin" && isAdminActor(session)) ||
    (mode === "staff" && !isAdminActor(session))
  );
}

export function canApproveMembers(
  session: ServerStaffSession,
  settings: WorkflowSettings
): boolean {
  if (session.role === "super_admin") return true;
  if (hasDelegation(settings, session.uid, "members", "approve_member")) return true;
  if (!sessionCan(session, "members.approve")) return false;
  const mode = settings.members.approveBy;
  return (
    mode === "any" ||
    (mode === "admin" && isAdminActor(session)) ||
    (mode === "staff" && !isAdminActor(session))
  );
}

export class WorkflowActionError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = "WorkflowActionError";
    this.code = code;
    this.status = status;
  }
}

export async function performReviewAction(
  session: ServerStaffSession,
  input: ReviewActionInput
): Promise<ReviewRecord> {
  const settings = await readWorkflowSettings();
  const store = await readReviewStore();
  const key = reviewKey(input.scope, input.itemId);
  const current = store.records[key] ?? emptyReviewRecord(input.scope, input.itemId);
  if (
    typeof input.expectedVersion === "number" &&
    input.expectedVersion !== current.version
  ) {
    throw new WorkflowActionError(
      "conflict",
      "تم تحديث المراجعة من جهاز آخر. حدّث الصفحة وحاول مجددًا.",
      409
    );
  }

  const now = new Date().toISOString();
  let next: ReviewRecord = {
    ...current,
    updatedAt: now,
    version: current.version + 1,
  };

  if (input.action === "assign") {
    if (!sessionCan(session, "review.assign")) {
      throw new WorkflowActionError("forbidden", "لا تملك صلاحية إسناد المراجعات", 403);
    }
    next = {
      ...next,
      assignedTo: input.assignedTo || undefined,
      assignedToName: input.assignedToName || undefined,
    };
  } else if (input.action === "start") {
    if (!canReviewScope(session, settings, input.scope)) {
      throw new WorkflowActionError("forbidden", "لا تملك صلاحية المراجعة", 403);
    }
    if (current.assignedTo && current.assignedTo !== session.uid && !sessionCan(session, "review.assign")) {
      throw new WorkflowActionError("assigned_to_other", "هذه المراجعة مسندة إلى موظف آخر", 409);
    }
    if (current.stage === "approved" || current.stage === "rejected") {
      throw new WorkflowActionError("closed", "تم إغلاق هذه المراجعة", 409);
    }
    next = {
      ...next,
      stage: "in_review",
      assignedTo: current.assignedTo || session.uid,
      assignedToName: current.assignedToName || session.name,
    };
  } else if (input.action === "submit") {
    if (!canReviewScope(session, settings, input.scope)) {
      throw new WorkflowActionError("forbidden", "لا تملك صلاحية المراجعة", 403);
    }
    if (current.assignedTo && current.assignedTo !== session.uid && !sessionCan(session, "review.assign")) {
      throw new WorkflowActionError("assigned_to_other", "هذه المراجعة مسندة إلى موظف آخر", 409);
    }
    if (current.stage === "approved" || current.stage === "rejected") {
      throw new WorkflowActionError("closed", "تم إغلاق هذه المراجعة", 409);
    }
    const documents = normalizeDocumentChecks(input.documents ?? current.documents);
    if (documents.some((item) => item.status !== "ok")) {
      throw new WorkflowActionError(
        "documents_not_clear",
        "يجب تأكيد سلامة جميع المستندات قبل التحويل إلى الأدمن"
      );
    }
    next = {
      ...next,
      stage: "awaiting_admin",
      assignedTo: current.assignedTo || session.uid,
      assignedToName: current.assignedToName || session.name,
      reviewerId: session.uid,
      reviewerName: session.name,
      reviewedAt: now,
      submittedToAdminAt: now,
      notes: typeof input.notes === "string" ? input.notes.trim().slice(0, 4000) : current.notes,
      documents,
      decisionNote: undefined,
      decidedAt: undefined,
      decidedBy: undefined,
      decidedByName: undefined,
    };
  } else if (input.action === "approve" || input.action === "reject" || input.action === "return") {
    if (!canPublishScope(session, settings, input.scope)) {
      throw new WorkflowActionError("forbidden", "لا تملك صلاحية الموافقة النهائية", 403);
    }
    const policy = scopeSettingsFor(settings, input.scope);
    if (policy.enabled && current.stage !== "awaiting_admin") {
      throw new WorkflowActionError(
        "not_reviewed",
        "يجب إتمام مراجعة المستندات أولًا قبل القرار النهائي",
        409
      );
    }
    if (
      policy.twoPerson &&
      current.reviewerId &&
      current.reviewerId === session.uid
    ) {
      throw new WorkflowActionError(
        "two_person_rule",
        "قاعدة الشخصين مفعلة: من راجع الطلب لا يستطيع الموافقة عليه",
        409
      );
    }
    next = {
      ...next,
      stage:
        input.action === "approve"
          ? "approved"
          : input.action === "reject"
            ? "rejected"
            : "returned",
      decidedBy: session.uid,
      decidedByName: session.name,
      decidedAt: now,
      decisionNote:
        typeof input.decisionNote === "string"
          ? input.decisionNote.trim().slice(0, 2000)
          : undefined,
      ...(input.action === "return"
        ? {
            reviewerId: undefined,
            reviewerName: undefined,
            reviewedAt: undefined,
            submittedToAdminAt: undefined,
          }
        : {}),
    };
  } else if (input.action === "reopen") {
    if (!canPublishScope(session, settings, input.scope)) {
      throw new WorkflowActionError("forbidden", "لا تملك صلاحية إعادة فتح المراجعة", 403);
    }
    next = {
      ...next,
      stage: "new",
      assignedTo: undefined,
      assignedToName: undefined,
      reviewerId: undefined,
      reviewerName: undefined,
      reviewedAt: undefined,
      submittedToAdminAt: undefined,
      decidedBy: undefined,
      decidedByName: undefined,
      decidedAt: undefined,
      decisionNote: undefined,
    };
  }

  store.records[key] = next;
  await cloudPutRow(REVIEW_STATE_KEY, store, session.sub);
  await appendAudit({
    ...actorSummary(session),
    action: `review.${input.action}`,
    category: "review",
    scope: input.scope,
    itemId: input.itemId,
    details: `إجراء «${input.action}» على ${input.scope}:${input.itemId}`,
    meta: { from: current.stage, to: next.stage },
  }).catch(() => undefined);
  return next;
}
