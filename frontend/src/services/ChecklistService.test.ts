import { describe, it, expect, vi } from "vitest";
import { ChecklistService } from "./ChecklistService";
import type { ChecklistItem } from "@/types/entities";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";

function createService(
  overrides: Partial<Record<keyof ChecklistRepository, unknown>> = {},
): { service: ChecklistService; repository: ChecklistRepository } {
  const repository = createMockChecklistRepository(overrides);
  return { service: new ChecklistService(repository), repository };
}

describe("ChecklistService", () => {
  describe("getByTaskId", () => {
    it("should return empty array when task has no checklist items", async () => {
      const { service } = createService();
      const items = await service.getByTaskId("task-1");
      expect(items).toEqual([]);
    });

    it("should return items sorted by sort_order ascending", async () => {
      const taskId = "task-1";
      const unsortedItems = [
        buildChecklistItem({ task_id: taskId, sort_order: 3 }),
        buildChecklistItem({ task_id: taskId, sort_order: 1 }),
        buildChecklistItem({ task_id: taskId, sort_order: 2 }),
      ];
      const { service } = createService({
        getByTaskId: vi.fn().mockResolvedValue(unsortedItems),
      });
      const items = await service.getByTaskId(taskId);
      expect(items[0].sort_order).toBe(1);
      expect(items[1].sort_order).toBe(2);
      expect(items[2].sort_order).toBe(3);
    });

    it("should call repository.getByTaskId with the taskId", async () => {
      const { service, repository } = createService();
      await service.getByTaskId("task-abc");
      expect(repository.getByTaskId).toHaveBeenCalledWith("task-abc");
    });
  });

  describe("getById", () => {
    it("should return item when found", async () => {
      const item = buildChecklistItem();
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const result = await service.getById(item.id);
      expect(result).toEqual(item);
    });

    it("should return undefined when item not found", async () => {
      const { service } = createService();
      const result = await service.getById("nonexistent-id");
      expect(result).toBeUndefined();
    });
  });

  describe("create", () => {
    it("should create item with given taskId and title", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Buy groceries");
      expect(item.task_id).toBe("task-1");
      expect(item.title).toBe("Buy groceries");
    });

    it("should create item with is_completed false", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Do something");
      expect(item.is_completed).toBe(false);
    });

    it("should create item with is_deleted false", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Do something");
      expect(item.is_deleted).toBe(false);
    });

    it("should create item with version 1", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Do something");
      expect(item.version).toBe(1);
    });

    it("should create item with sort_order 0 when task has no existing items", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Do something");
      expect(item.sort_order).toBe(0);
    });

    it("should create item with sort_order equal to existing items count", async () => {
      const taskId = "task-1";
      const existingItems = [
        buildChecklistItem({ task_id: taskId, sort_order: 0 }),
        buildChecklistItem({ task_id: taskId, sort_order: 1 }),
      ];
      const { service } = createService({
        getByTaskId: vi.fn().mockResolvedValue(existingItems),
      });
      const item = await service.create(taskId, "Third item");
      expect(item.sort_order).toBe(2);
    });

    it("should create item with a UUID id", async () => {
      const { service } = createService();
      const item = await service.create("task-1", "Do something");
      expect(item.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should call repository.create with the constructed item", async () => {
      const { service, repository } = createService();
      const item = await service.create("task-1", "Do something");
      expect(repository.create).toHaveBeenCalledWith(item);
    });
  });

  describe("update", () => {
    it("should update the title of the item", async () => {
      const item = buildChecklistItem({ title: "Old title" });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const updated = await service.update(item.id, { title: "New title" });
      expect(updated.title).toBe("New title");
    });

    it("should increment version on update", async () => {
      const item = buildChecklistItem({ version: 2 });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const updated = await service.update(item.id, { title: "New title" });
      expect(updated.version).toBe(3);
    });

    it("should update updated_at timestamp on update", async () => {
      const item = buildChecklistItem({
        updated_at: "2025-01-01T00:00:00.000Z",
      });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const updated = await service.update(item.id, { title: "New title" });
      expect(updated.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should throw when item not found", async () => {
      const { service } = createService();
      await expect(
        service.update("nonexistent-id", { title: "X" }),
      ).rejects.toThrow("ChecklistItem not found: nonexistent-id");
    });
  });

  describe("toggle", () => {
    it("should set is_completed to true when item is not completed", async () => {
      const item = buildChecklistItem({ is_completed: false });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const toggled = await service.toggle(item.id);
      expect(toggled.is_completed).toBe(true);
    });

    it("should set is_completed to false when item is already completed", async () => {
      const item = buildChecklistItem({ is_completed: true });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const toggled = await service.toggle(item.id);
      expect(toggled.is_completed).toBe(false);
    });

    it("should throw when item not found", async () => {
      const { service } = createService();
      await expect(service.toggle("nonexistent-id")).rejects.toThrow(
        "ChecklistItem not found: nonexistent-id",
      );
    });
  });

  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const item = buildChecklistItem({ is_deleted: false });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const deleted = await service.softDelete(item.id);
      expect(deleted.is_deleted).toBe(true);
    });

    it("should increment version on soft delete", async () => {
      const item = buildChecklistItem({ version: 3 });
      const { service } = createService({
        getById: vi.fn().mockResolvedValue(item),
      });
      const deleted = await service.softDelete(item.id);
      expect(deleted.version).toBe(4);
    });

    it("should throw when item not found", async () => {
      const { service } = createService();
      await expect(
        service.softDelete("nonexistent-id"),
      ).rejects.toThrow("ChecklistItem not found: nonexistent-id");
    });
  });

  describe("reorderItems", () => {
    it("should do nothing when items array is empty", async () => {
      const { service, repository } = createService();
      await service.reorderItems([]);
      expect(repository.bulkUpsert).not.toHaveBeenCalled();
    });

    it("should assign sort_order based on index position in given order", async () => {
      const items = [
        buildChecklistItem({ sort_order: 2 }),
        buildChecklistItem({ sort_order: 0 }),
        buildChecklistItem({ sort_order: 1 }),
      ];
      const { service, repository } = createService();
      await service.reorderItems(items);
      const updatedItems = (
        repository.bulkUpsert as ReturnType<typeof vi.fn>
      ).mock.calls[0][0] as ChecklistItem[];
      expect(updatedItems[0].sort_order).toBe(0);
      expect(updatedItems[1].sort_order).toBe(1);
      expect(updatedItems[2].sort_order).toBe(2);
    });

    it("should increment version for each item", async () => {
      const items = [
        buildChecklistItem({ version: 3 }),
        buildChecklistItem({ version: 5 }),
      ];
      const { service, repository } = createService();
      await service.reorderItems(items);
      const updatedItems = (
        repository.bulkUpsert as ReturnType<typeof vi.fn>
      ).mock.calls[0][0] as ChecklistItem[];
      expect(updatedItems[0].version).toBe(4);
      expect(updatedItems[1].version).toBe(6);
    });

    it("should update updated_at for each item", async () => {
      const oldTimestamp = "2025-01-01T00:00:00.000Z";
      const items = [
        buildChecklistItem({ updated_at: oldTimestamp }),
        buildChecklistItem({ updated_at: oldTimestamp }),
      ];
      const { service, repository } = createService();
      await service.reorderItems(items);
      const updatedItems = (
        repository.bulkUpsert as ReturnType<typeof vi.fn>
      ).mock.calls[0][0] as ChecklistItem[];
      expect(updatedItems[0].updated_at).not.toBe(oldTimestamp);
      expect(updatedItems[1].updated_at).not.toBe(oldTimestamp);
    });

    it("should call repository.bulkUpsert once with all updated items", async () => {
      const items = [
        buildChecklistItem(),
        buildChecklistItem(),
        buildChecklistItem(),
      ];
      const { service, repository } = createService();
      await service.reorderItems(items);
      expect(repository.bulkUpsert).toHaveBeenCalledTimes(1);
      expect(
        (repository.bulkUpsert as ReturnType<typeof vi.fn>).mock.calls[0][0],
      ).toHaveLength(3);
    });
  });

  describe("getProgress", () => {
    it("should return zero total when task has no items", async () => {
      const { service } = createService();
      const progress = await service.getProgress("task-1");
      expect(progress.total).toBe(0);
    });

    it("should return zero completed when no items are done", async () => {
      const taskId = "task-1";
      const items = [
        buildChecklistItem({ task_id: taskId, is_completed: false }),
        buildChecklistItem({ task_id: taskId, is_completed: false }),
      ];
      const { service } = createService({
        getByTaskId: vi.fn().mockResolvedValue(items),
      });
      const progress = await service.getProgress(taskId);
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
      const { service } = createService({
        getByTaskId: vi.fn().mockResolvedValue(items),
      });
      const progress = await service.getProgress(taskId);
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(3);
    });
  });
});
