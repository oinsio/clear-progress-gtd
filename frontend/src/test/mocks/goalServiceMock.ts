import { vi } from "vitest";
import type { GoalService } from "@/services/GoalService";
import { createMock } from "./createMock";

export function createMockGoalService(
  overrides: Partial<Record<keyof GoalService, unknown>> = {},
): GoalService {
  return createMock<GoalService>(
    {
      getAll: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      updateStatus: vi.fn().mockResolvedValue(undefined),
      softDelete: vi.fn().mockResolvedValue(undefined),
      reorderGoals: vi.fn().mockResolvedValue(undefined),
      searchByTitle: vi.fn().mockResolvedValue([]),
    },
    overrides,
  );
}
