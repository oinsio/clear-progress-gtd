import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChecklistService } from "./ChecklistService";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";

function createMockChecklistRepository(
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

describe("ChecklistService", () => {
  let mockChecklistRepository: ChecklistRepository;

  beforeEach(() => {
    mockChecklistRepository = createMockChecklistRepository();
  });

  describe("getByTaskId", () => {
    it("should return empty array when task has no checklist items", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      const items = await checklistService.getByTaskId("task-1");
      expect(items).toEqual([]);
    });

    it("should return items sorted by sort_order ascending", async () => {
      const taskId = "task-1";
      const unsortedItems = [
        buildChecklistItem({ task_id: taskId, sort_order: 3 }),
        buildChecklistItem({ task_id: taskId, sort_order: 1 }),
        buildChecklistItem({ task_id: taskId, sort_order: 2 }),
      ];
      mockChecklistRepository = createMockChecklistRepository({
        getByTaskId: vi.fn().mockResolvedValue(unsortedItems),
      });
      const checklistService = new ChecklistService(mockChecklistRepository);
      const items = await checklistService.getByTaskId(taskId);
      expect(items[0].sort_order).toBe(1);
      expect(items[1].sort_order).toBe(2);
      expect(items[2].sort_order).toBe(3);
    });

    it("should call repository.getByTaskId with the taskId", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      await checklistService.getByTaskId("task-abc");
      expect(mockChecklistRepository.getByTaskId).toHaveBeenCalledWith(
        "task-abc",
      );
    });
  });

  describe("getById", () => {
    it("should return item when found", async () => {
      const item = buildChecklistItem();
      mockChecklistRepository = createMockChecklistRepository({
        getById: vi.fn().mockResolvedValue(item),
      });
      const checklistService = new ChecklistService(mockChecklistRepository);
      const result = await checklistService.getById(item.id);
      expect(result).toEqual(item);
    });

    it("should return undefined when item not found", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      const result = await checklistService.getById("nonexistent-id");
      expect(result).toBeUndefined();
    });
  });

  describe("create", () => {
    it("should create item with given taskId and title", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      const item = await checklistService.create("task-1", "Buy groceries");
      expect(item.task_id).toBe("task-1");
      expect(item.title).toBe("Buy groceries");
    });

    it("should create item with is_completed false", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      const item = await checklistService.create("task-1", "Do something");
      expect(item.is_completed).toBe(false);
    });

    it("should create item with is_deleted false", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      const item = await checklistService.create("task-1", "Do something");
      expect(item.is_deleted).toBe(false);
    });

    it("should create item with version 1", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      const item = await checklistService.create("task-1", "Do something");
      expect(item.version).toBe(1);
    });

    it("should create item with sort_order 0", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      const item = await checklistService.create("task-1", "Do something");
      expect(item.sort_order).toBe(0);
    });

    it("should create item with a UUID id", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      const item = await checklistService.create("task-1", "Do something");
      expect(item.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should call repository.create with the constructed item", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      const item = await checklistService.create("task-1", "Do something");
      expect(mockChecklistRepository.create).toHaveBeenCalledWith(item);
    });
  });

  describe("update", () => {
    it("should update the title of the item", async () => {
      const item = buildChecklistItem({ title: "Old title" });
      mockChecklistRepository = createMockChecklistRepository({
        getById: vi.fn().mockResolvedValue(item),
      });
      const checklistService = new ChecklistService(mockChecklistRepository);
      const updated = await checklistService.update(item.id, {
        title: "New title",
      });
      expect(updated.title).toBe("New title");
    });

    it("should increment version on update", async () => {
      const item = buildChecklistItem({ version: 2 });
      mockChecklistRepository = createMockChecklistRepository({
        getById: vi.fn().mockResolvedValue(item),
      });
      const checklistService = new ChecklistService(mockChecklistRepository);
      const updated = await checklistService.update(item.id, {
        title: "New title",
      });
      expect(updated.version).toBe(3);
    });

    it("should update updated_at timestamp on update", async () => {
      const item = buildChecklistItem({
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      mockChecklistRepository = createMockChecklistRepository({
        getById: vi.fn().mockResolvedValue(item),
      });
      const checklistService = new ChecklistService(mockChecklistRepository);
      const updated = await checklistService.update(item.id, {
        title: "New title",
      });
      expect(updated.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should throw when item not found", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      await expect(
        checklistService.update("nonexistent-id", { title: "X" }),
      ).rejects.toThrow("ChecklistItem not found: nonexistent-id");
    });
  });

  describe("toggle", () => {
    it("should set is_completed to true when item is not completed", async () => {
      const item = buildChecklistItem({ is_completed: false });
      mockChecklistRepository = createMockChecklistRepository({
        getById: vi.fn().mockResolvedValue(item),
      });
      const checklistService = new ChecklistService(mockChecklistRepository);
      const toggled = await checklistService.toggle(item.id);
      expect(toggled.is_completed).toBe(true);
    });

    it("should set is_completed to false when item is already completed", async () => {
      const item = buildChecklistItem({ is_completed: true });
      mockChecklistRepository = createMockChecklistRepository({
        getById: vi.fn().mockResolvedValue(item),
      });
      const checklistService = new ChecklistService(mockChecklistRepository);
      const toggled = await checklistService.toggle(item.id);
      expect(toggled.is_completed).toBe(false);
    });

    it("should throw when item not found", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      await expect(checklistService.toggle("nonexistent-id")).rejects.toThrow(
        "ChecklistItem not found: nonexistent-id",
      );
    });
  });

  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const item = buildChecklistItem({ is_deleted: false });
      mockChecklistRepository = createMockChecklistRepository({
        getById: vi.fn().mockResolvedValue(item),
      });
      const checklistService = new ChecklistService(mockChecklistRepository);
      const deleted = await checklistService.softDelete(item.id);
      expect(deleted.is_deleted).toBe(true);
    });

    it("should increment version on soft delete", async () => {
      const item = buildChecklistItem({ version: 3 });
      mockChecklistRepository = createMockChecklistRepository({
        getById: vi.fn().mockResolvedValue(item),
      });
      const checklistService = new ChecklistService(mockChecklistRepository);
      const deleted = await checklistService.softDelete(item.id);
      expect(deleted.version).toBe(4);
    });

    it("should throw when item not found", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      await expect(
        checklistService.softDelete("nonexistent-id"),
      ).rejects.toThrow("ChecklistItem not found: nonexistent-id");
    });
  });

  describe("getProgress", () => {
    it("should return zero total when task has no items", async () => {
      const checklistService = new ChecklistService(mockChecklistRepository);
      const progress = await checklistService.getProgress("task-1");
      expect(progress.total).toBe(0);
    });

    it("should return zero completed when no items are done", async () => {
      const taskId = "task-1";
      const items = [
        buildChecklistItem({ task_id: taskId, is_completed: false }),
        buildChecklistItem({ task_id: taskId, is_completed: false }),
      ];
      mockChecklistRepository = createMockChecklistRepository({
        getByTaskId: vi.fn().mockResolvedValue(items),
      });
      const checklistService = new ChecklistService(mockChecklistRepository);
      const progress = await checklistService.getProgress(taskId);
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(2);
    });

    it("should count only completed items", async () => {
      const taskId = "task-1";
      const items = [
        buildChecklistItem({ task_id: taskId, is_completed: true }),
        buildChecklistItem({ task_id: taskId, is_completed: false }),
        buildChecklistItem({ task_id: taskId, is_completed: true }),
      ];
      mockChecklistRepository = createMockChecklistRepository({
        getByTaskId: vi.fn().mockResolvedValue(items),
      });
      const checklistService = new ChecklistService(mockChecklistRepository);
      const progress = await checklistService.getProgress(taskId);
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(3);
    });
  });
});
