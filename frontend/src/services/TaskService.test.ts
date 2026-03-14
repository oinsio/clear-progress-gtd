import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskService } from "./TaskService";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { buildTask } from "@/test/factories/taskFactory";
import { BOX } from "@/constants";

function createMockTaskRepository(
  overrides: Partial<Record<keyof TaskRepository, unknown>> = {},
): TaskRepository {
  return {
    getAll: vi.fn().mockResolvedValue([]),
    getActive: vi.fn().mockResolvedValue([]),
    getByBox: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue(undefined),
    getByGoalId: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    bulkUpsert: vi.fn().mockResolvedValue(undefined),
    getByMinVersion: vi.fn().mockResolvedValue([]),
    getMaxVersion: vi.fn().mockResolvedValue(0),
    ...overrides,
  } as unknown as TaskRepository;
}

describe("TaskService", () => {
  let mockTaskRepository: TaskRepository;

  beforeEach(() => {
    mockTaskRepository = createMockTaskRepository();
  });

  describe("getByBox", () => {
    it("should return empty array when box has no tasks", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getByBox(BOX.TODAY);
      expect(tasks).toEqual([]);
    });

    it("should return tasks sorted by sort_order ascending", async () => {
      const unsortedTasks = [
        buildTask({ box: "today", sort_order: 3 }),
        buildTask({ box: "today", sort_order: 1 }),
        buildTask({ box: "today", sort_order: 2 }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getByBox: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getByBox(BOX.TODAY);
      expect(tasks[0].sort_order).toBe(1);
      expect(tasks[1].sort_order).toBe(2);
      expect(tasks[2].sort_order).toBe(3);
    });
  });

  describe("getById", () => {
    it("should return task when found", async () => {
      const task = buildTask();
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      const result = await taskService.getById(task.id);
      expect(result).toEqual(task);
    });

    it("should return undefined when task not found", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const result = await taskService.getById("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("getByGoalId", () => {
    it("should return empty array when goal has no tasks", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getByGoalId("goal-1");
      expect(tasks).toEqual([]);
    });

    it("should return tasks sorted by sort_order ascending", async () => {
      const goalId = "goal-1";
      const unsortedTasks = [
        buildTask({ goal_id: goalId, sort_order: 3 }),
        buildTask({ goal_id: goalId, sort_order: 1 }),
        buildTask({ goal_id: goalId, sort_order: 2 }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getByGoalId: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getByGoalId(goalId);
      expect(tasks[0].sort_order).toBe(1);
      expect(tasks[1].sort_order).toBe(2);
      expect(tasks[2].sort_order).toBe(3);
    });

    it("should call repository.getByGoalId with the goalId", async () => {
      const taskService = new TaskService(mockTaskRepository);
      await taskService.getByGoalId("goal-abc");
      expect(mockTaskRepository.getByGoalId).toHaveBeenCalledWith("goal-abc");
    });
  });

  describe("create", () => {
    it("should create task with given title and box", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const task = await taskService.create({ title: "My task", box: "inbox" });
      expect(task.title).toBe("My task");
      expect(task.box).toBe("inbox");
    });

    it("should create task with is_deleted false", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const task = await taskService.create({ title: "My task", box: "inbox" });
      expect(task.is_deleted).toBe(false);
    });

    it("should create task with version 1", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const task = await taskService.create({ title: "My task", box: "inbox" });
      expect(task.version).toBe(1);
    });

    it("should create task with a UUID id", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const task = await taskService.create({ title: "My task", box: "inbox" });
      expect(task.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe("update", () => {
    it("should update task fields", async () => {
      const task = buildTask({ title: "Old title" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      const updated = await taskService.update(task.id, { title: "New title" });
      expect(updated.title).toBe("New title");
    });

    it("should increment version on update", async () => {
      const task = buildTask({ version: 2 });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      const updated = await taskService.update(task.id, { title: "X" });
      expect(updated.version).toBe(3);
    });

    it("should throw when task not found", async () => {
      const taskService = new TaskService(mockTaskRepository);
      await expect(taskService.update("nonexistent", {})).rejects.toThrow(
        "Task not found: nonexistent",
      );
    });
  });

  describe("complete", () => {
    it("should set is_completed to true", async () => {
      const task = buildTask({ is_completed: false });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      const completed = await taskService.complete(task.id);
      expect(completed.is_completed).toBe(true);
    });

    it("should set completed_at to a non-empty ISO string", async () => {
      const task = buildTask({ completed_at: "" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      const completed = await taskService.complete(task.id);
      expect(completed.completed_at).not.toBe("");
    });

    it("should NOT create a recurring copy when repeat_rule is empty", async () => {
      const task = buildTask({ repeat_rule: "" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      await taskService.complete(task.id);
      expect(mockTaskRepository.create).not.toHaveBeenCalled();
    });

    it("should create a recurring copy when repeat_rule is set", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({ type: "daily" }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      await taskService.complete(task.id);
      expect(mockTaskRepository.create).toHaveBeenCalledOnce();
    });

    it("should create recurring copy with same title and box", async () => {
      const task = buildTask({
        title: "Daily standup",
        box: "today",
        repeat_rule: JSON.stringify({ type: "daily" }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      await taskService.complete(task.id);
      const createdTask = (
        mockTaskRepository.create as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(createdTask.title).toBe("Daily standup");
      expect(createdTask.box).toBe("today");
    });

    it("should create recurring copy with reset completion state", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({ type: "weekly" }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      await taskService.complete(task.id);
      const createdTask = (
        mockTaskRepository.create as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(createdTask.is_completed).toBe(false);
      expect(createdTask.completed_at).toBe("");
    });

    it("should create recurring copy with a new unique id", async () => {
      const task = buildTask({
        repeat_rule: JSON.stringify({ type: "daily" }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      await taskService.complete(task.id);
      const createdTask = (
        mockTaskRepository.create as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(createdTask.id).not.toBe(task.id);
    });

    it("should create recurring copy with version 1", async () => {
      const task = buildTask({
        version: 5,
        repeat_rule: JSON.stringify({ type: "daily" }),
      });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      await taskService.complete(task.id);
      const createdTask = (
        mockTaskRepository.create as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(createdTask.version).toBe(1);
    });

    it("should preserve repeat_rule in the recurring copy", async () => {
      const repeatRule = JSON.stringify({ type: "daily" });
      const task = buildTask({ repeat_rule: repeatRule });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      await taskService.complete(task.id);
      const createdTask = (
        mockTaskRepository.create as ReturnType<typeof vi.fn>
      ).mock.calls[0][0];
      expect(createdTask.repeat_rule).toBe(repeatRule);
    });
  });

  describe("noncomplete", () => {
    it("should set is_completed to false", async () => {
      const task = buildTask({ is_completed: true });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      const result = await taskService.noncomplete(task.id);
      expect(result.is_completed).toBe(false);
    });

    it("should clear completed_at to empty string", async () => {
      const task = buildTask({ is_completed: true, completed_at: "2025-01-01T10:00:00.000Z" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      const result = await taskService.noncomplete(task.id);
      expect(result.completed_at).toBe("");
    });

    it("should throw when task not found", async () => {
      const taskService = new TaskService(mockTaskRepository);
      await expect(taskService.noncomplete("nonexistent")).rejects.toThrow(
        "Task not found: nonexistent",
      );
    });
  });

  describe("softDelete", () => {
    it("should set is_deleted to true", async () => {
      const task = buildTask({ is_deleted: false });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      const deleted = await taskService.softDelete(task.id);
      expect(deleted.is_deleted).toBe(true);
    });
  });

  describe("moveToBox", () => {
    it("should update task box", async () => {
      const task = buildTask({ box: "inbox" });
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn().mockResolvedValue(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      const moved = await taskService.moveToBox(task.id, BOX.TODAY);
      expect(moved.box).toBe("today");
    });
  });

  describe("searchByTitle", () => {
    it("should return empty array when no tasks match", async () => {
      const tasks = [buildTask({ title: "Buy groceries" })];
      mockTaskRepository = createMockTaskRepository({
        getActive: vi.fn().mockResolvedValue(tasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const results = await taskService.searchByTitle("nonexistent");
      expect(results).toEqual([]);
    });

    it("should return matching tasks case-insensitively", async () => {
      const tasks = [
        buildTask({ title: "Buy groceries" }),
        buildTask({ title: "Call dentist" }),
        buildTask({ title: "Buy medicine" }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getActive: vi.fn().mockResolvedValue(tasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const results = await taskService.searchByTitle("buy");
      expect(results).toHaveLength(2);
    });
  });
});
