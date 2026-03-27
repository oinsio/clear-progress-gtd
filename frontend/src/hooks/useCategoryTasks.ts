import { useState, useEffect, useCallback } from "react";
import type { Task } from "@/types/entities";
import type { Box } from "@/types/common";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { useTaskMutations } from "./useTaskMutations";

const defaultTaskService = new TaskService(new TaskRepository(), new ChecklistRepository());

export interface UseCategoryTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  createTask: (title: string, box: Box, notes?: string) => Promise<void>;
  completeTask: (id: string) => Promise<string | null>;
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

  const mutations = useTaskMutations(taskService, loadTasks);

  return { tasks, isLoading, createTask, ...mutations };
}
