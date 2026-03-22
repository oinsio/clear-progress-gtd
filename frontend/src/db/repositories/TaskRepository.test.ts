import { describe, it, expect, beforeEach } from "vitest";
import { TaskRepository } from "./TaskRepository";
import { db } from "../database";
import { buildTask } from "@/test/factories/taskFactory";

describe("TaskRepository", () => {
  let taskRepository: TaskRepository;

  beforeEach(async () => {
    await db.tasks.clear();
    taskRepository = new TaskRepository();
  });

  describe("getAll", () => {
    it("should return empty array when no tasks exist", async () => {
      const tasks = await taskRepository.getAll();
      expect(tasks).toEqual([]);
    });

    it("should return all tasks including deleted ones", async () => {
      const activeTask = buildTask({ is_deleted: false });
      const deletedTask = buildTask({ is_deleted: true });
      await db.tasks.bulkAdd([activeTask, deletedTask]);

      const tasks = await taskRepository.getAll();
      expect(tasks).toHaveLength(2);
    });
  });

  describe("getActive", () => {
    it("should return only non-deleted tasks", async () => {
      const activeTask = buildTask({ is_deleted: false });
      const deletedTask = buildTask({ is_deleted: true });
      await db.tasks.bulkAdd([activeTask, deletedTask]);

      const tasks = await taskRepository.getActive();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(activeTask.id);
    });

    it("should return empty array when all tasks are deleted", async () => {
      const deletedTask = buildTask({ is_deleted: true });
      await db.tasks.add(deletedTask);

      const tasks = await taskRepository.getActive();
      expect(tasks).toEqual([]);
    });
  });

  describe("getByBox", () => {
    it("should return only non-deleted tasks for the specified box", async () => {
      const inboxTask = buildTask({ box: "inbox", is_deleted: false });
      const todayTask = buildTask({ box: "today", is_deleted: false });
      const deletedInboxTask = buildTask({ box: "inbox", is_deleted: true });
      await db.tasks.bulkAdd([inboxTask, todayTask, deletedInboxTask]);

      const tasks = await taskRepository.getByBox("inbox");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(inboxTask.id);
    });

    it("should not return tasks from a different box", async () => {
      const todayTask = buildTask({ box: "today" });
      await db.tasks.add(todayTask);

      const tasks = await taskRepository.getByBox("inbox");
      expect(tasks).toEqual([]);
    });

    it("should not return soft-deleted tasks", async () => {
      const deletedTask = buildTask({ box: "inbox", is_deleted: true });
      await db.tasks.add(deletedTask);

      const tasks = await taskRepository.getByBox("inbox");
      expect(tasks).toEqual([]);
    });
  });

  describe("getById", () => {
    it("should return the task when found", async () => {
      const task = buildTask();
      await db.tasks.add(task);

      const foundTask = await taskRepository.getById(task.id);
      expect(foundTask).toBeDefined();
      expect(foundTask?.id).toBe(task.id);
    });

    it("should return undefined when task not found", async () => {
      const result = await taskRepository.getById("nonexistent-id");
      expect(result).toBeUndefined();
    });
  });

  describe("getByGoalId", () => {
    it("should return non-deleted tasks for the specified goal", async () => {
      const goalTask = buildTask({ goal_id: "goal-1", is_deleted: false });
      const deletedGoalTask = buildTask({ goal_id: "goal-1", is_deleted: true });
      const otherTask = buildTask({ goal_id: "goal-2", is_deleted: false });
      await db.tasks.bulkAdd([goalTask, deletedGoalTask, otherTask]);

      const tasks = await taskRepository.getByGoalId("goal-1");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(goalTask.id);
    });
  });

  describe("getActiveIncomplete", () => {
    it("should return only non-deleted and non-completed tasks", async () => {
      const activeTask = buildTask({ is_deleted: false, is_completed: false });
      const completedTask = buildTask({ is_deleted: false, is_completed: true });
      const deletedTask = buildTask({ is_deleted: true, is_completed: false });
      await db.tasks.bulkAdd([activeTask, completedTask, deletedTask]);

      const tasks = await taskRepository.getActiveIncomplete();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(activeTask.id);
    });
  });

  describe("getByCategoryId", () => {
    it("should return non-deleted, non-completed tasks for the category", async () => {
      const categoryTask = buildTask({ category_id: "cat-1", is_deleted: false, is_completed: false });
      const completedCategoryTask = buildTask({ category_id: "cat-1", is_deleted: false, is_completed: true });
      const deletedCategoryTask = buildTask({ category_id: "cat-1", is_deleted: true, is_completed: false });
      await db.tasks.bulkAdd([categoryTask, completedCategoryTask, deletedCategoryTask]);

      const tasks = await taskRepository.getByCategoryId("cat-1");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(categoryTask.id);
    });
  });

  describe("getByContextId", () => {
    it("should return non-deleted, non-completed tasks for the context", async () => {
      const contextTask = buildTask({ context_id: "ctx-1", is_deleted: false, is_completed: false });
      const completedContextTask = buildTask({ context_id: "ctx-1", is_deleted: false, is_completed: true });
      const deletedContextTask = buildTask({ context_id: "ctx-1", is_deleted: true, is_completed: false });
      await db.tasks.bulkAdd([contextTask, completedContextTask, deletedContextTask]);

      const tasks = await taskRepository.getByContextId("ctx-1");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(contextTask.id);
    });
  });

  describe("create", () => {
    it("should save the task to the database", async () => {
      const task = buildTask();
      await taskRepository.create(task);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask).toBeDefined();
      expect(savedTask?.id).toBe(task.id);
      expect(savedTask?.title).toBe(task.title);
    });

    it("should persist all task fields", async () => {
      const task = buildTask({ title: "My task", box: "today", notes: "some notes" });
      await taskRepository.create(task);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask?.title).toBe("My task");
      expect(savedTask?.box).toBe("today");
      expect(savedTask?.notes).toBe("some notes");
    });
  });

  describe("update", () => {
    it("should update an existing task", async () => {
      const task = buildTask({ title: "Old title" });
      await db.tasks.add(task);

      const updatedTask = { ...task, title: "New title" };
      await taskRepository.update(updatedTask);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask?.title).toBe("New title");
    });
  });

  describe("bulkUpsert", () => {
    it("should insert multiple tasks", async () => {
      const tasks = [buildTask(), buildTask(), buildTask()];
      await taskRepository.bulkUpsert(tasks);

      const allTasks = await db.tasks.toArray();
      expect(allTasks).toHaveLength(3);
    });

    it("should update existing tasks", async () => {
      const task = buildTask({ title: "Original" });
      await db.tasks.add(task);

      const updatedTask = { ...task, title: "Updated" };
      await taskRepository.bulkUpsert([updatedTask]);

      const savedTask = await db.tasks.get(task.id);
      expect(savedTask?.title).toBe("Updated");
    });
  });

  describe("getByMinVersion", () => {
    it("should return tasks with version greater than minVersion", async () => {
      const taskV1 = buildTask({ version: 1 });
      const taskV2 = buildTask({ version: 2 });
      const taskV5 = buildTask({ version: 5 });
      await db.tasks.bulkAdd([taskV1, taskV2, taskV5]);

      const tasks = await taskRepository.getByMinVersion(2);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(taskV5.id);
    });

    it("should return empty array when no tasks exceed minVersion", async () => {
      const task = buildTask({ version: 3 });
      await db.tasks.add(task);

      const tasks = await taskRepository.getByMinVersion(5);
      expect(tasks).toEqual([]);
    });
  });

  describe("getCompleted", () => {
    it("should return only non-deleted completed tasks", async () => {
      const completedTask = buildTask({ is_completed: true, is_deleted: false });
      const incompleteTask = buildTask({ is_completed: false, is_deleted: false });
      const deletedCompletedTask = buildTask({ is_completed: true, is_deleted: true });
      await db.tasks.bulkAdd([completedTask, incompleteTask, deletedCompletedTask]);

      const tasks = await taskRepository.getCompleted();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(completedTask.id);
    });

    it("should return empty array when no completed tasks exist", async () => {
      const task = buildTask({ is_completed: false });
      await db.tasks.add(task);

      const tasks = await taskRepository.getCompleted();
      expect(tasks).toEqual([]);
    });
  });

  describe("getChangedSince", () => {
    it("should return tasks with updated_at after since", async () => {
      const oldTask = buildTask({ updated_at: "2026-01-01T00:00:00.000Z" });
      const newTask = buildTask({ updated_at: "2026-03-01T00:00:00.000Z" });
      await db.tasks.bulkAdd([oldTask, newTask]);

      const tasks = await taskRepository.getChangedSince("2026-02-01T00:00:00.000Z");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(newTask.id);
    });

    it("should return empty array when no tasks are newer than since", async () => {
      const task = buildTask({ updated_at: "2026-01-01T00:00:00.000Z" });
      await db.tasks.add(task);

      const tasks = await taskRepository.getChangedSince("2026-06-01T00:00:00.000Z");
      expect(tasks).toEqual([]);
    });

    it("should not include tasks with updated_at equal to since", async () => {
      const task = buildTask({ updated_at: "2026-03-01T00:00:00.000Z" });
      await db.tasks.add(task);

      const tasks = await taskRepository.getChangedSince("2026-03-01T00:00:00.000Z");
      expect(tasks).toEqual([]);
    });

    it("should include soft-deleted tasks that changed after since", async () => {
      const deletedTask = buildTask({ is_deleted: true, updated_at: "2026-03-01T00:00:00.000Z" });
      await db.tasks.add(deletedTask);

      const tasks = await taskRepository.getChangedSince("2026-01-01T00:00:00.000Z");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(deletedTask.id);
    });
  });

  describe("getMaxVersion", () => {
    it("should return 0 when no tasks exist", async () => {
      const maxVersion = await taskRepository.getMaxVersion();
      expect(maxVersion).toBe(0);
    });

    it("should return the highest version number", async () => {
      const taskV1 = buildTask({ version: 1 });
      const taskV7 = buildTask({ version: 7 });
      const taskV3 = buildTask({ version: 3 });
      await db.tasks.bulkAdd([taskV1, taskV7, taskV3]);

      const maxVersion = await taskRepository.getMaxVersion();
      expect(maxVersion).toBe(7);
    });
  });
});
