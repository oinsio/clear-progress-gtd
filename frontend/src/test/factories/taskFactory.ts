import type { Task } from "@/types/entities";

let taskCounter = 0;

export function buildTask(overrides: Partial<Task> = {}): Task {
  taskCounter += 1;
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: `Task ${taskCounter}`,
    notes: "",
    box: "inbox",
    goal_id: "",
    context_id: "",
    category_id: "",
    is_completed: false,
    completed_at: "",
    repeat_rule: "",
    sort_order: taskCounter,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    version: 1,
    ...overrides,
  };
}
