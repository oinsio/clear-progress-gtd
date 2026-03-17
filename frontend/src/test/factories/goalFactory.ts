import type { Goal } from "@/types/entities";

let goalCounter = 0;

export function buildGoal(overrides: Partial<Goal> = {}): Goal {
  goalCounter += 1;
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: `Goal ${goalCounter}`,
    description: "",
    cover_file_id: "",
    status: "planning",
    sort_order: goalCounter,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    version: 1,
    ...overrides,
  };
}
