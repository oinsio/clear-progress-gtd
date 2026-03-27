import { vi } from "vitest";
import type { TaskService } from "@/services/TaskService";
import { createMock } from "./createMock";

export function createMockTaskService(
  overrides: Partial<Record<keyof TaskService, unknown>> = {},
): TaskService {
  return createMock<TaskService>(
    {
      getByBox: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      complete: vi.fn().mockResolvedValue({ completed: undefined, recurring: null }),
      noncomplete: vi.fn().mockResolvedValue(undefined),
      softDelete: vi.fn().mockResolvedValue(undefined),
      moveToBox: vi.fn().mockResolvedValue(undefined),
      getCompleted: vi.fn().mockResolvedValue([]),
      reorderTasks: vi.fn().mockResolvedValue(undefined),
      getByGoalId: vi.fn().mockResolvedValue([]),
      getCategoryTaskCounts: vi.fn().mockResolvedValue({}),
      getByCategoryId: vi.fn().mockResolvedValue([]),
      getContextTaskCounts: vi.fn().mockResolvedValue({}),
      getByContextId: vi.fn().mockResolvedValue([]),
      searchByTitle: vi.fn().mockResolvedValue([]),
      getGoalTaskCounts: vi.fn().mockResolvedValue({}),
    },
    overrides,
  );
}
