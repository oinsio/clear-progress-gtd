import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";

const defaultTaskService = new TaskService(new TaskRepository());

export interface UseCategoryTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  createTask: (title: string, box: Box, notes?: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  moveTask: (id: string, box: Box) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

export function useCategoryTasks(
  categoryId: string,
  taskService: TaskService = defaultTaskService,
): UseCategoryTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    const categoryTasks = await taskService.getByCategoryId(categoryId);
    setTasks(categoryTasks);
    setIsLoading(false);
  }, [taskService, categoryId]);

  useEffect(() => {
    setIsLoading(true);
    void loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(
    async (title: string, box: Box, notes = "") => {
      await taskService.create({ title, box, notes, category_id: categoryId });
      await loadTasks();
    },
    [taskService, loadTasks, categoryId],
  );

  const completeTask = useCallback(
    async (id: string) => {
      const task = await taskService.getById(id);
      if (!task) return;
      if (task.is_completed) {
        await taskService.noncomplete(id);
      } else {
        await taskService.complete(id);
      }
      await loadTasks();
    },
    [taskService, loadTasks],
  );

  const updateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      await taskService.update(id, changes);
      await loadTasks();
    },
    [taskService, loadTasks],
  );

  const moveTask = useCallback(
    async (id: string, box: Box) => {
      await taskService.moveToBox(id, box);
      await loadTasks();
    },
    [taskService, loadTasks],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await taskService.softDelete(id);
      await loadTasks();
    },
    [taskService, loadTasks],
  );

  return { tasks, isLoading, createTask, completeTask, updateTask, moveTask, deleteTask };
}
