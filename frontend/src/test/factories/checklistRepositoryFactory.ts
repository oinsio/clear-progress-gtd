import { vi } from "vitest";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";

export function createMockChecklistRepository(
  overrides: Partial<Record<keyof ChecklistRepository, unknown>> = {},
): ChecklistRepository {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getByTaskId: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    bulkUpsert: vi.fn().mockResolvedValue(undefined),
    getMaxVersion: vi.fn().mockResolvedValue(0),
    ...overrides,
  } as unknown as ChecklistRepository;
}
