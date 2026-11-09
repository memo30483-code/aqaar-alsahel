/**
 * نظام المراجعة والموافقات — أنواع وثوابت مشتركة بين الواجهة والسيرفر.
 *
 * الفكرة: الموظف يراجع المستندات والتفاصيل، ثم يضغط «تمت المراجعة وسلامة
 * المستندات» فينتقل الطلب تلقائيًا لقائمة الأدمن للموافقة النهائية.
 * الأدمن يتحكم في مَن يراجع ومَن يوافق ومن يحق له التفويض.
 *
 * الملف نقي بلا `window` ولا Supabase حتى يُستخدم في العميل والسيرفر.
 */

export type ReviewScope = "listings" | "propertyRequests" | "professionals";

export const REVIEW_SCOPES: ReviewScope[] = [
  "listings",
  "propertyRequests",
  "professionals",
];

export type ReviewStage =
  | "new"
  | "in_review"
  | "awaiting_admin"
  | "approved"
  | "rejected"
  | "returned";

export const REVIEW_STAGE_LABEL: Record<ReviewStage, string> = {
  new: "بانتظار المراجعة",
  in_review: "قيد مراجعة المستندات",
  awaiting_admin: "بانتظار موافقة الأدمن",
  approved: "تمت الموافقة",
  rejected: "مرفوض",
  returned: "أُعيد للعميل",
};

export const REVIEW_STAGE_STYLE: Record<ReviewStage, string> = {
  new: "border-sky-200 bg-sky-50 text-sky-700",
  in_review: "border-amber-200 bg-amber-50 text-amber-800",
  awaiting_admin: "border-violet-200 bg-violet-50 text-violet-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  returned: "border-orange-200 bg-orange-50 text-orange-700",
};

export const REVIEW_SCOPE_LABEL: Record<ReviewScope, string> = {
  listings: "الإعلانات",
  propertyRequests: "طلبات العقار",
  professionals: "دليل المهنيين",
};

/** حالة فحص مستند واحد */
export type DocumentCheckStatus = "ok" | "unclear" | "rejected";

export const DOCUMENT_CHECK_LABEL: Record<DocumentCheckStatus, string> = {
  ok: "سليم",
  unclear: "غير واضح",
  rejected: "مرفوض",
};

export interface ReviewDocumentCheck {
  key: string;
  label?: string;
  status: DocumentCheckStatus;
  note?: string;
}

export interface ReviewRecord {
  scope: ReviewScope;
  itemId: string;
  stage: ReviewStage;
  assignedTo?: string;
  assignedToName?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: string;
  notes?: string;
  documents?: ReviewDocumentCheck[];
  submittedToAdminAt?: string;
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: string;
  decisionNote?: string;
  updatedAt: string;
  version: number;
}

export interface ReviewStore {
  records: Record<string, ReviewRecord>;
}

/** مفتاح التخزين الموحّد لسجل المراجعة */
export function reviewKey(scope: ReviewScope, itemId: string): string {
  return `${scope}:${itemId}`;
}

export function emptyReviewRecord(
  scope: ReviewScope,
  itemId: string
): ReviewRecord {
  return {
    scope,
    itemId,
    stage: "new",
    updatedAt: new Date(0).toISOString(),
    version: 1,
  };
}

function text(value: unknown, max = 2000): string | undefined {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : undefined;
}

function stageValue(value: unknown): ReviewStage {
  return value === "in_review" ||
    value === "awaiting_admin" ||
    value === "approved" ||
    value === "rejected" ||
    value === "returned"
    ? value
    : "new";
}

function scopeValue(value: unknown): ReviewScope | null {
  return value === "listings" ||
    value === "propertyRequests" ||
    value === "professionals"
    ? value
    : null;
}

export function normalizeDocumentChecks(
  value: unknown
): ReviewDocumentCheck[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const key = text(item.key, 80);
    if (!key) return [];
    const status: DocumentCheckStatus =
      item.status === "ok" || item.status === "unclear" || item.status === "rejected"
        ? item.status
        : "unclear";
    return [
      {
        key,
        label: text(item.label, 150),
        status,
        note: text(item.note, 500),
      },
    ];
  });
}

export function normalizeReviewStore(value: unknown): ReviewStore {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const rawRecords =
    source.records && typeof source.records === "object" && !Array.isArray(source.records)
      ? (source.records as Record<string, unknown>)
      : {};

  const records: Record<string, ReviewRecord> = {};
  for (const raw of Object.values(rawRecords)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const scope = scopeValue(item.scope);
    const itemId = text(item.itemId, 160);
    if (!scope || !itemId) continue;
    records[reviewKey(scope, itemId)] = {
      scope,
      itemId,
      stage: stageValue(item.stage),
      assignedTo: text(item.assignedTo, 160),
      assignedToName: text(item.assignedToName, 160),
      reviewerId: text(item.reviewerId, 160),
      reviewerName: text(item.reviewerName, 160),
      reviewedAt: text(item.reviewedAt, 40),
      notes: text(item.notes, 4000),
      documents: normalizeDocumentChecks(item.documents),
      submittedToAdminAt: text(item.submittedToAdminAt, 40),
      decidedBy: text(item.decidedBy, 160),
      decidedByName: text(item.decidedByName, 160),
      decidedAt: text(item.decidedAt, 40),
      decisionNote: text(item.decisionNote, 2000),
      updatedAt: text(item.updatedAt, 40) ?? new Date(0).toISOString(),
      version:
        typeof item.version === "number" && Number.isFinite(item.version)
          ? item.version
          : 1,
    };
  }
  return { records };
}

/* ------------------------------------------------------------------ */
/* سياسة الموافقات                                                     */
/* ------------------------------------------------------------------ */

/** مَن ينفّذ قرار المراجعة */
export type ReviewActorMode = "admin" | "staff" | "any";
/** مَن ينفّذ الموافقة النهائية/النشر */
export type PublishActorMode = "admin" | "staff" | "any" | "auto";

export interface ScopeWorkflowSettings {
  /** تفعيل مرحلة مراجعة المستندات. عند الإيقاف يستطيع الأدمن النشر مباشرة. */
  enabled: boolean;
  reviewBy: ReviewActorMode;
  publishBy: PublishActorMode;
  /** من راجع لا يوافق — قاعدة الشخصين */
  twoPerson: boolean;
}

export type MembersMode = "approval" | "open" | "closed";

export interface MembersWorkflowSettings {
  mode: MembersMode;
  approveBy: ReviewActorMode;
}

export interface WorkflowDelegation {
  id: string;
  staffId: string;
  staffName: string;
  /** النطاق: الإعلانات/طلبات العقار/المهنيون/الأعضاء */
  scope: ReviewScope | "members";
  action: "review" | "publish" | "approve_member";
  /** تاريخ انتهاء ISO — null يعني تفويض مفتوح بلا تاريخ */
  expiresAt: string | null;
  createdAt: string;
  createdBy: string;
}

export interface WorkflowSettings {
  members: MembersWorkflowSettings;
  listings: ScopeWorkflowSettings;
  propertyRequests: ScopeWorkflowSettings;
  professionals: ScopeWorkflowSettings;
  delegations: WorkflowDelegation[];
}

export const DEFAULT_SCOPE_WORKFLOW: ScopeWorkflowSettings = {
  enabled: true,
  reviewBy: "staff",
  publishBy: "admin",
  twoPerson: true,
};

export const DEFAULT_WORKFLOW_SETTINGS: WorkflowSettings = {
  members: { mode: "approval", approveBy: "admin" },
  listings: { ...DEFAULT_SCOPE_WORKFLOW },
  propertyRequests: { ...DEFAULT_SCOPE_WORKFLOW },
  professionals: { ...DEFAULT_SCOPE_WORKFLOW },
  delegations: [],
};

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function reviewActor(value: unknown, fallback: ReviewActorMode): ReviewActorMode {
  return value === "admin" || value === "staff" || value === "any"
    ? value
    : fallback;
}

function publishActor(value: unknown, fallback: PublishActorMode): PublishActorMode {
  return value === "admin" ||
    value === "staff" ||
    value === "any" ||
    value === "auto"
    ? value
    : fallback;
}

function scopeSettings(
  value: unknown,
  fallback: ScopeWorkflowSettings
): ScopeWorkflowSettings {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    enabled: bool(source.enabled, fallback.enabled),
    reviewBy: reviewActor(source.reviewBy, fallback.reviewBy),
    publishBy: publishActor(source.publishBy, fallback.publishBy),
    twoPerson: bool(source.twoPerson, fallback.twoPerson),
  };
}

function delegationScope(value: unknown): ReviewScope | "members" | null {
  return value === "listings" ||
    value === "propertyRequests" ||
    value === "professionals" ||
    value === "members"
    ? value
    : null;
}

function delegationAction(
  value: unknown
): WorkflowDelegation["action"] | null {
  return value === "review" || value === "publish" || value === "approve_member"
    ? value
    : null;
}

export function normalizeWorkflowSettings(value: unknown): WorkflowSettings {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const membersSource =
    source.members && typeof source.members === "object"
      ? (source.members as Record<string, unknown>)
      : {};
  const mode: MembersMode =
    membersSource.mode === "open" || membersSource.mode === "closed"
      ? membersSource.mode
      : "approval";

  const rawDelegations = Array.isArray(source.delegations)
    ? source.delegations
    : [];
  const delegations = rawDelegations.slice(0, 100).flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const staffId = text(item.staffId, 160);
    const scope = delegationScope(item.scope);
    const action = delegationAction(item.action);
    if (!staffId || !scope || !action) return [];
    if (
      (scope === "members" && action !== "approve_member") ||
      (scope !== "members" && action === "approve_member")
    ) return [];
    const expiresAt =
      typeof item.expiresAt === "string" && item.expiresAt.trim()
        ? item.expiresAt.trim().slice(0, 40)
        : null;
    return [
      {
        id: text(item.id, 160) ?? `dlg-${staffId}-${scope}-${action}`,
        staffId,
        staffName: text(item.staffName, 160) ?? staffId,
        scope,
        action,
        expiresAt,
        createdAt: text(item.createdAt, 40) ?? new Date().toISOString(),
        createdBy: text(item.createdBy, 160) ?? "system",
      },
    ];
  });

  return {
    members: {
      mode,
      approveBy: reviewActor(
        membersSource.approveBy,
        DEFAULT_WORKFLOW_SETTINGS.members.approveBy
      ),
    },
    listings: scopeSettings(source.listings, DEFAULT_WORKFLOW_SETTINGS.listings),
    propertyRequests: scopeSettings(
      source.propertyRequests,
      DEFAULT_WORKFLOW_SETTINGS.propertyRequests
    ),
    professionals: scopeSettings(
      source.professionals,
      DEFAULT_WORKFLOW_SETTINGS.professionals
    ),
    delegations,
  };
}

export function scopeSettingsFor(
  settings: WorkflowSettings,
  scope: ReviewScope
): ScopeWorkflowSettings {
  return settings[scope];
}

export function isDelegationActive(
  delegation: WorkflowDelegation,
  now = Date.now()
): boolean {
  if (!delegation.expiresAt) return true;
  const end = Date.parse(delegation.expiresAt);
  return Number.isFinite(end) && end > now;
}

export function hasDelegation(
  settings: WorkflowSettings,
  staffId: string | undefined,
  scope: ReviewScope | "members",
  action: WorkflowDelegation["action"],
  now = Date.now()
): boolean {
  if (!staffId) return false;
  return settings.delegations.some(
    (item) =>
      item.staffId === staffId &&
      item.scope === scope &&
      item.action === action &&
      isDelegationActive(item, now)
  );
}

/** هل المرحلة تعني أن الطلب عاد للعميل أو يحتاج إجراء؟ */
export function isOpenReviewStage(stage: ReviewStage): boolean {
  return stage === "new" || stage === "returned" || stage === "in_review";
}
