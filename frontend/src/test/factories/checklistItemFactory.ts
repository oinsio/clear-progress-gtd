import type { ChecklistItem } from "@/types/entities";

let checklistItemCounter = 0;

export function buildChecklistItem(
  overrides: Partial<ChecklistItem> = {},
): ChecklistItem {
  checklistItemCounter += 1;
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    task_id: crypto.randomUUID(),
    title: `Checklist Item ${checklistItemCounter}`,
    is_completed: false,
    sort_order: checklistItemCounter,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    version: 1,
    ...overrides,
  };
}
