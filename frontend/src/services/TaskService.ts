import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskRepository } from "@/db/repositories/TaskRepository";

export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async getByBox(box: Box): Promise<Task[]> {
    const tasks = await this.taskRepository.getByBox(box);
    return tasks.sort((taskA, taskB) => taskA.sort_order - taskB.sort_order);
  }

  async getById(id: string): Promise<Task | undefined> {
    return this.taskRepository.getById(id);
  }

  async create(
    partialTask: Pick<Task, "title" | "box"> & Partial<Task>,
  ): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      notes: "",
      goal_id: "",
      context_id: "",
      category_id: "",
      is_completed: false,
      completed_at: "",
      repeat_rule: "",
      sort_order: 0,
      ...partialTask,
      id: crypto.randomUUID(),
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
    };
    await this.taskRepository.create(task);
    return task;
  }

  async update(id: string, changes: Partial<Task>): Promise<Task> {
    const existingTask = await this.taskRepository.getById(id);
    if (!existingTask) {
      throw new Error(`Task not found: ${id}`);
    }
    const updatedTask: Task = {
      ...existingTask,
      ...changes,
      id,
      updated_at: new Date().toISOString(),
      version: existingTask.version + 1,
    };
    await this.taskRepository.update(updatedTask);
    return updatedTask;
  }

  async complete(id: string): Promise<Task> {
    const existingTask = await this.taskRepository.getById(id);
    if (!existingTask) {
      throw new Error(`Task not found: ${id}`);
    }
    const completedTask = await this.update(id, {
      is_completed: true,
      completed_at: new Date().toISOString(),
    });
    if (existingTask.repeat_rule) {
      await this.createRecurringCopy(existingTask);
    }
    return completedTask;
  }

  private async createRecurringCopy(task: Task): Promise<Task> {
    const { id: _id, version: _version, created_at: _ca, updated_at: _ua, is_completed: _ic, completed_at: _cat, ...taskProps } = task;
    return this.create({ ...taskProps, is_completed: false, completed_at: "" });
  }

  async softDelete(id: string): Promise<Task> {
    return this.update(id, { is_deleted: true });
  }

  async moveToBox(id: string, box: Box): Promise<Task> {
    return this.update(id, { box });
  }

  async getByGoalId(goalId: string): Promise<Task[]> {
    const tasks = await this.taskRepository.getByGoalId(goalId);
    return tasks.sort((taskA, taskB) => taskA.sort_order - taskB.sort_order);
  }

  async searchByTitle(query: string): Promise<Task[]> {
    const allTasks = await this.taskRepository.getActive();
    const lowerQuery = query.toLowerCase();
    return allTasks.filter((task) =>
      task.title.toLowerCase().includes(lowerQuery),
    );
  }
}
