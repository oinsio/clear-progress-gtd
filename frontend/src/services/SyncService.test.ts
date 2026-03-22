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
      getChangedSince: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as TaskRepository;

    goalRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getChangedSince: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as GoalRepository;

    contextRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getChangedSince: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as ContextRepository;

    categoryRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getChangedSince: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as CategoryRepository;

    checklistRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getChangedSince: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      update: vi.fn().mockResolvedValue(undefined),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as ChecklistRepository;

    settingsRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getChangedSince: vi.fn().mockResolvedValue([]),
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

      await service.push(null);

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

      await service.push(null);

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
      await service.push(null);

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
      await service.push(null);

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
      await service.push(null);

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
      await service.push(null);

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

        await service.push(null);

        const pushCall = (mockApiClient.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(pushCall.changes.goals[0].cover_file_id).toBe(expectedCoverFileId);
      },
    );
  });

  describe("push — with since timestamp", () => {
    function createService() {
      return new SyncService(
        mockApiClient,
        taskRepository,
        goalRepository,
        contextRepository,
        categoryRepository,
        checklistRepository,
        settingsRepository,
      );
    }

    it("should call getChangedSince on all repositories when since is provided", async () => {
      const since = "2026-03-01T00:00:00.000Z";
      const service = createService();

      await service.push(since);

      expect(taskRepository.getChangedSince).toHaveBeenCalledWith(since);
      expect(goalRepository.getChangedSince).toHaveBeenCalledWith(since);
      expect(contextRepository.getChangedSince).toHaveBeenCalledWith(since);
      expect(categoryRepository.getChangedSince).toHaveBeenCalledWith(since);
      expect(checklistRepository.getChangedSince).toHaveBeenCalledWith(since);
      expect(settingsRepository.getChangedSince).toHaveBeenCalledWith(since);
    });

    it("should not call getAll on any repository when since is provided", async () => {
      const service = createService();

      await service.push("2026-03-01T00:00:00.000Z");

      expect(taskRepository.getAll).not.toHaveBeenCalled();
      expect(goalRepository.getAll).not.toHaveBeenCalled();
      expect(contextRepository.getAll).not.toHaveBeenCalled();
      expect(categoryRepository.getAll).not.toHaveBeenCalled();
      expect(checklistRepository.getAll).not.toHaveBeenCalled();
      expect(settingsRepository.getAll).not.toHaveBeenCalled();
    });

    it("should send only the records returned by getChangedSince to apiClient.push", async () => {
      const changedTask = { id: "task-1", title: "Changed Task" };
      (taskRepository.getChangedSince as ReturnType<typeof vi.fn>).mockResolvedValue([changedTask]);

      const service = createService();
      await service.push("2026-03-01T00:00:00.000Z");

      const pushCall = (mockApiClient.push as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(pushCall.changes.tasks).toEqual([changedTask]);
    });
  });

  describe("push — null since (first sync)", () => {
    function createService() {
      return new SyncService(
        mockApiClient,
        taskRepository,
        goalRepository,
        contextRepository,
        categoryRepository,
        checklistRepository,
        settingsRepository,
      );
    }

    it("should call getAll on all repositories when since is null", async () => {
      const service = createService();

      await service.push(null);

      expect(taskRepository.getAll).toHaveBeenCalled();
      expect(goalRepository.getAll).toHaveBeenCalled();
      expect(contextRepository.getAll).toHaveBeenCalled();
      expect(categoryRepository.getAll).toHaveBeenCalled();
      expect(checklistRepository.getAll).toHaveBeenCalled();
      expect(settingsRepository.getAll).toHaveBeenCalled();
    });

    it("should not call getChangedSince on any repository when since is null", async () => {
      const service = createService();

      await service.push(null);

      expect(taskRepository.getChangedSince).not.toHaveBeenCalled();
      expect(goalRepository.getChangedSince).not.toHaveBeenCalled();
      expect(contextRepository.getChangedSince).not.toHaveBeenCalled();
      expect(categoryRepository.getChangedSince).not.toHaveBeenCalled();
      expect(checklistRepository.getChangedSince).not.toHaveBeenCalled();
      expect(settingsRepository.getChangedSince).not.toHaveBeenCalled();
    });
  });

  describe("pull — versionsOverride", () => {
    function createService() {
      return new SyncService(
        mockApiClient,
        taskRepository,
        goalRepository,
        contextRepository,
        categoryRepository,
        checklistRepository,
        settingsRepository,
      );
    }

    it("should use provided versionsOverride instead of local versions when override is given", async () => {
      const override = { tasks: 0, goals: 0, contexts: 0, categories: 0, checklist_items: 0 };
      const service = createService();

      await service.pull(override);

      expect(mockApiClient.pull).toHaveBeenCalledWith({ versions: override });
    });

    it("should not call getMaxVersion on any repository when versionsOverride is provided", async () => {
      const override = { tasks: 0, goals: 0, contexts: 0, categories: 0, checklist_items: 0 };
      const service = createService();

      await service.pull(override);

      expect(taskRepository.getMaxVersion).not.toHaveBeenCalled();
      expect(goalRepository.getMaxVersion).not.toHaveBeenCalled();
      expect(contextRepository.getMaxVersion).not.toHaveBeenCalled();
      expect(categoryRepository.getMaxVersion).not.toHaveBeenCalled();
      expect(checklistRepository.getMaxVersion).not.toHaveBeenCalled();
    });

    it("should use local versions from repositories when versionsOverride is not provided", async () => {
      (taskRepository.getMaxVersion as ReturnType<typeof vi.fn>).mockResolvedValue(10);
      (goalRepository.getMaxVersion as ReturnType<typeof vi.fn>).mockResolvedValue(5);
      (contextRepository.getMaxVersion as ReturnType<typeof vi.fn>).mockResolvedValue(3);
      (categoryRepository.getMaxVersion as ReturnType<typeof vi.fn>).mockResolvedValue(2);
      (checklistRepository.getMaxVersion as ReturnType<typeof vi.fn>).mockResolvedValue(7);

      const service = createService();
      await service.pull();

      expect(mockApiClient.pull).toHaveBeenCalledWith({
        versions: { tasks: 10, goals: 5, contexts: 3, categories: 2, checklist_items: 7 },
      });
    });
  });
});
