import { describe, it, expect, vi, beforeEach } from "vitest";
import { SyncService } from "./SyncService";
import type { ApiClient } from "./ApiClient";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { CategoryRepository } from "@/db/repositories/CategoryRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import type { Goal } from "@/types/entities";
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
        settings: [],
      },
    }),
    push: vi.fn().mockResolvedValue({
      ok: true,
      data: {
        tasks: [],
        goals: [],
        contexts: [],
        categories: [],
        checklist_items: [],
      },
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
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as GoalRepository;

    contextRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as ContextRepository;

    categoryRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as CategoryRepository;

    checklistRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      getMaxVersion: vi.fn().mockResolvedValue(0),
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as ChecklistRepository;

    settingsRepository = {
      bulkUpsert: vi.fn().mockResolvedValue(undefined),
    } as unknown as SettingsRepository;
  });

  describe("push", () => {
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
