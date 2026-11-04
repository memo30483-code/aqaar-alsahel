export interface CrmSettings {
  autoAssign: boolean;
  defaultAssigneeId?: string;
  defaultAssigneeName?: string;
}

export const DEFAULT_CRM_SETTINGS: CrmSettings = {
  autoAssign: false,
};

export function normalizeCrmSettings(value: unknown): CrmSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_CRM_SETTINGS };
  const item = value as Record<string, unknown>;
  const id =
    typeof item.defaultAssigneeId === "string"
      ? item.defaultAssigneeId.trim()
      : "";
  const name =
    typeof item.defaultAssigneeName === "string"
      ? item.defaultAssigneeName.trim()
      : "";
  return {
    autoAssign: item.autoAssign === true && Boolean(id),
    ...(id ? { defaultAssigneeId: id } : {}),
    ...(name ? { defaultAssigneeName: name } : {}),
  };
}
