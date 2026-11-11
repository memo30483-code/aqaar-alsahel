/** صيغ قديمة كانت تحفظ السجلات داخل { items }؛ السحابة تستخدم مصفوفة موحّدة. */
export function professionalItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const items = (value as { items?: unknown }).items;
  return Array.isArray(items) ? items : [];
}

export function canonicalProfessionalsValue(
  value: unknown
): Record<string, unknown>[] {
  return professionalItems(value).flatMap((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    const record = raw as Record<string, unknown>;
    const id = typeof record.id === "string" ? record.id.trim() : "";
    const kind = record.kind;
    if (
      !id ||
      (kind !== "developer" &&
        kind !== "marketer" &&
        kind !== "lawyer" &&
        kind !== "engineer")
    ) {
      return [];
    }
    return [{ ...record, id, version: professionalVersion(record) }];
  });
}

export function professionalVersion(value: unknown): number {
  if (!value || typeof value !== "object") return 1;
  const raw = (value as { version?: unknown }).version;
  return typeof raw === "number" && Number.isSafeInteger(raw) && raw >= 1
    ? raw
    : 1;
}
