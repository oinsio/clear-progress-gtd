import type { Category } from "@/types/entities";

let categoryCounter = 0;

export function buildCategory(overrides: Partial<Category> = {}): Category {
  categoryCounter += 1;
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: `Category ${categoryCounter}`,
    sort_order: categoryCounter,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    version: 1,
    ...overrides,
  };
}
