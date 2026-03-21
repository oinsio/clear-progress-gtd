import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncService } from "./SyncService";
import type { ApiClient } from "./ApiClient";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import type { Goal, Context, Category, ChecklistItem } from "@/types/entities";
import { LOCAL_COVER_ID_PREFIX } from "@/constants";

function createMockApiClient(
  overrides: Partial<Record<keyof ApiClient, unknown>> = {},
): ApiClient {
  return {
    uploadCover: vi.fn(),
    deleteCover: vi.fn(),
    ping: vi.fn(),
    init: vi.fn(),
    pull: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        tasks: [],
        goals: [],
        contexts: [],
        categories: [],
        checklist_items: [],
      },
      settings: [],
      server_time: "2026-03-04T11:00:00.000Z",
    }),
    push: vi.fn().mockResolvedValue({
      ok: true,
      results: {
        tasks: [],
        goals: [],
        contexts: [],
        categories: [],
        checklist_items: [],
        settings: [],
      },
      server_time: "2026-03-04T11:00:00.000Z",
    }),
    ...overrides,
  } as ApiClient;
}

function createGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-id",
    title: "Test Goal",
    description: "",
    cover_file_id: "",
    status: "in_progress",
    sort_order: 0,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    ...overrides,
  };
}

function createContext(overrides: Partial<Context> = {}): Context {
  return {
    id: "context-id",
    name: "Test Context",
    sort_order: 0,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    ...overrides,
  };
}

function createCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "category-id",
    name: "Test Category",
    sort_order: 0,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    ...overrides,
  };
}

function createChecklistItem(overrides: Partial<ChecklistItem> = {}): ChecklistItem {
  return {
    id: "checklist-id",
    task_id: "task-id",
    title: "Test Item",
    is_completed: false,
    sort_order: 0,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    ...overrides,
  };
}

describe("SyncService", () => {
  let mockApiClient: ApiClient;
  let taskRepository: TaskRepository;
  let goalRepository: GoalRepository;
  let contextRepository: ContextRepository;
  let categoryRepository: CategoryRepository;
  let checklistRepository: ChecklistRepository;
  let settingsRepository: SettingsRepository;

  beforeEach(() => {
    mockApiClient = createMockApiClient();

    taskRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as TaskRepository;

    goalRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as GoalRepository;

    contextRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as ContextRepository;

    categoryRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as CategoryRepository;

    checklistRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as ChecklistRepository;

    settingsRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as SettingsRepository;
  });

  describe("pull", () => {
    it("should save settings from top-level response field, not from data", async () => {
      const serverSettings = [{ key: "default_box", value: "inbox", updated_at: "2026-03-04T10:00:00.000Z" }];
      mockApiClient = createMockApiClient({
        pull: vi.fn().mockResolvedValue({
          ok: true,
          data: { tasks: [], goals: [], contexts: [], categories: [], checklist_items: [] },
          settings: serverSettings,
          server_time: "2026-03-04T11:00:00.000Z",
        }),
      });

      const service = new SyncService(
        mockApiClient,
        taskRepository,
        goalRepository,
        contextRepository,
        categoryRepository,
        checklistRepository,
        settingsRepository,
      );

      await service.pull();

      expect(settingsRepository.bulkUpsert).toHaveBeenCalledWith(serverSettings);
    });
  });

  describe("push", () => {
    it("should call settingsRepository.getAll during push", async () => {
      const service = new SyncService(
        mockApiClient,
        taskRepository,
        goalRepository,
        contextRepository,
        categoryRepository,
        checklistRepository,
        settingsRepository,
      );

      await service.push();

      expect(settingsRepository.getAll).toHaveBeenCalledOnce();
    });

    it("should include settings in push payload", async () => {
      const localSettings = [
        { key: "default_box", value: "today", updated_at: "2026-03-21T10:00:00.000Z" },
        { key: "accent_color", value: "orange", updated_at: "2026-03-21T10:00:00.000Z" },
      ];
      (settingsRepository.getAll as ReturnType<typeof vi.fn>).mockResolvedValue(localSettings);

      const service = new SyncService(
        mockApiClient,
        taskRepository,
        goalRepository,
        contextRepository,
        categoryRepository,
        checklistRepository,
        settingsRepository,
      );

      await service.push();

      const pushCall = (mockApiClient.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(pushCall.changes.settings).toEqual(localSettings);
    });

    it("should apply server_record from goal conflict response to goalRepository", async () => {
      const serverGoal = createGoal({ id: "goal-conflict-id", title: "Server Goal", version: 5 });
      mockApiClient = createMockApiClient({
        push: vi.fn().mockResolvedValue({
          ok: true,
          results: {
            goals: [{ id: serverGoal.id, status: "conflict", server_record: serverGoal }],
          },
          server_time: new Date().toISOString(),
        }),
      });
      (goalRepository.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([createGoal({ id: serverGoal.id })]);

      const service = new SyncService(
        mockApiClient, taskRepository, goalRepository, contextRepository,
        categoryRepository, checklistRepository, settingsRepository,
      );
      await service.push();

      expect(goalRepository.update).toHaveBeenCalledWith(serverGoal);
    });

    it("should apply server_record from context conflict response to contextRepository", async () => {
      const serverContext = createContext({ id: "ctx-conflict-id", name: "Server Context", version: 3 });
      mockApiClient = createMockApiClient({
        push: vi.fn().mockResolvedValue({
          ok: true,
          results: {
            contexts: [{ id: serverContext.id, status: "conflict", server_record: serverContext }],
          },
          server_time: new Date().toISOString(),
        }),
      });

      const service = new SyncService(
        mockApiClient, taskRepository, goalRepository, contextRepository,
        categoryRepository, checklistRepository, settingsRepository,
      );
      await service.push();

      expect(contextRepository.update).toHaveBeenCalledWith(serverContext);
    });

    it("should apply server_record from category conflict response to categoryRepository", async () => {
      const serverCategory = createCategory({ id: "cat-conflict-id", name: "Server Category", version: 4 });
      mockApiClient = createMockApiClient({
        push: vi.fn().mockResolvedValue({
          ok: true,
          results: {
            categories: [{ id: serverCategory.id, status: "conflict", server_record: serverCategory }],
          },
          server_time: new Date().toISOString(),
        }),
      });

      const service = new SyncService(
        mockApiClient, taskRepository, goalRepository, contextRepository,
        categoryRepository, checklistRepository, settingsRepository,
      );
      await service.push();

      expect(categoryRepository.update).toHaveBeenCalledWith(serverCategory);
    });

    it("should apply server_record from checklist_item conflict response to checklistRepository", async () => {
      const serverItem = createChecklistItem({ id: "item-conflict-id", title: "Server Item", version: 2 });
      mockApiClient = createMockApiClient({
        push: vi.fn().mockResolvedValue({
          ok: true,
          results: {
            checklist_items: [{ id: serverItem.id, status: "conflict", server_record: serverItem }],
          },
          server_time: new Date().toISOString(),
        }),
      });

      const service = new SyncService(
        mockApiClient, taskRepository, goalRepository, contextRepository,
        categoryRepository, checklistRepository, settingsRepository,
      );
      await service.push();

      expect(checklistRepository.update).toHaveBeenCalledWith(serverItem);
    });

    it.each([
      {
        description: "local cover_file_id",
        inputCoverFileId: `${LOCAL_COVER_ID_PREFIX}some-local-uuid`,
        expectedCoverFileId: "",
      },
      {
        description: "remote cover_file_id",
        inputCoverFileId: "remote-file-id",
        expectedCoverFileId: "remote-file-id",
      },
      {
        description: "empty cover_file_id",
        inputCoverFileId: "",
        expectedCoverFileId: "",
      },
    ])(
      "should send correct cover_file_id when goal has $description",
      async ({ inputCoverFileId, expectedCoverFileId }) => {
        (goalRepository.getAll as ReturnType<typeof vi.fn>).mockResolvedValue([
          createGoal({ cover_file_id: inputCoverFileId }),
        ]);

        const service = new SyncService(
          mockApiClient,
          taskRepository,
          goalRepository,
          contextRepository,
          categoryRepository,
          checklistRepository,
          settingsRepository,
        );

        await service.push();

        const pushCall = (mockApiClient.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(pushCall.changes.goals[0].cover_file_id).toBe(expectedCoverFileId);
      },
    );
  });
});
