import { vi } from "vitest";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import { createMock } from "./createMock";

export function createMockGoalRepository(
  overrides: Partial<Record<keyof GoalRepository, unknown>> = {},
): GoalRepository {
  return createMock<GoalRepository>(
    {
      getAll: vi.fn().mockResolvedValue([]),
      getActive: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
      getMaxVersion: vi.fn().mockResolvedValue(0),
    },
    overrides,
  );
}
