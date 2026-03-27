import type { Task, ChecklistItem } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly checklistRepository: ChecklistRepository,
  ) {}

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
    const newTask = await this.create({ ...taskProps, is_completed: false, completed_at: "" });
    await this.copyChecklistItems(task.id, newTask.id);
    return newTask;
  }

  private async copyChecklistItems(sourceTaskId: string, targetTaskId: string): Promise<void> {
    const checklistItems = await this.checklistRepository.getByTaskId(sourceTaskId);
    if (checklistItems.length === 0) return;
    const now = new Date().toISOString();
    for (const item of checklistItems) {
      const copiedItem: ChecklistItem = {
        ...item,
        id: crypto.randomUUID(),
        task_id: targetTaskId,
        is_completed: false,
        created_at: now,
        updated_at: now,
        version: 1,
      };
      await this.checklistRepository.create(copiedItem);
    }
  }

  async noncomplete(id: string): Promise<Task> {
    const existingTask = await this.taskRepository.getById(id);
    if (!existingTask) {
      throw new Error(`Task not found: ${id}`);
    }
    return this.update(id, {
      is_completed: false,
      completed_at: "",
    });
  }

  async softDelete(id: string): Promise<Task> {
    return this.update(id, { is_deleted: true });
  }

  async restore(id: string): Promise<Task> {
    return this.update(id, { is_deleted: false });
  }

  async moveToBox(id: string, box: Box): Promise<Task> {
    return this.update(id, { box });
  }

  async getCompleted(): Promise<Task[]> {
    const tasks = await this.taskRepository.getCompleted();
    return tasks.sort((taskA, taskB) => {
      if (taskA.completed_at && taskB.completed_at) {
        return taskB.completed_at.localeCompare(taskA.completed_at);
      }
      return taskB.sort_order - taskA.sort_order;
    });
  }

  async reorderTasks(orderedTasks: Task[]): Promise<void> {
    if (orderedTasks.length === 0) return;
    const now = new Date().toISOString();
    const updatedTasks = orderedTasks.map((task, index) => ({
      ...task,
      sort_order: index,
      updated_at: now,
      version: task.version + 1,
    }));
    await this.taskRepository.bulkUpsert(updatedTasks);
  }

  async getByGoalId(goalId: string): Promise<Task[]> {
    const tasks = await this.taskRepository.getByGoalId(goalId);
    return tasks.sort((taskA, taskB) => taskA.sort_order - taskB.sort_order);
  }

  async getGoalTaskCounts(): Promise<Record<string, number>> {
    const tasks = await this.taskRepository.getActiveIncomplete();
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      if (task.goal_id) {
        counts[task.goal_id] = (counts[task.goal_id] ?? 0) + 1;
      }
    }
    return counts;
  }

  async getCategoryTaskCounts(): Promise<Record<string, number>> {
    const tasks = await this.taskRepository.getActiveIncomplete();
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      if (task.category_id) {
        counts[task.category_id] = (counts[task.category_id] ?? 0) + 1;
      }
    }
    return counts;
  }

  async getByCategoryId(categoryId: string): Promise<Task[]> {
    const tasks = await this.taskRepository.getByCategoryId(categoryId);
    return tasks.sort((taskA, taskB) => taskA.sort_order - taskB.sort_order);
  }

  async getContextTaskCounts(): Promise<Record<string, number>> {
    const tasks = await this.taskRepository.getActiveIncomplete();
    const counts: Record<string, number> = {};
    for (const task of tasks) {
      if (task.context_id) {
        counts[task.context_id] = (counts[task.context_id] ?? 0) + 1;
      }
    }
    return counts;
  }

  async getByContextId(contextId: string): Promise<Task[]> {
    const tasks = await this.taskRepository.getByContextId(contextId);
    return tasks.sort((taskA, taskB) => taskA.sort_order - taskB.sort_order);
  }

  async searchByTitle(query: string): Promise<Task[]> {
    const allTasks = await this.taskRepository.getActive();
    const lowerQuery = query.toLowerCase();
    const matchingTasks = allTasks.filter((task) =>
      task.title.toLowerCase().includes(lowerQuery),
    );
    return matchingTasks.sort((taskA, taskB) => {
      if (taskA.is_completed === taskB.is_completed) return 0;
      return taskA.is_completed ? 1 : -1;
    });
  }
}
