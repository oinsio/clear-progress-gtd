import { vi } from "vitest";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { createMock } from "./createMock";

export function createMockTaskRepository(
  overrides: Partial<Record<keyof TaskRepository, unknown>> = {},
): TaskRepository {
  return createMock<TaskRepository>(
    {
      getAll: vi.fn().mockResolvedValue([]),
      getActive: vi.fn().mockResolvedValue([]),
      getActiveIncomplete: vi.fn().mockResolvedValue([]),
      getByBox: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      getByGoalId: vi.fn().mockResolvedValue([]),
      getCompleted: vi.fn().mockResolvedValue([]),
      getByCategoryId: vi.fn().mockResolvedValue([]),
      getByContextId: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
      getByMinVersion: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
    },
    overrides,
  );
}
