import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { db } from "../database";

export class TaskRepository {
  async getAll(): Promise<Task[]> {
    return db.tasks.toArray();
  }

  async getActive(): Promise<Task[]> {
    return db.tasks.filter((task) => !task.is_deleted).toArray();
  }

  async getByBox(box: Box): Promise<Task[]> {
    return db.tasks
      .where("box")
      .equals(box)
      .filter((task) => !task.is_deleted)
      .toArray();
  }

  async getById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  }

  async getByGoalId(goalId: string): Promise<Task[]> {
    return db.tasks
      .where("goal_id")
      .equals(goalId)
      .filter((task) => !task.is_deleted)
      .toArray();
  }

  async getActiveIncomplete(): Promise<Task[]> {
    return db.tasks
      .filter((task) => !task.is_deleted && !task.is_completed)
      .toArray();
  }

  async getByCategoryId(categoryId: string): Promise<Task[]> {
    return db.tasks
      .where("category_id")
      .equals(categoryId)
      .filter((task) => !task.is_deleted && !task.is_completed)
      .toArray();
  }

  async getByContextId(contextId: string): Promise<Task[]> {
    return db.tasks
      .where("context_id")
      .equals(contextId)
      .filter((task) => !task.is_deleted && !task.is_completed)
      .toArray();
  }

  async create(task: Task): Promise<void> {
    await db.tasks.add(task);
  }

  async update(task: Task): Promise<void> {
    await db.tasks.put(task);
  }

  async bulkUpsert(tasks: Task[]): Promise<void> {
    await db.tasks.bulkPut(tasks);
  }

  async getByMinVersion(minVersion: number): Promise<Task[]> {
    return db.tasks.where("version").above(minVersion).toArray();
  }

  async getCompleted(): Promise<Task[]> {
    return db.tasks
      .filter((task) => !task.is_deleted && task.is_completed)
      .toArray();
  }

  async getChangedSince(since: string): Promise<Task[]> {
    return db.tasks.where("updated_at").above(since).toArray();
  }

  async getMaxVersion(): Promise<number> {
    const tasks = await db.tasks
      .orderBy("version")
      .reverse()
      .limit(1)
      .toArray();
    return tasks[0]?.version ?? 0;
  }
}
