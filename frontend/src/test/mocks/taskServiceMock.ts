import { vi } from "vitest";
import type { TaskService } from "@/services/TaskService";

export function createMockTaskService(
  overrides: Partial<Record<keyof TaskService, unknown>> = {},
): TaskService {
  return {
    getByBox: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    complete: vi.fn().mockResolvedValue(undefined),
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
    ...overrides,
  } as unknown as TaskService;
}
