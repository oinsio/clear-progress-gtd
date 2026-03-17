import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskService } from "./TaskService";
import type { Task } from "@/types/entities";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { buildTask } from "@/test/factories/taskFactory";
import { BOX } from "@/constants";

function createMockTaskRepository(
  overrides: Partial<Record<keyof TaskRepository, unknown>> = {},
): TaskRepository {
  return {
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

    it("should create task with empty string defaults for optional fields", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const task = await taskService.create({ title: "My task", box: "inbox" });
      expect(task.notes).toBe("");
      expect(task.goal_id).toBe("");
      expect(task.context_id).toBe("");
      expect(task.category_id).toBe("");
      expect(task.completed_at).toBe("");
      expect(task.repeat_rule).toBe("");
    });

    it("should create task with is_completed false", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const task = await taskService.create({ title: "My task", box: "inbox" });
      expect(task.is_completed).toBe(false);
    });

    it("should create task with sort_order 0 by default", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const task = await taskService.create({ title: "My task", box: "inbox" });
      expect(task.sort_order).toBe(0);
    });

    it("should call repository.create with the constructed task", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const task = await taskService.create({ title: "My task", box: "inbox" });
      expect(mockTaskRepository.create).toHaveBeenCalledWith(task);
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

    it("should not call repository.update when task not found", async () => {
      const task = buildTask();
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      await expect(taskService.complete("nonexistent")).rejects.toThrow();
      expect(mockTaskRepository.update).not.toHaveBeenCalled();
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

    it("should not call update when task not found in noncomplete", async () => {
      const task = buildTask();
      mockTaskRepository = createMockTaskRepository({
        getById: vi.fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(task),
      });
      const taskService = new TaskService(mockTaskRepository);
      await expect(taskService.noncomplete("nonexistent")).rejects.toThrow();
      expect(mockTaskRepository.update).not.toHaveBeenCalled();
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

  describe("reorderTasks", () => {
    it("should call bulkUpsert with tasks assigned sort_order by position", async () => {
      const taskA = buildTask({ sort_order: 2 });
      const taskB = buildTask({ sort_order: 0 });
      const taskC = buildTask({ sort_order: 1 });
      const taskService = new TaskService(mockTaskRepository);
      await taskService.reorderTasks([taskA, taskB, taskC]);
      const upserted = (mockTaskRepository.bulkUpsert as ReturnType<typeof vi.fn>).mock.calls[0][0] as Task[];
      expect(upserted[0].sort_order).toBe(0);
      expect(upserted[1].sort_order).toBe(1);
      expect(upserted[2].sort_order).toBe(2);
    });

    it("should increment version for each reordered task", async () => {
      const taskA = buildTask({ version: 3 });
      const taskB = buildTask({ version: 5 });
      const taskService = new TaskService(mockTaskRepository);
      await taskService.reorderTasks([taskA, taskB]);
      const upserted = (mockTaskRepository.bulkUpsert as ReturnType<typeof vi.fn>).mock.calls[0][0] as Task[];
      expect(upserted[0].version).toBe(4);
      expect(upserted[1].version).toBe(6);
    });

    it("should update updated_at for each reordered task", async () => {
      const taskA = buildTask({ updated_at: "2025-01-01T00:00:00.000Z" });
      const taskService = new TaskService(mockTaskRepository);
      await taskService.reorderTasks([taskA]);
      const upserted = (mockTaskRepository.bulkUpsert as ReturnType<typeof vi.fn>).mock.calls[0][0] as Task[];
      expect(upserted[0].updated_at).not.toBe("2025-01-01T00:00:00.000Z");
    });

    it("should preserve task ids after reorder", async () => {
      const taskA = buildTask();
      const taskB = buildTask();
      const taskService = new TaskService(mockTaskRepository);
      await taskService.reorderTasks([taskA, taskB]);
      const upserted = (mockTaskRepository.bulkUpsert as ReturnType<typeof vi.fn>).mock.calls[0][0] as Task[];
      expect(upserted[0].id).toBe(taskA.id);
      expect(upserted[1].id).toBe(taskB.id);
    });

    it("should not call bulkUpsert when given empty array", async () => {
      const taskService = new TaskService(mockTaskRepository);
      await taskService.reorderTasks([]);
      expect(mockTaskRepository.bulkUpsert).not.toHaveBeenCalled();
    });
  });

  describe("getCompleted", () => {
    it("should return empty array when no completed tasks exist", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getCompleted();
      expect(tasks).toEqual([]);
    });

    it("should sort completed tasks by completed_at descending", async () => {
      const completedTasks = [
        buildTask({ is_completed: true, completed_at: "2025-01-01T10:00:00.000Z" }),
        buildTask({ is_completed: true, completed_at: "2025-01-03T10:00:00.000Z" }),
        buildTask({ is_completed: true, completed_at: "2025-01-02T10:00:00.000Z" }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getCompleted: vi.fn().mockResolvedValue(completedTasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getCompleted();
      expect(tasks[0].completed_at).toBe("2025-01-03T10:00:00.000Z");
      expect(tasks[1].completed_at).toBe("2025-01-02T10:00:00.000Z");
      expect(tasks[2].completed_at).toBe("2025-01-01T10:00:00.000Z");
    });

    it("should sort by sort_order descending when completed_at is empty", async () => {
      const completedTasks = [
        buildTask({ is_completed: true, completed_at: "", sort_order: 1 }),
        buildTask({ is_completed: true, completed_at: "", sort_order: 3 }),
        buildTask({ is_completed: true, completed_at: "", sort_order: 2 }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getCompleted: vi.fn().mockResolvedValue(completedTasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getCompleted();
      expect(tasks[0].sort_order).toBe(3);
      expect(tasks[1].sort_order).toBe(2);
      expect(tasks[2].sort_order).toBe(1);
    });

    it("should sort by sort_order when only one task has completed_at", async () => {
      const taskWithDate = buildTask({ is_completed: true, completed_at: "2025-01-01T10:00:00.000Z", sort_order: 1 });
      const taskWithoutDate = buildTask({ is_completed: true, completed_at: "", sort_order: 10 });
      mockTaskRepository = createMockTaskRepository({
        getCompleted: vi.fn().mockResolvedValue([taskWithDate, taskWithoutDate]),
      });
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getCompleted();
      expect(tasks[0].sort_order).toBe(10);
      expect(tasks[1].sort_order).toBe(1);
    });
  });

  describe("getByCategoryId", () => {
    it("should return empty array when no tasks for category", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getByCategoryId("cat-1");
      expect(tasks).toEqual([]);
    });

    it("should return tasks sorted by sort_order ascending", async () => {
      const categoryId = "cat-1";
      const unsortedTasks = [
        buildTask({ category_id: categoryId, sort_order: 3 }),
        buildTask({ category_id: categoryId, sort_order: 1 }),
        buildTask({ category_id: categoryId, sort_order: 2 }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getByCategoryId: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getByCategoryId(categoryId);
      expect(tasks[0].sort_order).toBe(1);
      expect(tasks[1].sort_order).toBe(2);
      expect(tasks[2].sort_order).toBe(3);
    });

    it("should call repository.getByCategoryId with the categoryId", async () => {
      const taskService = new TaskService(mockTaskRepository);
      await taskService.getByCategoryId("cat-abc");
      expect(mockTaskRepository.getByCategoryId).toHaveBeenCalledWith("cat-abc");
    });
  });

  describe("getByContextId", () => {
    it("should return empty array when no tasks for context", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getByContextId("ctx-1");
      expect(tasks).toEqual([]);
    });

    it("should return tasks sorted by sort_order ascending", async () => {
      const contextId = "ctx-1";
      const unsortedTasks = [
        buildTask({ context_id: contextId, sort_order: 3 }),
        buildTask({ context_id: contextId, sort_order: 1 }),
        buildTask({ context_id: contextId, sort_order: 2 }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getByContextId: vi.fn().mockResolvedValue(unsortedTasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const tasks = await taskService.getByContextId(contextId);
      expect(tasks[0].sort_order).toBe(1);
      expect(tasks[1].sort_order).toBe(2);
      expect(tasks[2].sort_order).toBe(3);
    });

    it("should call repository.getByContextId with the contextId", async () => {
      const taskService = new TaskService(mockTaskRepository);
      await taskService.getByContextId("ctx-abc");
      expect(mockTaskRepository.getByContextId).toHaveBeenCalledWith("ctx-abc");
    });
  });

  describe("getCategoryTaskCounts", () => {
    it("should return empty object when no active incomplete tasks", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const counts = await taskService.getCategoryTaskCounts();
      expect(counts).toEqual({});
    });

    it("should count tasks per category_id", async () => {
      const tasks = [
        buildTask({ category_id: "cat-1" }),
        buildTask({ category_id: "cat-1" }),
        buildTask({ category_id: "cat-2" }),
        buildTask({ category_id: "" }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const counts = await taskService.getCategoryTaskCounts();
      expect(counts["cat-1"]).toBe(2);
      expect(counts["cat-2"]).toBe(1);
      expect(counts[""]).toBeUndefined();
    });
  });

  describe("getContextTaskCounts", () => {
    it("should return empty object when no active incomplete tasks", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const counts = await taskService.getContextTaskCounts();
      expect(counts).toEqual({});
    });

    it("should count tasks per context_id", async () => {
      const tasks = [
        buildTask({ context_id: "ctx-1" }),
        buildTask({ context_id: "ctx-1" }),
        buildTask({ context_id: "ctx-2" }),
        buildTask({ context_id: "" }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const counts = await taskService.getContextTaskCounts();
      expect(counts["ctx-1"]).toBe(2);
      expect(counts["ctx-2"]).toBe(1);
      expect(counts[""]).toBeUndefined();
    });
  });

  describe("getGoalTaskCounts", () => {
    it("should return empty object when no active incomplete tasks", async () => {
      const taskService = new TaskService(mockTaskRepository);
      const counts = await taskService.getGoalTaskCounts();
      expect(counts).toEqual({});
    });

    it("should count tasks per goal_id", async () => {
      const tasks = [
        buildTask({ goal_id: "goal-1" }),
        buildTask({ goal_id: "goal-1" }),
        buildTask({ goal_id: "goal-2" }),
        buildTask({ goal_id: "" }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const counts = await taskService.getGoalTaskCounts();
      expect(counts["goal-1"]).toBe(2);
      expect(counts["goal-2"]).toBe(1);
      expect(counts[""]).toBeUndefined();
    });

    it("should not include tasks with empty goal_id in counts", async () => {
      const tasks = [
        buildTask({ goal_id: "" }),
        buildTask({ goal_id: "" }),
      ];
      mockTaskRepository = createMockTaskRepository({
        getActiveIncomplete: vi.fn().mockResolvedValue(tasks),
      });
      const taskService = new TaskService(mockTaskRepository);
      const counts = await taskService.getGoalTaskCounts();
      expect(Object.keys(counts)).toHaveLength(0);
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
