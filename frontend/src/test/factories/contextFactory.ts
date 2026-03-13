import type { Context } from "@/types/entities";

let contextCounter = 0;

export function buildContext(overrides: Partial<Context> = {}): Context {
  contextCounter += 1;
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: `@Context ${contextCounter}`,
    sort_order: contextCounter,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    version: 1,
    ...overrides,
  };
}
